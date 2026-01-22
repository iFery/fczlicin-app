import analytics from '@react-native-firebase/analytics';
import { isFirebaseReady } from './firebase';

class AnalyticsService {
  /**
   * Zaznamená event do Analytics
   */
  logEvent(eventName: string, params?: Record<string, unknown>): void {
    try {
      if (!isFirebaseReady()) {
        console.warn('Analytics: Firebase not ready, skipping logEvent');
        return;
      }
      
      // V development módu vypiš do konzole pro debugging
      if (__DEV__) {
        console.log(`📊 [Analytics] Event: ${eventName}`, params || {});
      }
      
      analytics().logEvent(eventName, params);
    } catch (e: unknown) {
      console.error('❌ [analytics.ts] Error logging event:', e);
    }
  }

  /**
   * Nastaví vlastnost uživatele
   */
  setUserProperty(name: string, value: string): void {
    try {
      if (!isFirebaseReady()) {
        console.warn('Analytics: Firebase not ready, skipping setUserProperty');
        return;
      }
      analytics().setUserProperty(name, value);
    } catch (e: unknown) {
      console.error('❌ [analytics.ts] Error setting user property:', e);
    }
  }

  /**
   * Nastaví uživatelské ID
   */
  setUserId(userId: string): void {
    try {
      if (!isFirebaseReady()) {
        console.warn('Analytics: Firebase not ready, skipping setUserId');
        return;
      }
      analytics().setUserId(userId);
    } catch (e: unknown) {
      console.error('❌ [analytics.ts] Error setting user ID:', e);
    }
  }

  /**
   * Zaznamená zobrazení obrazovky
   */
  logScreenView(screenName: string, screenClass?: string): void {
    try {
      if (!isFirebaseReady()) {
        console.warn('Analytics: Firebase not ready, skipping logScreenView');
        return;
      }
      analytics().logScreenView({
        screen_name: screenName,
        screen_class: screenClass || screenName,
      });
    } catch (e: unknown) {
      console.error('❌ [analytics.ts] Error logging screen view:', e);
    }
  }

  /**
   * Povolí nebo zakáže Analytics
   */
  setAnalyticsCollectionEnabled(enabled: boolean): void {
    try {
      if (!isFirebaseReady()) {
        console.warn('Analytics: Firebase not ready, skipping setAnalyticsCollectionEnabled');
        return;
      }
      analytics().setAnalyticsCollectionEnabled(enabled);
    } catch (e: unknown) {
      console.error('❌ [analytics.ts] Error setting analytics collection enabled:', e);
    }
  }

  /**
   * Resetuje Analytics data (např. při logout)
   */
  resetAnalyticsData(): void {
    try {
      if (!isFirebaseReady()) {
        console.warn('Analytics: Firebase not ready, skipping resetAnalyticsData');
        return;
      }
      analytics().resetAnalyticsData();
    } catch (e: unknown) {
      console.error('❌ [analytics.ts] Error resetting analytics data:', e);
    }
  }

  /**
   * Loguje event s console výstupem pro debugging
   * V development módu také vypíše event do konzole
   */
  logEventWithDebug(eventName: string, params?: Record<string, unknown>): void {
    // V development módu vypiš do konzole
    if (__DEV__) {
      console.log(`📊 [Analytics] Event: ${eventName}`, params || {});
    }
    
    // Loguj do Firebase Analytics
    this.logEvent(eventName, params);
  }
}

// Lazy initialization - create instance only when needed
let analyticsServiceInstance: AnalyticsService | null = null;

export const analyticsService = new Proxy({} as AnalyticsService, {
  get(target, prop) {
    if (!analyticsServiceInstance) {
      analyticsServiceInstance = new AnalyticsService();
    }
    const value = analyticsServiceInstance[prop as keyof AnalyticsService];
    if (typeof value === 'function') {
      return value.bind(analyticsServiceInstance);
    }
    return value;
  }
});
