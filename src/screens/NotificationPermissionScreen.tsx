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
import { Ionicons } from '@expo/vector-icons';
import { useNotificationPromptStore } from '../stores/notificationPromptStore';
import { useNotificationPreferencesStore } from '../stores/notificationPreferencesStore';
import { notificationService } from '../services/notifications';
import { crashlyticsService } from '../services/crashlytics';

const { width, height } = Dimensions.get('window');

interface NotificationPermissionScreenProps {
  onComplete: () => void;
}

export function NotificationPermissionScreen({ onComplete }: NotificationPermissionScreenProps) {
  const { setPromptShown } = useNotificationPromptStore();
  const { favoriteTeamIds, matchStartReminderEnabled, matchResultNotificationEnabled } = useNotificationPreferencesStore();
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const logoScaleAnim = useRef(new Animated.Value(0.8)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

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
      Animated.spring(logoScaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulse animation for notification bell
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [fadeAnim, slideAnim, logoScaleAnim, pulseAnim]);

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
          },
        ]}
      >
        {/* Logo with animation */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              transform: [{ scale: logoScaleAnim }],
            },
          ]}
        >
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Notification bell icon with pulse */}
        <Animated.View
          style={[
            styles.iconContainer,
            {
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          <Ionicons name="notifications" size={56} color="#FFFFFF" />
        </Animated.View>

        <Text style={styles.title}>Nezmeškej žádný zápas! 🔔</Text>

        <Text style={styles.description}>
          Povol notifikace a dostávej důležité informace o zápasech FC Zličín – připomínky před začátkem zápasů, výsledky a další novinky.
        </Text>

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
    backgroundColor: '#014fa1', // FC Zličín blue
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  logoContainer: {
    marginBottom: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 160,
    height: 160,
  },
  iconContainer: {
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 36,
  },
  description: {
    fontSize: 17,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 48,
    paddingHorizontal: 16,
  },
  actions: {
    width: '100%',
    maxWidth: 400,
    gap: 16,
  },
  primaryButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
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
    color: '#014fa1',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  secondaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  secondaryButtonText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    fontWeight: '600',
  },
});
