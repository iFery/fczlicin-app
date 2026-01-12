/**
 * Centralized exports for hooks
 */
export { useBootstrap } from '../providers/BootstrapProvider';
export { useCachedData } from './useCachedData';
export type { UseCachedDataResult, UseCachedDataOptions } from './useCachedData';
export { useNetworkStatus } from './useNetworkStatus';
export type { NetworkStatus } from './useNetworkStatus';
export { useStaleWhileRevalidate } from './useStaleWhileRevalidate';
export type { UseStaleWhileRevalidateResult, UseStaleWhileRevalidateOptions } from './useStaleWhileRevalidate';
export { 
  useTeams, 
  useSeasons, 
  useCurrentSeason, 
  useCompetition, 
  useMatchCalendar, 
  useMatchResults,
  useMatchDetail,
  useRoundResults,
  useMatchPlayerStats, 
  useStandings,
  usePlayers,
  usePlayerById,
} from './useFootballData';

