/**
 * Preload service - loads all critical data into cache on app startup
 */

import { saveToCache, hasValidCache, getCacheAge } from '../utils/cacheManager';
import { crashlyticsService } from './crashlytics';
import { 
  footballApi, 
  getCurrentSeason,
  type Team,
  type Season,
  type Match,
  type Standing,
  type Competition,
} from '../api/footballEndpoints';
import { CACHE_KEY_PATTERNS } from '../config/cacheConfig';

export interface PreloadProgress {
  total: number;
  completed: number;
  currentTask: string;
}

export type PreloadProgressCallback = (progress: PreloadProgress) => void;

/**
 * Preload all critical data into cache
 * Note: Festival-related preloading removed - app now uses football API
 */
export async function preloadAllData(
  onProgress?: PreloadProgressCallback
): Promise<{ success: boolean; errors: string[] }> {
  const errors: string[] = [];
  // Festival-related tasks removed - app now uses football API with different caching strategy
  const tasks: Array<{ name: string; key: string; fn: () => Promise<unknown> }> = [];

  const total = tasks.length;
  
  // If no tasks, return immediately
  if (total === 0) {
    onProgress?.({
      total: 0,
      completed: 0,
      currentTask: 'Dokončeno',
    });
    return {
      success: true,
      errors: [],
    };
  }
  
  // Use atomic counter to track completion safely in parallel execution
  let completed = 0;
  const incrementCompleted = () => {
    completed++;
    return completed;
  };

  // Report initial progress
  onProgress?.({
    total,
    completed: 0,
    currentTask: 'Začínám načítání...',
  });

  // Performance optimization: Load all data in parallel instead of sequentially
  // This reduces startup time by 3-5x on good networks
  // Execute all preload tasks in parallel
  const taskPromises = tasks.map(async (task) => {
    try {
      // Report that we're starting this task
      onProgress?.({
        total,
        completed,
        currentTask: `Načítám ${task.name.toLowerCase()}...`,
      });

      const result = await task.fn();

      // Task completed successfully - use atomic increment
      const currentCompleted = incrementCompleted();
      onProgress?.({
        total,
        completed: currentCompleted,
        currentTask: `${task.name} načteno`,
      });

      return { task: task.name, success: true, error: null, data: result };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`${task.name}: ${errorMessage}`);
      
      crashlyticsService.recordError(error instanceof Error ? error : new Error(errorMessage));

      // Task failed but we continue - use atomic increment
      const currentCompleted = incrementCompleted();
      onProgress?.({
        total,
        completed: currentCompleted,
        currentTask: `${task.name} - chyba`,
      });

      return { task: task.name, success: false, error: errorMessage, data: null };
    }
  });

  // Wait for all tasks to complete (in parallel)
  const results = await Promise.allSettled(taskPromises);

  // Log results for debugging
  const successfulTasks: string[] = [];
  const failedTasks: string[] = [];

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      if (result.value.success) {
        successfulTasks.push(result.value.task);
      } else {
        failedTasks.push(result.value.task);
      }
    } else {
      failedTasks.push(tasks[index].name);
    }
  });

  onProgress?.({
    total,
    completed,
    currentTask: 'Dokončeno',
  });

  return {
    success: errors.length === 0,
    errors,
  };
}

/**
 * Preload current season data (matches, standings, competitions)
 * This ensures data is available immediately when user navigates to matches/standings screens
 */
