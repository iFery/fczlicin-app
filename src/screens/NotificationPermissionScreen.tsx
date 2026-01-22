/**
 * NotificationPermissionScreen - Fullscreen notification permission request
 * Shown on first app launch to request notification permissions
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Image,
  Animated,
  Dimensions,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNotificationPromptStore } from '../stores/notificationPromptStore';
import { useNotificationPreferencesStore } from '../stores/notificationPreferencesStore';
import { notificationService } from '../services/notifications';
import { crashlyticsService } from '../services/crashlytics';
import { analyticsService } from '../services/analytics';
import { typography } from '../theme/ThemeProvider';
import { footballApi, type Match } from '../api/footballEndpoints';
import { useCurrentSeason } from '../hooks/useFootballData';

const { width, height } = Dimensions.get('window');

interface NotificationPermissionScreenProps {
  onComplete: () => void;
}

export function NotificationPermissionScreen({ onComplete }: NotificationPermissionScreenProps) {
  const { setPromptShown } = useNotificationPromptStore();
  const { favoriteTeamIds, matchStartReminderEnabled, matchResultNotificationEnabled, setFavoriteTeamIds } = useNotificationPreferencesStore();
  const { data: currentSeason } = useCurrentSeason();
  const insets = useSafeAreaInsets();
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const handleAllowNotifications = async () => {
    // Prevent multiple clicks
    if (isRequestingPermission) {
      return;
    }
    
    try {
      setIsRequestingPermission(true);
      setPromptShown(true);
      
      // Log Analytics event - user clicked on permission request button
      analyticsService.logEvent('permission_request_clicked', {
        source: 'notification_permission_screen',
      });
      
      // Request notification permission
      const permissionGranted = await notificationService.requestPermissions();
      
      if (permissionGranted) {
        crashlyticsService.log('notification_permission_granted');
        
        // Log Analytics event - permission granted
        analyticsService.logEvent('permission_granted', {
          permission_type: 'notifications',
          source: 'notification_permission_screen',
        });
        
        // Auto-assign favorite team = 1 (FC Zličín) when user grants notification permission on first launch
        // Only set if user doesn't have any favorite teams yet
        const finalFavoriteTeamIds = favoriteTeamIds.length > 0 ? favoriteTeamIds : [1];
        if (favoriteTeamIds.length === 0) {
          setFavoriteTeamIds([1]);
          crashlyticsService.log('auto_assigned_favorite_team_on_notification_grant');
        }
        
        // Register device with backend API using preferences (with auto-assigned team if needed)
        await notificationService.registerDeviceTokenWithPreferences({
          favoriteTeamIds: finalFavoriteTeamIds,
          matchStartReminderEnabled,
          matchResultNotificationEnabled,
        });
        
        crashlyticsService.log('device_registered_with_notification_api');

        // Naplánuj lokální notifikace pro zápasy (pokud jsou povolené)
        if (matchStartReminderEnabled && finalFavoriteTeamIds.length > 0) {
          try {
            // Helper funkce pro získání matches
            const getMatches = async (teamId: number, seasonId: number): Promise<Match[]> => {
              try {
                return await footballApi.getMatchCalendar(teamId, seasonId);
              } catch (error) {
                console.error(`Error fetching matches for team ${teamId}:`, error);
                return [];
              }
            };

            // Helper funkce pro získání current season
            // Volá API přímo místo spoléhání na hook data, aby to fungovalo i když uživatel klikne rychle
            const getCurrentSeasonId = async (): Promise<number | null> => {
              try {
                const seasons = await footballApi.getSeasons();
                if (seasons.length === 0) return null;
                
                // Vrátí sezónu s nejvyšším ID (aktuální sezónu)
                const maxSeasonId = Math.max(...seasons.map(s => s.id));
                return maxSeasonId;
              } catch (error) {
                console.error('Error fetching current season:', error);
                return null;
              }
            };

            // Helper funkce pro získání team name (pro zobrazení v notifikaci použijeme jednoduchý název)
            const getTeamName = (teamId: number): string => {
              // Pro team ID 1 použijeme "Muži A", jinak obecný název
              if (teamId === 1) return 'Muži A';
              return `Tým ${teamId}`;
            };

            await notificationService.scheduleNotificationsForFavoriteTeams(
              finalFavoriteTeamIds,
              matchStartReminderEnabled,
              getMatches,
              getCurrentSeasonId,
              getTeamName
            );
          } catch (error) {
            console.error('Error scheduling match notifications after permission grant:', error);
            // Nechceme zablokovat dokončení, pokud naplánování selže
          }
        }
      } else {
        crashlyticsService.log('notification_permission_denied');
        
        // Log Analytics event - permission denied
        analyticsService.logEvent('permission_denied', {
          permission_type: 'notifications',
          source: 'notification_permission_screen',
        });
      }
      
      // Complete and proceed to app
      onComplete();
    } catch (error) {
      crashlyticsService.recordError(error instanceof Error ? error : new Error('Notification permission request failed'));
      console.error('Error requesting notification permission:', error);
      // Still proceed to app even if permission request fails
      setIsRequestingPermission(false); // Reset on error
      onComplete();
    }
  };

  const handleSkip = () => {
    setPromptShown(true);
    crashlyticsService.log('notification_permission_modal_dismissed');
    
    // Log Analytics event - user skipped permission request
    analyticsService.logEvent('permission_skipped', {
      permission_type: 'notifications',
      source: 'notification_permission_screen',
    });
    
    onComplete();
  };

  if (Platform.OS === 'web') {
    // Skip on web, proceed directly
    useEffect(() => {
      onComplete();
    }, [onComplete]);
    return null;
  }

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
            paddingTop: Math.max(24, insets.top),
            paddingBottom: Math.max(24, insets.bottom),
          },
        ]}
      >
        <View style={styles.topContent}>
          {/* Notification icon */}
          <View style={styles.iconContainer}>
            <Image
              source={require('../../assets/notification-permission-icon.png')}
              style={styles.icon}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.title}>Buď u každého zápasu 🔔</Text>

          <Text style={styles.description}>
            Povol notifikace a my tě upozorníme na začátky zápasů, výsledky i důležité novinky FC Zličín.
            {'\n\n'}
            V nastavení si pak můžeš vybrat oblíbené týmy a upravit, co přesně chceš dostávat.
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            onPress={handleAllowNotifications}
            activeOpacity={0.85}
            style={[styles.primaryButton, isRequestingPermission && styles.primaryButtonDisabled]}
            disabled={isRequestingPermission}
          >
            {isRequestingPermission ? (
              <View style={styles.buttonLoadingContent}>
                <ActivityIndicator size="small" color="#014fa1" style={styles.buttonLoader} />
                <Text style={styles.primaryButtonText}>Zpracovává se...</Text>
              </View>
            ) : (
              <Text style={styles.primaryButtonText}>Povolit notifikace</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSkip}
            activeOpacity={0.6}
            style={[styles.secondaryButton, isRequestingPermission && styles.secondaryButtonDisabled]}
            disabled={isRequestingPermission}
          >
            <Text style={styles.secondaryButtonText}>Možná později</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0144bc', // FC Zličín blue
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  topContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  iconContainer: {
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  icon: {
    width: 200,
    height: 200,
  },
  title: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 24,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 32,
  },
  description: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  actions: {
    width: '100%',
    maxWidth: 400,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  primaryButtonText: {
    fontFamily: typography.fontFamily.bold,
    color: '#014fa1',
    fontSize: 16,
    letterSpacing: 0.3,
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  buttonLoadingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonLoader: {
    marginRight: 8,
  },
  secondaryButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 10,
  },
  secondaryButtonText: {
    fontFamily: typography.fontFamily.semiBold,
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 15,
  },
  secondaryButtonDisabled: {
    opacity: 0.5,
  },
});
