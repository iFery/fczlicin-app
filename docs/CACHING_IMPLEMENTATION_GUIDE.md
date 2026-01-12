# Caching Layer Implementation Guide

**Quick Reference for Developers**

This guide provides practical implementation steps and code examples for implementing the caching layer as specified in `CACHING_LAYER_SPECIFICATION.md`.

---

## 🚀 Quick Start

### Step 1: Create Cache Configuration

**File:** `src/config/cacheConfig.ts`

```typescript
/**
 * Cache TTL (Time-to-Live) configuration in milliseconds
 * Each endpoint type has a tailored TTL based on update frequency
 */
export const CACHE_TTL = {
  TEAMS: 24 * 60 * 60 * 1000,           // 24 hours
  SEASONS: 24 * 60 * 60 * 1000,         // 24 hours
  COMPETITIONS: 24 * 60 * 60 * 1000,    // 24 hours
  MATCH_CALENDAR: 15 * 60 * 1000,       // 15 minutes
  MATCH_RESULTS: 10 * 60 * 1000,        // 10 minutes
  STANDINGS: 30 * 60 * 1000,            // 30 minutes
  DEFAULT: 15 * 60 * 1000,              // 15 minutes fallback
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
  return CACHE_TTL.DEFAULT;
}
```

---

### Step 2: Extend Cache Manager

**File:** `src/utils/cacheManager.ts` (extend existing)

Add these functions to the existing file:

```typescript
import { getTTLForKey } from '../config/cacheConfig';

/**
 * Load from cache with per-endpoint TTL checking
 * @param key Cache key
 * @param ttl Time-to-live in milliseconds (optional, uses config if not provided)
 * @returns Cached data if valid, null if expired/missing
 */
export async function loadFromCacheWithTTL<T>(
  key: string,
  ttl?: number
): Promise<T | null> {
  const cacheKey = getCacheKey(key);
  const ttlToUse = ttl ?? getTTLForKey(key);
  
  try {
    const cachedString = await AsyncStorage.getItem(cacheKey);
    if (!cachedString) return null;

    let cached: CachedData<T>;
    try {
      cached = JSON.parse(cachedString);
    } catch (parseError) {
      await AsyncStorage.removeItem(cacheKey);
      return null;
    }

    if (!cached || typeof cached !== 'object' || !cached.data) {
      await AsyncStorage.removeItem(cacheKey);
      return null;
    }

    // Check if cache is expired
    const now = Date.now();
    if (now - cached.timestamp > ttlToUse) {
      // Cache expired - don't remove, just return null
      // This allows stale-while-revalidate pattern
      return null;
    }

    return cached.data;
  } catch (error) {
    console.error(`Error loading cache for key ${key}:`, error);
    return null;
  }
}

/**
 * Load from cache allowing stale data
 * Returns data even if expired, with stale flag
 * Used for stale-while-revalidate pattern
 */
export async function loadFromCacheStaleAllowed<T>(
  key: string,
  ttl?: number
): Promise<{
  data: T | null;
  isStale: boolean;
  age: number | null;
}> {
  const cacheKey = getCacheKey(key);
  const ttlToUse = ttl ?? getTTLForKey(key);
  
  try {
    const cachedString = await AsyncStorage.getItem(cacheKey);
    if (!cachedString) {
      return { data: null, isStale: false, age: null };
    }

    let cached: CachedData<T>;
    try {
      cached = JSON.parse(cachedString);
    } catch (parseError) {
      await AsyncStorage.removeItem(cacheKey);
      return { data: null, isStale: false, age: null };
    }

    if (!cached || typeof cached !== 'object' || !cached.data) {
      await AsyncStorage.removeItem(cacheKey);
      return { data: null, isStale: false, age: null };
    }

    const age = Date.now() - cached.timestamp;
    const isStale = age >= ttlToUse;

    return {
      data: cached.data,
      isStale,
      age,
    };
  } catch (error) {
    console.error(`Error loading cache for key ${key}:`, error);
    return { data: null, isStale: false, age: null };
  }
}

/**
 * Invalidate cache entries
 * Supports single key or array of keys
 * Supports wildcard patterns (basic string matching)
 */
export async function invalidateCache(keyOrKeys: string | string[]): Promise<void> {
  try {
    const keys = Array.isArray(keyOrKeys) ? keyOrKeys : [keyOrKeys];
    const allKeys = await AsyncStorage.getAllKeys();
    
    const keysToRemove: string[] = [];
    
    for (const pattern of keys) {
      if (pattern.includes('*')) {
        // Wildcard pattern - match all keys starting with prefix
        const prefix = pattern.replace('*', '');
        const matchingKeys = allKeys
          .filter(k => k.startsWith(getCacheKey(prefix)))
          .map(k => k); // Already full keys
        keysToRemove.push(...matchingKeys);
      } else {
        // Exact match
        keysToRemove.push(getCacheKey(pattern));
      }
    }
    
    if (keysToRemove.length > 0) {
      await AsyncStorage.multiRemove(keysToRemove);
    }
  } catch (error) {
    console.error('Error invalidating cache:', error);
  }
}
```

