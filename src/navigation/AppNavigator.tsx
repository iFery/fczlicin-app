import React, { useEffect, useRef } from 'react';
import { NavigationContainer, LinkingOptions, type NavigationState, type PartialState } from '@react-navigation/native';
import TabNavigator from './TabNavigator';
import { linking, type RootStackParamList } from './linking';
import { navigationRef } from './navigationRef';
import { navigationQueue } from './navigationQueue';
import { analyticsService } from '../services/analytics';
import { AnalyticsEvent } from '../services/analyticsEvents';

export type { RootStackParamList };

export { navigationRef };

/**
 * Type-safe navigation function
 * Note: React Navigation's type system has limitations, but we maintain type safety
 * at the function signature level while using type assertions internally
 */
export function navigate(name: 'HomeMain'): void;
export function navigate(name: 'MatchesMain'): void;
export function navigate(name: 'ArtistsMain'): void;
export function navigate(name: 'FavoritesMain'): void;
export function navigate(name: 'InfoMain'): void;
export function navigate(name: 'Settings'): void;
export function navigate(name: 'News'): void;
export function navigate(name: 'NewsDetail', params: { newsId: string; newsTitle: string }): void;
export function navigate(
  name: keyof RootStackParamList,
  params?: RootStackParamList[keyof RootStackParamList]
): void {
  // Use queue system to ensure navigation is ready
  navigationQueue.enqueue(name, params);
}

export default function AppNavigator() {
  const routeNameRef = useRef<string | undefined>(undefined);

  // Mark navigation as ready when container is mounted
  useEffect(() => {
    // Small delay to ensure navigation container is fully initialized
    const timer = setTimeout(() => {
      navigationQueue.setReady();
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const handleReady = () => {
    // Navigation container is ready, drain any queued actions
    navigationQueue.setReady();
    const currentRouteName = getActiveRouteName(navigationRef.current?.getRootState());
    if (currentRouteName) {
      routeNameRef.current = currentRouteName;
      analyticsService.logScreenView(currentRouteName);
      analyticsService.logEvent(AnalyticsEvent.SCREEN_VIEW, {
        screen_name: currentRouteName,
      });
    }
  };

  const handleStateChange = (state?: NavigationState | PartialState<NavigationState>) => {
    const currentRouteName = getActiveRouteName(state);
    if (!currentRouteName || currentRouteName === routeNameRef.current) {
      return;
    }

    routeNameRef.current = currentRouteName;
    analyticsService.logScreenView(currentRouteName);
    analyticsService.logEvent(AnalyticsEvent.SCREEN_VIEW, {
      screen_name: currentRouteName,
    });
  };

  return (
    <NavigationContainer 
      ref={navigationRef} 
      linking={linking as LinkingOptions<RootStackParamList>}
      onReady={handleReady}
      onStateChange={handleStateChange}
    >
      <TabNavigator />
    </NavigationContainer>
  );
}

function getActiveRouteName(
  state: NavigationState | PartialState<NavigationState> | undefined
): string | undefined {
  if (!state) return undefined;
  const route = state.routes[state.index ?? 0];
  const nestedState = route.state as NavigationState | PartialState<NavigationState> | undefined;
  if (nestedState) {
    return getActiveRouteName(nestedState);
  }
  return route.name;
}
