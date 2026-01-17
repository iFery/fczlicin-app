/**
 * Football API endpoints for FC Zličín
 * Type definitions and API client functions
 */

import { apiClient } from './client';

// Type definitions based on API responses
export interface Team {
  id: number;
  name: string;
  category: 'seniors' | 'youth';
}

export interface Season {
  id: number;
  name: string;
  isActive: boolean;
}

export interface Competition {
  teamId: number;
  seasonId: number;
  competition: string | null;
}

export interface Match {
  id: number;
  round: number;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  date: string;
  time?: string;
  competition: string;
  status: 'scheduled' | 'finished' | 'live';
  isHome: boolean;
  homeTeamLogo?: string;
  awayTeamLogo?: string;
  hasDetail?: boolean; // true pro standardní zápasy, false pro old zápasy
}

export interface MatchDetail extends Match {
  goals?: string;
  yellowCards?: string;
  redCards?: string;
  homeLineup?: string;
  awayLineup?: string;
  referees?: string;
  attendance?: number;
}

export interface Standing {
  position: number;
  team: string;
  teamLogo: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
}

export interface RoundResult {
  id: number;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  date: string;
}

export interface PlayerStat {
  name: string;
  minutes: number;
  goals: number;
  yellowCards: number;
  redCards: number;
}

export interface Player {
  id: number;
  name: string;
  birthYear?: number;
}

export interface PlayersResponse {
  goalkeepers: Player[];
  defenders: Player[];
  midfielders: Player[];
  forwards: Player[];
}

export interface PlayerDetail {
  id: number;
  name: string;
  position?: string;
  team?: string;
  year?: number;
  competitions?: Array<{
    seasonName: string;
    competitionName: string;
    statistics: {
      matches: number;
      goals: number;
      minutes: number;
      yellow_cards: number;
      red_cards: number;
    };
  }>;
}

/**
 * Football API client functions
 */
export const footballApi = {
  /**
   * Get all teams
   */
  getTeams: () => 
    apiClient.get<Team[]>('/api/teams').then(res => res.data),
  
  /**
   * Get all seasons
   */
  getSeasons: () => 
    apiClient.get<Season[]>('/api/seasons').then(res => res.data),
  
  /**
   * Get competition name for a team/season combination
   * API returns empty array [] if team didn't play in season, or Competition object if they did
   */
  getCompetition: async (teamId: number, seasonId: number): Promise<Competition> => {
    const response = await apiClient.get<Competition | Competition[]>(
      `/api/competitions?team=${teamId}&season=${seasonId}`
    );
    
    // If API returns empty array, team didn't play in this season
    if (Array.isArray(response.data) && response.data.length === 0) {
      return { teamId, seasonId, competition: null };
    }
    
    // If API returns array with data, take first item
    if (Array.isArray(response.data) && response.data.length > 0) {
      return response.data[0];
    }
    
    // If API returns single Competition object
    return response.data as Competition;
  },
  
  /**
   * Get match calendar (scheduled matches)
   */
  getMatchCalendar: (teamId: number, seasonId: number) =>
    apiClient.get<Match[]>(
      `/api/matches?team=${teamId}&season=${seasonId}&type=calendar`
    ).then(res => res.data),
  
  /**
   * Get match results (past matches)
   */
  getMatchResults: (teamId: number, seasonId: number) =>
    apiClient.get<Match[]>(
      `/api/matches?team=${teamId}&season=${seasonId}&type=results`
    ).then(res => res.data),
  
  /**
   * Get standings (league table)
   */
  getStandings: (teamId: number, seasonId: number) =>
    apiClient.get<Standing[]>(
      `/api/standings?team=${teamId}&season=${seasonId}`
    ).then(res => res.data),
  
  /**
   * Get match detail by ID
   */
  getMatchDetail: (matchId: number) =>
    apiClient.get<MatchDetail>(
      `/api/matches?matchId=${matchId}`
    ).then(res => res.data),
  
  /**
   * Get round results for a match (all matches in the same round)
   */
  getRoundResults: (matchId: number) =>
    apiClient.get<{ matches: RoundResult[] }>(
      `/api/matches-round-results.php?id=${matchId}`
    ).then(res => res.data),
  
  /**
   * Get player stats for a match
   */
  getPlayerStats: (matchId: number) =>
    apiClient.get<{ players: PlayerStat[] }>(
      `/api/matches-player-stats.php?id=${matchId}`
    ).then(res => res.data),
  
  /**
   * Get players for a team
   */
  getPlayers: (teamId: number) =>
    apiClient.get<PlayersResponse>(
      `/api/players?team=${teamId}`
    ).then(res => res.data),
  
  /**
   * Get player detail by ID
   */
  getPlayerById: (playerId: number, teamId: number) =>
    apiClient.get<PlayerDetail>(
      `/api/players/${playerId}?team=${teamId}`
    ).then(res => res.data),
};

/**
 * Notification preferences types
 */
export interface NotificationPreferences {
  token: string;
  favoriteTeamIds: number[];
  matchStartReminderEnabled: boolean;
  matchResultNotificationEnabled: boolean;
}

export interface NotificationPreferencesResponse {
  success: boolean;
  message?: string;
}

/**
 * Notification preferences API
 * Uses the notification management API endpoint
 */
export const notificationApi = {
  /**
   * Register device token with notification preferences
   * POST /administrace/mobile-notification/api_notifications.php
   * @param preferences Notification preferences including token and team selections
   */
  registerDeviceToken: (preferences: NotificationPreferences) =>
    apiClient.post<NotificationPreferencesResponse>(
      '/administrace/mobile-notification/api_notifications.php',
      preferences
    ).then(res => res.data).catch((error) => {
      console.error('Notification registration failed:', error);
      return { success: false, message: error instanceof Error ? error.message : 'Registration failed' };
    }),
  
  /**
   * Update notification preferences for existing token
   * PUT /administrace/mobile-notification/api_notifications.php
   * @param preferences Updated notification preferences
   */
  updatePreferences: (preferences: NotificationPreferences) =>
    apiClient.put<NotificationPreferencesResponse>(
      '/administrace/mobile-notification/api_notifications.php',
      preferences
    ).then(res => res.data).catch((error) => {
      console.error('Notification preferences update failed:', error);
      return { success: false, message: error instanceof Error ? error.message : 'Update failed' };
    }),
  
  /**
   * Unregister device token (disable notifications)
   * DELETE /administrace/mobile-notification/api_notifications.php?token=XXX
   * @param token Device FCM token
   */
  unregisterDeviceToken: (token: string) =>
    apiClient.delete<NotificationPreferencesResponse>(
      `/administrace/mobile-notification/api_notifications.php?token=${encodeURIComponent(token)}`
    ).then(res => res.data).catch((error) => {
      console.error('Notification unregistration failed:', error);
      return { success: false, message: error instanceof Error ? error.message : 'Unregistration failed' };
    }),
};

/**
 * Get current season (highest ID from seasons list)
 * This is the authoritative way to determine current season
 * @param seasons Array of seasons from API
 * @returns Season with highest ID, or null if empty
 */
export function getCurrentSeason(seasons: Season[]): Season | null {
  if (!seasons || seasons.length === 0) return null;
  return seasons.reduce((latest, season) => 
    season.id > latest.id ? season : latest
  );
}
