import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import dayjs from 'dayjs';
import { handleNotificationNavigation } from './notificationNavigation';
import { notificationApi, type Match } from '../api/footballEndpoints';
import { ensureFirebaseInitialized, isFirebaseReady, safeMessagingCall } from './firebase';
import { crashlyticsService } from './crashlytics';
import { analyticsService } from './analytics';

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
  private notificationChannelCreated: boolean = false;
  private lastMatchHashes: Map<number, string> = new Map(); // teamId -> hash of match times

  /**
   * Vytvoří notification channel pro Android
   * Toto je kritické pro správné fungování notifikací na Androidu
   * a může pomoci předejít crashům v NotificationForwarderActivity
   */
  async ensureNotificationChannel(): Promise<void> {
    if (Platform.OS !== 'android' || this.notificationChannelCreated) {
      return;
    }

    try {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'FC Zličín Notifikace',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#014fa1',
        description: 'Notifikace z aplikace FC Zličín',
      });
      this.notificationChannelCreated = true;
    } catch (error) {
      console.error('Error creating notification channel:', error);
      crashlyticsService.recordError(error as Error);
      // Continue - channel might already exist
    }
  }

  /**
   * Požádá o oprávnění k notifikacím
   */
  async requestPermissions(): Promise<boolean> {
    try {
      // Vytvoř notification channel pro Android před požádáním o oprávnění
      await this.ensureNotificationChannel();

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Notification permissions not granted');
        
        // Log Analytics event - permission denied (if not already logged by caller)
        // This is a fallback for cases where requestPermissions is called directly
        analyticsService.logEvent('permission_denied', {
          permission_type: 'notifications',
          source: 'notifications_service',
        });
        
        return false;
      }

      // Log Analytics event - permission granted (if not already logged by caller)
      // This is a fallback for cases where requestPermissions is called directly
      analyticsService.logEvent('permission_granted', {
        permission_type: 'notifications',
        source: 'notifications_service',
      });

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
      // Zajisti, že notification channel existuje (pro Android)
      await this.ensureNotificationChannel();

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
          
          // Zajisti, že notification channel existuje
          await this.ensureNotificationChannel();

          // Zobrazí lokální notifikaci
          // DŮLEŽITÉ: Vždy zahrň data pole, i když je prázdné, aby se předešlo crashům
          await Notifications.scheduleNotificationAsync({
            content: {
              title: remoteMessage.notification?.title || 'Nová notifikace',
              body: remoteMessage.notification?.body || '',
              // Vždy zahrň data - i prázdné pole je lepší než null
              data: remoteMessage.data || {},
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
      try {
        console.log('Notification tapped:', response);
        
        // Obranná kontrola - zkontroluj, že response a notification existují
        if (!response || !response.notification || !response.notification.request) {
          console.warn('Invalid notification response - missing notification or request');
          crashlyticsService.recordError(
            new Error('Invalid notification response structure'),
            'NotificationResponseInvalid'
          );
          return;
        }

        const data = response.notification.request.content.data as Record<string, unknown> | undefined;
        
        if (data) {
          // Use navigation helper with queue system
          // No delay needed - queue handles timing
          handleNotificationNavigation(data);
        } else {
          console.warn('Notification tapped but no data field found');
        }
      } catch (error) {
        console.error('Error handling notification response:', error);
        crashlyticsService.recordError(error as Error);
      }
    });

    // CRITICAL: Check if app was opened by a notification tap
    // This handles the case when app is closed and user taps notification
    // getLastNotificationResponseAsync returns the notification that opened the app
    try {
      const lastNotificationResponse = await Notifications.getLastNotificationResponseAsync();
      if (lastNotificationResponse) {
        console.log('App opened by notification tap:', lastNotificationResponse);
        
        // Obranná kontrola - zkontroluj, že notification a request existují
        if (!lastNotificationResponse.notification || !lastNotificationResponse.notification.request) {
          console.warn('Invalid last notification response - missing notification or request');
          crashlyticsService.recordError(
            new Error('Invalid last notification response structure'),
            'LastNotificationResponseInvalid'
          );
          return;
        }

        const data = lastNotificationResponse.notification.request.content.data as Record<string, unknown> | undefined;
        
        if (data) {
          // Use navigation helper with queue system
          // Queue will handle navigation when navigation is ready
          handleNotificationNavigation(data);
        } else {
          console.warn('App opened by notification but no data field found');
        }
      }
    } catch (error) {
      console.error('Error checking last notification response:', error);
      crashlyticsService.recordError(error as Error);
      // Continue - this is not critical, listener will handle future notifications
    }

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
      // Zajisti, že notification channel existuje
      await this.ensureNotificationChannel();

      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Testovací notifikace',
          body: 'Toto je testovací notifikace z aplikace FC Zličín',
          // Vždy zahrň data pole
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
      // Zajisti, že notification channel existuje
      await this.ensureNotificationChannel();

      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Testovací notifikace (naplánovaná)',
          body: `Tato notifikace byla naplánována před ${seconds} sekundami. Aplikace může být zavřená.`,
          // Vždy zahrň data pole
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

  /**
   * Zruší všechny existující notifikace pro zápasy (identifikované prefixem)
   */
  async cancelMatchNotifications(): Promise<void> {
    try {
      const allNotifications = await Notifications.getAllScheduledNotificationsAsync();
      
      // Najít notifikace s prefixem "match_"
      const matchNotifications = allNotifications.filter(
        (notification) => notification.identifier.startsWith('match_')
      );

      // Zrušit všechny match notifikace
      await Promise.all(
        matchNotifications.map((notification) =>
          Notifications.cancelScheduledNotificationAsync(notification.identifier)
        )
      );
    } catch (error) {
      console.error('Error cancelling match notifications:', error);
      crashlyticsService.recordError(error as Error);
    }
  }

  /**
   * Naplánuje lokální notifikace pro zápasy oblíbených týmů
   * Notifikace budou naplánovány 10 minut před začátkem zápasu
   * @param matches Array of matches to schedule notifications for
   * @param teamName Team name for notification message (optional)
   */
  async scheduleMatchNotifications(matches: Match[], teamName?: string): Promise<number> {
    try {
      // Zajisti, že notification channel existuje
      await this.ensureNotificationChannel();

      // Zkontroluj permission
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Cannot schedule match notifications: permission not granted');
        return 0;
      }

      const now = dayjs();
      let scheduledCount = 0;

      for (const match of matches) {
        // Pouze scheduled zápasy v budoucnosti
        if (match.status !== 'scheduled') {
          continue;
        }

        // Parse date and time
        const matchDate = dayjs(match.date);
        if (!matchDate.isValid()) {
          console.warn(`Invalid match date for match ${match.id}: ${match.date}`);
          continue;
        }

        // Pokud má zápas čas, použij ho; jinak použij 12:00 jako default
        let matchDateTime = matchDate;
        if (match.time) {
          const [hours, minutes] = match.time.split(':').map(Number);
          if (!isNaN(hours) && !isNaN(minutes)) {
            matchDateTime = matchDate.hour(hours).minute(minutes).second(0).millisecond(0);
          } else {
            matchDateTime = matchDate.hour(12).minute(0).second(0).millisecond(0);
          }
        } else {
          matchDateTime = matchDate.hour(12).minute(0).second(0).millisecond(0);
        }

        // Notifikace 10 minut před zápasem
        const notificationTime = matchDateTime.subtract(10, 'minutes');

        // Pouze pokud je v budoucnosti
        if (notificationTime.isBefore(now)) {
          continue;
        }

        // Vytvoř název pro notifikaci
        const matchTitle = match.isHome 
          ? `${match.homeTeam} vs ${match.awayTeam}`
          : `${match.awayTeam} vs ${match.homeTeam}`;
        
        const notificationTitle = teamName 
          ? `${teamName}: Začíná zápas`
          : 'Začíná zápas';
        
        const notificationBody = `Zápas ${matchTitle} začíná za 10 minut`;

        try {
          await Notifications.scheduleNotificationAsync({
            identifier: `match_${match.id}`,
            content: {
              title: notificationTitle,
              body: notificationBody,
              data: {
                matchId: match.id.toString(),
                type: 'match',
              },
              sound: true,
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DATE,
              date: notificationTime.toDate(),
            },
          });

          scheduledCount++;
        } catch (error) {
          console.error(`Error scheduling notification for match ${match.id}:`, error);
          crashlyticsService.recordError(error as Error);
        }
      }

      return scheduledCount;
    } catch (error) {
      console.error('Error scheduling match notifications:', error);
      crashlyticsService.recordError(error as Error);
      return 0;
    }
  }

  /**
   * Vytvoří hash z match times pro porovnání
   */
  private getMatchesHash(matches: Match[]): string {
    return matches
      .filter(m => m.status === 'scheduled')
      .map(m => `${m.id}:${m.date}:${m.time || ''}`)
      .sort()
      .join('|');
  }

  /**
   * Naplánuje notifikace pro všechny oblíbené týmy
   * Tato funkce by měla být volána při změně oblíbených týmů nebo matchStartReminderEnabled
   * Automaticky porovnává hash a přeplánuje jen když se změnily časy zápasů
   * @param favoriteTeamIds Array of favorite team IDs
   * @param matchStartReminderEnabled Whether match start reminders are enabled
   * @param getMatches Function to get matches for a team (teamId, seasonId) => Promise<Match[]>
   * @param getCurrentSeason Function to get current season ID => Promise<number | null>
   * @param getTeamName Function to get team name (teamId) => string
   */
  async scheduleNotificationsForFavoriteTeams(
    favoriteTeamIds: number[],
    matchStartReminderEnabled: boolean,
    getMatches: (teamId: number, seasonId: number) => Promise<Match[]>,
    getCurrentSeason: () => Promise<number | null>,
    getTeamName: (teamId: number) => string,
    forceReschedule: boolean = false
  ): Promise<number> {
    try {
      console.log(`[scheduleNotificationsForFavoriteTeams] Called with teams: ${favoriteTeamIds}, enabled: ${matchStartReminderEnabled}, force: ${forceReschedule}`);
      
      // Pokud jsou notifikace vypnuté, zruš všechny match notifikace
      if (!matchStartReminderEnabled || favoriteTeamIds.length === 0) {
        console.log('[scheduleNotificationsForFavoriteTeams] Notifications disabled or no teams, cancelling all');
        await this.cancelMatchNotifications();
        this.lastMatchHashes.clear();
        return 0;
      }

      // Zkontroluj permission
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        console.warn('[scheduleNotificationsForFavoriteTeams] Permission not granted');
        await this.cancelMatchNotifications();
        this.lastMatchHashes.clear();
        return 0;
      }

      // Získej aktuální sezónu
      const currentSeasonId = await getCurrentSeason();
      if (!currentSeasonId) {
        console.warn('[scheduleNotificationsForFavoriteTeams] No current season');
        return 0;
      }

      // Zkontroluj, zda se změnily zápasy - porovnej hash pro každý tým
      let needsReschedule = forceReschedule;
      const currentHashes = new Map<number, string>();

      for (const teamId of favoriteTeamIds) {
        try {
          const matches = await getMatches(teamId, currentSeasonId);
          const hash = this.getMatchesHash(matches);
          currentHashes.set(teamId, hash);

          const lastHash = this.lastMatchHashes.get(teamId);
          if (lastHash !== hash) {
            console.log(`[scheduleNotificationsForFavoriteTeams] Hash changed for team ${teamId}`);
            needsReschedule = true;
          }
        } catch (error) {
          console.error(`Error checking matches for team ${teamId}:`, error);
        }
      }

      // Pokud se nic nezměnilo, není potřeba přeplánovávat
      if (!needsReschedule && this.lastMatchHashes.size > 0) {
        console.log('[scheduleNotificationsForFavoriteTeams] No changes detected, skipping reschedule');
        return 0;
      }
      
      console.log('[scheduleNotificationsForFavoriteTeams] Rescheduling notifications...');

      // Zruš staré notifikace (pokud se změnilo nebo pokud to je první naplánování)
      await this.cancelMatchNotifications();

      // Naplánuj notifikace pro každý oblíbený tým
      let totalScheduled = 0;
      for (const teamId of favoriteTeamIds) {
        try {
          const matches = await getMatches(teamId, currentSeasonId);
          const teamName = getTeamName(teamId);
          const scheduled = await this.scheduleMatchNotifications(matches, teamName);
          totalScheduled += scheduled;
        } catch (error) {
          console.error(`Error scheduling notifications for team ${teamId}:`, error);
          crashlyticsService.recordError(error as Error);
        }
      }

      // Ulož hash pro příští porovnání
      this.lastMatchHashes = currentHashes;

      return totalScheduled;
    } catch (error) {
      console.error('Error scheduling notifications for favorite teams:', error);
      crashlyticsService.recordError(error as Error);
      return 0;
    }
  }
}

export const notificationService = new NotificationService();