---

### Step 3: Create Stale-While-Revalidate Hook

**File:** `src/hooks/useStaleWhileRevalidate.ts` (new)

```typescript
import { useState, useEffect, useCallback, useRef } from 'react';
import { ApiError } from '../api/client';
import { 
  loadFromCacheStaleAllowed, 
  saveToCache, 
  getTTLForKey 
} from '../utils/cacheManager';
import NetInfo from '@react-native-community/netinfo';

export interface UseStaleWhileRevalidateResult<T> {
  data: T;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  isStale: boolean;
  lastUpdated: number | null;
}

export interface UseStaleWhileRevalidateOptions<T> {
  cacheKey: string;
  fetchFn: () => Promise<T>;
  defaultData: T;
  errorMessage: string;
  ttl?: number;
  transformResponse?: (response: unknown) => T;
}

/**
 * Hook implementing stale-while-revalidate pattern
 * Serves cached data immediately (even if stale), refreshes in background
 */
export function useStaleWhileRevalidate<T>({
  cacheKey,
  fetchFn,
  defaultData,
  errorMessage,
  ttl,
  transformResponse,
}: UseStaleWhileRevalidateOptions<T>): UseStaleWhileRevalidateResult<T> {
  const [data, setData] = useState<T>(defaultData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isStale, setIsStale] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  
  const isMountedRef = useRef(true);
  const fetchFnRef = useRef(fetchFn);
  const transformResponseRef = useRef(transformResponse);
  const backgroundRefreshRef = useRef<Promise<void> | null>(null);
  
  const ttlToUse = ttl ?? getTTLForKey(cacheKey);
  
  // Update refs when props change
  useEffect(() => {
    fetchFnRef.current = fetchFn;
    transformResponseRef.current = transformResponse;
  }, [fetchFn, transformResponse]);
  
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  const fetchFromNetwork = useCallback(
    async (forceLoading = false): Promise<T | null> => {
      try {
        if (forceLoading && isMountedRef.current) {
          setLoading(true);
        }
        if (isMountedRef.current) {
          setError(null);
        }
        
        // Check network before fetch
        const networkState = await NetInfo.fetch();
        if (!networkState.isConnected) {
          throw new ApiError('No network connection', 0);
        }
        
        const response = await fetchFnRef.current();
        const transformedData = transformResponseRef.current
          ? transformResponseRef.current(response)
          : (response as T);
        
        await saveToCache<T>(cacheKey, transformedData);
        
        if (isMountedRef.current) {
          setData(transformedData);
          setLastUpdated(Date.now());
          setIsStale(false);
          setLoading(false);
        }
        
        return transformedData;
      } catch (err) {
        const apiError = err as ApiError;
        if (isMountedRef.current) {
          setError(apiError.message || errorMessage);
          setLoading(false);
        }
        throw err;
      }
    },
    [cacheKey, defaultData, errorMessage, ttlToUse]
  );
  
  // Background refresh (non-blocking)
  const backgroundRefresh = useCallback(async () => {
    // Prevent multiple simultaneous background refreshes
    if (backgroundRefreshRef.current) {
      return backgroundRefreshRef.current;
    }
    
    const refreshPromise = (async () => {
      try {
        await fetchFromNetwork(false);
      } catch (err) {
        // Silent failure - we already have cached data
        console.debug(`Background refresh failed for ${cacheKey}:`, err);
      } finally {
        backgroundRefreshRef.current = null;
      }
    })();
    
    backgroundRefreshRef.current = refreshPromise;
    return refreshPromise;
  }, [fetchFromNetwork, cacheKey]);
  
  // Initial load: check cache first, then fetch if needed
  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      // Load from cache (stale allowed)
      const cacheResult = await loadFromCacheStaleAllowed<T>(cacheKey, ttlToUse);
      
      if (!isMounted) return;
      
      if (cacheResult.data !== null) {
        // Cache exists - serve immediately
        setData(cacheResult.data);
        setIsStale(cacheResult.isStale);
        setLoading(false);
        
        if (cacheResult.age !== null) {
          setLastUpdated(Date.now() - cacheResult.age);
        }
        
        // If stale, trigger background refresh
        if (cacheResult.isStale) {
          backgroundRefresh().catch(() => {
            // Silent failure
          });
        }
      } else {
        // No cache - fetch from network
        setLoading(true);
        try {
          await fetchFromNetwork(true);
        } catch (err) {
          // Network error - show error, keep default data
          if (isMounted) {
            setError((err as ApiError).message || errorMessage);
            setData(defaultData);
            setLoading(false);
          }
        }
      }
    };
    
    loadData();
    
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey]);
  
  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      await fetchFromNetwork(true);
    } catch (err) {
      // Error already handled in fetchFromNetwork
    }
  }, [fetchFromNetwork]);
  
  return {
    data,
    loading,
    error,
    refetch,
    isStale,
    lastUpdated,
  };
}
```

