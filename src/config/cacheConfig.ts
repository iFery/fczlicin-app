/**
 * Cache TTL (Time-to-Live) configuration in milliseconds
 * Each endpoint type has a tailored TTL based on update frequency
 */

export const CACHE_TTL = {
  TEAMS: 24 * 60 * 60 * 1000,           // 24 hours
  SEASONS: 24 * 60 * 60 * 1000,         // 24 hours
  COMPETITIONS: 24 * 60 * 60 * 1000,    // 24 hours
  MATCH_CALENDAR: 15 * 60 * 1000,       // 15 minutes
  MATCH_RESULTS: 10 * 60 * 1000,         // 10 minutes
  STANDINGS: 30 * 60 * 1000,             // 30 minutes
  PLAYERS: 30 * 60 * 1000,               // 30 minutes
  PLAYER_DETAIL: 30 * 60 * 1000,         // 30 minutes
  DEFAULT: 15 * 60 * 1000,               // 15 minutes fallback
} as const;

/**
 * Cache key patterns for different resource types
 */
export const CACHE_KEY_PATTERNS = {
  TEAMS: 'teams:list',
  SEASONS: 'seasons:list',
  COMPETITIONS: (teamId: number, seasonId: number) => 
    `competitions:team:${teamId}:season:${seasonId}`,
  MATCH_CALENDAR: (teamId: number, seasonId: number) =>
    `matches:team:${teamId}:season:${seasonId}:calendar`,
  MATCH_RESULTS: (teamId: number, seasonId: number) =>
    `matches:team:${teamId}:season:${seasonId}:results`,
  STANDINGS: (teamId: number, seasonId: number) =>
    `standings:team:${teamId}:season:${seasonId}`,
  PLAYERS: (teamId: number) =>
    `players:team:${teamId}`,
  PLAYER_DETAIL: (playerId: number, teamId: number) =>
    `player:detail:${playerId}:team:${teamId}`,
} as const;

/**
 * Get TTL for a cache key pattern
 * Returns appropriate TTL based on key prefix, or default TTL
 */
export function getTTLForKey(key: string): number {
  if (key.startsWith('teams:')) return CACHE_TTL.TEAMS;
  if (key.startsWith('seasons:')) return CACHE_TTL.SEASONS;
  if (key.startsWith('competitions:')) return CACHE_TTL.COMPETITIONS;
  if (key.includes(':calendar')) return CACHE_TTL.MATCH_CALENDAR;
  if (key.includes(':results')) return CACHE_TTL.MATCH_RESULTS;
  if (key.startsWith('standings:')) return CACHE_TTL.STANDINGS;
  if (key.startsWith('players:')) return CACHE_TTL.PLAYERS;
  if (key.startsWith('player:detail:')) return CACHE_TTL.PLAYER_DETAIL;
  return CACHE_TTL.DEFAULT;
}
