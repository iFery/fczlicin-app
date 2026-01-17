/**
 * Shared type definitions for the application
 */

export interface NotificationData {
  matchId?: string | number;
  type?: 'general' | 'match';
  [key: string]: unknown;
}

export interface AppConfig {
  latestAppVersion: string;
  minRequiredVersion: string;
  forceUpdateEnabled: boolean;
  chatIconAllowed: boolean;
  updateMessage: string;
}

export interface News {
  id: string;
  title: string;
  date: string;
  image_url?: string;
  text?: string;
  perex?: string;
  category?: string;
}