---

### Step 4: Create Football API Endpoints

**File:** `src/api/footballEndpoints.ts` (new)

```typescript
import { apiClient } from './client';

// Type definitions (adjust based on actual API responses)
export interface Team {
  id: number;
  name: string;
  category: 'seniors' | 'youth';
}

export interface Season {
  id: number;
  name: string;
  isActive: boolean;
}

export interface Competition {
  teamId: number;
  seasonId: number;
  competition: string | null;
}

export interface Match {
  id: number;
  round: number;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  date: string;
  time: string;
  competition: string;
  status: 'scheduled' | 'finished';
  isHome: boolean;
  homeTeamLogo?: string;
  awayTeamLogo?: string;
}

export interface Standing {
  position: number;
  team: string;
  teamLogo: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
}

export const footballApi = {
  getTeams: () => 
    apiClient.get<Team[]>('/api/teams').then(res => res.data),
  
  getSeasons: () => 
    apiClient.get<Season[]>('/api/seasons').then(res => res.data),
  
  getCompetition: (teamId: number, seasonId: number) =>
    apiClient.get<Competition>(
      `/api/competitions?team=${teamId}&season=${seasonId}`
    ).then(res => res.data),
  
  getMatchCalendar: (teamId: number, seasonId: number) =>
    apiClient.get<Match[]>(
      `/api/matches?team=${teamId}&season=${seasonId}&type=calendar`
    ).then(res => res.data),
  
  getMatchResults: (teamId: number, seasonId: number) =>
    apiClient.get<Match[]>(
      `/api/matches?team=${teamId}&season=${seasonId}&type=results`
    ).then(res => res.data),
  
  getStandings: (teamId: number, seasonId: number) =>
    apiClient.get<Standing[]>(
      `/api/standings?team=${teamId}&season=${seasonId}`
    ).then(res => res.data),
};

/**
 * Get current season (highest ID from seasons list)
 */
export function getCurrentSeason(seasons: Season[]): Season | null {
  if (!seasons || seasons.length === 0) return null;
  return seasons.reduce((latest, season) => 
    season.id > latest.id ? season : latest
  );
}
```

---

### Step 5: Create Football-Specific Hooks

**File:** `src/hooks/useFootballData.ts` (new)

