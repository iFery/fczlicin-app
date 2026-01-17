import * as Notifications from 'expo-notifications';
import messaging from '@react-native-firebase/messaging';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { handleNotificationNavigation } from './notificationNavigation';
import { notificationApi } from '../api/footballEndpoints';
import { ensureFirebaseInitialized, isFirebaseReady, safeMessagingCall } from './firebase';
import { crashlyticsService } from './crashlytics';

/**
 * Get current environment from app config
 * Returns 'production', 'staging', 'development', etc.
 */
function getCurrentEnvironment(): string {
  return Constants.expoConfig?.extra?.environment || 'production';
}

/**
 * Configure notification handler
 * Must be called before any notification operations
 * Best practice: Set once at app initialization
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  private fcmToken: string | null = null;

  /**
   * Požádá o oprávnění k notifikacím
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Notification permissions not granted');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      crashlyticsService.recordError(error as Error);
      return false;
    }
  }

  /**
   * Získá FCM token pro zařízení (pokud má permission)
   * Nepožádá o oprávnění - použijte requestPermissions() před tím
   */
  async getToken(): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        console.warn('FCM not supported on web');
        return null;
      }

      // Zajisti, že Firebase je inicializován
      await ensureFirebaseInitialized();

      // Ověř, že Firebase je skutečně připraven
      if (!isFirebaseReady()) {
        console.warn('Firebase not ready after ensureFirebaseInitialized, cannot get token');
        return null;
      }

      // Zkontroluje oprávnění (nepožádá)
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        console.log('Notification permission not granted, skipping token');
        return null;
      }

      // Získá FCM token s bezpečným voláním (s automatickým retry)
      const token = await safeMessagingCall(async (msg) => {
        return await msg.getToken();
      });
      
      if (token) {
        this.fcmToken = token;
        console.log('FCM Token:', token);
        return token;
      } else {
        console.warn('Failed to get FCM token after retries');
        return null;
      }
    } catch (error) {
      console.error('Error getting FCM token:', error);
      // Crashlytics service už kontroluje inicializaci
      crashlyticsService.recordError(error as Error);
      return null;
    }
  }

  /**
   * Nastaví listenery pro notifikace
   * Poznámka: Background message handler musí být registrován v index.js
   */
  async setupNotificationListeners() {
    try {
      // Zajisti, že Firebase je inicializován
      await ensureFirebaseInitialized();
      
      // Ověř, že Firebase je skutečně připraven
      if (!isFirebaseReady()) {
        console.warn('Firebase not ready after ensureFirebaseInitialized, cannot setup listeners');
        return {
          unsubscribeForeground: () => {},
          notificationListener: { remove: () => {} },
        };
      }
    } catch (error) {
      console.error('Firebase not initialized, cannot setup notification listeners:', error);
      return {
        unsubscribeForeground: () => {},
        notificationListener: { remove: () => {} },
      };
    }

    // Listener pro notifikace, když je aplikace na popředí
    let unsubscribeForeground: (() => void) | null = null;
    try {
      if (!isFirebaseReady()) {
        throw new Error('Firebase not ready');
      }
      
      // Použijeme safeMessagingCall pro bezpečné nastavení listeneru
      const unsubscribe = await safeMessagingCall((msg) => {
        return msg.onMessage(async (remoteMessage) => {
          console.log('Foreground notification received:', remoteMessage);
          
          // Zobrazí lokální notifikaci
          await Notifications.scheduleNotificationAsync({
            content: {
              title: remoteMessage.notification?.title || 'Nová notifikace',
              body: remoteMessage.notification?.body || '',
              data: remoteMessage.data,
            },
            trigger: null, // Okamžitě
          });
        });
      });
      
      unsubscribeForeground = unsubscribe || (() => {}); // Empty function as fallback
    } catch (error) {
      console.error('Error setting up foreground message listener:', error);
      crashlyticsService.recordError(error as Error);
      unsubscribeForeground = () => {}; // Empty function as fallback
    }

    // Listener pro kliknutí na notifikaci
    // Works for both foreground and background/closed app states
    const notificationListener = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('Notification tapped:', response);
      const data = response.notification.request.content.data as Record<string, unknown> | undefined;
      
      if (data) {
        // Use navigation helper with queue system
        // No delay needed - queue handles timing
        handleNotificationNavigation(data);
      }
    });

    return {
      unsubscribeForeground: unsubscribeForeground || (() => {}),
      notificationListener,
    };
  }

  /**
   * Odešle testovací notifikaci (pro testování)
   */
  async sendTestNotification(): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Testovací notifikace',
          body: 'Toto je testovací notifikace z aplikace FC Zličín',
          data: { test: true },
        },
        trigger: null, // Okamžitě
      });
    } catch (error) {
      console.error('Error sending test notification:', error);
      crashlyticsService.recordError(error as Error);
      throw error;
    }
  }

  /**
   * Naplánuje testovací notifikaci za určitý počet sekund
   * Užitečné pro testování notifikací když je aplikace zavřená
   */
  async scheduleTestNotification(seconds: number = 10): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Testovací notifikace (naplánovaná)',
          body: `Tato notifikace byla naplánována před ${seconds} sekundami. Aplikace může být zavřená.`,
          data: { 
            test: true,
            scheduled: true,
            scheduledAt: new Date().toISOString(),
          },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: seconds,
        },
      });
      console.log(`Test notification scheduled for ${seconds} seconds`);
    } catch (error) {
      console.error('Error scheduling test notification:', error);
      crashlyticsService.recordError(error as Error);
      throw error;
    }
  }

  /**
   * Zruší registraci FCM tokenu
   */
  async deleteToken(): Promise<void> {
    try {
      if (Platform.OS !== 'web') {
        // Zajisti, že Firebase je inicializován
        await ensureFirebaseInitialized();
        
        // Ověř, že Firebase je skutečně připraven
        if (!isFirebaseReady()) {
          console.warn('Firebase not ready, cannot delete token');
          return;
        }
        
        const result = await safeMessagingCall(async (msg) => {
          await msg.deleteToken();
          return true;
        });
        
        if (result) {
          this.fcmToken = null;
        } else {
          console.warn('Failed to delete FCM token after retries');
        }
        this.fcmToken = null;
      }
    } catch (error) {
      console.error('Error deleting FCM token:', error);
      // Crashlytics service už kontroluje inicializaci
      crashlyticsService.recordError(error as Error);
    }
  }

  /**
   * Získá aktuální permission status (nepožádá o permission)
   */
  async getPermissionStatus(): Promise<string> {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      return status;
    } catch (error) {
      console.error('Error getting permission status:', error);
      return 'undetermined';
    }
  }

  /**
   * Register device token with backend notification preferences
   * @param preferences Notification preferences including favorite teams and notification types
   */
  async registerDeviceTokenWithPreferences(preferences: {
    favoriteTeamIds: number[];
    matchStartReminderEnabled: boolean;
    matchResultNotificationEnabled: boolean;
  }): Promise<boolean> {
    try {
      // Get FCM token
      const token = await this.getToken();
      if (!token) {
        console.warn('Cannot register token: no FCM token available');
        return false;
      }

      // Register with backend (include environment for filtering)
      const result = await notificationApi.registerDeviceToken({
        token,
        favoriteTeamIds: preferences.favoriteTeamIds,
        matchStartReminderEnabled: preferences.matchStartReminderEnabled,
        matchResultNotificationEnabled: preferences.matchResultNotificationEnabled,
        environment: getCurrentEnvironment(),
      });

      if (result.success) {
        console.log('Device token registered successfully with preferences');
        return true;
      } else {
        console.warn('Device token registration returned failure:', result.message);
        return false;
      }
    } catch (error) {
      console.error('Error registering device token with preferences:', error);
      // Crashlytics service už kontroluje inicializaci
      crashlyticsService.recordError(error as Error);
      return false;
    }
  }

  /**
   * Update notification preferences on backend
   * @param preferences Updated notification preferences
   */
  async updateNotificationPreferences(preferences: {
    favoriteTeamIds: number[];
    matchStartReminderEnabled: boolean;
    matchResultNotificationEnabled: boolean;
  }): Promise<boolean> {
    try {
      // Get FCM token
      const token = await this.getToken();
      if (!token) {
        console.warn('Cannot update preferences: no FCM token available');
        return false;
      }

      // Update preferences on backend (include environment for filtering)
      const result = await notificationApi.updatePreferences({
        token,
        favoriteTeamIds: preferences.favoriteTeamIds,
        matchStartReminderEnabled: preferences.matchStartReminderEnabled,
        matchResultNotificationEnabled: preferences.matchResultNotificationEnabled,
        environment: getCurrentEnvironment(),
      });

      if (result.success) {
        console.log('Notification preferences updated successfully');
        return true;
      } else {
        console.warn('Notification preferences update returned failure:', result.message);
        return false;
      }
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      crashlyticsService.recordError(error as Error);
      return false;
    }
  }

  /**
   * Unregister device token from backend (disable notifications)
   */
  async unregisterDeviceToken(): Promise<boolean> {
    try {
      const token = await this.getToken();
      if (!token) {
        console.warn('Cannot unregister token: no FCM token available');
        return false;
      }

      const result = await notificationApi.unregisterDeviceToken(token);
      if (result.success) {
        console.log('Device token unregistered successfully');
        return true;
      } else {
        console.warn('Device token unregistration returned failure:', result.message);
        return false;
      }
    } catch (error) {
      console.error('Error unregistering device token:', error);
      crashlyticsService.recordError(error as Error);
      return false;
    }
  }
}

export const notificationService = new NotificationService();

