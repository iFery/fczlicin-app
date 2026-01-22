/**
 * BootstrapProvider - Controls app startup with offline-first logic
 * Ensures app only starts when data is available (online or cached)
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { preloadAllData, preloadCurrentSeasonData } from '../services/preloadService';
import { hasAnyValidCache, getOldestCacheAge, checkAndClearCacheOnVersionUpgrade } from '../utils/cacheManager';
import { crashlyticsService } from '../services/crashlytics';
import { initializeFirebase, ensureFirebaseInitialized } from '../services/firebase';
import { remoteConfigService } from '../services/remoteConfig';
import { notificationService } from '../services/notifications';
import { Platform } from 'react-native';
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
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);

  // Run bootstrap with proper cleanup and mounted checks
  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();

    const runBootstrap = async () => {
      try {
        if (!isMounted || abortController.signal.aborted) return;
        setState('loading');
        
        // Initialize Firebase FIRST - before any Firebase service calls
        // This is critical - Firebase must be initialized before crashlytics, messaging, etc.
        // We use ensureFirebaseInitialized which waits for auto-initialization
        try {
          // First ensure Firebase is initialized (waits for auto-init from google-services.json)
          await ensureFirebaseInitialized();
          // Then initialize Firebase services (Remote Config, Crashlytics)
          await initializeFirebase();
          if (!isMounted || abortController.signal.aborted) return;
        } catch (firebaseError) {
          console.error('❌ [BootstrapProvider] Firebase initialization failed:', firebaseError);
          // Continue even if Firebase fails, but log it
        }

        // Now we can safely use Firebase services
        try {
          crashlyticsService.log('bootstrap_start');
          crashlyticsService.setAttribute('bootstrap_attempt', String(retryKey + 1));
          crashlyticsService.setAttribute('platform', Platform.OS);
          crashlyticsService.log('Firebase initialized');
        } catch (e) {
          // Ignore if Crashlytics is not available
          console.warn('Crashlytics not available:', e);
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
          console.error('❌ [BootstrapProvider] Remote Config error:', rcError);
          // Ignore Remote Config errors
        }

        // Check for app updates (after Remote Config is initialized)
        // Only check if online (offline mode should not block app)
        if (isInternetReachable) {
          try {
            console.log('🚀 [BootstrapProvider] Checking for app updates...');
            const updateCheckResult = await checkForUpdate();
            console.log('🚀 [BootstrapProvider] Update check result:', updateCheckResult);
            if (!isMounted || abortController.signal.aborted) return;
            
            // Check if user has skipped this version
            const skippedVersion = await AsyncStorage.getItem(UPDATE_SKIP_KEY);
            const isSkipped = skippedVersion === updateCheckResult.latestVersion;
            
            setUpdateInfo(updateCheckResult);
            
            if (updateCheckResult.type === 'forced') {
              console.log('🚀 [BootstrapProvider] Forced update required, blocking app');
              crashlyticsService.log('bootstrap_blocked_by_forced_update');
              setState('update-required');
              return; // Stop bootstrap, show update screen (cannot skip forced updates)
            } else if (updateCheckResult.type === 'optional' && !isSkipped) {
              console.log('🚀 [BootstrapProvider] Optional update available, showing update screen');
              crashlyticsService.log('bootstrap_optional_update_available');
              setState('update-optional');
              return; // Stop bootstrap, show update screen (user can skip)
            }
            console.log('🚀 [BootstrapProvider] No update needed, continuing bootstrap');
            // Continue with normal bootstrap if no update needed or update was skipped
          } catch (updateError) {
            console.error('❌ [BootstrapProvider] Update check error:', updateError);
            crashlyticsService.recordError(updateError instanceof Error ? updateError : new Error('Update check failed'));
            // Continue with bootstrap even if update check fails
          }
        } else {
          console.log('🚀 [BootstrapProvider] Offline, skipping update check');
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
            await notificationService.setupNotificationListeners();
          } catch (notifError) {
            // Ignore notification setup errors
            console.warn('Notification setup failed:', notifError);
          }
        }

        // Check for existing cache
        const hasCache = await hasAnyValidCache(REQUIRED_CACHE_KEYS);
        if (!isMounted || abortController.signal.aborted) return;
        
        const cacheAge = hasCache ? await getOldestCacheAge(REQUIRED_CACHE_KEYS) : null;
        
        if (cacheAge !== null) {
          const cacheAgeHours = Math.floor(cacheAge / (60 * 60 * 1000));
          crashlyticsService.setAttribute('cache_age_hours', String(cacheAgeHours));
          crashlyticsService.log(`Cache age: ${cacheAgeHours} hours`);
        }

        // Decision flow
        if (isInternetReachable) {
          // Internet is available - bootstrap immediately, preload in background
          // OPTIMIZATION: Don't block bootstrap waiting for data preload
          // App shows immediately, data loads in background
          
          // Set ready state immediately (don't wait for preload)
          // Since REQUIRED_CACHE_KEYS is empty, app can start without cache
          crashlyticsService.log('bootstrap_online_success_no_requirements');
          setState('ready-online');
          
          // Start data preload in background (non-blocking)
          // This doesn't block bootstrap or app visibility
          
          Promise.all([
            preloadAllData(),
            preloadCurrentSeasonData(),
          ])
            .then(([preloadResult, seasonPreloadResult]) => {
              // Preload completed
              if (!isMounted || abortController.signal.aborted) return;
              
              
              if (preloadResult.errors.length > 0) {
                crashlyticsService.log(`Preload errors: ${preloadResult.errors.join(', ')}`);
              }
              
              if (seasonPreloadResult.errors.length > 0) {
                crashlyticsService.log(`Season preload errors: ${seasonPreloadResult.errors.join(', ')}`);
              } else {
                crashlyticsService.log('current_season_data_preloaded');
              }
            })
            .catch((preloadError) => {
              // Preload failed - log but don't block app (non-critical)
              if (!isMounted || abortController.signal.aborted) return;
              
              console.warn('Background preload failed (non-blocking):', preloadError);
              crashlyticsService.log('bootstrap_background_preload_failed');
              crashlyticsService.recordError(
                preloadError instanceof Error ? preloadError : new Error('Background preload failed')
              );
              // App continues to work - this is non-blocking
            });
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
        console.error('❌ [BootstrapProvider] Bootstrap error:', error);
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
      
      // Optimize: Instead of restarting bootstrap, quickly check internet and set ready state
      // This is much faster than restarting the entire bootstrap process
      try {
        const netInfoState = await NetInfo.fetch();
        const isInternetReachable = netInfoState.isInternetReachable ?? false;
        
        // Set state directly to ready without restarting bootstrap
        const readyState = isInternetReachable ? 'ready-online' : 'ready-offline';
        setState(readyState);
        crashlyticsService.log(`update_skipped_quick_transition_to_${readyState}`);
      } catch (error) {
        // Fallback: if quick check fails, restart bootstrap (slower but safe)
        crashlyticsService.log('update_skipped_fallback_to_bootstrap_restart');
        setRetryKey((prev) => prev + 1);
      }
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
