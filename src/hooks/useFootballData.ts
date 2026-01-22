/**
 * Football-specific data hooks with intelligent caching
 * Uses stale-while-revalidate pattern for optimal performance
 */

import { useStaleWhileRevalidate } from './useStaleWhileRevalidate';
import { 
  footballApi, 
  getCurrentSeason, 
  type Season,
  type Team,
  type Competition,
  type Match,
  type MatchDetail,
  type Standing,
  type RoundResult,
  type PlayerStat,
  type PlayersResponse,
  type PlayerDetail,
} from '../api/footballEndpoints';
import { CACHE_KEY_PATTERNS, CACHE_TTL } from '../config/cacheConfig';

/**
 * Hook to fetch teams list
 * TTL: 24 hours
 */
export function useTeams() {
  return useStaleWhileRevalidate<Team[]>({
    cacheKey: CACHE_KEY_PATTERNS.TEAMS,
    fetchFn: footballApi.getTeams,
    defaultData: [],
    errorMessage: 'Failed to load teams',
    ttl: CACHE_TTL.TEAMS,
  });
}

/**
 * Hook to fetch seasons list
 * TTL: 24 hours
 */
export function useSeasons() {
  return useStaleWhileRevalidate<Season[]>({
    cacheKey: CACHE_KEY_PATTERNS.SEASONS,
    fetchFn: footballApi.getSeasons,
    defaultData: [],
    errorMessage: 'Failed to load seasons',
    ttl: CACHE_TTL.SEASONS,
  });
}

/**
 * Hook to get current season (highest ID from seasons)
 * TTL: 24 hours (inherited from seasons)
 */
export function useCurrentSeason() {
  const seasonsResult = useSeasons();
  
  const currentSeason = seasonsResult.data.length > 0
    ? getCurrentSeason(seasonsResult.data)
    : null;
  
  return {
    ...seasonsResult,
    data: currentSeason,
  };
}

/**
 * Hook to fetch competition name for a team/season
 * TTL: 24 hours
 * @param teamId Team ID
 * @param seasonId Season ID
 */
export function useCompetition(teamId: number, seasonId: number) {
  return useStaleWhileRevalidate<Competition>({
    cacheKey: CACHE_KEY_PATTERNS.COMPETITIONS(teamId, seasonId),
    fetchFn: () => footballApi.getCompetition(teamId, seasonId),
    defaultData: { teamId, seasonId, competition: null },
    errorMessage: 'Failed to load competition',
    ttl: CACHE_TTL.COMPETITIONS,
  });
}

/**
 * Hook to fetch match calendar (scheduled matches)
 * TTL: 15 minutes
 * @param teamId Team ID
 * @param seasonId Season ID
 */
export function useMatchCalendar(teamId: number, seasonId: number) {
  return useStaleWhileRevalidate<Match[]>({
    cacheKey: CACHE_KEY_PATTERNS.MATCH_CALENDAR(teamId, seasonId),
    fetchFn: () => {
      if (teamId <= 0 || seasonId <= 0) {
        return Promise.resolve([]);
      }
      return footballApi.getMatchCalendar(teamId, seasonId);
    },
    defaultData: [],
    errorMessage: 'Failed to load match calendar',
    ttl: CACHE_TTL.MATCH_CALENDAR,
  });
}

/**
 * Hook to fetch match results (past matches)
 * TTL: 10 minutes
 * @param teamId Team ID
 * @param seasonId Season ID
 */
export function useMatchResults(teamId: number, seasonId: number) {
  return useStaleWhileRevalidate<Match[]>({
    cacheKey: CACHE_KEY_PATTERNS.MATCH_RESULTS(teamId, seasonId),
    fetchFn: () => footballApi.getMatchResults(teamId, seasonId),
    defaultData: [],
    errorMessage: 'Failed to load match results',
    ttl: CACHE_TTL.MATCH_RESULTS,
  });
}

/**
 * Hook to fetch standings (league table)
 * TTL: 30 minutes
 * @param teamId Team ID
 * @param seasonId Season ID
 */
export function useStandings(teamId: number, seasonId: number) {
  return useStaleWhileRevalidate<Standing[]>({
    cacheKey: CACHE_KEY_PATTERNS.STANDINGS(teamId, seasonId),
    fetchFn: () => footballApi.getStandings(teamId, seasonId),
    defaultData: [],
    errorMessage: 'Failed to load standings',
    ttl: CACHE_TTL.STANDINGS,
  });
}

/**
 * Hook to fetch match detail by ID
 * TTL: 10 minutes
 * @param matchId Match ID
 */
export function useMatchDetail(matchId: number) {
  return useStaleWhileRevalidate<MatchDetail | null>({
    cacheKey: `match:detail:${matchId}`,
    fetchFn: () => footballApi.getMatchDetail(matchId),
    defaultData: null,
    errorMessage: 'Failed to load match detail',
    ttl: CACHE_TTL.MATCH_RESULTS,
  });
}

/**
 * Hook to fetch round results for a match
 * TTL: 10 minutes
 * @param matchId Match ID
 */
export function useRoundResults(matchId: number) {
  return useStaleWhileRevalidate<{ matches: RoundResult[] }>({
    cacheKey: `match:round:${matchId}`,
    fetchFn: () => footballApi.getRoundResults(matchId),
    defaultData: { matches: [] },
    errorMessage: 'Failed to load round results',
    ttl: CACHE_TTL.MATCH_RESULTS,
  });
}

/**
 * Hook to fetch player stats for a match
 * TTL: 10 minutes
 * @param matchId Match ID
 */
export function useMatchPlayerStats(matchId: number) {
  return useStaleWhileRevalidate<{ players: PlayerStat[] }>({
    cacheKey: `match:player-stats:${matchId}`,
    fetchFn: () => footballApi.getPlayerStats(matchId),
    defaultData: { players: [] },
    errorMessage: 'Failed to load player stats',
    ttl: CACHE_TTL.MATCH_RESULTS,
  });
}

/**
 * Hook to fetch players for a team
 * TTL: 30 minutes
 * @param teamId Team ID
 */
export function usePlayers(teamId: number) {
  return useStaleWhileRevalidate<PlayersResponse>({
    cacheKey: CACHE_KEY_PATTERNS.PLAYERS(teamId),
    fetchFn: () => footballApi.getPlayers(teamId),
    defaultData: { goalkeepers: [], defenders: [], midfielders: [], forwards: [] },
    errorMessage: 'Failed to load players',
    ttl: CACHE_TTL.PLAYERS,
  });
}

/**
 * Hook to fetch player detail by ID
 * TTL: 30 minutes
 * @param playerId Player ID
 * @param teamId Team ID
 */
export function usePlayerById(playerId: number, teamId: number) {
  return useStaleWhileRevalidate<PlayerDetail | null>({
    cacheKey: CACHE_KEY_PATTERNS.PLAYER_DETAIL(playerId, teamId),
    fetchFn: () => footballApi.getPlayerById(playerId, teamId),
    defaultData: null,
    errorMessage: 'Failed to load player detail',
    ttl: CACHE_TTL.PLAYER_DETAIL,
  });
}
