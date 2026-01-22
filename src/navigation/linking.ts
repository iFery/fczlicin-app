import * as Linking from 'expo-linking';

export type RootStackParamList = {
  HomeMain: undefined;
  MatchesMain: undefined;
  ArtistsMain: undefined;
  FavoritesMain: undefined;
  InfoMain: undefined;
  PlayerDetail: { playerId: string; teamId: string };
  NewsDetail: { newsId: string; newsTitle: string };
  MatchDetail: { matchId: string };
  Settings: undefined;
  News: undefined;
  Debug: undefined;
  NotificationsList: undefined;
};

const prefix = Linking.createURL('/');

export const linking = {
  prefixes: [prefix, 'fczlicin://'],
  config: {
    screens: {
      Home: {
        screens: {
          HomeMain: 'home',
          MatchDetail: {
            path: 'match/:matchId',
            parse: {
              matchId: (matchId: string) => matchId,
            },
          },
          NewsDetail: {
            path: 'news/:newsId',
            parse: {
              newsId: (newsId: string) => newsId,
              newsTitle: (newsTitle: string) => decodeURIComponent(newsTitle || ''),
            },
          },
          Settings: 'settings',
          News: 'news',
        },
      },
      Matches: {
        screens: {
          MatchesMain: 'matches',
          MatchDetail: {
            path: 'match/:matchId',
            parse: {
              matchId: (matchId: string) => matchId,
            },
          },
          NewsDetail: {
            path: 'news/:newsId',
            parse: {
              newsId: (newsId: string) => newsId,
              newsTitle: (newsTitle: string) => decodeURIComponent(newsTitle || ''),
            },
          },
          Settings: 'settings',
          News: 'news',
        },
      },
      Artists: {
        screens: {
          ArtistsMain: 'artists',
          NewsDetail: {
            path: 'news/:newsId',
            parse: {
              newsId: (newsId: string) => newsId,
              newsTitle: (newsTitle: string) => decodeURIComponent(newsTitle || ''),
            },
          },
          Settings: 'settings',
          News: 'news',
        },
      },
      Favorites: {
        screens: {
          FavoritesMain: 'favorites',
          NewsDetail: {
            path: 'news/:newsId',
            parse: {
              newsId: (newsId: string) => newsId,
              newsTitle: (newsTitle: string) => decodeURIComponent(newsTitle || ''),
            },
          },
          Settings: 'settings',
          News: 'news',
        },
      },
      Info: {
        screens: {
          InfoMain: 'info',
          NewsDetail: {
            path: 'news/:newsId',
            parse: {
              newsId: (newsId: string) => newsId,
              newsTitle: (newsTitle: string) => decodeURIComponent(newsTitle || ''),
            },
          },
          Settings: 'settings',
          News: 'news',
          NotificationsList: 'notifications',
        },
      },
    },
  },
};

export function parseNotificationToNavParams(
  data: Record<string, unknown>
): { screen: keyof RootStackParamList; params?: RootStackParamList[keyof RootStackParamList] } | null {
  // Check for match notification
  if (data.matchId) {
    const matchId = typeof data.matchId === 'number' ? data.matchId.toString() : String(data.matchId);
    return {
      screen: 'MatchDetail',
      params: { matchId },
    };
  }
  
  
  // Default to home for all other notifications
  return {
    screen: 'HomeMain',
  };
}
