import AsyncStorage from '@react-native-async-storage/async-storage';
import { footballApi, type Match, type MatchDetail } from '../api/footballEndpoints';
import { saveToCache } from '../utils/cacheManager';
import { crashlyticsService } from './crashlytics';

const MATCH_CACHE_STORAGE_PREFIX = 'cache_matches:';
const getMatchDetailCacheKey = (matchId: number) => `match:detail:${matchId}`;

interface CachedEntry<T> {
  data?: T;
  timestamp?: number;
}

const activeRefreshes = new Map<number, Promise<void>>();

function extractMatchId(payload: Record<string, unknown> | null | undefined): number | null {
  if (!payload) {
    return null;
  }

  const rawValue = payload['matchId'] ?? payload['match_id'] ?? payload['matchID'];
  if (rawValue == null) {
    return null;
  }

  const numeric = typeof rawValue === 'number' ? rawValue : parseInt(String(rawValue), 10);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return null;
  }

  return numeric;
}

function matchesEqual(a: Match, b: Match): boolean {
  return (
    a.homeScore === b.homeScore &&
    a.awayScore === b.awayScore &&
    a.status === b.status &&
    a.date === b.date &&
    a.time === b.time &&
    a.round === b.round &&
    a.competition === b.competition &&
    a.homeTeam === b.homeTeam &&
    a.awayTeam === b.awayTeam
  );
}

function buildUpdatedMatch(existing: Match, detail: MatchDetail): Match {
  const scoresKnown = detail.homeScore != null && detail.awayScore != null;
  const derivedStatus = detail.status ?? (scoresKnown ? 'finished' : existing.status);

  return {
    ...existing,
    homeTeam: detail.homeTeam || existing.homeTeam,
    awayTeam: detail.awayTeam || existing.awayTeam,
    homeScore: detail.homeScore ?? existing.homeScore,
    awayScore: detail.awayScore ?? existing.awayScore,
    competition: detail.competition || existing.competition,
    round: detail.round ?? existing.round,
    date: detail.date || existing.date,
    time: detail.time ?? existing.time,
    homeTeamLogo: detail.homeTeamLogo || existing.homeTeamLogo,
    awayTeamLogo: detail.awayTeamLogo || existing.awayTeamLogo,
    hasDetail: detail.hasDetail ?? existing.hasDetail ?? true,
    status: derivedStatus ?? existing.status ?? (scoresKnown ? 'finished' : 'scheduled'),
  };
}

async function updateMatchListCaches(detail: MatchDetail): Promise<void> {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const matchKeys = allKeys.filter((key) => key.startsWith(MATCH_CACHE_STORAGE_PREFIX));

    if (matchKeys.length === 0) {
      return;
    }

    const entries = await AsyncStorage.multiGet(matchKeys);
    const updates: Array<[string, string]> = [];

    for (const [storageKey, rawValue] of entries) {
      if (!rawValue) {
        continue;
      }

      let cached: CachedEntry<Match[]>;
      try {
        cached = JSON.parse(rawValue) as CachedEntry<Match[]>;
      } catch (error) {
        console.warn(`[MatchRefresh] Failed to parse cache entry ${storageKey}:`, error);
        continue;
      }

      if (!cached || !Array.isArray(cached.data)) {
        continue;
      }

      const matches = cached.data;
      const matchIndex = matches.findIndex((match) => match.id === detail.id);
      if (matchIndex === -1) {
        continue;
      }

      const existingMatch = matches[matchIndex];
      const updatedMatch = buildUpdatedMatch(existingMatch, detail);

      if (matchesEqual(existingMatch, updatedMatch)) {
        continue;
      }

      matches[matchIndex] = updatedMatch;
      cached.timestamp = Date.now();
      updates.push([storageKey, JSON.stringify(cached)]);
    }

    if (updates.length > 0) {
      await AsyncStorage.multiSet(updates);
      console.log(`[MatchRefresh] Updated ${updates.length} cached match list entries for match ${detail.id}`);
    }
  } catch (error) {
    console.error('[MatchRefresh] Error updating cached match lists:', error);
    crashlyticsService.recordError(error as Error, 'MatchCacheUpdateFailed');
  }
}

export async function refreshMatchData(matchId: number, trigger: string = 'unknown'): Promise<void> {
  if (!Number.isFinite(matchId) || matchId <= 0) {
    return;
  }

  if (activeRefreshes.has(matchId)) {
    return activeRefreshes.get(matchId);
  }

  const refreshPromise = (async () => {
    try {
      const detail = await footballApi.getMatchDetail(matchId);
      if (!detail) {
        return;
      }

      await saveToCache(getMatchDetailCacheKey(matchId), detail);
      await updateMatchListCaches(detail);
    } catch (error) {
      console.error(`[MatchRefresh] Failed to refresh match ${matchId} (${trigger})`, error);
      crashlyticsService.recordError(error as Error, 'MatchRefreshFailed');
    } finally {
      activeRefreshes.delete(matchId);
    }
  })();

  activeRefreshes.set(matchId, refreshPromise);
  return refreshPromise;
}

export async function refreshMatchDataFromPayload(
  payload: Record<string, unknown> | null | undefined,
  trigger: string = 'unknown'
): Promise<void> {
  const matchId = extractMatchId(payload);
  if (!matchId) {
    return;
  }

  await refreshMatchData(matchId, trigger);
}
