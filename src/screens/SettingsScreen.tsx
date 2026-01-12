import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Switch,
  Linking,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import TeamSelectionModal from '../components/TeamSelectionModal';
import { useNotificationPreferencesStore } from '../stores/notificationPreferencesStore';
import { useTheme } from '../theme/ThemeProvider';
import { useTeams } from '../hooks/useFootballData';
import { notificationService } from '../services/notifications';

export default function SettingsScreen() {
  const {
    pushNotificationsEnabled,
    favoriteTeamIds,
    matchStartReminderEnabled,
    matchResultNotificationEnabled,
    setPushNotificationsEnabled,
    setFavoriteTeamIds,
    setMatchStartReminderEnabled,
    setMatchResultNotificationEnabled,
  } = useNotificationPreferencesStore();
  const { globalStyles } = useTheme();
  const { data: teams } = useTeams();

  const [notificationPermissionStatus, setNotificationPermissionStatus] = useState<string>('');
  const [showTeamSelectionModal, setShowTeamSelectionModal] = useState(false);

  useEffect(() => {
    checkNotificationPermission();
  }, []);

  // Zkontroluj oprávnění při návratu na obrazovku (např. po návratu z nastavení)
  useFocusEffect(
    React.useCallback(() => {
      checkNotificationPermission();
    }, [])
  );

  const checkNotificationPermission = async () => {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      setNotificationPermissionStatus(status);
    } catch (error) {
      console.error('Error checking notification permission:', error);
      setNotificationPermissionStatus('undetermined');
    }
  };

  const isNotificationEnabled = notificationPermissionStatus === 'granted';

  const handleOpenSystemSettings = async () => {
    try {
      // Nejprve zkus požádat o oprávnění (funguje hlavně na Androidu)
      const { status } = await Notifications.requestPermissionsAsync();
      
      if (status === 'granted') {
        // Oprávnění bylo uděleno
        setNotificationPermissionStatus('granted');
        return;
      }
      
      // Pokud oprávnění nebylo uděleno, otevři systémová nastavení
      if (Platform.OS === 'ios') {
        Linking.openURL('app-settings:');
      } else {
        Linking.openSettings();
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
      // Pokud selže požadavek, otevři systémová nastavení
      if (Platform.OS === 'ios') {
        Linking.openURL('app-settings:');
      } else {
        Linking.openSettings();
      }
    }
  };


  const handleTogglePushNotifications = async (enabled: boolean) => {
    if (enabled) {
      // Check OS permission first
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        const { status: newStatus } = await Notifications.requestPermissionsAsync();
        if (newStatus !== 'granted') {
          // Permission denied - don't enable
          return;
        }
        setNotificationPermissionStatus('granted');
      }
    }
    
    setPushNotificationsEnabled(enabled);
    
    // Sync with backend
    if (enabled) {
      // Register token with preferences
      await notificationService.registerDeviceTokenWithPreferences({
        favoriteTeamIds,
        matchStartReminderEnabled,
        matchResultNotificationEnabled,
      });
    } else {
      // Unregister token
      await notificationService.unregisterDeviceToken();
    }
  };

  const handleTeamSelectionSave = async (teamIds: number[]) => {
    setFavoriteTeamIds(teamIds);
    
    // Sync with backend if notifications are enabled
    if (pushNotificationsEnabled && isNotificationEnabled) {
      await notificationService.updateNotificationPreferences({
        favoriteTeamIds: teamIds,
        matchStartReminderEnabled,
        matchResultNotificationEnabled,
      });
    }
  };

  const handleToggleMatchStartReminder = async (enabled: boolean) => {
    setMatchStartReminderEnabled(enabled);
    
    // Sync with backend if notifications are enabled
    if (pushNotificationsEnabled && isNotificationEnabled) {
      await notificationService.updateNotificationPreferences({
        favoriteTeamIds,
        matchStartReminderEnabled: enabled,
        matchResultNotificationEnabled,
      });
    }
  };

  const handleToggleMatchResultNotification = async (enabled: boolean) => {
    setMatchResultNotificationEnabled(enabled);
    
    // Sync with backend if notifications are enabled
    if (pushNotificationsEnabled && isNotificationEnabled) {
      await notificationService.updateNotificationPreferences({
        favoriteTeamIds,
        matchStartReminderEnabled,
        matchResultNotificationEnabled: enabled,
      });
    }
  };

  const getSelectedTeams = () => {
    if (favoriteTeamIds.length === 0) return [];
    return teams.filter((team) => favoriteTeamIds.includes(team.id));
  };

  const selectedTeams = getSelectedTeams();

  const isTeamNotificationsEnabled = pushNotificationsEnabled && isNotificationEnabled;

  return (
    <>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          bounces={false}
          overScrollMode="never"
          refreshControl={undefined}
        >
          {/* Notifications Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="notifications-outline" size={24} color="#014fa1" />
              <Text style={[globalStyles.heading, styles.sectionTitle]}>Notifikace</Text>
            </View>

            {/* Notification Status Row */}
            <View style={styles.statusRow}>
              <View style={styles.statusContent}>
                <Text style={styles.statusIcon}>
                  {isNotificationEnabled ? '✅' : '🔕'}
                </Text>
                <View style={styles.statusTextContainer}>
                  <Text style={[globalStyles.text, styles.statusText]}>
                    {isNotificationEnabled
                      ? 'Notifikace jsou povolené'
                      : 'Notifikace jsou vypnuté'}
                  </Text>
                </View>
              </View>
              {!isNotificationEnabled && (
                <TouchableOpacity
                  style={styles.settingsButton}
                  onPress={handleOpenSystemSettings}
                  activeOpacity={0.7}
                >
                  <Text style={[globalStyles.button, styles.settingsButtonText]}>Otevřít nastavení</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Team Notifications Section */}
            <View style={styles.teamNotificationsSection}>
              <View style={styles.subsectionHeader}>
                <View style={styles.subsectionIconContainer}>
                  <Ionicons name="football" size={22} color="#014fa1" />
                </View>
                <View style={styles.subsectionTitleContainer}>
                  <Text style={[globalStyles.heading, styles.subsectionTitle]}>
                    Týmové notifikace
                  </Text>
                  <Text style={[globalStyles.caption, styles.subsectionSubtitle]}>
                    Nastavení upozornění pro fotbalové týmy
                  </Text>
                </View>
              </View>

              {/* Global Push Notifications Card */}
              <View style={styles.notificationCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardIconContainer}>
                    <Ionicons name="notifications" size={20} color="#014fa1" />
                  </View>
                  <View style={styles.cardHeaderText}>
                    <Text style={[globalStyles.text, styles.cardTitle]}>
                      Push notifikace
                    </Text>
                    <Text style={[globalStyles.caption, styles.cardDescription]}>
                      Hlavní přepínač pro všechny týmové notifikace
                    </Text>
                  </View>
                    <Switch
                      value={pushNotificationsEnabled && isNotificationEnabled}
                      onValueChange={handleTogglePushNotifications}
                      disabled={!isNotificationEnabled}
                      trackColor={{ false: '#E0E0E0', true: '#014fa1' }}
                      thumbColor="#FFFFFF"
                      ios_backgroundColor="#E0E0E0"
                    />
                </View>
              </View>

              {/* Favorite Teams Selection Card */}
              <TouchableOpacity
                style={[
                  styles.notificationCard,
                  !isTeamNotificationsEnabled && styles.cardDisabled
                ]}
                onPress={() => isTeamNotificationsEnabled && setShowTeamSelectionModal(true)}
                disabled={!isTeamNotificationsEnabled}
                activeOpacity={0.7}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.cardIconContainer}>
                    <Ionicons 
                      name="people" 
                      size={20} 
                      color={isTeamNotificationsEnabled ? "#014fa1" : "#999999"} 
                    />
                  </View>
                  <View style={styles.cardHeaderText}>
                    <View style={styles.cardTitleRow}>
                      <Text style={[
                        globalStyles.text, 
                        styles.cardTitle,
                        !isTeamNotificationsEnabled && styles.cardTitleDisabled
                      ]}>
                        Oblíbené týmy
                      </Text>
                      {selectedTeams.length > 0 && (
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>{selectedTeams.length}</Text>
                        </View>
                      )}
                    </View>
                    {selectedTeams.length === 0 ? (
                      <Text style={[
                        globalStyles.caption, 
                        styles.cardDescription,
                        !isTeamNotificationsEnabled && styles.cardDescriptionDisabled
                      ]}>
                        Klepnutím vyberte týmy
                      </Text>
                    ) : selectedTeams.length <= 2 ? (
                      <View style={styles.teamChipsContainer}>
                        {selectedTeams.map((team) => (
                          <View key={team.id} style={styles.teamChip}>
                            <Text style={styles.teamChipText} numberOfLines={1}>
                              {team.name}
                            </Text>
                          </View>
                        ))}
                      </View>
                    ) : (
                      <View style={styles.teamChipsContainer}>
                        {selectedTeams.slice(0, 2).map((team) => (
                          <View key={team.id} style={styles.teamChip}>
                            <Text style={styles.teamChipText} numberOfLines={1}>
                              {team.name}
                            </Text>
                          </View>
                        ))}
                        <View style={styles.teamChipMore}>
                          <Text style={styles.teamChipMoreText}>
                            +{selectedTeams.length - 2}
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>
                  <Ionicons 
                    name="chevron-forward" 
                    size={20} 
                    color={isTeamNotificationsEnabled ? "#666666" : "#999999"} 
                  />
                </View>
              </TouchableOpacity>

              {/* Notification Types Card */}
              <View style={styles.notificationCard}>
                <View style={styles.cardSectionHeader}>
                  <Text style={[globalStyles.text, styles.cardSectionTitle]}>
                    Typy notifikací
                  </Text>
                </View>

                {/* Match Start Reminder */}
                <View style={styles.cardSettingRow}>
                  <View style={styles.cardSettingContent}>
                    <View style={styles.cardSettingIconContainer}>
                      <Ionicons name="time-outline" size={18} color="#014fa1" />
                    </View>
                    <View style={styles.cardSettingText}>
                      <Text style={[globalStyles.text, styles.cardSettingTitle]}>
                        Připomínka začátku zápasu
                      </Text>
                      <Text style={[globalStyles.caption, styles.cardSettingDescription]}>
                        Upozornění před začátkem zápasu
                      </Text>
                    </View>
                  </View>
                    <Switch
                      value={matchStartReminderEnabled && isTeamNotificationsEnabled}
                      onValueChange={handleToggleMatchStartReminder}
                      disabled={!isTeamNotificationsEnabled}
                      trackColor={{ false: '#E0E0E0', true: '#014fa1' }}
                      thumbColor="#FFFFFF"
                      ios_backgroundColor="#E0E0E0"
                    />
                </View>

                <View style={styles.cardDivider} />

                {/* Match Result Notification */}
                <View style={styles.cardSettingRow}>
                  <View style={styles.cardSettingContent}>
                    <View style={styles.cardSettingIconContainer}>
                      <Ionicons name="trophy-outline" size={18} color="#014fa1" />
                    </View>
                    <View style={styles.cardSettingText}>
                      <Text style={[globalStyles.text, styles.cardSettingTitle]}>
                        Notifikace o výsledku
                      </Text>
                      <Text style={[globalStyles.caption, styles.cardSettingDescription]}>
                        Upozornění po skončení zápasu
                      </Text>
                    </View>
                  </View>
                    <Switch
                      value={matchResultNotificationEnabled && isTeamNotificationsEnabled}
                      onValueChange={handleToggleMatchResultNotification}
                      disabled={!isTeamNotificationsEnabled}
                      trackColor={{ false: '#E0E0E0', true: '#014fa1' }}
                      thumbColor="#FFFFFF"
                      ios_backgroundColor="#E0E0E0"
                    />
                </View>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Team Selection Modal */}
        <TeamSelectionModal
          visible={showTeamSelectionModal}
          onClose={() => setShowTeamSelectionModal(false)}
          selectedTeamIds={favoriteTeamIds}
          onSave={handleTeamSelectionSave}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#014fa1',
  },
  sectionTitle: {
    color: '#333333',
    marginLeft: 8,
  },
  statusRow: {
    backgroundColor: '#F5F5F5',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusText: {
    color: '#333333',
  },
  settingsButton: {
    backgroundColor: '#014fa1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  settingsButtonText: {
    color: '#FFFFFF',
  },
  settingRow: {
    backgroundColor: '#F5F5F5',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  settingContent: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    color: '#333333',
    marginBottom: 4,
  },
  settingDescription: {
    color: '#666666',
  },
  teamNotificationsSection: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  subsectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    gap: 12,
  },
  subsectionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(1, 79, 161, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  subsectionTitleContainer: {
    flex: 1,
  },
  subsectionTitle: {
    color: '#333333',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  subsectionSubtitle: {
    color: '#666666',
    fontSize: 13,
  },
  notificationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  cardDisabled: {
    opacity: 0.5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  cardIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(1, 79, 161, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  cardHeaderText: {
    flex: 1,
    gap: 8,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  cardTitle: {
    color: '#333333',
    fontSize: 16,
    fontWeight: '600',
  },
  cardTitleDisabled: {
    color: '#999999',
  },
  cardDescription: {
    color: '#666666',
    fontSize: 13,
    lineHeight: 18,
  },
  cardDescriptionDisabled: {
    color: '#999999',
  },
  badge: {
    backgroundColor: '#014fa1',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'Rajdhani-SemiBold',
  },
  teamChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  teamChip: {
    backgroundColor: 'rgba(1, 79, 161, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(1, 79, 161, 0.3)',
  },
  teamChipText: {
    color: '#014fa1',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Rajdhani-Medium',
  },
  teamChipMore: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  teamChipMoreText: {
    color: '#666666',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Rajdhani-Medium',
  },
  cardSectionHeader: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  cardSectionTitle: {
    color: '#333333',
    fontSize: 15,
    fontWeight: '600',
  },
  cardSettingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  cardSettingContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    gap: 12,
    marginRight: 16,
  },
  cardSettingIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(1, 79, 161, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  cardSettingText: {
    flex: 1,
    gap: 4,
  },
  cardSettingTitle: {
    color: '#333333',
    fontSize: 15,
    fontWeight: '500',
  },
  cardSettingDescription: {
    color: '#666666',
    fontSize: 13,
    lineHeight: 18,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 16,
    marginLeft: 44,
  },
  settingRowDisabled: {
    opacity: 0.5,
  },
});
