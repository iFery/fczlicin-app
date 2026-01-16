/**
 * Notification Permission Modal
 * Custom "soft ask" screen for FC Zličín football app
 * Best practice: Show once on first launch, allow user to dismiss
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

interface NotificationPermissionModalProps {
  visible: boolean;
  onAllowNotifications: () => void;
  onDismiss: () => void;
}

export default function NotificationPermissionModal({
  visible,
  onAllowNotifications,
  onDismiss,
}: NotificationPermissionModalProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const logoScaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      fadeAnim.setValue(0);
      slideAnim.setValue(30);
      pulseAnim.setValue(1);
      logoScaleAnim.setValue(0.8);

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(logoScaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();

      // Pulse animation for notification bell icon
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
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(30);
      pulseAnim.setValue(1);
      logoScaleAnim.setValue(0.8);
    }
  }, [visible, fadeAnim, slideAnim, pulseAnim, logoScaleAnim]);

  if (!visible) {
    return null;
  }

  return (
    <Modal
      animationType="none"
      transparent={true}
      visible={visible}
      onRequestClose={onDismiss}
      statusBarTranslucent={true}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.backdrop,
            {
              opacity: fadeAnim,
            },
          ]}
        />
        
        <Animated.View
          style={[
            styles.modalContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.modalCard}>
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
              <Ionicons name="notifications" size={48} color="#014fa1" />
            </Animated.View>

            <Text style={styles.title}>Nezmeškej žádný zápas! 🔔</Text>

            <Text style={styles.bodyText}>
              Povol notifikace a dostávej důležité informace o zápasech FC Zličín – připomínky před začátkem zápasů, výsledky a další novinky.
            </Text>

            <TouchableOpacity
              onPress={onAllowNotifications}
              activeOpacity={0.85}
              style={styles.primaryButton}
            >
              <View style={styles.primaryButtonInner}>
                <Text style={styles.primaryButtonText}>Povolit notifikace</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onDismiss}
              activeOpacity={0.6}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryButtonText}>Možná později</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: width,
    height: height,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(1, 79, 161, 0.9)', // FC Zličín blue with transparency
  },
  modalContainer: {
    width: width * 0.9,
    maxWidth: 400,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCard: {
    width: '100%',
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 20,
  },
  logoContainer: {
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 120,
    height: 120,
  },
  iconContainer: {
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(1, 79, 161, 0.1)',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#014fa1',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 30,
  },
  bodyText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
    paddingHorizontal: 8,
  },
  primaryButton: {
    width: '100%',
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  primaryButtonInner: {
    backgroundColor: '#014fa1',
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    borderRadius: 16,
    shadowColor: '#014fa1',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  secondaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  secondaryButtonText: {
    color: '#999999',
    fontSize: 16,
    fontWeight: '500',
  },
});
