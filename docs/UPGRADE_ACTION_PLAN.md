# Akční Plán - Upgrade na Expo SDK 52

**Cíl:** Bezpečně upgradovat na Expo SDK 52 a splnit požadavky Google Play (API 35) a App Store (iOS 18 SDK)

---

## 🎯 Přehled - 5 Hlavních Fází

1. **Příprava a Backup** (15 min) → ✅ Test: Git status OK
2. **Expo SDK Upgrade** (30 min) → ✅ Test: `npx expo-doctor`
3. **Konfigurace Build Properties** (15 min) → ✅ Test: Config validace
4. **Native Projekty Regenerace** (30 min) → ✅ Test: Lokální buildy
5. **Testování a Opravy** (2-4 hod) → ✅ Test: Všechny funkce

**Celkový čas:** 3-5 hodin

---

## 📋 FÁZE 1: Příprava a Backup (15 minut)

### Krok 1.1: Vytvoř git branch
```bash
# Ujisti se, že jsi na main a máš čistý working directory
git status
git checkout main
git pull origin main

# Vytvoř novou branch
git checkout -b upgrade/expo-sdk-52
```

### Krok 1.2: Vytvoř backup tag
```bash
# Tag pro případný rollback
git tag backup-before-sdk-52-upgrade
git push origin backup-before-sdk-52-upgrade
```

### Krok 1.3: Ověř aktuální stav
```bash
# Zkontroluj, že aktuální build funguje
npm run android  # nebo npm run ios
# Pokud nefunguje, oprav to PRVNÍ před upgrade!
```

### ✅ TEST PO FÁZI 1:
- [ ] Git branch vytvořen
- [ ] Backup tag vytvořen a pushnut
- [ ] Aktuální aplikace funguje (dev build)
- [ ] Všechny změny commitnuté

**Pokud něco nefunguje → OPRAV TO PRVNÍ!**

---

## 📋 FÁZE 2: Expo SDK Upgrade (30 minut)

### Krok 2.1: Upgrade Expo SDK
```bash
# Nejdřív zkontroluj aktuální verzi
npm list expo

# Upgrade Expo SDK na 52
npx expo install expo@~52.0.0

# Automaticky opraví všechny expo-* balíčky na kompatibilní verze
npx expo install --fix
```

**Co se stane:**
- Expo SDK: `~51.0.0` → `~52.0.0`
- React Native: `0.74.5` → `0.76.x`
- Všechny `expo-*` balíčky se upgradují automaticky

### Krok 2.2: Ověř změny
```bash
# Zkontroluj co se změnilo
git diff package.json

# Mělo by se změnit:
# - expo: ~51.0.0 → ~52.0.0
# - react-native: 0.74.5 → 0.76.x
# - všechny expo-* balíčky na nové verze
```

### Krok 2.3: Spusť expo-doctor
```bash
# Kontrola zdraví projektu
npx expo-doctor@latest
```

**Očekávaný výstup:**
- Může hlásit varování o targetSdkVersion (to opravíme v Fázi 3)
- Může hlásit varování o iOS deployment target (to opravíme v Fázi 3)
- **NEMĚLY by být kritické chyby**

### ✅ TEST PO FÁZI 2:
```bash
# 1. Ověř verze
npm list expo          # Mělo by být ~52.0.0
npm list react-native  # Mělo by být 0.76.x

# 2. Ověř TypeScript
npx tsc --noEmit       # Neměly by být chyby

# 3. Ověř expo-doctor
npx expo-doctor        # Měly by být jen varování, ne chyby
```

- [ ] Expo SDK je 52.x
- [ ] React Native je 0.76.x
- [ ] `npx expo-doctor` nehlásí kritické chyby
- [ ] TypeScript kompilace bez chyb

**Pokud jsou chyby → Zapiš je a pokračuj, opravíme v Fázi 5**

---

## 📋 FÁZE 3: Konfigurace Build Properties (15 minut)

### Krok 3.1: Aktualizuj app.config.js

Otevři `app.config.js` a najdi sekci `expo-build-properties`:

