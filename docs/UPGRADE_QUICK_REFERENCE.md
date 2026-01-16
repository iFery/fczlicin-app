# Rychlý Reference - Upgrade na Expo SDK 52

## 🔢 Klíčové Verze

### Aktuální (SDK 51)
```
Expo SDK: ~51.0.0
React Native: 0.74.5
React: 18.2.0
Android compileSdk: 34
Android targetSdk: 34
Android minSdk: 23
iOS Deployment: 13.4
```

### Cílové (SDK 52)
```
Expo SDK: ~52.0.0
React Native: 0.76.x
React: 18.2.0 (stejné)
Android compileSdk: 35 ⚠️
Android targetSdk: 35 ⚠️ (MUSÍ být explicitně nastaveno)
Android minSdk: 24 (automaticky)
iOS Deployment: 15.1+ ⚠️
```

## 🚀 Rychlý Start - Nejbezpečnější Postup

### 1. Příprava (5 min)
```bash
git checkout -b upgrade/expo-sdk-52
git tag backup-before-sdk-52-upgrade
```

### 2. Upgrade Expo SDK (10 min)
```bash
npx expo install expo@latest
npx expo install --fix
```

### 3. Aktualizace app.config.js (5 min)
```javascript
// V expo-build-properties přidej:
android: {
  compileSdkVersion: 35,
  targetSdkVersion: 35, // KRITICKÉ!
  buildToolsVersion: '35.0.0',
  minSdkVersion: 24,
},
ios: {
  deploymentTarget: '15.1',
}
```

### 4. Regenerace Native Projektů (10 min)
```bash
npx expo prebuild --clean
cd ios && pod install && cd ..
```

### 5. Test (15 min)
```bash
npm run android
npm run ios
```

### 6. Ověření (5 min)
```bash
npx expo-doctor
npx tsc --noEmit
npm test
```

**Celkem:** ~50 minut pro základní upgrade

## ⚠️ Breaking Changes - Quick List

| Změna | Dopad | Riziko |
|-------|-------|--------|
| iOS min: 13.4 → 15.1 | Ztráta podpory iOS 13-14 | 🔴 Vysoké |
| Android min: 23 → 24 | Ztráta podpory Android 6.0 | 🟡 Střední |
| targetSdk: 34 → 35 | **Povinné pro Google Play** | 🟢 Nízké |
| React Native: 0.74 → 0.76 | Možné API změny | 🟡 Střední |

## 🔍 Kompatibilita Závislostí

### ✅ Kompatibilní bez změn
- `@react-native-firebase/*` v20.0.0 ✅
- `expo-notifications` ~0.28.0 → upgrade na SDK 52 verzi ✅
- `@react-navigation/*` → upgrade na nejnovější ✅

### ⚠️ Vyžaduje upgrade
- `expo-build-properties` → upgrade na latest ✅
- Všechny `expo-*` balíčky → automaticky s `expo install` ✅

### ❌ Nepoužíváme (žádný problém)
- `expo-av` ❌ (nemáme)
- `expo-camera/legacy` ❌ (nemáme)
- `expo-sqlite/legacy` ❌ (nemáme)
- `expo-barcode-scanner` ❌ (nemáme)

## 🛠️ Kritické Příkazy

```bash
# Kontrola zdraví projektu
npx expo-doctor

# Kontrola TypeScript
npx tsc --noEmit

# Kontrola verzí
npm ls expo
npm ls react-native
npm ls react

# Čištění a rebuild
rm -rf node_modules android/.gradle ios/Pods ios/Podfile.lock
npm install
npx expo prebuild --clean
```

## 📱 Testovací Checklist

### Android
- [ ] Build úspěšný
- [ ] Aplikace se spustí
- [ ] Firebase funguje
- [ ] Notifikace fungují
- [ ] Navigace funguje
- [ ] API volání fungují

### iOS
- [ ] Build úspěšný (Xcode 16+)
- [ ] Aplikace se spustí
- [ ] Firebase funguje
- [ ] Notifikace fungují
- [ ] Navigace funguje
- [ ] API volání fungují

## 🚨 Nejčastější Problémy a Řešení

### Problém: "targetSdkVersion must be 35"
**Řešení:** Přidej do `app.config.js` v `expo-build-properties`:
```javascript
android: { targetSdkVersion: 35 }
```

### Problém: iOS build selže
**Řešení:**
```bash
cd ios
pod deintegrate
pod install --repo-update
cd ..
```

### Problém: "Cannot find module..."
**Řešení:**
```bash
rm -rf node_modules
npm install
```

### Problém: Firebase nefunguje
**Řešení:**
```bash
npx expo prebuild --clean
# Android:
cd android && ./gradlew clean && cd ..
# iOS:
cd ios && pod install && cd ..
```

## 📊 Verzování Pro Google Play / App Store

### Google Play - Target API 35
**Deadline:** 31. srpna 2025  
**Kontrola:**
```bash
# Po buildu zkontroluj v AndroidManifest.xml nebo build.gradle
targetSdkVersion = 35
```

### App Store - iOS 18 SDK / Xcode 16
**Deadline:** 24. dubna 2025 (již platné!)  
**Kontrola:**
```bash
xcodebuild -version
# Mělo by být Xcode 16.x
```

## 🔄 Rollback Plán

Pokud upgrade selže:

```bash
# 1. Vrať se na main branch
git checkout main

# 2. Nebo použij backup tag
git checkout backup-before-sdk-52-upgrade

# 3. Obnov node_modules
rm -rf node_modules
npm install

# 4. Regeneruj native projekty
npx expo prebuild --clean
```

## 📞 Pomocné Nástroje

- `npx expo-doctor` - kontrola zdraví projektu
- `npx expo install --fix` - automatický fix závislostí
- `npm ls` - kontrola verzí závislostí
- Expo Discord - komunita pro pomoc

---

**Vytvořeno:** Leden 2026  
**Poslední aktualizace:** Leden 2026
