/**
 * Centralized cache manager for all API data
 * Provides unified caching interface with configurable TTL expiration
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { getTTLForKey } from '../config/cacheConfig';

const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours (legacy default)
const APP_VERSION_KEY = '@app_version';

interface CachedData<T> {
  data: T;
  timestamp: number;
}

/**
 * Generic cache key generator
 */
function getCacheKey(key: string): string {
  return `cache_${key}`;
}

/**
 * Load data from cache if valid (not expired)
 */
export async function loadFromCache<T>(key: string): Promise<T | null> {
  const cacheKey = getCacheKey(key);
  
  try {
    const cachedString = await AsyncStorage.getItem(cacheKey);
    
    if (!cachedString) {
      return null;
    }

    let cached: CachedData<T>;
    try {
      cached = JSON.parse(cachedString);
    } catch (parseError) {
      // Issue #6: Clear corrupted cache entry when JSON parsing fails
      await AsyncStorage.removeItem(cacheKey);
      console.error(`Corrupted cache cleared for key ${key}:`, parseError);
      return null;
    }

    // Validate cached data structure
    if (!cached || typeof cached !== 'object' || !cached.data) {
      await AsyncStorage.removeItem(cacheKey);
      console.warn(`Invalid cache structure cleared for key ${key}`);
      return null;
    }

    // Check if cache is expired
    const now = Date.now();
    if (now - cached.timestamp > CACHE_EXPIRY_MS) {
      await AsyncStorage.removeItem(cacheKey);
      return null;
    }

    return cached.data;
  } catch (error) {
    console.error(`Error loading cache for key ${key}:`, error);
    // Try to clear cache on any other error
    try {
      await AsyncStorage.removeItem(cacheKey);
    } catch {
      // Ignore errors when clearing
    }
    return null;
  }
}

/**
 * Save data to cache with timestamp
 */
export async function saveToCache<T>(key: string, data: T): Promise<void> {
  try {
    const cacheKey = getCacheKey(key);
    const cached: CachedData<T> = {
      data,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(cacheKey, JSON.stringify(cached));
  } catch (error) {
    console.error(`Error saving cache for key ${key}:`, error);
  }
}

/**
 * Clear specific cache entry
 */
export async function clearCache(key: string): Promise<void> {
  try {
    const cacheKey = getCacheKey(key);
    await AsyncStorage.removeItem(cacheKey);
  } catch (error) {
    console.error(`Error clearing cache for key ${key}:`, error);
  }
}

/**
 * Clear all cache entries
 */
export async function clearAllCache(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter((key) => key.startsWith('cache_'));
    await AsyncStorage.multiRemove(cacheKeys);
  } catch (error) {
    console.error('Error clearing all cache:', error);
  }
}

/**
 * Check if cache exists and is valid
 */
export async function hasValidCache(key: string): Promise<boolean> {
  const data = await loadFromCache(key);
  return data !== null;
}

/**
 * Get cache age in milliseconds
 */
export async function getCacheAge(key: string): Promise<number | null> {
  const cacheKey = getCacheKey(key);
  
  try {
    const cachedString = await AsyncStorage.getItem(cacheKey);
    
    if (!cachedString) {
      return null;
    }

    let cached: CachedData<unknown>;
    try {
      cached = JSON.parse(cachedString);
    } catch (parseError) {
      // Issue #6: Clear corrupted cache entry when JSON parsing fails
      await AsyncStorage.removeItem(cacheKey);
      console.error(`Corrupted cache cleared for key ${key}:`, parseError);
      return null;
    }

    // Validate cached data structure
    if (!cached || typeof cached !== 'object' || typeof cached.timestamp !== 'number') {
      await AsyncStorage.removeItem(cacheKey);
      console.warn(`Invalid cache structure cleared for key ${key}`);
      return null;
    }

    return Date.now() - cached.timestamp;
  } catch (error) {
    console.error(`Error getting cache age for key ${key}:`, error);
    // Try to clear cache on any other error
    try {
      await AsyncStorage.removeItem(cacheKey);
    } catch {
      // Ignore errors when clearing
    }
    return null;
  }
}

/**
 * Check if any of the required cache keys exist and are valid
 * Returns true if at least one cache exists
 */
export async function hasAnyValidCache(keys: string[]): Promise<boolean> {
  for (const key of keys) {
    const hasCache = await hasValidCache(key);
    if (hasCache) {
      return true;
    }
  }
  return false;
}

/**
 * Get the oldest cache age from the provided keys
 * Returns null if no valid cache exists
 */
export async function getOldestCacheAge(keys: string[]): Promise<number | null> {
  let oldestAge: number | null = null;

  for (const key of keys) {
    const age = await getCacheAge(key);
    if (age !== null) {
      if (oldestAge === null || age > oldestAge) {
        oldestAge = age;
      }
    }
  }

  return oldestAge;
}

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
      console.error(`Corrupted cache cleared for key ${key}:`, parseError);
      return null;
    }

    if (!cached || typeof cached !== 'object' || !cached.data) {
      await AsyncStorage.removeItem(cacheKey);
      console.warn(`Invalid cache structure cleared for key ${key}`);
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
 * @param key Cache key
 * @param ttl Time-to-live in milliseconds (optional, uses config if not provided)
 * @returns Object with data, isStale flag, and age in milliseconds
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
      console.error(`Corrupted cache cleared for key ${key}:`, parseError);
      return { data: null, isStale: false, age: null };
    }

    if (!cached || typeof cached !== 'object' || !cached.data) {
      await AsyncStorage.removeItem(cacheKey);
      console.warn(`Invalid cache structure cleared for key ${key}`);
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
 * @param keyOrKeys Single cache key, array of keys, or wildcard pattern (e.g., 'matches:*')
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
    
    // Remove duplicates
    const uniqueKeys = Array.from(new Set(keysToRemove));
    
    if (uniqueKeys.length > 0) {
      await AsyncStorage.multiRemove(uniqueKeys);
      console.debug(`[CacheManager] Invalidated ${uniqueKeys.length} cache entries`);
    }
  } catch (error) {
    console.error('[CacheManager] Error invalidating cache:', error);
  }
}

/**
 * Get current app version from Constants
 */
function getCurrentAppVersion(): string {
  return Constants.expoConfig?.version || Constants.manifest2?.extra?.expoClient?.version || '1.0.0';
}

/**
 * Check if app version has changed and clear cache if needed
 * Should be called on app startup to handle version upgrades
 */
export async function checkAndClearCacheOnVersionUpgrade(): Promise<boolean> {
  try {
    const currentVersion = getCurrentAppVersion();
    const storedVersion = await AsyncStorage.getItem(APP_VERSION_KEY);

    // If version changed, clear all cache
    if (storedVersion && storedVersion !== currentVersion) {
      console.log(`[CacheManager] App version changed from ${storedVersion} to ${currentVersion}, clearing cache`);
      await clearAllCache();
      await AsyncStorage.setItem(APP_VERSION_KEY, currentVersion);
      return true; // Cache was cleared
    }

    // If no stored version, this is first launch or cache was cleared manually
    // Store current version for future checks
    if (!storedVersion) {
      await AsyncStorage.setItem(APP_VERSION_KEY, currentVersion);
    }

    return false; // Cache was not cleared
  } catch (error) {
    console.error('[CacheManager] Error checking version upgrade:', error);
    // On error, don't block app - just log and continue
    return false;
  }
}

