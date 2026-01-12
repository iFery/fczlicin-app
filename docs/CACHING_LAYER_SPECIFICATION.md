# Client-Side Caching Layer Specification

**Version:** 1.0  
**Date:** 2025-01-27  
**Status:** Ready for Implementation  
**Target:** React Native Mobile App for FC Zličín

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Objectives](#objectives)
3. [Architecture Overview](#architecture-overview)
4. [Data Types to Cache](#data-types-to-cache)
5. [TTL Configuration](#ttl-configuration)
6. [Cache Behavior & Flow](#cache-behavior--flow)
7. [Implementation Requirements](#implementation-requirements)
8. [Technical Specifications](#technical-specifications)
9. [Offline Support](#offline-support)
10. [Manual Refresh](#manual-refresh)
11. [Future Extensibility](#future-extensibility)
12. [Testing Requirements](#testing-requirements)
13. [Success Criteria](#success-criteria)

---

## 🎯 Executive Summary

This specification defines the requirements for implementing an intelligent client-side caching layer in the FC Zličín React Native mobile application. The caching system will reduce unnecessary network calls, provide instant data on app start, support offline usage, and maintain data freshness through time-based invalidation (TTL) with stale-while-revalidate patterns.

The implementation should extend the existing data layer architecture (`src/hooks/` and `src/services/`) without requiring changes to UI components. The cache layer will be transparent to consumers and designed for future enhancements such as server-triggered invalidation via push notifications.

---

## 🎯 Objectives

### Primary Goals

1. **Minimize Network Calls** — Reduce redundant API requests by serving cached data when appropriate
2. **Instant Data Display** — Show cached data immediately on app start or screen navigation
3. **Maintain Data Freshness** — Keep data reasonably up-to-date using configurable TTL values
4. **Offline Support** — Provide seamless experience when network is unavailable
5. **Future-Ready Architecture** — Design for server-triggered cache invalidation (push notifications)

### Success Metrics

- ⚡ App startup time: < 500ms to display cached data
- 📡 Network requests reduced by 60-80% during normal usage
- 🌐 Offline functionality: All cached screens accessible without network
- 🔄 Background refresh: Stale data refreshed without blocking UI

---

## 🏗️ Architecture Overview

### Current Architecture

The app currently uses:
- `src/utils/cacheManager.ts` — Basic cache utilities with fixed 24h TTL
- `src/hooks/useCachedData.ts` — Generic hook for data fetching with cache support
- `src/api/client.ts` — Centralized API client
- `@react-native-async-storage/async-storage` — Persistent storage

### Proposed Extension

The caching layer should extend the existing architecture by:

1. **Enhanced Cache Manager** — Add per-endpoint TTL configuration and stale-while-revalidate logic
2. **Specialized Hooks** — Create football-specific hooks (e.g., `useMatches`, `useStandings`) that use intelligent caching
3. **Cache Configuration** — Centralized TTL configuration for all cached endpoints
4. **Network-Aware Caching** — Respect network status when deciding to refresh

### Design Principles

- ✅ **Separation of Concerns** — Cache logic stays in data layer, not UI
- ✅ **Backward Compatible** — Existing hooks continue to work
- ✅ **Configurable** — TTL values can be adjusted without code changes
- ✅ **Extensible** — Easy to add new cached endpoints
- ✅ **Resilient** — Graceful fallbacks on errors

---

## 📊 Data Types to Cache

The following API endpoints should be cached with intelligent TTL values:

### 1. Teams List
- **Endpoint:** `/api/teams`
- **Purpose:** Team metadata (name, category: seniors/youth)
- **Usage:** Used across multiple screens, rarely changes
- **Cache Key Pattern:** `teams:list`

### 2. Current Season Metadata
- **Endpoint:** `/api/seasons`
- **Purpose:** Determine current season (highest ID from response)
- **Usage:** Critical for filtering matches, standings, competitions
- **Cache Key Pattern:** `seasons:list`
- **Note:** Current season must be determined by highest `id`, not `isActive` flag

### 3. Competition Names (for Current Season)
- **Endpoint:** `/api/competitions?team={id}&season={id}`
- **Purpose:** Competition name for a team/season combination
- **Usage:** Displayed in match cards, standings headers
- **Cache Key Pattern:** `competitions:team:{teamId}:season:{seasonId}`
- **Dependencies:** Requires team and season IDs

### 4. Match Calendar (Scheduled Matches)
- **Endpoint:** `/api/matches?team={id}&season={id}&type=calendar`
- **Purpose:** Upcoming matches without results
- **Usage:** Match calendar screen, home screen upcoming matches
- **Cache Key Pattern:** `matches:team:{teamId}:season:{seasonId}:calendar`
- **Dependencies:** Requires team and season IDs

### 5. Match Results (Past Matches)
- **Endpoint:** `/api/matches?team={id}&season={id}&type=results`
- **Purpose:** Completed matches with scores
- **Usage:** Results screen, match history
- **Cache Key Pattern:** `matches:team:{teamId}:season:{seasonId}:results`
- **Dependencies:** Requires team and season IDs

### 6. Standings (Table)
- **Endpoint:** `/api/standings?team={id}&season={id}`
- **Purpose:** League table with positions, points, goals
- **Usage:** Standings screen, home screen summary
- **Cache Key Pattern:** `standings:team:{teamId}:season:{seasonId}`
- **Dependencies:** Requires team and season IDs

### Out of Scope (for this task)

The following endpoints are **not** part of this caching task:
- `/api/news` — Can be cached separately if needed
- `/api/players` — Player list (may be cached on demand)
- `/api/player.php` — Individual player details
- `/api/matches?matchId={id}` — Match detail (large payload, cache separately)
- Historical seasons data — Only current season caching required

---

## 🕐 TTL Configuration

Time-to-Live (TTL) values define how long cached data remains "fresh" before requiring a background refresh. Each data type has a tailored TTL based on its update frequency in real-world usage.

### Default TTL Values

| Data Type | TTL | Rationale |
|-----------|-----|-----------|
| **Teams List** | **24 hours** | Teams rarely change during a season; reload at most once per day |
| **Current Season Metadata** | **24 hours** | Season only changes between seasons (yearly) |
| **Competitions (season)** | **24 hours** | Competition name is stable for entire season |
| **Match Calendar** | **15 minutes** | Match times can change due to rescheduling, but infrequently |
| **Match Results** | **10 minutes** | Scores change only after matches; high frequency views during game days |
| **Standings (Table)** | **30 minutes** | Table updates after each round; medium update frequency |

### TTL Implementation Requirements

1. **Configurable Constants** — TTL values should be defined as constants in a configuration file (e.g., `src/config/cacheConfig.ts`)
2. **Easy Adjustment** — TTL values must be easy to modify without refactoring code
3. **Per-Endpoint TTL** — Each endpoint type should have its own TTL value
4. **Fallback TTL** — Default TTL of 15 minutes for any uncached endpoint types

### Example Configuration Structure

```typescript
// src/config/cacheConfig.ts
export const CACHE_TTL = {
  TEAMS: 24 * 60 * 60 * 1000,           // 24 hours
  SEASONS: 24 * 60 * 60 * 1000,         // 24 hours
  COMPETITIONS: 24 * 60 * 60 * 1000,    // 24 hours
  MATCH_CALENDAR: 15 * 60 * 1000,       // 15 minutes
  MATCH_RESULTS: 10 * 60 * 1000,        // 10 minutes
  STANDINGS: 30 * 60 * 1000,            // 30 minutes
  DEFAULT: 15 * 60 * 1000,              // 15 minutes fallback
} as const;
```

---

## 🔄 Cache Behavior & Flow

The cache layer follows a **stale-while-revalidate** pattern, an industry-recommended approach that balances performance and data freshness.

### High-Level Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Cache Request Flow                        │
└─────────────────────────────────────────────────────────────┘

1. App Start / Screen Load
   │
   ├─► Check Cache
   │   │
   │   ├─► Cache Exists & Fresh (age < TTL)
   │   │   └─► Serve from Cache ✓ (no loading state)
   │   │       └─► (Optional) Background refresh if near expiry
   │   │
   │   ├─► Cache Exists & Stale (age >= TTL)
   │   │   └─► Serve from Cache ✓ (no loading state)
   │   │       └─► Background fetch → Update cache → (Silent refresh)
   │   │
   │   └─► Cache Missing
   │       └─► Show Loading State
   │           └─► Fetch from Network
   │               ├─► Success → Save to Cache → Update UI
   │               └─► Error → Show Error (or use stale cache if available)
```

### Detailed Behavior

#### 1. On App Start or Screen Load

**Step 1: Check Cache First**
- Immediately attempt to read from cache (synchronous if possible, async otherwise)
- If cache exists and is **not expired** (age < TTL):
  - ✅ Serve cached data immediately
  - ✅ Do **not** show loading spinner
  - (Optional) Trigger background refresh if cache age > 80% of TTL (proactive refresh)

**Step 2: Handle Missing or Expired Cache**
- If cache is absent or expired (age >= TTL):
  - If cache exists but expired: serve stale cache immediately (no loading)
  - Show loading state only if no cache exists
  - Fetch from network in background
  - Update cache and UI when fetch completes

#### 2. Stale-While-Revalidate Logic

**When Cache is Stale (age >= TTL):**
- ✅ **Serve stale cache immediately** — User sees data instantly
- ✅ **No blocking** — UI does not wait for network response
- 🔄 **Background refresh** — Trigger network fetch silently
- 🔄 **Update on completion** — When network fetch succeeds, update cache and UI
- ⚠️ **Silent failure** — If background refresh fails, keep showing stale cache (no error to user)

**Benefits:**
- Instant UI response (no perceived delay)
- Always shows "something" (never blank screens)
- Data freshness maintained in background
- Reduces perceived loading times by 70-90%

#### 3. Manual Refresh Trigger

**Pull-to-Refresh Pattern:**
- User explicitly requests fresh data (e.g., pull-to-refresh gesture)
- **Invalidate cache** for the specific endpoint
- **Show loading indicator** during refresh
- **Fetch from network** and update cache
- **Handle errors** — If network fails, show error but keep stale cache visible

**Implementation:**
- Provide `refetch()` function in hooks
- UI components can call `refetch()` on pull-to-refresh
- Cache is invalidated before fetch (force fresh data)

#### 4. Offline Support

**Network Unavailable:**
- ✅ **Serve from cache** — Use any available cached data
- ✅ **No network errors** — Don't show "network error" if cache exists
- ✅ **Offline indicator** — Show subtle indicator that data may be stale
- ⚠️ **Graceful degradation** — Missing cache + offline = show "no data available"

**Network Detection:**
- Use `@react-native-community/netinfo` (already in dependencies)
- Check network status before attempting network fetch
- If offline, skip network fetch and rely on cache only

#### 5. Error Handling

**Network Error with Cache Available:**
- Show cached data (even if stale)
- Don't show error to user (cached data is acceptable)
- Optionally show subtle indicator that data may be outdated

**Network Error without Cache:**
- Show appropriate error message
- Provide retry mechanism
- Don't crash app

**Cache Corruption:**
- Detect corrupted cache entries (JSON parse errors)
- Clear corrupted entry automatically
- Fall back to network fetch (or error if offline)

---

## 🔧 Implementation Requirements

### 1. Enhanced Cache Manager

**File:** `src/utils/cacheManager.ts` (extend existing)

**New Functions Required:**

```typescript
/**
 * Load from cache with per-endpoint TTL checking
 * @param key Cache key
 * @param ttl Time-to-live in milliseconds (from config)
 * @returns Cached data if valid, null if expired/missing
 */
async function loadFromCacheWithTTL<T>(key: string, ttl: number): Promise<T | null>

/**
 * Check if cache is stale (age >= TTL) but still return data
 * @param key Cache key
 * @param ttl Time-to-live in milliseconds
 * @returns Object with { data, isStale, age }
 */
async function loadFromCacheStaleAllowed<T>(key: string, ttl: number): Promise<{
  data: T | null;
  isStale: boolean;
  age: number | null;
}>

/**
 * Invalidate specific cache entry
 * @param key Cache key (supports wildcards for pattern matching)
 */
async function invalidateCache(key: string | string[]): Promise<void>

/**
 * Get TTL for a cache key pattern
 * @param keyPattern Cache key pattern (e.g., 'matches:*')
 * @returns TTL in milliseconds or default TTL
 */
function getTTLForKey(keyPattern: string): number
```

**Modifications to Existing Functions:**
- `loadFromCache()` — Keep for backward compatibility (uses default TTL)
- `saveToCache()` — No changes needed
- `getCacheAge()` — Already exists, use as-is

### 2. Cache Configuration

**File:** `src/config/cacheConfig.ts` (new file)

**Structure:**
```typescript
export const CACHE_TTL = { /* ... */ } as const;

export const CACHE_KEY_PATTERNS = {
  TEAMS: 'teams:list',
  SEASONS: 'seasons:list',
  COMPETITIONS: 'competitions:team:{teamId}:season:{seasonId}',
  MATCH_CALENDAR: 'matches:team:{teamId}:season:{seasonId}:calendar',
  MATCH_RESULTS: 'matches:team:{teamId}:season:{seasonId}:results',
  STANDINGS: 'standings:team:{teamId}:season:{seasonId}',
} as const;

/**
 * Get TTL for a cache key
 */
export function getTTLForKey(key: string): number {
  // Implementation
}
```

### 3. Enhanced Data Hooks

**Create Football-Specific Hooks:**

**File:** `src/hooks/useFootballData.ts` (new file)

**Hooks to Implement:**
- `useTeams()` — Teams list with 24h TTL
- `useCurrentSeason()` — Current season (highest ID) with 24h TTL
- `useCompetition(teamId, seasonId)` — Competition name with 24h TTL
- `useMatchCalendar(teamId, seasonId)` — Scheduled matches with 15min TTL
- `useMatchResults(teamId, seasonId)` — Past matches with 10min TTL
- `useStandings(teamId, seasonId)` — League table with 30min TTL

**Hook Pattern:**
```typescript
interface UseFootballDataResult<T> {
  data: T;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  isStale: boolean; // NEW: Indicates if showing stale data
  lastUpdated: number | null; // NEW: Timestamp of last successful fetch
}

function useMatchResults(teamId: number, seasonId: number): UseFootballDataResult<Match[]> {
  // Implementation using stale-while-revalidate pattern
}
```

### 4. Stale-While-Revalidate Hook

**File:** `src/hooks/useStaleWhileRevalidate.ts` (new file, or extend `useCachedData.ts`)

**Core Logic:**
```typescript
function useStaleWhileRevalidate<T>(options: {
  cacheKey: string;
  fetchFn: () => Promise<T>;
  ttl: number;
  defaultData: T;
  errorMessage: string;
}): UseFootballDataResult<T> {
  // 1. Load from cache immediately (stale allowed)
  // 2. If stale, trigger background refresh
  // 3. Update UI when background refresh completes
  // 4. Handle offline scenario
}
```

### 5. API Endpoints

**File:** `src/api/footballEndpoints.ts` (new file)

**API Client Functions:**
```typescript
export const footballApi = {
  getTeams: () => apiClient.get<Team[]>('/api/teams'),
  getSeasons: () => apiClient.get<Season[]>('/api/seasons'),
  getCompetition: (teamId: number, seasonId: number) => 
    apiClient.get<Competition>(`/api/competitions?team=${teamId}&season=${seasonId}`),
  getMatchCalendar: (teamId: number, seasonId: number) =>
    apiClient.get<Match[]>(`/api/matches?team=${teamId}&season=${seasonId}&type=calendar`),
  getMatchResults: (teamId: number, seasonId: number) =>
    apiClient.get<Match[]>(`/api/matches?team=${teamId}&season=${seasonId}&type=results`),
  getStandings: (teamId: number, seasonId: number) =>
    apiClient.get<Standing[]>(`/api/standings?team=${teamId}&season=${seasonId}`),
};
```

### 6. Current Season Determination

**Critical Requirement:** Current season must be determined by the **highest `id`** from `/api/seasons`, not by `isActive` flag.

**Implementation:**
```typescript
function getCurrentSeason(seasons: Season[]): Season | null {
  if (!seasons || seasons.length === 0) return null;
  return seasons.reduce((latest, season) => 
    season.id > latest.id ? season : latest
  );
}
```

---

## 🌐 Offline Support

### Requirements

1. **Network Status Detection**
   - Use `@react-native-community/netinfo` (already installed)
   - Create `src/hooks/useNetworkStatus.ts` if not exists
   - Check network before attempting fetch

2. **Offline Behavior**
   - Serve from cache if available (even if stale)
   - Show subtle "offline" indicator (optional badge/banner)
   - Don't show error messages if cache is available
   - Disable pull-to-refresh when offline (or show "offline" message)

3. **Offline Indicator**
   - Optional: Show banner when offline
   - Optional: Show indicator on cached data that may be stale
   - Don't block UI — indicator should be non-intrusive

### Implementation

```typescript
// In hooks, check network before fetch
import NetInfo from '@react-native-community/netinfo';

async function fetchWithOfflineSupport() {
  const networkState = await NetInfo.fetch();
  
  if (!networkState.isConnected) {
    // Serve from cache only
    const cached = await loadFromCache(key);
    if (cached) return { data: cached, isStale: true };
    throw new Error('Offline and no cache available');
  }
  
  // Proceed with network fetch
  // ...
}
```

---

## 🔄 Manual Refresh

### Requirements

1. **Pull-to-Refresh Support**
   - Each hook should expose `refetch()` function
   - UI components can trigger `refetch()` on pull-to-refresh gesture
   - `refetch()` invalidates cache and forces fresh fetch

2. **Refresh Behavior**
   - Show loading indicator during refresh
   - Invalidate cache before fetch (don't serve stale during refresh)
   - Update UI when fetch completes
   - Handle errors appropriately

3. **Implementation**

```typescript
const { data, loading, refetch } = useMatchResults(teamId, seasonId);

// In UI component:
<RefreshControl refreshing={loading} onRefresh={refetch} />
```

---

## 🚀 Future Extensibility

### Server-Triggered Cache Invalidation

The architecture must support future enhancement where push notifications can invalidate specific cache entries.

**Requirements:**
1. **Cache Invalidation API**
   - Export `invalidateCache(key: string | string[])` function
   - Support wildcard patterns (e.g., `matches:*` to invalidate all match caches)
   - Support array of keys for batch invalidation

2. **Event System (Optional)**
   - Provide event emitter for cache invalidation events
   - Allow hooks to subscribe to invalidation events
   - Trigger UI refresh when cache is invalidated externally

3. **Push Notification Integration (Future)**
   - When push notification received: extract cache key pattern
   - Call `invalidateCache(pattern)`
   - Trigger background refresh for invalidated keys

**Example:**
```typescript
// In push notification handler (future):
import { invalidateCache } from '@/utils/cacheManager';

// When notification indicates match result updated:
invalidateCache(`matches:team:${teamId}:season:${seasonId}:results`);
invalidateCache(`standings:team:${teamId}:season:${seasonId}`);
// This will trigger hooks to refresh data
```

### Hooks/Events for External Invalidation

**File:** `src/utils/cacheEvents.ts` (optional, for future)

```typescript
import { EventEmitter } from 'events';

class CacheEventEmitter extends EventEmitter {}
export const cacheEvents = new CacheEventEmitter();

// When cache invalidated:
cacheEvents.emit('invalidated', { keys: ['matches:*'] });

// In hooks, subscribe:
useEffect(() => {
  const handler = (event: { keys: string[] }) => {
    if (event.keys.some(k => matchesCacheKey(k, cacheKey))) {
      refetch(); // Trigger refresh
    }
  };
  cacheEvents.on('invalidated', handler);
  return () => cacheEvents.off('invalidated', handler);
}, [cacheKey, refetch]);
```

---

## ✅ Testing Requirements

### Unit Tests

1. **Cache Manager Tests**
   - Test TTL expiration logic
   - Test stale-while-revalidate behavior
   - Test cache invalidation
   - Test offline scenario

2. **Hook Tests**
   - Test immediate cache serving
   - Test background refresh on stale cache
   - Test error handling
   - Test offline fallback

3. **Current Season Logic Tests**
   - Test highest ID selection
   - Test edge cases (empty array, single season)

### Integration Tests

1. **End-to-End Cache Flow**
   - Test app start with cache
   - Test app start without cache
   - Test stale cache refresh
   - Test offline mode

2. **Network Simulation**
   - Test with network disabled
   - Test with slow network
   - Test with network error

### Manual Testing Checklist

- [ ] App starts instantly with cached data
- [ ] Stale cache shows immediately, refreshes in background
- [ ] Pull-to-refresh forces fresh data
- [ ] Offline mode shows cached data
- [ ] Error handling works gracefully
- [ ] TTL values are respected
- [ ] Cache invalidation works

---

## 🎯 Success Criteria

### Functional Requirements

- ✅ All 6 endpoint types cached with correct TTL values
- ✅ Stale-while-revalidate pattern implemented
- ✅ Offline support functional
- ✅ Manual refresh (pull-to-refresh) works
- ✅ Current season determined by highest ID

### Performance Requirements

- ✅ App startup shows data in < 500ms (from cache)
- ✅ Network requests reduced by 60-80% during normal usage
- ✅ No UI blocking during background refresh
- ✅ Smooth transitions between cached and fresh data

### Code Quality Requirements

- ✅ Type-safe (TypeScript)
- ✅ Well-documented (JSDoc comments)
- ✅ Backward compatible with existing code
- ✅ Follows existing code style and patterns
- ✅ Unit tests coverage > 80%

### User Experience Requirements

- ✅ No blank screens (always show cached data if available)
- ✅ No unnecessary loading spinners
- ✅ Subtle offline indicators (non-intrusive)
- ✅ Graceful error handling

---

## 📝 Implementation Notes

### Key Decisions

1. **Storage Backend:** Continue using `@react-native-async-storage/async-storage` (already in dependencies, proven stable)

2. **Cache Key Naming:** Use pattern `{resource}:{param1}:{param2}:...` for consistency and easy invalidation

3. **TTL Strategy:** Per-endpoint TTL values from configuration file, default fallback for unknown endpoints

4. **Stale Handling:** Always serve stale cache if available (better than blank screen), refresh in background

5. **Network Detection:** Use `@react-native-community/netinfo` (already in dependencies)

### Migration Path

1. **Phase 1:** Extend `cacheManager.ts` with TTL support (backward compatible)
2. **Phase 2:** Create football-specific hooks using new cache manager
3. **Phase 3:** Update UI components to use new hooks (gradual migration)
4. **Phase 4:** Remove old cache usage (if any) after full migration

### Dependencies

All required dependencies are already installed:
- `@react-native-async-storage/async-storage` ✅
- `@react-native-community/netinfo` ✅
- React hooks (built-in) ✅

---

## 📚 Additional Resources

### Related Documentation

- Existing cache implementation: `src/utils/cacheManager.ts`
- Existing data hooks: `src/hooks/useCachedData.ts`
- API client: `src/api/client.ts`

### References

- [Stale-While-Revalidate Pattern](https://web.dev/stale-while-revalidate/)
- [React Native AsyncStorage](https://react-native-async-storage.github.io/async-storage/)
- [React Native NetInfo](https://github.com/react-native-netinfo/react-native-netinfo)

---

## ✅ Approval & Sign-off

**Prepared by:** Senior React Native Architect  
**Review Status:** Ready for Implementation  
**Priority:** High  
**Estimated Effort:** 3-5 days

---

**End of Specification**