```javascript
// PŘED (aktuální stav):
plugins: [
  [
    'expo-build-properties',
    {
      ios: {
        useFrameworks: 'static',
      },
    },
  ],
  // ...
]

// PO (nový stav):
plugins: [
  [
    'expo-build-properties',
    {
      android: {
        compileSdkVersion: 35,        // NOVÉ - pro Android 15
        targetSdkVersion: 35,          // KRITICKÉ - požadavek Google Play
        buildToolsVersion: '35.0.0',  // NOVÉ
        minSdkVersion: 24,            // NOVÉ - SDK 52 default
      },
      ios: {
        useFrameworks: 'static',
        deploymentTarget: '15.1',     // NOVÉ - SDK 52 vyžaduje 15.1+
      },
    },
  ],
  // ... ostatní pluginy zůstávají stejné
]
```

### Krok 3.2: Ověř konfiguraci
```bash
# Zkontroluj, že config je validní
npx expo config --type public

# Mělo by se zobrazit:
# - android.compileSdkVersion: 35
# - android.targetSdkVersion: 35
# - ios.deploymentTarget: 15.1
```

### ✅ TEST PO FÁZI 3:
- [ ] `app.config.js` obsahuje správné hodnoty
- [ ] `npx expo config` zobrazuje správné hodnoty
- [ ] Žádné syntax chyby v configu

---

## 📋 FÁZE 4: Native Projekty Regenerace (30 minut)

### Krok 4.1: Vyčisti staré buildy (volitelné, ale doporučeno)
```bash
# Android
rm -rf android/.gradle android/app/build android/build

# iOS
rm -rf ios/Pods ios/Podfile.lock ios/build
```

### Krok 4.2: Regeneruj native projekty
```bash
# Expo prebuild - regeneruje android/ a ios/ složky
npx expo prebuild --clean

# Toto může trvat 2-5 minut
```

**Co se stane:**
- Regeneruje `android/` projekt s novými SDK verzemi
- Regeneruje `ios/` projekt s novým deployment targetem
- Aktualizuje všechny native konfigurace

### Krok 4.3: iOS - Nainstaluj Pods
```bash
cd ios
pod install --repo-update
cd ..
```

**Poznámka:** Pokud máš problémy s CocoaPods:
```bash
# Alternativa - čistší instalace
cd ios
pod deintegrate
pod install --repo-update
cd ..
```

### Krok 4.4: Android - Ověř Gradle
```bash
cd android
./gradlew tasks --dry-run
cd ..
```

**Pokud selže:** Zkontroluj, že máš správnou verzi Java (17+)

### ✅ TEST PO FÁZI 4:

**Android:**
```bash
# Zkus build (nemusí se dokončit, jen zkontroluj že začne)
npm run android

# Nebo jen zkontroluj gradle sync
cd android
./gradlew :app:dependencies --dry-run
cd ..
```

- [ ] `npx expo prebuild --clean` proběhl bez chyb
- [ ] iOS `pod install` proběhl bez chyb
- [ ] Android gradle sync funguje (nebo alespoň začne)

**Pokud jsou chyby → Zapiš je, pokračuj k testování buildů**

---

## 📋 FÁZE 5: Testování a Opravy (2-4 hodiny)

### Krok 5.1: Android Development Build

```bash
# Spusť Android build
npm run android

# Nebo pokud používáš EAS:
# npm run build:android --profile development
```

**Co testovat:**
1. **Spuštění aplikace**
   - [ ] Aplikace se spustí bez crash
   - [ ] Splash screen se zobrazí
   - [ ] Hlavní obrazovka se načte

2. **Firebase funkcionalita**
   - [ ] Aplikace se spustí (Firebase init funguje)
   - [ ] Crashlytics funguje (zkus test crash v Debug screenu)
   - [ ] Remote Config funguje (zkontroluj v logu)
   - [ ] Push notifikace - získej FCM token (zkontroluj v logu)

3. **Notifikace**
   - [ ] Lokální notifikace fungují
   - [ ] Push notifikace z Firebase fungují
   - [ ] Kliknutí na notifikaci naviguje správně

4. **Navigace**
   - [ ] Všechny taby fungují
   - [ ] Deep linking funguje
   - [ ] Navigace z notifikací funguje

