/**
 * Preload service - loads all critical data into cache on app startup
 */

import { eventsApi, newsApi, type TimelineApiResponse } from '../api';
import { saveToCache, hasValidCache, getCacheAge } from '../utils/cacheManager';
import { crashlyticsService } from './crashlytics';
import type { Event, News } from '../types';
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
 * Returns timeline data if available for immediate use in TimelineContext
 * Note: Festival-related preloading removed - app now uses football API
 */
export async function preloadAllData(
  onProgress?: PreloadProgressCallback
): Promise<{ success: boolean; errors: string[]; timelineData?: TimelineApiResponse }> {
  const errors: string[] = [];
  // Festival-related tasks removed - app now uses football API with different caching strategy
  const tasks: Array<{ name: string; key: string; fn: () => Promise<any> }> = [];

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
      timelineData: undefined,
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
  const startTime = Date.now();

  // Execute all preload tasks in parallel
  // Special handling for Events task to capture timeline data
  let timelineData: TimelineApiResponse | null = null;
  
  const taskPromises = tasks.map(async (task) => {
    try {
      // Report that we're starting this task
      onProgress?.({
        total,
        completed,
        currentTask: `Načítám ${task.name.toLowerCase()}...`,
      });

      const result = await task.fn();
      
      // Capture timeline data from Events task
      if (task.name === 'Events' && result) {
        timelineData = result as TimelineApiResponse;
      }

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

  // Extract timeline data from Events task result if not already captured
  if (!timelineData) {
    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && tasks[index].name === 'Events' && result.value.data) {
        timelineData = result.value.data as TimelineApiResponse | null;
      }
    });
  }

  onProgress?.({
    total,
    completed,
    currentTask: 'Dokončeno',
  });

  return {
    success: errors.length === 0,
    errors,
    timelineData: timelineData || undefined,
  };
}

/**
 * Transform timeline API response to events format
 */
function transformTimeline(response: TimelineApiResponse): { events: Event[]; timeline: TimelineApiResponse } {
  // Transform events from timeline API response
  const events: Event[] = response.events.map((event) => ({
    id: event.id || '',
    name: event.name || '',
    time: event.time || '',
    artist: event.artist || '',
    stage: event.stage,
    description: event.description,
    image: event.image,
    date: event.date,
  }));

  return { events, timeline: response };
}

/**
 * Preload events (timeline)
 * Returns timeline data for immediate use in TimelineContext
 */
async function preloadEvents(): Promise<TimelineApiResponse | null> {
  try {
    // Check if cache is valid
    const cacheValid = await hasValidCache('events');
    if (cacheValid) {
      // Return cached timeline data if available
      const { loadFromCache } = await import('../utils/cacheManager');
      return await loadFromCache<TimelineApiResponse>('timeline') || null;
    }

    const response = await eventsApi.getAll();
    const transformed = transformTimeline(response.data);
    
    // Save events array for backward compatibility
    await saveToCache<Event[]>('events', transformed.events);
    // Also save full timeline data with config and stages
    await saveToCache<TimelineApiResponse>('timeline', transformed.timeline);
    
    // Return timeline data for immediate use
    return transformed.timeline;
  } catch (error) {
    // Try to return cached timeline data even if API call failed
    try {
      const { loadFromCache } = await import('../utils/cacheManager');
      return await loadFromCache<TimelineApiResponse>('timeline') || null;
    } catch {
      throw error;
    }
  }
}

/**
 * Preload news
 */
async function preloadNews(): Promise<void> {
  try {
    // Check if cache is valid
    const cacheValid = await hasValidCache('news');
    if (cacheValid) {
      return;
    }

    const response = await newsApi.getAll();
    await saveToCache<News[]>('news', response.data);
  } catch (error) {
    throw error;
  }
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


