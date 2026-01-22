/**
 * NotificationsListScreen - Zobrazení naplánovaných notifikací
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { useTheme } from '../theme/ThemeProvider';
import dayjs from 'dayjs';
import 'dayjs/locale/cs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);
dayjs.locale('cs');

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  scheduledDate: Date | null;
  trigger: Notifications.NotificationTriggerInput | null;
}

export default function NotificationsListScreen() {
  const { globalStyles } = useTheme();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadNotifications();
    }, [])
  );

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      
      const formattedNotifications: NotificationItem[] = scheduledNotifications.map((notification) => {
        let scheduledDate: Date | null = null;
        
        // Získat datum naplánování z triggeru
        if (notification.trigger) {
          const trigger = notification.trigger as any;
          
          // Expo-notifications DATE trigger má strukturu: { type: "date", value: Date/timestamp }
          // Ne { type: "date", date: Date }!
          const triggerType = trigger.type;
          
          // DATE trigger - datum je v 'value' property, ne v 'date'!
          if (triggerType === Notifications.SchedulableTriggerInputTypes.DATE || 
              triggerType === 'date' || 
              triggerType === 1) {
            const dateValue = trigger.value || trigger.date; // Zkusit value i date
            if (dateValue) {
              if (dateValue instanceof Date) {
                scheduledDate = dateValue;
              } else if (typeof dateValue === 'string') {
                scheduledDate = new Date(dateValue);
              } else if (typeof dateValue === 'number') {
                scheduledDate = new Date(dateValue);
              }
            }
          }
          // TIME_INTERVAL trigger
          else if (triggerType === Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL || 
                   triggerType === 'timeInterval' || 
                   triggerType === 0) {
            const seconds = typeof trigger.seconds === 'number' ? trigger.seconds : 0;
            scheduledDate = new Date(Date.now() + seconds * 1000);
          }
          // DATE_COMPONENTS trigger
          else if (triggerType === Notifications.SchedulableTriggerInputTypes.DATE_COMPONENTS || 
                   triggerType === 'dateComponents' || 
                   triggerType === 2) {
            if (trigger.dateComponents) {
              const components = trigger.dateComponents;
              if (components.year && components.month && components.day !== undefined) {
                scheduledDate = new Date(
                  components.year,
                  (components.month || 1) - 1,
                  components.day || 1,
                  components.hour || 0,
                  components.minute || 0
                );
              }
            }
          }
        }

        return {
          id: notification.identifier,
          title: notification.content.title || 'Notifikace',
          body: notification.content.body || '',
          scheduledDate,
          trigger: notification.trigger,
        };
      });

      // Seřadit podle data naplánování (nejbližší první)
      formattedNotifications.sort((a, b) => {
        if (!a.scheduledDate && !b.scheduledDate) return 0;
        if (!a.scheduledDate) return 1;
        if (!b.scheduledDate) return -1;
        return a.scheduledDate.getTime() - b.scheduledDate.getTime();
      });

      setNotifications(formattedNotifications);
    } catch (error) {
      console.error('Chyba při načítání notifikací:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date | null): string => {
    if (!date) return 'Není specifikováno';
    
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    
    // Pokud je v budoucnosti méně než 24 hodin, použij relative time
    if (diffHours > 0 && diffHours < 24) {
      return dayjs(date).fromNow();
    }
    
    // Jinak formátuj jako datum a čas
    return dayjs(date).format('DD.MM.YYYY HH:mm');
  };

  const formatTriggerType = (trigger: Notifications.NotificationTriggerInput | null): string => {
    if (!trigger) return 'Okamžitě';
    
    // Použít type property pokud existuje (novější API)
    if ('type' in trigger) {
      switch (trigger.type) {
        case Notifications.SchedulableTriggerInputTypes.DATE:
          return 'Naplánováno';
        case Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL:
          return 'Časový interval';
        case Notifications.SchedulableTriggerInputTypes.DATE_COMPONENTS:
          return 'Pravidelné';
        default:
          return 'Naplánováno';
      }
    }
    
    // Fallback pro starší notifikace
    if ('date' in trigger) {
      return 'Naplánováno';
    } else if ('seconds' in trigger) {
      return 'Časový interval';
    } else if ('dateComponents' in trigger) {
      return 'Pravidelné';
    }
    
    return 'Naplánováno';
  };

  return (
    <>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={loadNotifications}
              tintColor="#014fa1"
            />
          }
        >
          {notifications.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="notifications-off-outline" size={64} color="#999999" />
              <Text style={[globalStyles.text, styles.emptyText]}>
                Žádné naplánované notifikace
              </Text>
              <Text style={[globalStyles.caption, styles.emptySubtext]}>
                Naplánované notifikace se zobrazí zde. Notifikace pro zápasy oblíbených týmů budou automaticky vytvořeny při výběru týmů v nastavení.
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.header}>
                <Text style={[globalStyles.heading, styles.headerTitle]}>
                  Naplánované notifikace
                </Text>
                <Text style={[globalStyles.caption, styles.headerSubtitle]}>
                  {notifications.length} {notifications.length === 1 ? 'notifikace' : 'notifikací'}
                </Text>
              </View>

              {notifications.map((notification) => (
                <View key={notification.id} style={styles.notificationCard}>
                  <View style={styles.cardHeader}>
                    <View style={styles.iconContainer}>
                      <Ionicons name="notifications" size={24} color="#014fa1" />
                    </View>
                    <View style={styles.cardContent}>
                      <Text style={[globalStyles.text, styles.cardTitle]} numberOfLines={1}>
                        {notification.title}
                      </Text>
                      {notification.body ? (
                        <Text style={[globalStyles.caption, styles.cardBody]} numberOfLines={2}>
                          {notification.body}
                        </Text>
                      ) : null}
                    </View>
                  </View>

                  <View style={styles.cardFooter}>
                    <View style={styles.footerItem}>
                      <Ionicons name="time-outline" size={16} color="#666666" />
                      <Text style={[globalStyles.caption, styles.footerText]}>
                        {formatDate(notification.scheduledDate)}
                      </Text>
                    </View>
                    <View style={styles.footerItem}>
                      <Ionicons name="settings-outline" size={16} color="#666666" />
                      <Text style={[globalStyles.caption, styles.footerText]}>
                        {formatTriggerType(notification.trigger)}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}

              <View style={styles.infoBox}>
                <Ionicons name="information-circle-outline" size={20} color="#014fa1" />
                <Text style={[globalStyles.caption, styles.infoText]}>
                  Notifikace pro zápasy oblíbených týmů jsou naplánovány lokálně. Jsou automaticky vytvořeny při výběru oblíbených týmů v nastavení a jsou naplánovány 10 minut před začátkem každého zápasu.
                </Text>
              </View>
            </>
          )}
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    color: '#333333',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    color: '#666666',
    fontSize: 14,
  },
  notificationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(1, 79, 161, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    color: '#333333',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardBody: {
    color: '#666666',
    fontSize: 14,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    color: '#666666',
    fontSize: 13,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyText: {
    color: '#333333',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    color: '#666666',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(1, 79, 161, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    gap: 12,
  },
  infoText: {
    flex: 1,
    color: '#014fa1',
    fontSize: 13,
    lineHeight: 18,
  },
});
