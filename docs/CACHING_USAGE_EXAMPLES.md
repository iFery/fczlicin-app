# Caching Layer Usage Examples

**Quick reference for using the new caching layer in UI components**

---

## Basic Usage

### Example 1: Displaying Teams List

```typescript
import React from 'react';
import { View, FlatList, Text, RefreshControl } from 'react-native';
import { useTeams } from '@/hooks';

export function TeamsScreen() {
  const { data: teams, loading, error, refetch, isStale } = useTeams();
  
  return (
    <View>
      {isStale && (
        <Text style={styles.staleIndicator}>
          Showing cached data, refreshing...
        </Text>
      )}
      
      <FlatList
        data={teams}
        renderItem={({ item }) => (
          <View>
            <Text>{item.name}</Text>
            <Text>{item.category}</Text>
          </View>
        )}
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

### Example 2: Match Results with Current Season

```typescript
import React from 'react';
import { View, FlatList, Text, RefreshControl, ActivityIndicator } from 'react-native';
import { useCurrentSeason, useMatchResults } from '@/hooks';

export function MatchResultsScreen({ teamId }: { teamId: number }) {
  const { data: currentSeason, loading: seasonLoading } = useCurrentSeason();
  const { 
    data: matches, 
    loading: matchesLoading, 
    error, 
    refetch, 
    isStale 
  } = useMatchResults(
    teamId, 
    currentSeason?.id || 0
  );
  
  if (seasonLoading) {
    return <ActivityIndicator />;
  }
  
  if (!currentSeason) {
    return <Text>No season available</Text>;
  }
  
  return (
    <View>
      {isStale && (
        <Text style={styles.staleIndicator}>Refreshing...</Text>
      )}
      
      <FlatList
        data={matches}
        renderItem={({ item }) => (
          <View>
            <Text>{item.homeTeam} vs {item.awayTeam}</Text>
            {item.status === 'finished' && (
              <Text>{item.homeScore} - {item.awayScore}</Text>
            )}
            <Text>{new Date(item.date).toLocaleDateString()}</Text>
          </View>
        )}
        keyExtractor={item => item.id.toString()}
        refreshControl={
          <RefreshControl 
            refreshing={matchesLoading} 
            onRefresh={refetch} 
          />
        }
      />
      
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}
```

---

### Example 3: Standings Table

```typescript
import React from 'react';
import { View, FlatList, Text, RefreshControl } from 'react-native';
import { useStandings, useCurrentSeason } from '@/hooks';

export function StandingsScreen({ teamId }: { teamId: number }) {
  const { data: currentSeason } = useCurrentSeason();
  const { data: standings, loading, error, refetch, isStale } = useStandings(
    teamId,
    currentSeason?.id || 0
  );
  
  if (!currentSeason) {
    return <Text>Loading season...</Text>;
  }
  
  return (
    <View>
      {isStale && (
        <Text style={styles.staleIndicator}>Updating table...</Text>
      )}
      
      <FlatList
        data={standings}
        renderItem={({ item }) => (
          <View style={styles.tableRow}>
            <Text>{item.position}</Text>
            <Text>{item.team}</Text>
            <Text>{item.played}</Text>
            <Text>{item.won}-{item.drawn}-{item.lost}</Text>
            <Text>{item.goalsFor}:{item.goalsAgainst}</Text>
            <Text style={styles.points}>{item.points}</Text>
          </View>
        )}
        keyExtractor={item => `${item.position}-${item.team}`}
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

### Example 4: Manual Cache Invalidation

```typescript
import React from 'react';
import { Button, View } from 'react-native';
import { invalidateMatchCache, invalidateAllFootballCache } from '@/utils/cacheUtils';

export function AdminScreen({ teamId, seasonId }: Props) {
  const handleInvalidateMatches = async () => {
    await invalidateMatchCache(teamId, seasonId);
    // Next time the hook is used, it will fetch fresh data
  };
  
  const handleInvalidateAll = async () => {
    await invalidateAllFootballCache();
    // All football cache cleared
  };
  
  return (
    <View>
      <Button 
        title="Refresh Matches" 
        onPress={handleInvalidateMatches} 
      />
      <Button 
        title="Clear All Cache" 
        onPress={handleInvalidateAll} 
      />
    </View>
  );
}
```

---

### Example 5: Handling Offline State

```typescript
import React from 'react';
import { View, Text } from 'react-native';
import { useMatchResults } from '@/hooks';
import { useNetworkStatus } from '@/hooks';

export function MatchResultsScreen({ teamId, seasonId }: Props) {
  const { isConnected } = useNetworkStatus();
  const { data, loading, error, isStale } = useMatchResults(teamId, seasonId);
  
  return (
    <View>
      {!isConnected && (
        <View style={styles.offlineBanner}>
          <Text>Offline - Showing cached data</Text>
        </View>
      )}
      
      {isStale && isConnected && (
        <Text style={styles.staleIndicator}>
          Data may be outdated, refreshing...
        </Text>
      )}
      
      {/* Rest of component */}
    </View>
  );
}
```

---

## Key Points

1. **Always show cached data immediately** - No loading spinner if cache exists
2. **Use `isStale` flag** - Show subtle indicator when data is being refreshed
3. **Provide `refetch` function** - For pull-to-refresh gestures
4. **Handle offline gracefully** - Cache works offline, show indicator
5. **Error handling** - Show errors only when no cache is available

---

## Hook Return Values

All football hooks return:

```typescript
{
  data: T;                    // The actual data
  loading: boolean;           // True only during initial load or manual refresh
  error: string | null;        // Error message if fetch failed
  refetch: () => Promise<void>; // Manual refresh function
  isStale: boolean;            // True if showing stale cached data
  lastUpdated: number | null;  // Timestamp of last successful fetch
}
```

---

**End of Usage Examples**
