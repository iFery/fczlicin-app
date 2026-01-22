import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator, type BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CommonActions, type RouteProp, type NavigationState, type PartialState, type EventArg } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HomeScreen from '../screens/HomeScreen';
import MatchesListScreen from '../screens/MatchesListScreen';
import MatchDetailScreen from '../screens/MatchDetailScreen';
import StandingsScreen from '../screens/StandingsScreen';
import TeamListScreen from '../screens/TeamListScreen';
import InfoScreen from '../screens/InfoScreen';
import PlayerDetailScreen from '../screens/PlayerDetailScreen';
import SettingsScreen from '../screens/SettingsScreen';
import NewsScreen from '../screens/NewsScreen';
import NewsDetailScreen from '../screens/NewsDetailScreen';
import DebugScreen from '../screens/DebugScreen';
import NotificationsListScreen from '../screens/NotificationsListScreen';
import type { RootStackParamList } from './linking';
import { colors } from '../theme/colors';

export type TabParamList = {
  Home: undefined;
  Matches: undefined;
  Artists: undefined;
  Favorites: undefined;
  Info: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

// Helper function to get main screen name for each tab
function getMainScreenName(tabName: string): string | null {
  switch (tabName) {
    case 'Home':
      return 'HomeMain';
    case 'Matches':
      return 'MatchesMain';
    case 'Artists':
      return 'ArtistsMain';
    case 'Favorites':
      return 'FavoritesMain';
    case 'Info':
      return 'InfoMain';
    default:
      return null;
  }
}

// Shared screens that are used across multiple stacks
// Helper to render shared screens - must be used as JSX children directly
function renderSharedScreens() {
  return (
    <>
      <Stack.Screen 
        name="PlayerDetail" 
        component={PlayerDetailScreen} 
        options={{ 
          headerShown: true, 
          title: 'Hráč',
          headerStyle: { backgroundColor: colors.brandBlue },
          headerTintColor: colors.white,
          headerTitleStyle: { color: colors.white },
          headerBackTitleVisible: false, // Hide back button title on iOS
        }} 
      />
      <Stack.Screen 
        name="Settings" 
        component={SettingsScreen} 
        options={{ 
          headerShown: true,
          title: 'Nastavení',
          headerStyle: { backgroundColor: colors.brandBlue },
          headerTintColor: colors.white,
          headerTitleStyle: { color: colors.white },
          headerTitleAlign: 'center' as const,
        }} 
      />
      <Stack.Screen 
        name="News" 
        component={NewsScreen}
        options={{ 
          headerShown: true, 
          title: 'Novinky',
          headerStyle: { backgroundColor: colors.brandBlue },
          headerTintColor: colors.white,
          headerTitleStyle: { color: colors.white },
          headerTitleAlign: 'center',
        }} 
      />
      <Stack.Screen 
        name="NewsDetail" 
        component={NewsDetailScreen}
        options={{ 
          headerShown: true, 
          title: 'Detail novinky',
          headerStyle: { backgroundColor: colors.brandBlue },
          headerTintColor: colors.white,
          headerTitleStyle: { color: colors.white }
        }} 
      />
    </>
  );
}

// Helper function to create tab press handler
function createTabPressHandler() {
  return ({ navigation, route }: { navigation: BottomTabNavigationProp<TabParamList>; route: RouteProp<TabParamList, keyof TabParamList> }) => ({
    tabPress: (e: EventArg<'tabPress', true>) => {
      const state = navigation.getState();
      const targetRoute = state.routes.find((r) => r.name === route.name);
      const currentRoute = state.routes[state.index || 0];
      
      const targetState = targetRoute?.state as NavigationState | PartialState<NavigationState> | undefined;
      if (targetState) {
        const stackKey = targetState.key;
        const stackIndex = targetState.index || 0;
        
        if (stackKey && stackIndex > 0) {
          const mainScreenName = getMainScreenName(route.name);
          
          if (mainScreenName) {
            e.preventDefault();
            
            if (currentRoute.name !== route.name) {
              navigation.navigate(route.name);
            }
            
            navigation.dispatch({
              ...CommonActions.reset({
                index: 0,
                routes: [{ name: mainScreenName }],
              }),
              target: stackKey,
            });
          }
        }
      }
    },
  });
}

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="HomeMain">
      <Stack.Screen 
        name="HomeMain" 
        component={HomeScreen}
        options={{ 
          headerShown: true, 
          title: 'Novinky',
          headerStyle: { backgroundColor: colors.brandBlue },
          headerTintColor: colors.white,
          headerTitleStyle: { color: colors.white },
          headerTitleAlign: 'center',
        }} 
      />
      <Stack.Screen 
        name="MatchDetail" 
        component={MatchDetailScreen} 
        options={{ 
          headerShown: true, 
          title: 'Detail zápasu',
          headerStyle: { backgroundColor: colors.brandBlue },
          headerTintColor: colors.white,
          headerTitleStyle: { color: colors.white },
          headerBackTitleVisible: false, // Hide back button title on iOS
        }} 
      />
      {renderSharedScreens()}
    </Stack.Navigator>
  );
}

function ProgramStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="MatchesMain">
      <Stack.Screen name="MatchesMain" component={MatchesListScreen} />
      <Stack.Screen 
        name="MatchDetail" 
        component={MatchDetailScreen} 
        options={{ 
          headerShown: true, 
          title: 'Detail zápasu',
          headerStyle: { backgroundColor: colors.brandBlue },
          headerTintColor: colors.white,
          headerTitleStyle: { color: colors.white },
          headerBackTitleVisible: false, // Hide back button title on iOS
        }} 
      />
      {renderSharedScreens()}
    </Stack.Navigator>
  );
}

function ArtistsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="ArtistsMain">
      <Stack.Screen name="ArtistsMain" component={StandingsScreen} />
      {renderSharedScreens()}
    </Stack.Navigator>
  );
}

function FavoritesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="FavoritesMain">
      <Stack.Screen name="FavoritesMain" component={TeamListScreen} />
      {renderSharedScreens()}
    </Stack.Navigator>
  );
}

function InfoStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="InfoMain">
      <Stack.Screen 
        name="InfoMain" 
        component={InfoScreen}
        options={{ 
          headerShown: true, 
          title: 'Více',
          headerStyle: { backgroundColor: colors.brandBlue },
          headerTintColor: colors.white,
          headerTitleStyle: { color: colors.white },
          headerTitleAlign: 'center',
        }} 
      />
      {renderSharedScreens()}
      <Stack.Screen 
        name="Debug" 
        component={DebugScreen} 
        options={{ 
          headerShown: true,
          title: 'Debug',
          headerStyle: { backgroundColor: colors.brandBlue },
          headerTintColor: colors.white,
          headerTitleStyle: { color: colors.white },
          headerTitleAlign: 'center',
        }} 
      />
      <Stack.Screen 
        name="NotificationsList" 
        component={NotificationsListScreen} 
        options={{ 
          headerShown: true,
          title: 'Notifikace',
          headerStyle: { backgroundColor: colors.brandBlue },
          headerTintColor: colors.white,
          headerTitleStyle: { color: colors.white },
          headerTitleAlign: 'center',
        }} 
      />
    </Stack.Navigator>
  );
}

export default function TabNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Matches') {
            iconName = focused ? 'football' : 'football-outline';
          } else if (route.name === 'Artists') {
            iconName = focused ? 'trophy' : 'trophy-outline';
          } else if (route.name === 'Favorites') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Info') {
            iconName = focused ? 'menu' : 'menu-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.brandBlue,
        tabBarInactiveTintColor: colors.gray700,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.gray500,
          borderTopWidth: 1,
          // Use safe area insets for both platforms to prevent overlap with system UI
          ...(Platform.OS === 'android' && {
            height: 60 + Math.max(insets?.bottom || 0, 0),
            paddingBottom: Math.max(insets?.bottom || 0, 8),
            paddingTop: 8,
          }),
          // For iOS, React Navigation will automatically add safe area insets
          // We just ensure minimum padding based on safe area insets
          ...(Platform.OS === 'ios' && {
            paddingBottom: Math.max(insets?.bottom || 0, 8),
            paddingTop: 8,
          }),
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeStack}
        options={{ title: 'Úvod', headerShown: false }}
        getId={() => 'HomeTab'}
        listeners={createTabPressHandler()}
      />
      <Tab.Screen 
        name="Matches" 
        component={ProgramStack}
        options={{ title: 'Zápasy' }}
        getId={() => 'MatchesTab'}
        listeners={createTabPressHandler()}
      />
      <Tab.Screen 
        name="Artists" 
        component={ArtistsStack}
        options={{ title: 'Tabulka' }}
        getId={() => 'ArtistsTab'}
        listeners={createTabPressHandler()}
      />
      <Tab.Screen 
        name="Favorites" 
        component={FavoritesStack}
        options={{ title: 'Tým' }}
        getId={() => 'FavoritesTab'}
        listeners={createTabPressHandler()}
      />
      <Tab.Screen 
        name="Info" 
        component={InfoStack}
        options={{ title: 'Více' }}
        getId={() => 'InfoTab'}
        listeners={createTabPressHandler()}
      />
    </Tab.Navigator>
  );
}