```typescript
import { useStaleWhileRevalidate } from './useStaleWhileRevalidate';
import { footballApi, getCurrentSeason, type Season } from '../api/footballEndpoints';
import { CACHE_KEY_PATTERNS, CACHE_TTL } from '../config/cacheConfig';

// Teams hook
export function useTeams() {
  return useStaleWhileRevalidate({
    cacheKey: CACHE_KEY_PATTERNS.TEAMS,
    fetchFn: footballApi.getTeams,
    defaultData: [],
    errorMessage: 'Failed to load teams',
    ttl: CACHE_TTL.TEAMS,
  });
}

// Seasons hook
export function useSeasons() {
  return useStaleWhileRevalidate({
    cacheKey: CACHE_KEY_PATTERNS.SEASONS,
    fetchFn: footballApi.getSeasons,
    defaultData: [],
    errorMessage: 'Failed to load seasons',
    ttl: CACHE_TTL.SEASONS,
  });
}

// Current season hook (derives from seasons)
export function useCurrentSeason() {
  const seasonsResult = useSeasons();
  
  const currentSeason = seasonsResult.data.length > 0
    ? getCurrentSeason(seasonsResult.data)
    : null;
  
  return {
    ...seasonsResult,
    data: currentSeason,
    defaultData: null as Season | null,
  };
}

// Competition hook
export function useCompetition(teamId: number, seasonId: number) {
  return useStaleWhileRevalidate({
    cacheKey: CACHE_KEY_PATTERNS.COMPETITIONS(teamId, seasonId),
    fetchFn: () => footballApi.getCompetition(teamId, seasonId),
    defaultData: { teamId, seasonId, competition: null },
    errorMessage: 'Failed to load competition',
    ttl: CACHE_TTL.COMPETITIONS,
  });
}

// Match calendar hook
export function useMatchCalendar(teamId: number, seasonId: number) {
  return useStaleWhileRevalidate({
    cacheKey: CACHE_KEY_PATTERNS.MATCH_CALENDAR(teamId, seasonId),
    fetchFn: () => footballApi.getMatchCalendar(teamId, seasonId),
    defaultData: [],
    errorMessage: 'Failed to load match calendar',
    ttl: CACHE_TTL.MATCH_CALENDAR,
  });
}

// Match results hook
export function useMatchResults(teamId: number, seasonId: number) {
  return useStaleWhileRevalidate({
    cacheKey: CACHE_KEY_PATTERNS.MATCH_RESULTS(teamId, seasonId),
    fetchFn: () => footballApi.getMatchResults(teamId, seasonId),
    defaultData: [],
    errorMessage: 'Failed to load match results',
    ttl: CACHE_TTL.MATCH_RESULTS,
  });
}

// Standings hook
export function useStandings(teamId: number, seasonId: number) {
  return useStaleWhileRevalidate({
    cacheKey: CACHE_KEY_PATTERNS.STANDINGS(teamId, seasonId),
    fetchFn: () => footballApi.getStandings(teamId, seasonId),
    defaultData: [],
    errorMessage: 'Failed to load standings',
    ttl: CACHE_TTL.STANDINGS,
  });
}
```

---

### Step 6: Usage in UI Components

**Example:** Using the hooks in a screen component

```typescript
import React from 'react';
import { View, FlatList, RefreshControl, Text } from 'react-native';
import { useMatchResults } from '@/hooks/useFootballData';

export function MatchResultsScreen({ teamId, seasonId }: Props) {
  const { data, loading, error, refetch, isStale } = useMatchResults(teamId, seasonId);
  
  return (
    <View>
      {isStale && (
        <Text style={styles.staleIndicator}>
          Showing cached data, refreshing...
        </Text>
      )}
      
      <FlatList
        data={data}
        renderItem={({ item }) => <MatchCard match={item} />}
        keyExtractor={item => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refetch} />
        }
      />
      
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}
```

---

## 🔧 Additional Utilities

### Cache Invalidation Helper

For future push notification integration:

```typescript
import { invalidateCache } from '@/utils/cacheManager';

// Invalidate specific team's match data
function invalidateTeamMatches(teamId: number, seasonId: number) {
  invalidateCache([
    `matches:team:${teamId}:season:${seasonId}:calendar`,
    `matches:team:${teamId}:season:${seasonId}:results`,
    `standings:team:${teamId}:season:${seasonId}`,
  ]);
}

// Invalidate all match data for a season
function invalidateSeasonData(seasonId: number) {
  invalidateCache(`matches:*:season:${seasonId}:*`);
}
```

---

## ✅ Testing Checklist

- [ ] Cache serves data immediately on mount
- [ ] Stale cache refreshes in background
- [ ] Pull-to-refresh forces fresh fetch
- [ ] Offline mode shows cached data
- [ ] TTL values are respected
- [ ] Current season determined by highest ID
- [ ] Cache invalidation works
- [ ] Error handling is graceful

---

## 📝 Notes

- All hooks follow the stale-while-revalidate pattern
- Network detection prevents unnecessary fetches when offline
- Cache keys are structured for easy invalidation patterns
- TTL values are centralized and easy to adjust

---

**End of Implementation Guide**
