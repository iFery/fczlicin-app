/**
 * Shared type definitions for the application
 */

export interface Event {
  id: string;
  name: string;
  time: string;
  artist: string;
  stage?: string;
  description?: string;
  image?: string;
  date?: string;
}

export interface TimelineConfig {
  dayOne: {
    start: string;
    end: string;
  };
  dayTwo: {
    start: string;
    end: string;
  };
}

export interface Stage {
  stage: string;
  stage_name: string;
  class: string;
  stageColors: string;
  stageColorsArtist: string;
  sort: number;
}

export interface TimelineData {
  config: TimelineConfig;
  stages: Stage[];
  events: Event[];
}

export interface NotificationData {
  eventId?: string;
  artistId?: string;
  matchId?: string | number;
  type?: 'event' | 'artist' | 'general' | 'match';
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


