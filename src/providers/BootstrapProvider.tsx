/**
 * BootstrapProvider - Controls app startup with offline-first logic
 * Ensures app only starts when data is available (online or cached)
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { preloadAllData, preloadCurrentSeasonData } from '../services/preloadService';
import { hasAnyValidCache, getOldestCacheAge, loadFromCache, checkAndClearCacheOnVersionUpgrade } from '../utils/cacheManager';
import { crashlyticsService } from '../services/crashlytics';
import { initializeFirebase } from '../services/firebase';
import { remoteConfigService } from '../services/remoteConfig';
import { notificationService } from '../services/notifications';
import { Platform } from 'react-native';
import { TimelineApiResponse } from '../api/endpoints';
import { checkForUpdate, UpdateInfo } from '../services/updateService';

const UPDATE_SKIP_KEY = '@update_skip_version';

export type BootstrapState = 
  | 'loading' 
  | 'update-required' 
  | 'update-optional' 
  | 'ready-online' 
  | 'ready-offline' 
  | 'offline-blocked';

interface BootstrapContextValue {
  state: BootstrapState;
  retry: () => void;
  timelineData: TimelineApiResponse | null;
  updateInfo: UpdateInfo | null;
  skipUpdate: () => Promise<void>;
}

const BootstrapContext = createContext<BootstrapContextValue | undefined>(undefined);

// Required cache keys for app to function
// Note: Festival-related cache keys removed - app now uses football API
const REQUIRED_CACHE_KEYS: string[] = [];

interface BootstrapProviderProps {
  children: ReactNode;
}

export function BootstrapProvider({ children }: BootstrapProviderProps) {
  const [state, setState] = useState<BootstrapState>('loading');
  const [retryKey, setRetryKey] = useState(0);
  const [timelineData, setTimelineData] = useState<TimelineApiResponse | null>(null);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);

  // Run bootstrap with proper cleanup and mounted checks
  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();

    const runBootstrap = async () => {
      try {
        if (!isMounted || abortController.signal.aborted) return;
        setState('loading');
        
        crashlyticsService.log('bootstrap_start');
        crashlyticsService.setAttribute('bootstrap_attempt', String(retryKey + 1));

        // Initialize Firebase first (required for Crashlytics)
        try {
          await initializeFirebase();
          if (!isMounted || abortController.signal.aborted) return;
          crashlyticsService.log('Firebase initialized');
        } catch (firebaseError) {
          // Continue even if Firebase fails
        }

        // Setup Crashlytics attributes
        try {
          crashlyticsService.setAttribute('platform', Platform.OS);
        } catch (e) {
          // Ignore if Crashlytics is not available
        }

        // Check for app version upgrade and clear cache if needed
        // This should happen before any cache operations
        try {
          const cacheCleared = await checkAndClearCacheOnVersionUpgrade();
          if (cacheCleared) {
            crashlyticsService.log('cache_cleared_on_version_upgrade');
          }
        } catch (versionCheckError) {
          // Continue bootstrap even if version check fails
        }

        // Check internet connectivity first (before Remote Config fetch)
        const netInfoState = await NetInfo.fetch();
        if (!isMounted || abortController.signal.aborted) return;
        
        const isInternetReachable = netInfoState.isInternetReachable ?? false;
        
        crashlyticsService.setAttribute('internet_reachable', String(isInternetReachable));
        crashlyticsService.log(`Internet reachable: ${isInternetReachable}`);

        // Initialize Remote Config (skip fetch if no internet)
        try {
          await remoteConfigService.initialize(!isInternetReachable);
          if (!isMounted || abortController.signal.aborted) return;
          crashlyticsService.log('Remote Config initialized');
        } catch (rcError) {
          // Ignore Remote Config errors
        }

        // Check for app updates (after Remote Config is initialized)
        // Only check if online (offline mode should not block app)
        if (isInternetReachable) {
          try {
            const updateCheckResult = await checkForUpdate();
            if (!isMounted || abortController.signal.aborted) return;
            
            // Check if user has skipped this version
            const skippedVersion = await AsyncStorage.getItem(UPDATE_SKIP_KEY);
            const isSkipped = skippedVersion === updateCheckResult.latestVersion;
            
            setUpdateInfo(updateCheckResult);
            
            if (updateCheckResult.type === 'forced') {
              crashlyticsService.log('bootstrap_blocked_by_forced_update');
              setState('update-required');
              return; // Stop bootstrap, show update screen (cannot skip forced updates)
            } else if (updateCheckResult.type === 'optional' && !isSkipped) {
              crashlyticsService.log('bootstrap_optional_update_available');
              setState('update-optional');
              return; // Stop bootstrap, show update screen (user can skip)
            }
            // Continue with normal bootstrap if no update needed or update was skipped
          } catch (updateError) {
            crashlyticsService.recordError(updateError instanceof Error ? updateError : new Error('Update check failed'));
            // Continue with bootstrap even if update check fails
          }
        }

        // Setup notifications (only listeners, don't request permission here)
        if (Platform.OS !== 'web') {
          try {
            const token = await notificationService.getToken();
            if (!isMounted || abortController.signal.aborted) return;
            if (token) {
              crashlyticsService.log('FCM Token registered');
            }
            // Store listeners (they live for app lifetime, no cleanup needed)
            notificationService.setupNotificationListeners();
          } catch (notifError) {
            // Ignore notification setup errors
          }
        }

        // Check for existing cache
        const hasCache = await hasAnyValidCache(REQUIRED_CACHE_KEYS);
        if (!isMounted || abortController.signal.aborted) return;
        
        // Preload timeline data from cache if available (for immediate use in TimelineContext)
        if (hasCache) {
          try {
            const cachedTimeline = await loadFromCache<TimelineApiResponse>('timeline');
            if (cachedTimeline && isMounted && !abortController.signal.aborted) {
              setTimelineData(cachedTimeline);
            }
          } catch (err) {
            // Silently fail - timeline will be loaded later if needed
          }
        }
        
        const cacheAge = hasCache ? await getOldestCacheAge(REQUIRED_CACHE_KEYS) : null;
        
        if (cacheAge !== null) {
          const cacheAgeHours = Math.floor(cacheAge / (60 * 60 * 1000));
          crashlyticsService.setAttribute('cache_age_hours', String(cacheAgeHours));
          crashlyticsService.log(`Cache age: ${cacheAgeHours} hours`);
        }

        // Decision flow
        if (isInternetReachable) {
          // Internet is available - try to fetch data
          try {
            crashlyticsService.log('Fetching app data...');
            
            // Preload general app data and current season data in parallel
            const [preloadResult, seasonPreloadResult] = await Promise.all([
              preloadAllData(),
              preloadCurrentSeasonData(),
            ]);
            
            if (!isMounted || abortController.signal.aborted) return;
            
            // Store timeline data from preload for immediate use in TimelineContext
            if (preloadResult.timelineData && isMounted && !abortController.signal.aborted) {
              setTimelineData(preloadResult.timelineData);
            }
            
            if (preloadResult.errors.length > 0) {
              crashlyticsService.log(`Preload errors: ${preloadResult.errors.join(', ')}`);
            }
            
            if (seasonPreloadResult.errors.length > 0) {
              crashlyticsService.log(`Season preload errors: ${seasonPreloadResult.errors.join(', ')}`);
            } else {
              crashlyticsService.log('current_season_data_preloaded');
            }

            // After fetch attempt, check if we have cache now
            const hasCacheAfterFetch = REQUIRED_CACHE_KEYS.length > 0 
              ? await hasAnyValidCache(REQUIRED_CACHE_KEYS)
              : true; // If no required keys, consider it successful
            
            if (!isMounted || abortController.signal.aborted) return;
            
            // If no required cache keys, app can start without cache
            if (REQUIRED_CACHE_KEYS.length === 0) {
              crashlyticsService.log('bootstrap_online_success_no_requirements');
              setState('ready-online');
            } else if (hasCacheAfterFetch) {
              crashlyticsService.log('bootstrap_online_success');
              setState('ready-online');
            } else if (hasCache) {
              // Fetch failed but we had old cache
              crashlyticsService.log('bootstrap_offline_cache_used');
              crashlyticsService.setAttribute('fetch_failed', 'true');
              setState('ready-offline');
            } else {
              // Fetch failed and no cache
              crashlyticsService.log('bootstrap_offline_blocked');
              crashlyticsService.setAttribute('blocked_reason', 'fetch_failed_no_cache');
              setState('offline-blocked');
            }
          } catch (fetchError) {
            if (!isMounted || abortController.signal.aborted) return;
            
            crashlyticsService.log('bootstrap_fetch_failed');
            crashlyticsService.recordError(
              fetchError instanceof Error ? fetchError : new Error('Bootstrap fetch failed')
            );

            // Check if we have cache to fall back to
            // If no required cache keys, app can start without cache
            if (REQUIRED_CACHE_KEYS.length === 0) {
              crashlyticsService.log('bootstrap_ready_offline_no_requirements');
              setState('ready-offline');
            } else if (hasCache) {
              crashlyticsService.log('bootstrap_offline_cache_used');
              crashlyticsService.setAttribute('fetch_failed', 'true');
              setState('ready-offline');
            } else {
              crashlyticsService.log('bootstrap_offline_blocked');
              crashlyticsService.setAttribute('blocked_reason', 'fetch_error_no_cache');
              setState('offline-blocked');
            }
          }
        } else {
          // Internet is NOT available
          if (!isMounted || abortController.signal.aborted) return;
          
          // If no required cache keys, app can start without cache (football app doesn't require pre-cached data)
          if (REQUIRED_CACHE_KEYS.length === 0) {
            crashlyticsService.log('bootstrap_ready_offline_no_requirements');
            setState('ready-offline');
          } else if (hasCache) {
            crashlyticsService.log('bootstrap_offline_cache_used');
            setState('ready-offline');
          } else {
            crashlyticsService.log('bootstrap_offline_blocked');
            crashlyticsService.setAttribute('blocked_reason', 'no_internet_no_cache');
            setState('offline-blocked');
          }
        }
      } catch (error) {
        if (!isMounted || abortController.signal.aborted) return;
        
        crashlyticsService.recordError(
          error instanceof Error ? error : new Error('Bootstrap failed')
        );
        
        // Last resort: check if we have any cache
        // If no required cache keys, app can start without cache
        if (REQUIRED_CACHE_KEYS.length === 0) {
          crashlyticsService.log('bootstrap_ready_offline_no_requirements');
          setState('ready-offline');
        } else {
          const hasCache = await hasAnyValidCache(REQUIRED_CACHE_KEYS);
          if (!isMounted || abortController.signal.aborted) return;
          
          if (hasCache) {
            crashlyticsService.log('bootstrap_offline_cache_used');
            setState('ready-offline');
          } else {
            crashlyticsService.log('bootstrap_offline_blocked');
            crashlyticsService.setAttribute('blocked_reason', 'bootstrap_error');
            setState('offline-blocked');
          }
        }
      }
    };

    runBootstrap();

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [retryKey]);

  const retry = useCallback(() => {
    setRetryKey((prev) => prev + 1);
  }, []);

  const skipUpdate = useCallback(async () => {
    if (updateInfo?.latestVersion) {
      await AsyncStorage.setItem(UPDATE_SKIP_KEY, updateInfo.latestVersion);
      crashlyticsService.log('update_skipped_by_user');
      // Retry bootstrap - it will see the skipped version and continue
      setRetryKey((prev) => prev + 1);
    }
  }, [updateInfo]);

  // Optional: Listen for internet connectivity changes when blocked
  useEffect(() => {
    if (state === 'offline-blocked') {
      const unsubscribe = NetInfo.addEventListener((netInfoState: NetInfoState) => {
        if (netInfoState.isInternetReachable) {
          crashlyticsService.log('Internet became reachable, retrying bootstrap');
          retry();
        }
      });

      return () => {
        unsubscribe();
      };
    }
  }, [state, retry]);

  // Initialize deep link service when app becomes ready
  useEffect(() => {
    if (state === 'ready-online' || state === 'ready-offline') {
      // Delay to ensure navigation container is mounted
      const timer = setTimeout(async () => {
        try {
          const { deepLinkService } = await import('../services/deepLinkService');
          await deepLinkService.initialize();
          crashlyticsService.log('Deep link service initialized');
        } catch (deepLinkError) {
          // Ignore deep link errors
        }
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [state]);

  const value: BootstrapContextValue = {
    state,
    retry,
    timelineData,
    updateInfo,
    skipUpdate,
  };

  return <BootstrapContext.Provider value={value}>{children}</BootstrapContext.Provider>;
}

export function useBootstrap(): BootstrapContextValue {
  const context = useContext(BootstrapContext);
  if (context === undefined) {
    throw new Error('useBootstrap must be used within a BootstrapProvider');
  }
  return context;
}

