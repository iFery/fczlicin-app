/**
 * Expo app configuration with environment variable support
 * This file replaces app.json to enable dynamic configuration
 */

const fs = require('fs');
const path = require('path');

module.exports = ({ config }) => {
  // Get environment with priority:
  // 1. APP_ENV (explicit control for local builds)
  // 2. EAS_BUILD_PROFILE (EAS cloud builds)
  // 3. NODE_ENV (fallback)
  // 4. 'development' (default - only use 'production' if explicitly set)
  //
  // NOTE: For AAB/release builds, ensure APP_ENV=production or NODE_ENV=production
  // is set during the build process (see package.json build:aab script)
  const environment = process.env.APP_ENV || 
                      process.env.EAS_BUILD_PROFILE || 
                      process.env.NODE_ENV || 
                      'development';
  
  const isProduction = environment === 'production';
  const isDevelopment = environment === 'development';
  
  // Automatically copy correct Firebase config files to root directory
  // This ensures correct config is used even when running `npx expo run:android` directly
  // CRITICAL: This runs BEFORE plugins, so Firebase plugin will use the correct config
  const envFolder = isProduction ? 'prod' : 'dev';
  const rootDir = path.resolve(__dirname);
  const configDir = path.join(rootDir, 'config', 'firebase', envFolder);
  const androidTarget = path.join(rootDir, 'google-services.json');
  const iosTarget = path.join(rootDir, 'GoogleService-Info.plist');
  const androidSource = path.join(configDir, 'google-services.json');
  const iosSource = path.join(configDir, 'GoogleService-Info.plist');
  
  // Copy Android config - ALWAYS copy to ensure correct config is used
  if (fs.existsSync(androidSource)) {
    // Check if target exists and has different project_id (to avoid unnecessary copies)
    let shouldCopy = true;
    if (fs.existsSync(androidTarget)) {
      try {
        const targetContent = JSON.parse(fs.readFileSync(androidTarget, 'utf8'));
        const sourceContent = JSON.parse(fs.readFileSync(androidSource, 'utf8'));
        if (targetContent.project_info?.project_id === sourceContent.project_info?.project_id) {
          shouldCopy = false; // Already correct
        }
      } catch (e) {
        // If parsing fails, copy anyway
        shouldCopy = true;
      }
    }
    
    if (shouldCopy) {
      fs.copyFileSync(androidSource, androidTarget);
      console.log(`✅ [app.config.js] Copied ${envFolder} Firebase config: google-services.json`);
    }
    
    // CRITICAL: Also copy to android/app/ if it exists (for when android/ folder already exists)
    // This ensures correct config is used even when prebuild doesn't run
    const androidAppDir = path.join(rootDir, 'android', 'app');
    const androidAppTarget = path.join(androidAppDir, 'google-services.json');
    if (fs.existsSync(androidAppDir)) {
      fs.copyFileSync(androidSource, androidAppTarget);
      console.log(`✅ [app.config.js] Copied ${envFolder} Firebase config to android/app/: google-services.json`);
    }
  }
  
  // Copy iOS config - ALWAYS copy to ensure correct config is used
  if (fs.existsSync(iosSource)) {
    fs.copyFileSync(iosSource, iosTarget);
    console.log(`✅ [app.config.js] Copied ${envFolder} Firebase config: GoogleService-Info.plist`);
    
    // CRITICAL: Also copy to iOS project if it exists (for when ios/ folder already exists)
    // This ensures correct config is used even when prebuild doesn't run
    const iosDir = path.join(rootDir, 'ios');
    if (fs.existsSync(iosDir)) {
      // Try common iOS project locations - copy to ALL found locations
      const possibleIOSTargets = [
        path.join(iosDir, 'FCZlin', 'GoogleService-Info.plist'),
        path.join(iosDir, 'FCZlicin', 'GoogleService-Info.plist'),
        path.join(iosDir, 'GoogleService-Info.plist'),
      ];
      
      // Copy to all found iOS project locations (not just first)
      for (const iosAppTarget of possibleIOSTargets) {
        const iosAppDir = path.dirname(iosAppTarget);
        if (fs.existsSync(iosAppDir)) {
          fs.copyFileSync(iosSource, iosAppTarget);
          console.log(`✅ [app.config.js] Copied ${envFolder} Firebase config to iOS: ${path.relative(rootDir, iosAppTarget)}`);
        }
      }
    }
  }

  // API URL - can be overridden by EAS Secrets
  const apiUrl = process.env.API_URL || 'https://www.fczlicin.cz';

  // Firebase configuration files
  // Build script copies files from config/firebase/{env}/ to root
  // Firebase plugin copies them to correct native folders during prebuild:
  // - Android: ./google-services.json (root) → android/app/google-services.json
  // - iOS: ./GoogleService-Info.plist (root) → ios/{project}/GoogleService-Info.plist
  const androidGoogleServicesFile = './google-services.json';
  const iosGoogleServicesFile = './GoogleService-Info.plist';

  return {
    ...config,
    expo: {
      ...config.expo,
      name: 'FC Zličín',
      slug: 'fczlicin-app',
      version: '1.1.2',
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
        versionCode: 11, // Increment this for each release to Google Play
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
        'expo-notifications',
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
        // Custom plugin to add release signing configuration
        './plugins/withAndroidSigning.js',
        // Custom plugin to add Firebase Crashlytics Gradle plugin
        './plugins/withAndroidCrashlytics.js',
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

