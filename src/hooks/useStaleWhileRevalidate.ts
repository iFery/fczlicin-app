/**
 * Stale-while-revalidate hook for intelligent caching
 * Serves cached data immediately (even if stale), refreshes in background
 */

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
    [cacheKey, errorMessage, ttlToUse]
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
        console.debug(`[SWR] Background refresh failed for ${cacheKey}:`, err);
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
      // Set loading to true immediately if we're going to check cache
      // This prevents showing defaultData (which might have null values) before cache is checked
      setLoading(true);
      
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
        // No cache - fetch from network (loading already set to true)
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