5. **API a Data**
   - [ ] API volání fungují
   - [ ] Data se načítají
   - [ ] Cachování funguje

### Krok 5.2: iOS Development Build

```bash
# Ujisti se, že máš Xcode 16+
xcodebuild -version

# Spusť iOS build
npm run ios

# Nebo pokud používáš EAS:
# npm run build:ios --profile development
```

**Testuj stejné věci jako na Androidu:**
- [ ] Spuštění aplikace
- [ ] Firebase funkcionalita
- [ ] Notifikace
- [ ] Navigace
- [ ] API a Data

### Krok 5.3: Ověření Verzí v Buildu

**Android:**
```bash
# Po buildu zkontroluj build.gradle
cat android/app/build.gradle | grep -A 5 "defaultConfig"

# Mělo by být:
# minSdkVersion 24
# targetSdkVersion 35
# compileSdkVersion 35
```

**iOS:**
```bash
# Zkontroluj Info.plist nebo projekt nastavení
# Deployment target by měl být 15.1+
```

### Krok 5.4: Oprava Nalezených Problémů

**Pokud něco nefunguje:**

1. **Firebase nefunguje:**
   ```bash
   # Vyčisti a regeneruj
   rm -rf node_modules android/.gradle ios/Pods
   npm install
   npx expo prebuild --clean
   cd ios && pod install && cd ..
   ```

2. **Notifikace nefungují:**
   - Ověř, že máš oprávnění na zařízení
   - Testuj na reálném zařízení (emulátory někdy nefungují správně)

3. **Navigace nefunguje:**
   ```bash
   # Upgrade React Navigation
   npx expo install @react-navigation/native@latest \
     @react-navigation/native-stack@latest \
     @react-navigation/bottom-tabs@latest
   ```

4. **Build selže:**
   - Zkontroluj logy (`npm run android` nebo `npm run ios`)
   - Spusť `npx expo-doctor` pro diagnostiku
   - Zkontroluj, že máš správné verze nástrojů (Xcode 16+, Java 17+)

### ✅ TEST PO FÁZI 5:

**Kompletní checklist:**
- [ ] Android dev build funguje
- [ ] iOS dev build funguje
- [ ] Všechny klíčové funkce fungují (viz seznam výše)
- [ ] Žádné kritické chyby v konzoli
- [ ] Aplikace vypadá stejně jako před upgrade

**Pokud vše funguje → Pokračuj na Fázi 6 (Production Buildy)**

---

## 📋 FÁZE 6: Production Buildy a Ověření (1 hodina)

### Krok 6.1: Production Android Build

```bash
# EAS Build pro Android
npm run build:android --profile production

# Nebo lokálně (pokud máš nastavené):
# cd android && ./gradlew assembleRelease
```

**Po buildu zkontroluj:**
- [ ] Build byl úspěšný
- [ ] APK/AAB má správnou velikost
- [ ] Ověř targetSdkVersion v build.gradle nebo pomocí `aapt`:
  ```bash
  # Pokud máš APK:
  aapt dump badging app-release.apk | grep targetSdkVersion
  # Mělo by být: targetSdkVersion='35'
  ```

### Krok 6.2: Production iOS Build

```bash
# EAS Build pro iOS
npm run build:ios --profile production

# Ujisti se, že build používá Xcode 16+
```

**Po buildu zkontroluj:**
- [ ] Build byl úspěšný
- [ ] IPA má správnou velikost
- [ ] Ověř v Xcode nebo App Store Connect, že build byl vytvořen s Xcode 16+

### Krok 6.3: Test na Reálných Zařízeních

**Doporučené testování:**
- Android zařízení s Android 15 (pokud dostupné)
- Android zařízení s Android 14
- Android zařízení s Android 13 (mělo by fungovat, minSdk je 24)
- iOS zařízení s iOS 15.1 (minimální podporovaná)
- iOS zařízení s iOS 16
- iOS zařízení s iOS 17
- iOS zařízení s iOS 18

