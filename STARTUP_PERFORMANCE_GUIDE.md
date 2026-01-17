# Startup Performance Instrumentation Guide

## Overview

This app has been instrumented with comprehensive startup performance tracking to measure the complete startup lifecycle from process start to app interactivity.

## What is Measured

The instrumentation tracks timing at all critical startup checkpoints:

1. **Boot Phase** - Entry point execution
2. **Initialization Phase** - Firebase setup, component mounting
3. **Bootstrap Phase** - Cache loading, Remote Config, data preloading
4. **Render Phase** - Font loading, provider mounting, navigation setup
5. **Screen Phase** - First screen render and meaningful content display
6. **Interactive Phase** - App becomes fully interactive

## Checkpoint Tags

All checkpoints are logged with tags for easy filtering:

- `[BOOT]` - App entry point
- `[INIT]` - Initialization steps
- `[FIREBASE]` - Firebase initialization
- `[BOOTSTRAP]` - Bootstrap sequence
- `[CACHE]` - Cache operations
- `[FONT]` - Font loading
- `[PROVIDER]` - Provider mounting
- `[NAVIGATION]` - Navigation setup
- `[RENDER]` - Rendering checkpoints
- `[SCREEN]` - Screen rendering
- `[READY]` - App ready/interactive states

## Log Format

Each checkpoint is logged in this format:
```
🚀 [STARTUP] [TAG] TIMESTAMPms (+DELTAms) - Description
```

Example:
```
🚀 [STARTUP] [BOOT] 0.00ms (0.00ms) - App entry point - first JS execution
🚀 [STARTUP] [INIT] 42.15ms (+42.15ms) - App component mounted - React root rendered
🚀 [STARTUP] [BOOTSTRAP] 310.25ms (+268.10ms) - Cache check complete - hasCache: true
```

Where:
- **TIMESTAMP**: Absolute time from app entry (in milliseconds)
- **DELTA**: Time elapsed since previous checkpoint
- **Description**: What happened at this checkpoint

## How to Collect Startup Logs

### Android (Logcat)

1. **Cold start the app** (force stop first):
   ```bash
   # Force stop the app
   adb shell am force-stop cz.fczlicin.app
   
   # Start the app
   adb shell am start -n cz.fczlicin.app/.MainActivity
   ```

2. **Filter startup logs**:
   ```bash
   adb logcat | grep "STARTUP"
   ```

3. **Or capture to file**:
   ```bash
   adb logcat | grep "STARTUP" > startup_log.txt
   ```

### iOS (Xcode Console)

1. **Cold start the app**:
   - Stop the app in Xcode
   - Build and run (Cmd+R) or launch from device

2. **View logs**:
   - Open Xcode Console (View → Debug Area → Activate Console)
   - Filter by "STARTUP" in the search box

3. **Or capture to file**:
   - Run in Terminal: `xcrun simctl spawn booted log stream --level=debug --predicate 'processImagePath contains "fczlicin"' | grep STARTUP`

### React Native Debugger / Metro

If using Metro bundler or React Native Debugger:

```bash
# Metro console will show all logs
npm start

# Or in React Native Debugger, filter console by "STARTUP"
```

### Expo Dev Tools

```bash
# Start Expo with logs
npx expo start

# Logs will appear in the terminal, filter by "STARTUP"
```

## Complete Checkpoint List

The instrumentation tracks these checkpoints in order:

### Boot Phase
- `[BOOT]` - App entry point - first JS execution
- `[FIREBASE_INIT_START]` - Starting Firebase initialization check
- `[FIREBASE_INIT_DONE]` - Firebase initialized (auto-init from google-services.json)
- `[MESSAGING_SETUP_START]` - Starting background messaging setup
- `[MESSAGING_SETUP_DONE]` - Background messaging handler registered
- `[REGISTER_ROOT_START]` - Registering root component with React Native
- `[REGISTER_ROOT_DONE]` - Root component registered

### Initialization Phase
- `[INIT_APP_MOUNT]` - App component mounted - React root rendered
- `[FONT_LOAD_START]` - Starting font loading (expo-font)
- `[FONT_LOAD_DONE]` - Fonts loaded successfully
- `[PROVIDER_THEME_MOUNT]` - ThemeProvider mounting
- `[PROVIDER_TIMELINE_MOUNT]` - TimelineProvider mounting
- `[APP_CONTENT_MOUNT]` - AppContent component mounted

