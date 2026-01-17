import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, StatusBar, Animated, Image, Easing, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import {
  Rajdhani_400Regular,
  Rajdhani_500Medium,
  Rajdhani_600SemiBold,
  Rajdhani_700Bold,
} from '@expo-google-fonts/rajdhani';
import { BootstrapProvider, useBootstrap } from './src/providers/BootstrapProvider';
import { ThemeProvider } from './src/theme/ThemeProvider';
import AppNavigator from './src/navigation/AppNavigator';
import { OfflineBlockedScreen } from './src/screens/OfflineBlockedScreen';
import { UpdateScreen } from './src/screens/UpdateScreen';
import { NotificationPermissionScreen } from './src/screens/NotificationPermissionScreen';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { useNotificationPromptStore } from './src/stores/notificationPromptStore';

const FADE_DURATION = 300;

function LoadingScreen() {
  const logoImage = require('./assets/fc-zlicin-logo.jpg');

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <View style={styles.content}>
        <Image source={logoImage} style={styles.logo} resizeMode="contain" />
      </View>
    </View>
  );
}

function AppContent() {
  const { state, updateInfo, skipUpdate } = useBootstrap();
  const loadingOpacity = useRef(new Animated.Value(1)).current;
  const appOpacity = useRef(new Animated.Value(0)).current;
  const updateScreenOpacity = useRef(new Animated.Value(0)).current;
  const notificationScreenOpacity = useRef(new Animated.Value(0)).current;
  const [showLoading, setShowLoading] = useState(true);
  const [showApp, setShowApp] = useState(false);
  const [showUpdateScreen, setShowUpdateScreen] = useState(false);
  const [showNotificationScreen, setShowNotificationScreen] = useState(false);
  const loadingStartTime = useRef<number | null>(null);
  const appFadeInTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Notification permission screen state
  const { shouldShowPrompt } = useNotificationPromptStore();

  useEffect(() => {
  }, []);

  const isLoading = state === 'loading';
  const isBlocked = state === 'offline-blocked';
  const isUpdateRequired = state === 'update-required';
  const isUpdateOptional = state === 'update-optional';
  const isReady = state === 'ready-online' || state === 'ready-offline';

  // Handle update screen fade-in
  useEffect(() => {
    if ((isUpdateRequired || isUpdateOptional) && updateInfo && !showUpdateScreen) {
      setShowUpdateScreen(true);
      // Fade out loading screen, fade in update screen
      Animated.parallel([
        Animated.timing(loadingOpacity, {
          toValue: 0,
          duration: FADE_DURATION,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(updateScreenOpacity, {
          toValue: 1,
          duration: FADE_DURATION,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShowLoading(false);
      });
    }
  }, [isUpdateRequired, isUpdateOptional, updateInfo, showUpdateScreen, updateScreenOpacity, loadingOpacity]);

  // Handle update screen fade-out when user skips optional update
  useEffect(() => {
    if (showUpdateScreen && !isUpdateRequired && !isUpdateOptional && isReady) {
      // Update screen should be hidden, fade it out and show app
      Animated.timing(updateScreenOpacity, {
        toValue: 0,
        duration: FADE_DURATION,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start(() => {
        setShowUpdateScreen(false);
        // Reset loading start time for immediate app display after skipping update
        loadingStartTime.current = Date.now();
        // Now show the app immediately (user already waited for update screen)
        setShowApp(true);
        Animated.timing(appOpacity, {
          toValue: 1,
          duration: FADE_DURATION,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }).start();
      });
    }
  }, [showUpdateScreen, isUpdateRequired, isUpdateOptional, isReady, updateScreenOpacity, appOpacity]);

  // Handle loading screen timing
  useEffect(() => {
    if (isLoading && loadingStartTime.current === null) {
      loadingStartTime.current = Date.now();
    }
  }, [isLoading]);

  // Show notification permission screen when app is ready (before main app)
  // This has PRIORITY over app fade-in - check this FIRST
  // OPTIMIZATION: Set showNotificationScreen immediately (no delay) to prevent app fade-in
  useEffect(() => {
    if (isReady && !showUpdateScreen && !showNotificationScreen && !showApp && Platform.OS !== 'web') {
      // Check if we should show the prompt
      const shouldShow = shouldShowPrompt();
      
      if (shouldShow) {
        // Set showNotificationScreen immediately to prevent app fade-in from running
        // This ensures notification screen has priority
        setShowNotificationScreen(true);
        
        // Set notification screen opacity immediately (so it's visible)
        notificationScreenOpacity.setValue(1);
        
        // Hide loading screen immediately (notification screen should be visible)
        setShowLoading(false);
        loadingOpacity.setValue(0);
      }
      // If shouldShow is false, don't show notification screen
      // App fade-in will handle showing the app (in separate useEffect)
    }
  }, [isReady, showUpdateScreen, showNotificationScreen, showApp, shouldShowPrompt, loadingOpacity, notificationScreenOpacity]);

  // Handle optional update skip (when user clicks "Later")
  const handleUpdateLater = async () => {
    await skipUpdate();
  };

  // Handle update action (opens store)
  const handleUpdate = () => {
    // For forced updates, we still open store but don't change state
    // User must update to continue
    // For optional updates, opening store is enough - they can update or not
  };

  // Handle app fade-in when ready (not showing update screen or notification screen)
  // IMPORTANT: This runs AFTER notification screen useEffect - check actual state, not prediction
  useEffect(() => {
    // If notification screen is shown, cancel any pending app fade-in timer
    if (showNotificationScreen) {
      if (appFadeInTimerRef.current) {
        clearTimeout(appFadeInTimerRef.current);
        appFadeInTimerRef.current = null;
      }
      return;
    }
    
    // Only proceed if we're ready and not showing other screens
    if (!isLoading && isReady && !showUpdateScreen && !showNotificationScreen && !showApp && !isUpdateRequired && !isUpdateOptional) {
      // Small delay to let notification screen useEffect run first (if it was going to run)
      // This avoids race condition where both useEffects run simultaneously
      appFadeInTimerRef.current = setTimeout(() => {
        appFadeInTimerRef.current = null;
        
        // Double-check state after delay - notification screen might have been set
        if (!showUpdateScreen && !showNotificationScreen && !showApp && !isUpdateRequired && !isUpdateOptional) {
          // Show app immediately when ready
          setShowApp(true);

          Animated.parallel([
            Animated.timing(loadingOpacity, {
              toValue: 0,
              duration: FADE_DURATION,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(appOpacity, {
              toValue: 1,
              duration: FADE_DURATION,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
          ]).start(() => {
            setShowLoading(false);
          });
        }
      }, 150); // Small delay to let notification screen useEffect run first
      
      return () => {
        if (appFadeInTimerRef.current) {
          clearTimeout(appFadeInTimerRef.current);
          appFadeInTimerRef.current = null;
        }
      };
    }
  }, [isLoading, isReady, showLoading, showApp, showUpdateScreen, showNotificationScreen, isUpdateRequired, isUpdateOptional, loadingOpacity, appOpacity]);

  // Handle notification screen completion
  const handleNotificationScreenComplete = () => {
    // Fade out notification screen, fade in app
    Animated.parallel([
      Animated.timing(notificationScreenOpacity, {
        toValue: 0,
        duration: FADE_DURATION,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(appOpacity, {
        toValue: 1,
        duration: FADE_DURATION,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowNotificationScreen(false);
      setShowApp(true);
    });
  };

  // Update screen - show for forced or optional updates
  if ((isUpdateRequired || isUpdateOptional) && updateInfo && showUpdateScreen) {
    return (
      <View style={styles.appContainer}>
        <Animated.View
          style={[
            styles.updateWrapper,
            {
              opacity: updateScreenOpacity,
            },
          ]}
          pointerEvents="auto"
        >
          <UpdateScreen
            updateInfo={updateInfo}
            onUpdate={handleUpdate}
            onLater={isUpdateOptional ? handleUpdateLater : undefined}
          />
        </Animated.View>
        {/* Keep loading screen behind for smooth transition */}
        {showLoading && (
          <Animated.View
            style={[
              styles.loadingWrapper,
              {
                opacity: loadingOpacity,
              },
            ]}
            pointerEvents="none"
          >
            <LoadingScreen />
          </Animated.View>
        )}
      </View>
    );
  }

  // Offline blocked - show blocking screen only
  if (isBlocked) {
    return <OfflineBlockedScreen />;
  }

  // Notification permission screen - shown before main app on first launch
  if (showNotificationScreen && isReady) {
    return (
      <View style={styles.appContainer}>
        <Animated.View
          style={[
            styles.notificationWrapper,
            {
              opacity: notificationScreenOpacity,
            },
          ]}
          pointerEvents="auto"
        >
          <NotificationPermissionScreen onComplete={handleNotificationScreenComplete} />
        </Animated.View>
        {/* Keep loading screen behind for smooth transition */}
        {showLoading && (
          <Animated.View
            style={[
              styles.loadingWrapper,
              {
                opacity: loadingOpacity,
              },
            ]}
            pointerEvents="none"
          >
            <LoadingScreen />
          </Animated.View>
        )}
      </View>
    );
  }

  // Loading or ready states
  return (
    <View style={styles.appContainer}>
      {showApp && isReady && (
        <Animated.View
          testID="app-navigator"
          style={[
            styles.appWrapper,
            {
              opacity: appOpacity,
            },
          ]}
          pointerEvents={showLoading ? 'none' : 'auto'}
        >
          <ErrorBoundary>
            <AppNavigator />
          </ErrorBoundary>
        </Animated.View>
      )}
      
      {showLoading && (
        <Animated.View
          style={[
            styles.loadingWrapper,
            {
              opacity: loadingOpacity,
            },
          ]}
          pointerEvents="auto"
        >
          <LoadingScreen />
        </Animated.View>
      )}
    </View>
  );
}

export default function App() {
  useEffect(() => {
  }, []);

  return (
    <SafeAreaProvider>
      <BootstrapProvider>
        <AppContentWithFonts />
      </BootstrapProvider>
    </SafeAreaProvider>
  );
}

function AppContentWithFonts() {
  // Try to load fonts using useFonts hook (for runtime loading)
  // Fonts are also embedded via expo-font config plugin, so they should be available immediately
  const [fontsLoaded, fontError] = useFonts({
    'Rajdhani-Regular': Rajdhani_400Regular,
    'Rajdhani-Medium': Rajdhani_500Medium,
    'Rajdhani-SemiBold': Rajdhani_600SemiBold,
    'Rajdhani-Bold': Rajdhani_700Bold,
  });
  const [fontsTimeout, setFontsTimeout] = useState(false);

  useEffect(() => {
    if (fontError) {
      console.error('❌ [AppContentWithFonts] Font loading error:', fontError);
      // If there's an error, proceed anyway - fonts are embedded via config plugin
      setFontsTimeout(true);
    }
    
    // Timeout fallback: pokud se fonty nenačtou do 2 sekund, pokračuj bez nich
    // Fonty jsou embedované pomocí config pluginu, takže by měly být dostupné okamžitě
    const timeout = setTimeout(() => {
      if (!fontsLoaded && !fontError) {
        setFontsTimeout(true);
      }
    }, 2000);
    
    return () => clearTimeout(timeout);
  }, [fontsLoaded, fontError]);

  useEffect(() => {
  }, [fontsLoaded]);

  // CRITICAL: All hooks must be called before any conditional return
  // This ensures hooks are called in the same order every render
  useEffect(() => {
  }, []);

  // Pokračuj, pokud jsou fonty načtené NEBO pokud uplynul timeout NEBO pokud je chyba
  // Fonty jsou embedované pomocí config pluginu, takže by měly být dostupné i bez runtime loading
  if (!fontsLoaded && !fontsTimeout && !fontError) {
    return <LoadingScreen />; // Show loading screen while fonts are loading
  }
  
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    backgroundColor: '#014fa1',
  },
  appWrapper: {
    ...StyleSheet.absoluteFillObject,
  },
  loadingWrapper: {
    ...StyleSheet.absoluteFillObject,
  },
  updateWrapper: {
    ...StyleSheet.absoluteFillObject,
  },
  notificationWrapper: {
    ...StyleSheet.absoluteFillObject,
  },
  container: {
    flex: 1,
    backgroundColor: '#014fa1',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 140,
    height: 140,
  },
});