### ✅ TEST PO FÁZI 6:
- [ ] Production Android build úspěšný
- [ ] Production iOS build úspěšný
- [ ] Ověřeno targetSdkVersion 35 pro Android
- [ ] Ověřeno Xcode 16+ pro iOS
- [ ] Testováno na reálných zařízeních

---

## 📋 FÁZE 7: Commit a Merge (15 minut)

### Krok 7.1: Commit změn

```bash
# Zkontroluj všechny změny
git status
git diff

# Commit
git add .
git commit -m "chore: upgrade to Expo SDK 52

- Upgrade Expo SDK 51 → 52
- Upgrade React Native 0.74.5 → 0.76.x
- Update Android targetSdkVersion to 35 (Google Play requirement)
- Update iOS deployment target to 15.1
- Update all expo-* packages to SDK 52 compatible versions

BREAKING CHANGES:
- iOS: Minimum supported version is now iOS 15.1 (was 13.4)
- Android: Minimum supported version is now Android 7.0 API 24 (was 6.0 API 23)

Tested:
- Android dev build ✅
- iOS dev build ✅
- Production builds ✅
- All key features working ✅"
```

### Krok 7.2: Push a Code Review

```bash
git push origin upgrade/expo-sdk-52
```

**Vytvoř Pull Request:**
- Zahrni checklist z Fáze 5
- Zapiš všechny známé problémy/omezení
- Požádej o code review

### Krok 7.3: Merge do Main

```bash
# Po schválení PR:
git checkout main
git pull origin main
git merge upgrade/expo-sdk-52
git push origin main

# Vytvoř release tag
git tag v1.2.0-sdk-52
git push origin v1.2.0-sdk-52
```

---

## 🚨 Co Dělat Pokud Někde Selže?

### Rollback Plán

```bash
# 1. Vrať se na backup tag
git checkout backup-before-sdk-52-upgrade

# 2. Obnov node_modules
rm -rf node_modules
npm install

# 3. Regeneruj native projekty
npx expo prebuild --clean
cd ios && pod install && cd ..

# 4. Zkus znovu nebo zapiš problém
```

### Časté Problémy

**Problém:** `expo-doctor` hlásí chyby
- **Řešení:** Zapiš chyby, většina se vyřeší v dalších fázích

**Problém:** Build selže s Kotlin chybou
- **Řešení:** Ověř Kotlin verzi v `android/build.gradle` (mělo by být 1.9.24)

**Problém:** iOS pod install selže
- **Řešení:** 
  ```bash
  cd ios
  pod deintegrate
  pod install --repo-update
  ```

**Problém:** Firebase nefunguje
- **Řešení:** Ověř, že `google-services.json` a `GoogleService-Info.plist` jsou na správných místech

---

## ✅ Finální Checklist

Před merge do main:

- [ ] ✅ Fáze 1: Backup vytvořen
- [ ] ✅ Fáze 2: Expo SDK upgradován na 52
- [ ] ✅ Fáze 3: Build properties nastaveny (targetSdk 35, iOS 15.1)
- [ ] ✅ Fáze 4: Native projekty regenerovány
- [ ] ✅ Fáze 5: Android dev build funguje
- [ ] ✅ Fáze 5: iOS dev build funguje
- [ ] ✅ Fáze 5: Všechny klíčové funkce fungují
- [ ] ✅ Fáze 6: Production buildy úspěšné
- [ ] ✅ Fáze 6: Ověřeno na reálných zařízeních
- [ ] ✅ Fáze 7: Code review dokončen
- [ ] ✅ Dokumentace aktualizována

---

## 📊 Odhad Času

| Fáze | Čas | Status |
|------|-----|--------|
| Fáze 1: Příprava | 15 min | ⬜ |
| Fáze 2: Expo SDK | 30 min | ⬜ |
| Fáze 3: Config | 15 min | ⬜ |
| Fáze 4: Native | 30 min | ⬜ |
| Fáze 5: Testování | 2-4 hod | ⬜ |
| Fáze 6: Production | 1 hod | ⬜ |
| Fáze 7: Merge | 15 min | ⬜ |
| **CELKEM** | **4-6 hod** | ⬜ |

---

**Dobré štěstí! 🚀**