### Bootstrap Phase
- `[BOOTSTRAP_START]` - BootstrapProvider starting bootstrap sequence
- `[BOOTSTRAP_FIREBASE_INIT_START]` - Ensuring Firebase is initialized
- `[BOOTSTRAP_FIREBASE_INIT_DONE]` - Firebase ensured (auto-init complete)
- `[BOOTSTRAP_FIREBASE_SERVICES_DONE]` - Firebase services initialized
- `[BOOTSTRAP_CACHE_VERSION_CHECK_START]` - Checking app version for cache upgrade
- `[BOOTSTRAP_CACHE_VERSION_CHECK_DONE]` - Cache version check complete
- `[BOOTSTRAP_NETINFO_START]` - Checking network connectivity
- `[BOOTSTRAP_NETINFO_DONE]` - Network check complete
- `[BOOTSTRAP_REMOTE_CONFIG_START]` - Initializing Remote Config
- `[BOOTSTRAP_REMOTE_CONFIG_DONE]` - Remote Config initialized
- `[BOOTSTRAP_UPDATE_CHECK_START]` - Checking for app updates
- `[BOOTSTRAP_UPDATE_CHECK_DONE]` - Update check complete
- `[BOOTSTRAP_NOTIFICATIONS_START]` - Setting up notifications
- `[BOOTSTRAP_NOTIFICATIONS_DONE]` - Notification listeners setup complete
- `[BOOTSTRAP_CACHE_CHECK_START]` - Checking for cached data
- `[BOOTSTRAP_CACHE_CHECK_DONE]` - Cache check complete
- `[BOOTSTRAP_CACHE_LOAD_START]` - Loading timeline data from cache
- `[BOOTSTRAP_CACHE_LOAD_DONE]` - Timeline data loaded from cache
- `[BOOTSTRAP_PRELOAD_START]` - Starting data preload (online)
- `[BOOTSTRAP_PRELOAD_DONE]` - Data preload complete
- `[BOOTSTRAP_READY_ONLINE]` - Bootstrap complete - ready-online
- `[BOOTSTRAP_READY_OFFLINE]` - Bootstrap complete - ready-offline

### Render Phase
- `[APP_FADE_IN_START]` - Starting app fade-in animation
- `[APP_FADE_IN_DONE]` - App fade-in animation complete - app visible
- `[NAVIGATION_MOUNT]` - AppNavigator component mounted
- `[NAVIGATION_READY]` - NavigationContainer onReady - navigation fully initialized
- `[NAVIGATION_QUEUE_READY]` - Navigation queue ready

### Screen Phase
- `[SCREEN_HOME_MOUNT]` - HomeScreen component mounted - first screen rendered
- `[SCREEN_HOME_CONTENT]` - HomeScreen meaningful content rendered (data visible)

### Interactive Phase
- `[READY_INTERACTIVE]` - App fully interactive - user can interact with UI

## Analysis Steps

### Step 1: Cold Start the App

**Important**: Always do a **cold start** (app was force-stopped) to get accurate startup measurements. Warm starts are faster and not representative.

1. Force stop the app completely
2. Clear app data if possible (to simulate fresh install)
3. Launch the app
4. Wait until the app is fully loaded and interactive
5. Collect the logs

### Step 2: Extract the Timeline

Filter logs to get only startup checkpoints:

```bash
# Android
adb logcat | grep "STARTUP" > startup_log.txt

# iOS (in Xcode console, copy all STARTUP lines)
# Or use Terminal command above
```

### Step 3: Identify Bottlenecks

Look for:
- **Large deltas** (+XXXms) - indicates slow operations
- **Sequential blocking operations** - operations that happen one after another instead of in parallel
- **Network calls during startup** - API calls that block rendering
- **Heavy cache operations** - large cache loads or JSON parsing
- **Long font loading times** - fonts that block rendering

### Step 4: Calculate Phase Timings

Use the checkpoint tags to group by phase:

**Boot Phase**: From `[BOOT]` to `[REGISTER_ROOT_DONE]`
**Init Phase**: From `[INIT_APP_MOUNT]` to `[APP_CONTENT_MOUNT]`
**Bootstrap Phase**: From `[BOOTSTRAP_START]` to `[BOOTSTRAP_READY_*]`
**Render Phase**: From `[APP_FADE_IN_START]` to `[NAVIGATION_READY]`
**Screen Phase**: From `[SCREEN_HOME_MOUNT]` to `[SCREEN_HOME_CONTENT]`
**Total Time**: From `[BOOT]` to `[READY_INTERACTIVE]`

### Step 5: Identify Heavy Operations

Flags for heavy operations:
- `[BOOTSTRAP_PRELOAD_*]` - Network calls and data fetching
- `[BOOTSTRAP_CACHE_*]` - Disk I/O and JSON parsing
- `[BOOTSTRAP_REMOTE_CONFIG_*]` - Remote Config fetch (network)
- `[BOOTSTRAP_UPDATE_CHECK_*]` - Update check (network)
- `[FONT_LOAD_*]` - Font file loading

## Example Analysis

Here's an example of what a startup log might look like:

```
🚀 [STARTUP] [BOOT] 0.00ms (0.00ms) - App entry point - first JS execution
🚀 [STARTUP] [FIREBASE_INIT_START] 1.25ms (+1.25ms) - Starting Firebase initialization check
🚀 [STARTUP] [FIREBASE_INIT_DONE] 5.50ms (+4.25ms) - Firebase initialized
🚀 [STARTUP] [MESSAGING_SETUP_START] 6.10ms (+0.60ms) - Starting background messaging setup
🚀 [STARTUP] [MESSAGING_SETUP_DONE] 8.75ms (+2.65ms) - Background messaging handler registered
🚀 [STARTUP] [REGISTER_ROOT_START] 9.20ms (+0.45ms) - Registering root component
🚀 [STARTUP] [REGISTER_ROOT_DONE] 10.50ms (+1.30ms) - Root component registered
🚀 [STARTUP] [INIT_APP_MOUNT] 42.15ms (+31.65ms) - App component mounted
🚀 [STARTUP] [FONT_LOAD_START] 43.80ms (+1.65ms) - Starting font loading
🚀 [STARTUP] [FONT_LOAD_DONE] 45.20ms (+1.40ms) - Fonts loaded successfully
🚀 [STARTUP] [PROVIDER_THEME_MOUNT] 46.50ms (+1.30ms) - ThemeProvider mounting
🚀 [STARTUP] [PROVIDER_TIMELINE_MOUNT] 47.20ms (+0.70ms) - TimelineProvider mounting
🚀 [STARTUP] [APP_CONTENT_MOUNT] 48.10ms (+0.90ms) - AppContent component mounted
🚀 [STARTUP] [BOOTSTRAP_START] 50.25ms (+2.15ms) - BootstrapProvider starting bootstrap
🚀 [STARTUP] [BOOTSTRAP_FIREBASE_INIT_START] 51.00ms (+0.75ms) - Ensuring Firebase initialized
🚀 [STARTUP] [BOOTSTRAP_FIREBASE_INIT_DONE] 52.30ms (+1.30ms) - Firebase ensured
🚀 [STARTUP] [BOOTSTRAP_CACHE_VERSION_CHECK_START] 53.10ms (+0.80ms) - Checking cache version
🚀 [STARTUP] [BOOTSTRAP_CACHE_VERSION_CHECK_DONE] 54.50ms (+1.40ms) - Cache version check complete
🚀 [STARTUP] [BOOTSTRAP_NETINFO_START] 55.20ms (+0.70ms) - Checking network
🚀 [STARTUP] [BOOTSTRAP_NETINFO_DONE] 210.50ms (+155.30ms) - Network check complete - internet: true
🚀 [STARTUP] [BOOTSTRAP_REMOTE_CONFIG_START] 211.20ms (+0.70ms) - Initializing Remote Config
🚀 [STARTUP] [BOOTSTRAP_REMOTE_CONFIG_DONE] 580.75ms (+369.55ms) - Remote Config initialized
🚀 [STARTUP] [BOOTSTRAP_UPDATE_CHECK_START] 581.50ms (+0.75ms) - Checking for updates
🚀 [STARTUP] [BOOTSTRAP_UPDATE_CHECK_DONE] 620.30ms (+38.80ms) - Update check complete
🚀 [STARTUP] [BOOTSTRAP_NOTIFICATIONS_START] 621.00ms (+0.70ms) - Setting up notifications
🚀 [STARTUP] [BOOTSTRAP_NOTIFICATIONS_DONE] 625.50ms (+4.50ms) - Notification listeners setup
🚀 [STARTUP] [BOOTSTRAP_CACHE_CHECK_START] 626.20ms (+0.70ms) - Checking for cached data
🚀 [STARTUP] [BOOTSTRAP_CACHE_CHECK_DONE] 680.25ms (+54.05ms) - Cache check complete - hasCache: true
🚀 [STARTUP] [BOOTSTRAP_CACHE_LOAD_START] 681.00ms (+0.75ms) - Loading timeline from cache
🚀 [STARTUP] [BOOTSTRAP_CACHE_LOAD_DONE] 690.50ms (+9.50ms) - Timeline data loaded from cache
🚀 [STARTUP] [BOOTSTRAP_PRELOAD_START] 691.20ms (+0.70ms) - Starting data preload
🚀 [STARTUP] [BOOTSTRAP_PRELOAD_DONE] 1250.75ms (+559.55ms) - Data preload complete
🚀 [STARTUP] [BOOTSTRAP_READY_ONLINE] 1251.50ms (+0.75ms) - Bootstrap complete - ready-online
🚀 [STARTUP] [APP_FADE_IN_START] 1280.00ms (+28.50ms) - Starting app fade-in animation
🚀 [STARTUP] [APP_FADE_IN_DONE] 1580.00ms (+300.00ms) - App fade-in animation complete
🚀 [STARTUP] [NAVIGATION_MOUNT] 1585.50ms (+5.50ms) - AppNavigator component mounted
🚀 [STARTUP] [NAVIGATION_READY] 1590.25ms (+4.75ms) - NavigationContainer onReady
🚀 [STARTUP] [SCREEN_HOME_MOUNT] 1600.50ms (+10.25ms) - HomeScreen component mounted
🚀 [STARTUP] [SCREEN_HOME_CONTENT] 1650.75ms (+50.25ms) - HomeScreen meaningful content rendered
🚀 [STARTUP] [READY_INTERACTIVE] 1680.50ms (+29.75ms) - App fully interactive
```

