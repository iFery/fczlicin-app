/**
 * DebugScreen - Debug a diagnostické informace pro FC Zličín aplikaci
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { useTheme } from '../theme/ThemeProvider';
import { useNotificationPreferencesStore } from '../stores/notificationPreferencesStore';
import { useAppStore } from '../stores/appStore';
import { clearAllCache, getCacheAge } from '../utils/cacheManager';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { notificationService } from '../services/notifications';
import { remoteConfigService } from '../services/remoteConfig';
import { crashlyticsService } from '../services/crashlytics';
import { CACHE_KEY_PATTERNS } from '../config/cacheConfig';
import { useTeams } from '../hooks/useFootballData';
import { isFirebaseReady, ensureFirebaseInitialized } from '../services/firebase';
import firebase from '@react-native-firebase/app';
import { colors } from '../theme/colors';

interface CacheInfo {
  key: string;
  age: number | null;
  exists: boolean;
}

const FOOTBALL_CACHE_KEYS = [
  CACHE_KEY_PATTERNS.TEAMS,
  CACHE_KEY_PATTERNS.SEASONS,
];

export default function DebugScreen() {
  const { globalStyles } = useTheme();
  const networkStatus = useNetworkStatus();
  const { isInitialized, isPreloaded } = useAppStore();
  const {
    pushNotificationsEnabled,
    favoriteTeamIds,
    matchStartReminderEnabled,
    matchResultNotificationEnabled,
  } = useNotificationPreferencesStore();
  const { data: teams } = useTeams();

  const [cacheInfo, setCacheInfo] = useState<CacheInfo[]>([]);
  const [asyncStorageKeysCount, setAsyncStorageKeysCount] = useState<number>(0);
  const [asyncStorageSize, setAsyncStorageSize] = useState<number>(0);
  const [notificationPermission, setNotificationPermission] = useState<string>('');
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [scheduledNotifications, setScheduledNotifications] = useState<Notifications.NotificationRequest[]>([]);
  const [remoteConfigValues, setRemoteConfigValues] = useState<Record<string, string>>({});
  const [firebaseProjectId, setFirebaseProjectId] = useState<string>('Načítání...');

  const loadCacheInfo = useCallback(async () => {
    const info: CacheInfo[] = await Promise.all(
      FOOTBALL_CACHE_KEYS.map(async (key) => {
        const age = await getCacheAge(key);
        return {
          key,
          age: age ?? null,
          exists: age !== null,
        };
      })
    );
    
    // Also check for dynamic cache keys (matches, standings, etc.)
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const cacheKeys = allKeys.filter(key => key.startsWith('cache_'));
      const footballKeys = cacheKeys
        .map(key => key.replace('cache_', ''))
        .filter(key => 
          key.includes('teams:') || 
          key.includes('seasons:') || 
          key.includes('matches:') || 
          key.includes('standings:') || 
          key.includes('players:') ||
          key.includes('competitions:')
        );
      
      // Get unique keys (remove duplicates from FOOTBALL_CACHE_KEYS)
      const existingKeys = new Set(info.map(i => i.key));
      const uniqueFootballKeys = footballKeys.filter(key => !existingKeys.has(key));
      
      const dynamicInfo: CacheInfo[] = await Promise.all(
        uniqueFootballKeys.slice(0, 10).map(async (key) => {
          const age = await getCacheAge(key);
          return {
            key,
            age: age ?? null,
            exists: age !== null,
          };
        })
      );
      
      setCacheInfo([...info, ...dynamicInfo]);
    } catch (error) {
      console.error('Error loading cache info:', error);
      setCacheInfo(info);
    }
  }, []);

  const loadAsyncStorageInfo = useCallback(async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      setAsyncStorageKeysCount(keys.length);
      
      // Estimate size
      let totalSize = 0;
      const items = await AsyncStorage.multiGet(keys);
      items.forEach(([_, value]) => {
        if (value) {
          totalSize += value.length;
        }
      });
      setAsyncStorageSize(totalSize);
    } catch (error) {
      console.error('Error loading AsyncStorage info:', error);
    }
  }, []);

  const loadNotificationInfo = useCallback(async () => {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      setNotificationPermission(status);
      
      const token = await notificationService.getToken();
      setFcmToken(token);
    } catch (error) {
      setNotificationPermission('unknown');
    }
  }, []);

  const loadScheduledNotifications = useCallback(async () => {
    try {
      const notifications = await Notifications.getAllScheduledNotificationsAsync();
      setScheduledNotifications(notifications);
    } catch (error) {
      console.error('Error loading scheduled notifications:', error);
      setScheduledNotifications([]);
    }
  }, []);

  const loadRemoteConfig = useCallback(async () => {
    try {
      const all = remoteConfigService.getAll();
      setRemoteConfigValues(all);
    } catch (error) {
      console.error('Error loading Remote Config:', error);
    }
  }, []);

  const loadFirebaseProjectId = useCallback(async () => {
    try {
      await ensureFirebaseInitialized();
      if (isFirebaseReady()) {
        const app = firebase.app();
        const projectId = app.options?.projectId || app.options?.appId || 'N/A';
        setFirebaseProjectId(projectId);
      } else {
        setFirebaseProjectId('Není k dispozici (Firebase není inicializován)');
      }
    } catch (error) {
      console.error('Error loading Firebase Project ID:', error);
      setFirebaseProjectId('Chyba při načítání');
    }
  }, []);

  const loadDebugInfo = useCallback(async () => {
    await Promise.all([
      loadCacheInfo(),
      loadAsyncStorageInfo(),
      loadNotificationInfo(),
      loadScheduledNotifications(),
      loadRemoteConfig(),
      loadFirebaseProjectId(),
    ]);
  }, [
    loadCacheInfo,
    loadAsyncStorageInfo,
    loadNotificationInfo,
    loadScheduledNotifications,
    loadRemoteConfig,
    loadFirebaseProjectId,
  ]);

  useEffect(() => {
    loadDebugInfo();
  }, [loadDebugInfo]);

  useFocusEffect(
    useCallback(() => {
      loadDebugInfo();
    }, [loadDebugInfo])
  );

  const formatAge = (ageMs: number | null): string => {
    if (ageMs === null) return 'Není v cache';
    const seconds = Math.floor(ageMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatToken = (token: string | null): string => {
    if (!token) return 'Není k dispozici';
    if (token.length > 30) {
      return `${token.substring(0, 15)}...${token.substring(token.length - 15)}`;
    }
    return token;
  };

  const handleClearCache = () => {
    Alert.alert(
      'Vyčistit cache',
      'Opravdu chceš vymazat všechnu cache? Aplikace bude muset znovu načíst všechna data.',
      [
        { text: 'Zrušit', style: 'cancel' },
        {
          text: 'Vymazat',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearAllCache();
              await loadCacheInfo();
              await loadAsyncStorageInfo();
              Alert.alert('Hotovo', 'Cache byla vymazána');
            } catch (error) {
              Alert.alert('Chyba', 'Nepodařilo se vymazat cache');
            }
          },
        },
      ]
    );
  };

  const handleTestCrash = () => {
    Alert.alert(
      'Testovací Crash',
      'Toto vyvolá testovací crash aplikace pro Crashlytics. Aplikace se okamžitě ukončí. Chceš pokračovat?',
      [
        { text: 'Zrušit', style: 'cancel' },
        {
          text: 'Vyvolat crash',
          style: 'destructive',
          onPress: () => {
            crashlyticsService.log('Test crash triggered from debug screen');
            crashlyticsService.forceCrash();
          },
        },
      ]
    );
  };

  const appVersion = Constants.expoConfig?.version || '1.0.0';
  const buildNumber = Constants.expoConfig?.ios?.buildNumber || Constants.expoConfig?.android?.versionCode || 'N/A';
  const deviceName = Constants.deviceName || 'Unknown';
  const platform = Platform.OS;
  const platformVersion = Platform.Version;
  const apiUrl = Constants.expoConfig?.extra?.apiUrl || 'N/A';
  const environment = Constants.expoConfig?.extra?.environment || 'N/A';

  return (
    <>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          bounces={false}
          overScrollMode="never"
        >
          {/* App Info Card */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <Ionicons name="information-circle" size={22} color={colors.brandBlue} />
              </View>
              <Text style={[globalStyles.heading, styles.sectionTitle]}>
                Informace o aplikaci
              </Text>
            </View>
            <View style={styles.infoCard}>
              <InfoRow 
                label="Firebase Project ID" 
                value={firebaseProjectId}
                valueColor={firebaseProjectId !== 'Načítání...' && !firebaseProjectId.includes('Není') && !firebaseProjectId.includes('Chyba') ? colors.brandBlue : colors.gray700}
              />
              <InfoRow label="Verze aplikace" value={appVersion} />
              <InfoRow label="Build číslo" value={String(buildNumber)} />
              <InfoRow label="Platforma" value={`${platform} ${platformVersion}`} />
              <InfoRow label="Zařízení" value={deviceName} />
              <InfoRow label="Expo SDK" value={Constants.expoConfig?.sdkVersion || 'N/A'} />
              <InfoRow label="API URL" value={apiUrl} />
              <InfoRow label="Prostředí" value={environment} />
              <InfoRow 
                label="Development" 
                value={__DEV__ ? 'Ano' : 'Ne'}
                valueColor={__DEV__ ? colors.brandBlue : colors.gray700}
              />
            </View>
          </View>

          {/* App State Card */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <Ionicons name="pulse" size={22} color={colors.brandBlue} />
              </View>
              <Text style={[globalStyles.heading, styles.sectionTitle]}>
                Stav aplikace
              </Text>
            </View>
            <View style={styles.infoCard}>
              <InfoRow 
                label="Inicializováno" 
                value={isInitialized ? 'Ano' : 'Ne'}
                valueColor={isInitialized ? colors.brandBlue : colors.errorLight}
              />
              <InfoRow 
                label="Data načtena" 
                value={isPreloaded ? 'Ano' : 'Ne'}
                valueColor={isPreloaded ? colors.brandBlue : colors.errorLight}
              />
            </View>
          </View>

          {/* Network Status Card */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <Ionicons name="wifi" size={22} color={colors.brandBlue} />
              </View>
              <Text style={[globalStyles.heading, styles.sectionTitle]}>
                Síťové připojení
              </Text>
            </View>
            <View style={styles.infoCard}>
              <InfoRow 
                label="Připojeno" 
                value={networkStatus.isConnected ? 'Ano' : 'Ne'}
                valueColor={networkStatus.isConnected ? colors.brandBlue : colors.errorLight}
              />
              <InfoRow 
                label="Internet dostupný" 
                value={networkStatus.isInternetReachable ? 'Ano' : 'Ne'}
                valueColor={networkStatus.isInternetReachable ? colors.brandBlue : colors.errorLight}
              />
              <InfoRow label="Typ připojení" value={networkStatus.type} />
            </View>
          </View>

          {/* Cache Info Card */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <Ionicons name="archive" size={22} color={colors.brandBlue} />
              </View>
              <Text style={[globalStyles.heading, styles.sectionTitle]}>
                Cache
              </Text>
            </View>
            <View style={styles.infoCard}>
              {cacheInfo.slice(0, 8).map((info) => (
                <InfoRow
                  key={info.key}
                  label={info.key.length > 30 ? info.key.substring(0, 27) + '...' : info.key}
                  value={formatAge(info.age)}
                  valueColor={info.exists ? colors.brandBlue : colors.gray600}
                />
              ))}
              {cacheInfo.length > 8 && (
                <InfoRow 
                  label="Ostatní cache klíče" 
                  value={`+${cacheInfo.length - 8} dalších`}
                />
              )}
              <View style={styles.divider} />
              <InfoRow label="AsyncStorage klíčů" value={String(asyncStorageKeysCount)} />
              <InfoRow label="Velikost dat" value={formatSize(asyncStorageSize)} />
              <TouchableOpacity style={styles.actionButton} onPress={handleClearCache}>
                <Ionicons name="trash-outline" size={18} color={colors.white} style={styles.actionButtonIcon} />
                <Text style={styles.actionButtonText}>Vyčistit všechnu cache</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Notification Preferences Card */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <Ionicons name="notifications" size={22} color={colors.brandBlue} />
              </View>
              <Text style={[globalStyles.heading, styles.sectionTitle]}>
                Notifikace
              </Text>
            </View>
            <View style={styles.infoCard}>
              <InfoRow 
                label="OS oprávnění" 
                value={notificationPermission}
                valueColor={notificationPermission === 'granted' ? colors.brandBlue : colors.errorLight}
              />
              <InfoRow 
                label="Push notifikace" 
                value={pushNotificationsEnabled ? 'Zapnuto' : 'Vypnuto'}
                valueColor={pushNotificationsEnabled ? colors.brandBlue : colors.gray600}
              />
              <InfoRow 
                label="Vybrané týmy" 
                value={favoriteTeamIds.length > 0 ? `${favoriteTeamIds.length} týmů` : 'Žádný'}
              />
              <InfoRow 
                label="Připomínka začátku" 
                value={matchStartReminderEnabled ? 'Zapnuto' : 'Vypnuto'}
                valueColor={matchStartReminderEnabled ? colors.brandBlue : colors.gray600}
              />
              <InfoRow 
                label="Notifikace výsledků" 
                value={matchResultNotificationEnabled ? 'Zapnuto' : 'Vypnuto'}
                valueColor={matchResultNotificationEnabled ? colors.brandBlue : colors.gray600}
              />
              <InfoRow label="Naplánované notifikace" value={String(scheduledNotifications.length)} />
              <InfoRow label="FCM Token" value={formatToken(fcmToken)} />
            </View>
          </View>

          {/* Football Data Card */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <Ionicons name="football" size={22} color={colors.brandBlue} />
              </View>
              <Text style={[globalStyles.heading, styles.sectionTitle]}>
                Fotbalová data
              </Text>
            </View>
            <View style={styles.infoCard}>
              <InfoRow label="Počet týmů" value={teams ? String(teams.length) : 'Načítání...'} />
              <InfoRow label="Vybrané týmy" value={favoriteTeamIds.length > 0 ? favoriteTeamIds.join(', ') : 'Žádný'} />
            </View>
          </View>

          {/* Remote Config Card */}
          {Object.keys(remoteConfigValues).length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIconContainer}>
                  <Ionicons name="cloud" size={22} color={colors.brandBlue} />
                </View>
                <Text style={[globalStyles.heading, styles.sectionTitle]}>
                  Remote Config
                </Text>
              </View>
              <View style={styles.infoCard}>
                {Object.entries(remoteConfigValues).map(([key, value]) => (
                  <InfoRow key={key} label={key} value={String(value)} />
                ))}
              </View>
            </View>
          )}

          {/* Crashlytics Testing Card */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <Ionicons name="bug" size={22} color={colors.brandBlue} />
              </View>
              <Text style={[globalStyles.heading, styles.sectionTitle]}>
                Crashlytics
              </Text>
            </View>
            <View style={styles.infoCard}>
              <TouchableOpacity style={styles.crashButton} onPress={handleTestCrash}>
                <Ionicons name="warning" size={18} color={colors.white} style={styles.actionButtonIcon} />
                <Text style={styles.crashButtonText}>Vyvolat testovací crash</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </>
  );
}

interface InfoRowProps {
  label: string;
  value: string;
  valueColor?: string;
}

function InfoRow({ label, value, valueColor = colors.gray900 }: InfoRowProps) {
  const { globalStyles } = useTheme();
  
  return (
    <View style={styles.infoRow}>
      <Text style={[globalStyles.text, styles.infoLabel]}>{label}</Text>
      <Text style={[globalStyles.text, styles.infoValue, { color: valueColor }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  sectionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.brandBlueLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    color: colors.gray900,
    fontSize: 20,
    fontWeight: '700',
  },
  infoCard: {
    backgroundColor: colors.gray300,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.gray500,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray475,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.gray700,
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
    marginLeft: 16,
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray500,
    marginVertical: 8,
  },
  actionButton: {
    backgroundColor: colors.brandBlue,
    padding: 14,
    marginTop: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonIcon: {
    marginRight: 8,
  },
  actionButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Rajdhani-SemiBold',
  },
  crashButton: {
    backgroundColor: colors.errorLight,
    padding: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  crashButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Rajdhani-SemiBold',
  },
});
