/**
 * Expo app configuration with environment variable support
 * This file replaces app.json to enable dynamic configuration
 */

module.exports = ({ config }) => {
  // Get environment from EAS build profile or default to 'development'
  const environment = process.env.EAS_BUILD_PROFILE || process.env.NODE_ENV || 'development';
  const isProduction = environment === 'production';
  const isDevelopment = environment === 'development';

  // API URL - can be overridden by EAS Secrets
  const apiUrl = process.env.API_URL || 'https://www.fczlicin.cz';

  // Firebase configuration files
  // Build script copies files from config/firebase/{env}/ to standard locations
  // Standard locations (used by native builds):
  // - Android: android/app/google-services.json
  // - iOS: ios/FCZlicin/GoogleService-Info.plist
  const androidGoogleServicesFile = './android/app/google-services.json';
  const iosGoogleServicesFile = './ios/FCZlicin/GoogleService-Info.plist';

  return {
    ...config,
    expo: {
      ...config.expo,
      name: 'FC Zličín',
      slug: 'fczlicin-app',
      version: '1.1.0',
      orientation: 'portrait',
      scheme: 'fczlicin',
      icon: './assets/icon.png',
      userInterfaceStyle: 'light',
      splash: {
        image: './assets/fc-zlicin-logo.jpg',
        resizeMode: 'contain',
        backgroundColor: '#014fa1',
      },
      assetBundlePatterns: ['**/*'],
      ios: {
        supportsTablet: true,
        bundleIdentifier: 'cz.fczlicin.app',
        googleServicesFile: iosGoogleServicesFile,
      },
      android: {
        adaptiveIcon: {
          foregroundImage: './assets/adaptive-icon.png',
          backgroundColor: '#ffffff',
        },
        package: 'cz.fczlicin.app',
        googleServicesFile: androidGoogleServicesFile,
      },
      web: {
        favicon: './assets/favicon.png',
      },
      plugins: [
        'expo-asset',
        [
          'expo-font',
          {
            fonts: [
              './assets/fonts/Rajdhani_400Regular.ttf',
              './assets/fonts/Rajdhani_500Medium.ttf',
              './assets/fonts/Rajdhani_600SemiBold.ttf',
              './assets/fonts/Rajdhani_700Bold.ttf',
            ],
          },
        ],
        [
          'expo-build-properties',
          {
            android: {
              // Google Play requirement: targetSdkVersion 35 (Android 15) from August 31, 2025
              compileSdkVersion: 35,
              targetSdkVersion: 35, // KRITICKÉ - požadavek Google Play
              buildToolsVersion: '35.0.0',
              minSdkVersion: 24, // Expo SDK 52 default (was 23 in SDK 51)
            },
            ios: {
              // Force Objective-C AppDelegate for Firebase compatibility
              // Firebase plugin requires Objective-C, not Swift
              useFrameworks: 'static',
              // Expo SDK 52 requires iOS 15.1+ (was 13.4 in SDK 51)
              deploymentTarget: '15.1',
            },
          },
        ],
        [
          'expo-notifications',
          {
            icon: './assets/notification-icon.png',
            color: '#ffffff',
            sounds: [],
          },
        ],
        [
          '@react-native-firebase/app',
          {
            android: {
              googleServicesFile: androidGoogleServicesFile,
            },
            ios: {
              googleServicesFile: iosGoogleServicesFile,
            },
          },
        ],
      ],
      extra: {
        eas: {
          projectId: process.env.EAS_PROJECT_ID || 'your-project-id',
        },
        // Environment variables accessible via Constants.expoConfig.extra
        apiUrl,
        environment,
        isProduction,
        isDevelopment,
      },
    },
  };
};

