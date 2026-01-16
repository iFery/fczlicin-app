#!/bin/bash

# Script pro zobrazení Android logů
# Použití: ./scripts/view-android-logs.sh

echo "🔍 Zobrazuji Android logy..."
echo "📱 Ujistěte se, že je zařízení připojené (adb devices)"
echo ""
echo "Možnosti:"
echo "1. Všechny logy (včetně verbose)"
echo "2. Pouze chyby (Error a výše)"
echo "3. React Native logy"
echo "4. Crash logy (FATAL)"
echo "5. Všechny logy s filtrem na vaši aplikaci"
echo ""
read -p "Vyberte možnost (1-5): " choice

case $choice in
  1)
    echo "📋 Zobrazuji všechny logy..."
    adb logcat
    ;;
  2)
    echo "❌ Zobrazuji pouze chyby..."
    adb logcat *:E
    ;;
  3)
    echo "⚛️  Zobrazuji React Native logy..."
    adb logcat ReactNative:V ReactNativeJS:V
    ;;
  4)
    echo "💥 Zobrazuji crash logy..."
    adb logcat *:F
    ;;
  5)
    echo "📱 Zobrazuji logy pro aplikaci..."
    # Zjistíme package name z build.gradle
    PACKAGE=$(grep -E "applicationId|namespace" android/app/build.gradle | head -1 | sed 's/.*"\(.*\)".*/\1/')
    echo "Package: $PACKAGE"
    adb logcat | grep -i "$PACKAGE\|ReactNative\|AndroidRuntime"
    ;;
  *)
    echo "Neplatná volba. Zobrazuji všechny logy..."
    adb logcat
    ;;
esac
