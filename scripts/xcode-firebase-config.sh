#!/bin/bash

# Xcode Build Phase Script
# Automatically copies correct Firebase config based on build configuration
# This runs BEFORE compilation, ensuring correct config is used

# Get project root (assuming script is in scripts/ folder)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

# Check if CONFIGURATION is set (Xcode sets this automatically)
CONFIGURATION="${CONFIGURATION:-Debug}"

# Determine environment based on build configuration
if [ "$CONFIGURATION" = "Release" ]; then
  ENV="prod"
  echo "📦 [Xcode] Release build detected - using PRODUCTION Firebase config"
else
  ENV="dev"
  echo "🔧 [Xcode] Debug build detected - using DEVELOPMENT Firebase config"
fi

# Paths
CONFIG_DIR="$PROJECT_ROOT/config/firebase/$ENV"
IOS_DIR="$PROJECT_ROOT/ios"

# Copy iOS Firebase config
IOS_SOURCE="$CONFIG_DIR/GoogleService-Info.plist"
if [ -f "$IOS_SOURCE" ]; then
  # Copy to root (for app.config.js)
  IOS_ROOT_TARGET="$PROJECT_ROOT/GoogleService-Info.plist"
  cp "$IOS_SOURCE" "$IOS_ROOT_TARGET"
  echo "✅ [Xcode] Copied $ENV Firebase config to root: GoogleService-Info.plist"
  
  # Copy to iOS project directories
  if [ -d "$IOS_DIR" ]; then
    POSSIBLE_TARGETS=(
      "$IOS_DIR/FCZlin/GoogleService-Info.plist"
      "$IOS_DIR/FCZlicin/GoogleService-Info.plist"
      "$IOS_DIR/GoogleService-Info.plist"
    )
    
    for TARGET in "${POSSIBLE_TARGETS[@]}"; do
      TARGET_DIR=$(dirname "$TARGET")
      if [ -d "$TARGET_DIR" ]; then
        cp "$IOS_SOURCE" "$TARGET"
        echo "✅ [Xcode] Copied $ENV Firebase config to: ${TARGET#$PROJECT_ROOT/}"
      fi
    done
  fi
else
  echo "⚠️  [Xcode] Warning: Firebase config not found at $IOS_SOURCE"
fi

# Copy Android Firebase config (for consistency, though not used in iOS build)
ANDROID_SOURCE="$CONFIG_DIR/google-services.json"
if [ -f "$ANDROID_SOURCE" ]; then
  ANDROID_ROOT_TARGET="$PROJECT_ROOT/google-services.json"
  cp "$ANDROID_SOURCE" "$ANDROID_ROOT_TARGET"
  echo "✅ [Xcode] Copied $ENV Firebase config to root: google-services.json"
  
  ANDROID_APP_DIR="$PROJECT_ROOT/android/app"
  if [ -d "$ANDROID_APP_DIR" ]; then
    cp "$ANDROID_SOURCE" "$ANDROID_APP_DIR/google-services.json"
    echo "✅ [Xcode] Copied $ENV Firebase config to android/app/: google-services.json"
  fi
fi

# Create marker file for app.config.js to detect environment
# This ensures environment is correctly set even if APP_ENV is not set
if [ "$ENV" = "prod" ]; then
  echo "production" > "$PROJECT_ROOT/.xcode-build-env"
  echo "✅ [Xcode] Created environment marker: .xcode-build-env = production"
else
  echo "development" > "$PROJECT_ROOT/.xcode-build-env"
  echo "✅ [Xcode] Created environment marker: .xcode-build-env = development"
fi

exit 0