export async function preloadCurrentSeasonData(): Promise<{ success: boolean; errors: string[] }> {
  const errors: string[] = [];
  
  try {
    // Step 1: Load teams and seasons (required to determine current season)
    let teams: Team[] = [];
    let seasons: Season[] = [];
    
    try {
      // Check cache first
      const teamsCacheValid = await hasValidCache(CACHE_KEY_PATTERNS.TEAMS);
      if (teamsCacheValid) {
        const { loadFromCache } = await import('../utils/cacheManager');
        const cachedTeams = await loadFromCache<Team[]>(CACHE_KEY_PATTERNS.TEAMS);
        if (cachedTeams) {
          teams = cachedTeams;
        }
      }
      
      if (teams.length === 0) {
        teams = await footballApi.getTeams();
        await saveToCache<Team[]>(CACHE_KEY_PATTERNS.TEAMS, teams);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`Teams: ${errorMessage}`);
    }
    
    try {
      const seasonsCacheValid = await hasValidCache(CACHE_KEY_PATTERNS.SEASONS);
      if (seasonsCacheValid) {
        const { loadFromCache } = await import('../utils/cacheManager');
        const cachedSeasons = await loadFromCache<Season[]>(CACHE_KEY_PATTERNS.SEASONS);
        if (cachedSeasons) {
          seasons = cachedSeasons;
        }
      }
      
      if (seasons.length === 0) {
        seasons = await footballApi.getSeasons();
        await saveToCache<Season[]>(CACHE_KEY_PATTERNS.SEASONS, seasons);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`Seasons: ${errorMessage}`);
    }
    
    // Step 2: Determine current season
    if (teams.length === 0 || seasons.length === 0) {
      return { success: errors.length === 0, errors };
    }
    
    const currentSeason = getCurrentSeason(seasons);
    if (!currentSeason) {
      return { success: errors.length === 0, errors };
    }
    
    // Step 3: Preload data for each team for current season
    const preloadTasks: Array<Promise<void>> = [];
    
    for (const team of teams) {
      const teamId = team.id;
      const seasonId = currentSeason.id;
      
      // Preload match calendar
      preloadTasks.push(
        (async () => {
          try {
            const cacheKey = CACHE_KEY_PATTERNS.MATCH_CALENDAR(teamId, seasonId);
            const cacheAge = await getCacheAge(cacheKey);
            const FIVE_MINUTES_MS = 5 * 60 * 1000; // 5 minutes
            
            // Update if cache doesn't exist or is older than 5 minutes
            if (cacheAge === null || cacheAge > FIVE_MINUTES_MS) {
              const matches = await footballApi.getMatchCalendar(teamId, seasonId);
              await saveToCache<Match[]>(cacheKey, matches);
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            errors.push(`Match calendar (team ${teamId}): ${errorMessage}`);
          }
        })()
      );
      
      // Preload match results
      preloadTasks.push(
        (async () => {
          try {
            const cacheKey = CACHE_KEY_PATTERNS.MATCH_RESULTS(teamId, seasonId);
            const cacheAge = await getCacheAge(cacheKey);
            const FIVE_MINUTES_MS = 5 * 60 * 1000; // 5 minutes
            
            // Update if cache doesn't exist or is older than 5 minutes
            if (cacheAge === null || cacheAge > FIVE_MINUTES_MS) {
              const matches = await footballApi.getMatchResults(teamId, seasonId);
              await saveToCache<Match[]>(cacheKey, matches);
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            errors.push(`Match results (team ${teamId}): ${errorMessage}`);
          }
        })()
      );
      
      // Preload standings
      preloadTasks.push(
        (async () => {
          try {
            const cacheKey = CACHE_KEY_PATTERNS.STANDINGS(teamId, seasonId);
            const cacheAge = await getCacheAge(cacheKey);
            const FIVE_MINUTES_MS = 5 * 60 * 1000; // 5 minutes
            
            // Update if cache doesn't exist or is older than 5 minutes
            if (cacheAge === null || cacheAge > FIVE_MINUTES_MS) {
              const standings = await footballApi.getStandings(teamId, seasonId);
              await saveToCache<Standing[]>(cacheKey, standings);
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            errors.push(`Standings (team ${teamId}): ${errorMessage}`);
          }
        })()
      );
      
      // Preload competition
      preloadTasks.push(
        (async () => {
          try {
            const cacheKey = CACHE_KEY_PATTERNS.COMPETITIONS(teamId, seasonId);
            const cacheAge = await getCacheAge(cacheKey);
            const FIVE_MINUTES_MS = 5 * 60 * 1000; // 5 minutes
            
            // Update if cache doesn't exist or is older than 5 minutes
            if (cacheAge === null || cacheAge > FIVE_MINUTES_MS) {
              const competition = await footballApi.getCompetition(teamId, seasonId);
              await saveToCache<Competition>(cacheKey, competition);
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            errors.push(`Competition (team ${teamId}): ${errorMessage}`);
          }
        })()
      );
    }
    
    // Execute all preload tasks in parallel
    await Promise.allSettled(preloadTasks);
    
    return { success: errors.length === 0, errors };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    crashlyticsService.recordError(error instanceof Error ? error : new Error(errorMessage));
    return { success: false, errors: [errorMessage] };
  }
}
