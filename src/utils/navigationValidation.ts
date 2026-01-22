/**
 * Navigation Parameter Validation
 * Validates deep link and notification parameters before navigation
 */

import type { RootStackParamList } from '../navigation/linking';

/**
 * Validate news ID parameter
 */
export function validateNewsId(newsId: string | undefined | null): boolean {
  if (!newsId || typeof newsId !== 'string') {
    return false;
  }
  // News ID should be non-empty string
  return newsId.trim().length > 0;
}

/**
 * Validate navigation parameters for a screen
 */
export function validateNavigationParams(
  screen: keyof RootStackParamList,
  params?: RootStackParamList[keyof RootStackParamList]
): { valid: boolean; error?: string } {
  switch (screen) {
    case 'NewsDetail': {
      if (!params || typeof params !== 'object') {
        return { valid: false, error: 'Missing news parameters' };
      }
      const newsParams = params as { newsId: string; newsTitle: string };
      if (!validateNewsId(newsParams.newsId)) {
        return { valid: false, error: 'Invalid news ID' };
      }
      return { valid: true };
    }

    case 'HomeMain':
    case 'MatchesMain':
    case 'ArtistsMain':
    case 'FavoritesMain':
    case 'InfoMain':
    case 'Settings':
    case 'News':
    case 'Debug':
      // These screens don't require parameters
      return { valid: true };

    default:
      return { valid: true };
  }
}

/**
 * Sanitize and normalize navigation parameters
 */
export function sanitizeNavigationParams(
  screen: keyof RootStackParamList,
  params?: RootStackParamList[keyof RootStackParamList]
): RootStackParamList[keyof RootStackParamList] | undefined {
  if (!params) {
    return undefined;
  }

  switch (screen) {
    case 'NewsDetail': {
      const newsParams = params as { newsId: string; newsTitle: string };
      return {
        newsId: String(newsParams.newsId || '').trim(),
        newsTitle: String(newsParams.newsTitle || 'Novinka').trim(),
      };
    }

    default:
      return params;
  }
}

