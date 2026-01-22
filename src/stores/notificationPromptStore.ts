/**
 * Store for tracking notification prompt state
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { debouncedStorage } from '../utils/debouncedStorage';

interface NotificationPromptStore {
  notificationPromptShown: boolean;
  lastPromptDate: string | null; // ISO date string (kept for backward compatibility but not used)
  setPromptShown: (shown: boolean) => void;
  shouldShowPrompt: () => boolean;
  resetDaily: () => void; // Kept for backward compatibility but does nothing
}

export const useNotificationPromptStore = create<NotificationPromptStore>()(
  persist(
    (set, get) => ({
      notificationPromptShown: false,
      lastPromptDate: null,

      setPromptShown: (shown: boolean) => {
        set({
          notificationPromptShown: shown,
          lastPromptDate: shown ? new Date().toISOString() : get().lastPromptDate,
        });
      },

      shouldShowPrompt: () => {
        const state = get();
        // Show only once - if user dismissed/skipped, never show again
        return !state.notificationPromptShown;
      },

      resetDaily: () => {
        // No-op - kept for backward compatibility
        // We no longer reset the prompt daily
      },
    }),
    {
      name: 'notification-prompt-storage',
      storage: createJSONStorage(() => debouncedStorage),
    }
  )
);