**Analysis**:
- Total startup time: **1680.50ms** (~1.68 seconds)
- Biggest bottleneck: **BOOTSTRAP_PRELOAD** (+559.55ms) - data fetching
- Second bottleneck: **BOOTSTRAP_REMOTE_CONFIG** (+369.55ms) - Remote Config fetch
- Third bottleneck: **BOOTSTRAP_NETINFO** (+155.30ms) - network check
- Cache operations are fast: cache load only took 9.50ms

**Optimization opportunities**:
1. Make data preload parallel or defer non-critical data
2. Consider caching Remote Config or fetching it in background
3. Network check could potentially be optimized (155ms is high)

## Code Reference

The instrumentation module is located at:
- `src/utils/startupPerformance.ts` - Performance tracking utility

Instrumentation is added in:
- `index.js` - Entry point
- `App.tsx` - App component and providers
- `src/providers/BootstrapProvider.tsx` - Bootstrap sequence
- `src/navigation/AppNavigator.tsx` - Navigation setup
- `src/screens/HomeScreen.tsx` - First screen render

## Next Steps

After collecting logs:

1. **Share the complete log** - Paste the full startup log for analysis
2. **Identify bottlenecks** - Look for operations with large deltas
3. **Plan optimizations** - Determine what can be deferred, parallelized, or optimized
4. **Measure improvements** - Run before/after comparisons after optimizations

## Notes

- All timings use `performance.now()` when available (high-resolution)
- Logs are prefixed with `🚀 [STARTUP]` for easy filtering
- The tracker is a singleton - all checkpoints share the same start time
- Instrumentation is designed to have minimal performance impact
- The tracker can be disabled if needed (see `startupPerformance.ts`)
