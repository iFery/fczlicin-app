/**
 * Store for notification preferences
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { debouncedStorage } from '../utils/debouncedStorage';

interface NotificationPreferencesStore {
  // Existing festival notifications (kept for backward compatibility)
  importantFestivalNotifications: boolean;
  
  // Team notification preferences
  pushNotificationsEnabled: boolean; // Global master switch
  favoriteTeamIds: number[]; // Array of selected team IDs
  matchStartReminderEnabled: boolean;
  matchResultNotificationEnabled: boolean;
  
  // Setters
  setImportantFestivalNotifications: (enabled: boolean) => void;
  setPushNotificationsEnabled: (enabled: boolean) => void;
  setFavoriteTeamIds: (teamIds: number[]) => void;
  setMatchStartReminderEnabled: (enabled: boolean) => void;
  setMatchResultNotificationEnabled: (enabled: boolean) => void;
}

export const useNotificationPreferencesStore = create<NotificationPreferencesStore>()(
  persist(
    (set) => ({
      // Existing defaults
      importantFestivalNotifications: true,
      
      // Team notification defaults
      pushNotificationsEnabled: true,
      favoriteTeamIds: [],
      matchStartReminderEnabled: true,
      matchResultNotificationEnabled: true,

      setImportantFestivalNotifications: (enabled: boolean) => {
        set({ importantFestivalNotifications: enabled });
      },
      
      setPushNotificationsEnabled: (enabled: boolean) => {
        set({ pushNotificationsEnabled: enabled });
      },
      
      setFavoriteTeamIds: (teamIds: number[]) => {
        set({ favoriteTeamIds: teamIds });
      },
      
      setMatchStartReminderEnabled: (enabled: boolean) => {
        set({ matchStartReminderEnabled: enabled });
      },
      
      setMatchResultNotificationEnabled: (enabled: boolean) => {
        set({ matchResultNotificationEnabled: enabled });
      },
    }),
    {
      name: 'notification-preferences-storage',
      storage: createJSONStorage(() => debouncedStorage),
    }
  )
);



