/**
 * NotificationPermissionScreen - Fullscreen notification permission request
 * Shown on first app launch to request notification permissions
 */

import React, { useEffect, useRef } from 'react';
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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNotificationPromptStore } from '../stores/notificationPromptStore';
import { useNotificationPreferencesStore } from '../stores/notificationPreferencesStore';
import { notificationService } from '../services/notifications';
import { crashlyticsService } from '../services/crashlytics';
import { typography } from '../theme/ThemeProvider';

const { width, height } = Dimensions.get('window');

interface NotificationPermissionScreenProps {
  onComplete: () => void;
}

export function NotificationPermissionScreen({ onComplete }: NotificationPermissionScreenProps) {
  const { setPromptShown } = useNotificationPromptStore();
  const { favoriteTeamIds, matchStartReminderEnabled, matchResultNotificationEnabled } = useNotificationPreferencesStore();
  const insets = useSafeAreaInsets();
  
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
    try {
      setPromptShown(true);
      
      // Request notification permission
      const permissionGranted = await notificationService.requestPermissions();
      
      if (permissionGranted) {
        crashlyticsService.log('notification_permission_granted');
        
        // Register device with backend API using current preferences
        await notificationService.registerDeviceTokenWithPreferences({
          favoriteTeamIds: favoriteTeamIds.length > 0 ? favoriteTeamIds : [],
          matchStartReminderEnabled,
          matchResultNotificationEnabled,
        });
        
        crashlyticsService.log('device_registered_with_notification_api');
      } else {
        crashlyticsService.log('notification_permission_denied');
      }
      
      // Complete and proceed to app
      onComplete();
    } catch (error) {
      crashlyticsService.recordError(error instanceof Error ? error : new Error('Notification permission request failed'));
      console.error('Error requesting notification permission:', error);
      // Still proceed to app even if permission request fails
      onComplete();
    }
  };

  const handleSkip = () => {
    setPromptShown(true);
    crashlyticsService.log('notification_permission_modal_dismissed');
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

          <Text style={styles.title}>Nezmeškej žádný zápas! 🔔</Text>

          <Text style={styles.description}>
            Povol notifikace a dostávej důležité informace o zápasech FC Zličín – připomínky před začátkem zápasů, výsledky a další novinky.
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            onPress={handleAllowNotifications}
            activeOpacity={0.85}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>Povolit notifikace</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSkip}
            activeOpacity={0.6}
            style={styles.secondaryButton}
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
  secondaryButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  secondaryButtonText: {
    fontFamily: typography.fontFamily.semiBold,
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 15,
  },
});
