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
};

const prefix = Linking.createURL('/');

export const linking = {
  prefixes: [prefix, 'fczlicin://'],
  config: {
    screens: {
      Home: {
        screens: {
          HomeMain: 'home',
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
          ArtistDetail: {
            path: 'artist/:artistId',
            parse: {
              artistId: (artistId: string) => artistId,
              artistName: (artistName: string) => decodeURIComponent(artistName || ''),
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
          ArtistDetail: {
            path: 'artist/:artistId',
            parse: {
              artistId: (artistId: string) => artistId,
              artistName: (artistName: string) => decodeURIComponent(artistName || ''),
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
      Favorites: {
        screens: {
          FavoritesMain: 'favorites',
          ArtistDetail: {
            path: 'artist/:artistId',
            parse: {
              artistId: (artistId: string) => artistId,
              artistName: (artistName: string) => decodeURIComponent(artistName || ''),
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
      Info: {
        screens: {
          InfoMain: 'info',
          ArtistDetail: {
            path: 'artist/:artistId',
            parse: {
              artistId: (artistId: string) => artistId,
              artistName: (artistName: string) => decodeURIComponent(artistName || ''),
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
    },
  },
};

export function parseNotificationToNavParams(
  data: Record<string, unknown>
): { screen: keyof RootStackParamList; params?: RootStackParamList[keyof RootStackParamList] } | null {
  // Default to home for all notifications
  return {
    screen: 'HomeMain',
  };
}
