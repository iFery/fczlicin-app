# Podrobný Plán Upgrade na Expo SDK 52

**Datum vytvoření:** Leden 2026  
**Cílová verze:** Expo SDK 52  
**Důvod:** Splnění požadavků Google Play (API 35) a App Store (iOS 18 SDK, Xcode 16)

---

## 📊 Aktuální Stav Projektu

### Hlavní závislosti
- **Expo SDK:** `~51.0.0`
- **React Native:** `0.74.5`
- **React:** `18.2.0`
- **React Native Firebase:** `^20.0.0` (app, crashlytics, messaging, remote-config)
- **Expo Notifications:** `~0.28.0`
- **Expo Build Properties:** `~0.14.8`

### Android Konfigurace
- **compileSdkVersion:** 34 (potřeba 35)
- **targetSdkVersion:** 34 (potřeba 35)
- **minSdkVersion:** 23 (SDK 52 vyžaduje 24, Firebase Auth vyžaduje 23, takže 24 je OK)
- **buildToolsVersion:** 34.0.0 (potřeba 35.0.0)
- **Kotlin:** 1.9.23
- **New Architecture:** `false` (vypnutá)

### iOS Konfigurace
- **Deployment Target:** 13.4 (SDK 52 vyžaduje 15.1+)
- **Podfile:** `ios.useFrameworks: 'static'`
- **Build Tool:** Xcode (potřeba Xcode 16+)
- **Privacy Manifest:** `apple.privacyManifestAggregationEnabled: true`

### Kritické API Použití
✅ **Žádné problémové závislosti:**
- ❌ Neobsahuje `expo-av` (deprecated v SDK 52)
- ❌ Neobsahuje `expo-camera/legacy`
- ❌ Neobsahuje `expo-sqlite/legacy`
- ❌ Neobsahuje `expo-barcode-scanner` (odstraněno v SDK 52)

⚠️ **Potenciální problémy:**
- `expo-notifications` - změny v trigger API (calendar trigger změny)
- Použití `trigger: { date: ... }` a `trigger: { seconds: ... }` - **Kontrolováno: OK**

---

## 🎯 Cílový Stav

### Expo SDK 52 Požadavky
- **Expo SDK:** `~52.0.0`
- **React Native:** `0.76.x` (výchozí pro SDK 52)
- **Android compileSdkVersion:** 35
- **Android targetSdkVersion:** 35 (musí být explicitně nastaveno)
- **Android minSdkVersion:** 24 (automaticky v SDK 52)
- **iOS Deployment Target:** 15.1+
- **Xcode:** 16+ (pro buildy)
- **iOS SDK:** 18+

### React Native Firebase
- **Možnost 1:** Zůstat na v20.0.0 (kompatibilní, ale starší)
- **Možnost 2:** Upgrade na v22.x (doporučeno, ale vyžaduje refaktoring na modular API)

**Doporučení:** Zůstat na v20.0.0 pro první upgrade, pak upgrade na v22 v samostatné fázi.

---

## ⚠️ Breaking Changes v Expo SDK 52

### 1. iOS Deployment Target
- **Změna:** 13.4 → 15.1+
- **Dopad:** Aplikace nebude fungovat na iOS 13.x a 14.x zařízeních
- **Riziko:** 🔴 Vysoké - ztráta podpory starších zařízení
- **Řešení:** Testovat na iOS 15.1+ zařízeních

### 2. Android minSdkVersion
- **Změna:** 23 → 24
- **Dopad:** Aplikace nebude fungovat na Android 6.0 (Marshmallow)
- **Riziko:** 🟡 Střední - většina zařízení má novější Android
- **Řešení:** Ověřit distribuci Android verzí u uživatelů

### 3. New Architecture Default
- **Změna:** Nové projekty mají New Architecture zapnutou, existující ne
- **Dopad:** Pokud bychom zapnuli, mohlo by něco přestat fungovat
- **Riziko:** 🟢 Nízké - zůstáváme na staré architektuře (`newArchEnabled: false`)
- **Řešení:** Necháme vypnuté, zapneme později v samostatné fázi

### 4. Expo Notifications Triggers
- **Změna:** Calendar trigger API změny
- **Dopad:** V kódu používáme `date` a `seconds` triggery, které jsou OK
- **Riziko:** 🟢 Nízké - naše použití není ovlivněno
- **Řešení:** Žádné změny nejsou potřeba

### 5. Android Splash Screen
- **Změna:** Full-screen splash images nejsou podporované
- **Dopad:** Splash screen konfigurace může potřebovat úpravy
- **Riziko:** 🟡 Střední - může vyžadovat změny v designu
- **Řešení:** Otestovat splash screen po upgrade

### 6. React Native Upgrade (0.74.5 → 0.76.x)
- **Změna:** Major upgrade React Native
- **Dopad:** Možné breaking changes v React Native API
- **Riziko:** 🟡 Střední - závisí na použitých React Native komponentách
- **Řešení:** Důkladné testování všech funkcí

---

## 📋 Podrobný Postup Upgrade

### FÁZE 1: Příprava a Backup (30 min)

#### 1.1 Vytvoření git branch
```bash
git checkout -b upgrade/expo-sdk-52
git push -u origin upgrade/expo-sdk-52
```

#### 1.2 Backup aktuálního stavu
```bash
# Vytvoř tag pro případný rollback
git tag backup-before-sdk-52-upgrade
git push origin backup-before-sdk-52-upgrade

# Zkontroluj aktuální buildy
npm run build:android --dry-run 2>&1 | tee build-check-before.log
npm run build:ios --dry-run 2>&1 | tee build-check-ios-before.log
```

#### 1.3 Zkontroluj aktuální funkčnost
- [ ] Zapiš všechny známé problémy/bugy do issue trackeru
- [ ] Otestuj klíčové funkce (notifikace, Firebase, navigace)
- [ ] Udělej screenshoty hlavních obrazovek (pro vizuální srovnání)

---

### FÁZE 2: Upgrade Expo SDK a Core Dependencies (1-2 hodiny)

#### 2.1 Upgrade Expo CLI (pokud je potřeba)
```bash
npm install -g expo-cli@latest
# nebo
npm install -g eas-cli@latest
```

#### 2.2 Upgrade Expo SDK a souvisejících balíčků
```bash
# Použij oficiální Expo upgrade nástroj
npx expo install expo@latest

# Automaticky upgraduje všechny expo-* balíčky na kompatibilní verze
npx expo install --fix

# Nebo ručně upgradovat klíčové balíčky
npx expo install expo@~52.0.0 \
  expo-build-properties@latest \
  expo-constants@latest \
  expo-dev-client@latest \
  expo-font@latest \
  expo-linking@latest \
  expo-notifications@latest \
  expo-status-bar@latest
```

#### 2.3 Aktualizace app.config.js
Uprav `expo-build-properties` plugin pro správné Android/iOS verze:

```javascript
// app.config.js - aktualizovat sekci plugins
plugins: [
  [
    'expo-build-properties',
    {
      android: {
        compileSdkVersion: 35,
        targetSdkVersion: 35, // KRITICKÉ: musí být 35 pro Google Play
        buildToolsVersion: '35.0.0',
        minSdkVersion: 24, // SDK 52 default, Firebase Auth potřebuje 23+, takže OK
      },
      ios: {
        deploymentTarget: '15.1', // SDK 52 vyžaduje 15.1+
      },
    },
  ],
  // ... ostatní pluginy
]
```

#### 2.4 Ověření změn
```bash
# Zkontroluj co se změnilo
git diff package.json package-lock.json

# Spusť expo-doctor pro kontrolu problémů
npx expo-doctor@latest
```

**Očekávané změny:**
- Expo SDK: `~51.0.0` → `~52.0.0`
- React Native: `0.74.5` → `0.76.x`
- Všechny `expo-*` balíčky upgradovány na verze kompatibilní s SDK 52

---

### FÁZE 3: React Native a React Navigation (30 min - 1 hodina)

#### 3.1 Upgrade React Navigation
```bash
npx expo install @react-navigation/native@latest \
  @react-navigation/native-stack@latest \
  @react-navigation/bottom-tabs@latest \
  react-native-screens@latest \
  react-native-safe-area-context@latest
```

#### 3.2 Upgrade dalších React Native závislostí
```bash
npx expo install @react-native-async-storage/async-storage@latest \
  @react-native-community/netinfo@latest
```

#### 3.3 Ověření kompatibility
```bash
# Zkontroluj konflikty
npm ls react-native
npm ls react

# Měly by být kompatibilní verze s Expo SDK 52
```

---

### FÁZE 4: React Native Firebase - Zůstat na v20 (DOPORUČENO) (15 min)

#### 4.1 Ověření kompatibility v20 s SDK 52
React Native Firebase v20.0.0 je **kompatibilní** s Expo SDK 52, ale:
- Vyžaduje `compileSdkVersion 34+` (máme 35 ✅)
- Vyžaduje `minSdkVersion 23+` pro Auth (máme 24 ✅)
- Vyžaduje Xcode 15.2+ pro iOS (budeme mít Xcode 16+ ✅)

#### 4.2 Žádné změny v kódu nejsou potřeba
Pokud zůstaneme na v20, nemusíme měnit žádný Firebase kód.

**Poznámka:** Upgrade na v22 vyžaduje refaktoring na modular API (např. `firebase.auth()` → `getAuth(app)`). Doporučuji to udělat v samostatné fázi po úspěšném upgrade na SDK 52.

---

### FÁZE 5: Aktualizace Native Projektů (1-2 hodiny)

#### 5.1 Android - Aktualizace Gradle souborů
```bash
# Nejdřív vyčisti build cache
cd android
./gradlew clean
cd ..
```

Aktualizuj `android/build.gradle`:
```gradle
buildscript {
    ext {
        buildToolsVersion = findProperty('android.buildToolsVersion') ?: '35.0.0'
        minSdkVersion = Integer.parseInt(findProperty('android.minSdkVersion') ?: '24')
        compileSdkVersion = Integer.parseInt(findProperty('android.compileSdkVersion') ?: '35')
        targetSdkVersion = Integer.parseInt(findProperty('android.targetSdkVersion') ?: '35')
        kotlinVersion = findProperty('android.kotlinVersion') ?: '1.9.24' // Expo SDK 52 default
    }
    // ...
}
```

#### 5.2 iOS - Aktualizace Podfile
Expo SDK 52 automaticky aktualizuje deployment target, ale ověř:

```ruby
# ios/Podfile - mělo by automaticky být 15.1+
platform :ios, podfile_properties['ios.deploymentTarget'] || '15.1'
```

Aktualizuj `ios/Podfile.properties.json` pokud je potřeba:
```json
{
  "expo.jsEngine": "hermes",
  "EX_DEV_CLIENT_NETWORK_INSPECTOR": "true",
  "ios.useFrameworks": "static",
  "ios.deploymentTarget": "15.1",
  "apple.privacyManifestAggregationEnabled": "true"
}
```

#### 5.3 Regenerace native projektů
```bash
# Odstraň staré native soubory (volitelné, ale doporučeno)
rm -rf ios/Pods ios/Podfile.lock
rm -rf android/.gradle android/app/build android/build

# Regeneruj native projekty
npx expo prebuild --clean

# iOS - nainstaluj pods
cd ios
pod install --repo-update
cd ..

# Android - zkontroluj gradle sync
cd android
./gradlew tasks --dry-run
cd ..
```

---

### FÁZE 6: Aktualizace TypeScript a Testovací Dependencies (15 min)

#### 6.1 Upgrade TypeScript a testovacích nástrojů
```bash
npm install --save-dev typescript@latest \
  @types/react@~18.2.0 \
  jest-expo@latest \
  @testing-library/react-native@latest \
  @testing-library/jest-native@latest
```

#### 6.2 Ověření TypeScript konfigurace
Zkontroluj `tsconfig.json` - mělo by být kompatibilní bez změn.

---

### FÁZE 7: Testování a Opravy (2-4 hodiny)

#### 7.1 Lokální vývojové buildy

**Android:**
```bash
# Development build
npm run android

# Otestuj:
# - Spuštění aplikace
# - Firebase funkcionalita (crashlytics, messaging, remote config)
# - Notifikace
# - Navigace
# - Všechny hlavní obrazovky
```

**iOS:**
```bash
# Ujisti se že máš Xcode 16+
xcodebuild -version

# Development build
npm run ios

# Otestuj stejné věci jako na Androidu
```

#### 7.2 Konkrétní testy

**Firebase:**
- [ ] Aplikace se spustí bez chyb
- [ ] Crashlytics funguje (zkus test crash)
- [ ] Push notifikace fungují
- [ ] Remote Config funguje
- [ ] FCM token se získává správně

**Notifikace:**
- [ ] Lokální notifikace fungují
- [ ] Naplánované notifikace fungují (`trigger: { date: ... }`)
- [ ] Push notifikace z Firebase fungují
- [ ] Kliknutí na notifikaci naviguje správně

**Navigace:**
- [ ] Všechny screeny jsou dostupné
- [ ] Deep linking funguje
- [ ] Navigace z notifikací funguje
- [ ] Tab navigace funguje

**Ostatní:**
- [ ] API volání fungují
- [ ] Cachování funguje
- [ ] Offline režim funguje
- [ ] Splash screen vypadá správně

#### 7.3 Testování na reálných zařízeních
```bash
# Build pro TestFlight / Internal Testing
npm run build:android  # EAS build
npm run build:ios      # EAS build
```

**Test na:**
- Android zařízení s Android 15
- Android zařízení s Android 14
- Android zařízení s Android 13 (mělo by fungovat, minSdk je 24, ale testuj)
- iOS zařízení s iOS 15.1
- iOS zařízení s iOS 16
- iOS zařízení s iOS 17
- iOS zařízení s iOS 18

---

### FÁZE 8: Opravy a Finální Úpravy (1-2 hodiny)

#### 8.1 Oprava nalezených problémů
Dokumentuj všechny problémy a jejich řešení.

#### 8.2 Aktualizace dokumentace
- Aktualizuj README pokud je potřeba
- Aktualizuj CHANGELOG
- Zapiš poznámky o breaking changes

#### 8.3 Code Review
```bash
# Zkontroluj změny
git diff main...upgrade/expo-sdk-52

# Commit změny
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

Closes #XXX"
```

---

### FÁZE 9: EAS Build a Ověření (1 hodina)

#### 9.1 Production buildy
```bash
# Android
npm run build:android --profile production

# iOS
npm run build:ios --profile production
```

#### 9.2 Ověření buildů
- [ ] Android APK/AAB má správný `targetSdkVersion: 35`
- [ ] iOS build byl vytvořen s Xcode 16 a iOS 18 SDK
- [ ] Oba buildy fungují na testovacích zařízeních

#### 9.3 Ověření v store konzolích
**Google Play Console:**
- Zkontroluj, že target API level je 35
- Ověř, že nejsou žádné varování

**App Store Connect:**
- Zkontroluj, že build byl vytvořen s Xcode 16+
- Ověř iOS SDK verzi

---

### FÁZE 10: Merge a Release (30 min)

#### 10.1 Merge do main
```bash
git checkout main
git merge upgrade/expo-sdk-52
git push origin main
```

#### 10.2 Tag release
```bash
git tag v1.2.0-sdk-52
git push origin v1.2.0-sdk-52
```

---

## 🚨 Řešení Problémů

### Problém: Build selže s chybou Kotlin verze
**Řešení:**
```gradle
// android/build.gradle
kotlinVersion = '1.9.24' // Expo SDK 52 default
```

### Problém: iOS build selže kvůli deployment target
**Řešení:**
```bash
# Aktualizuj Podfile.properties.json
# Spusť znovu
cd ios && pod install --repo-update && cd ..
```

### Problém: Firebase nefunguje po upgrade
**Řešení:**
```bash
# Vyčisti cache
rm -rf node_modules
npm install

# Regeneruj native projekty
npx expo prebuild --clean
```

### Problém: Notifikace nefungují
**Řešení:**
- Ověř, že `expo-notifications` je na nejnovější verzi
- Zkontroluj trigger syntax (mělo by být OK pro naše použití)
- Testuj na reálném zařízení (emulátory někdy nepodporují notifikace správně)

### Problém: Navigace nefunguje
**Řešení:**
- Ověř, že všechny `@react-navigation/*` balíčky jsou na stejné verzi
- Zkontroluj, že `react-native-screens` a `react-native-safe-area-context` jsou kompatibilní

---

## ✅ Checklist Pro Každou Fázi

### Před začátkem
- [ ] Git branch vytvořen
- [ ] Backup tag vytvořen
- [ ] Aktuální buildy fungují
- [ ] Všechny testy procházejí

### Po každé fázi
- [ ] `npx expo-doctor` nehlásí kritické problémy
- [ ] `npm install` proběhl bez chyb
- [ ] TypeScript kompilace bez chyb (`npx tsc --noEmit`)
- [ ] Jest testy procházejí (`npm test`)

### Po dokončení upgrade
- [ ] Android development build funguje
- [ ] iOS development build funguje
- [ ] Všechny klíčové funkce fungují
- [ ] Production buildy jsou úspěšné
- [ ] Testy na reálných zařízeních prošly
- [ ] Code review dokončen
- [ ] Dokumentace aktualizována

---

## 📊 Odhadované Časy

| Fáze | Čas | Poznámka |
|------|-----|----------|
| Fáze 1: Příprava | 30 min | Backup, git branch |
| Fáze 2: Expo SDK upgrade | 1-2 hod | Hlavní upgrade |
| Fáze 3: React Navigation | 30 min - 1 hod | Drobné upgrady |
| Fáze 4: Firebase | 15 min | Žádné změny, jen ověření |
| Fáze 5: Native projekty | 1-2 hod | Prebuild, pod install |
| Fáze 6: TypeScript/Test | 15 min | Drobné upgrady |
| Fáze 7: Testování | 2-4 hod | Důkladné testování |
| Fáze 8: Opravy | 1-2 hod | Fixy problémů |
| Fáze 9: EAS Build | 1 hod | Production buildy |
| Fáze 10: Release | 30 min | Merge, tag |

**Celkový odhad:** 8-14 hodin

---

## 🔮 Budoucí Upgrady (Po SDK 52)

### React Native Firebase v22
- **Kdy:** Po stabilizaci SDK 52 upgrade (2-4 týdny po)
- **Co:** Migrace na modular API
- **Dopad:** Refaktoring Firebase kódu

### New Architecture
- **Kdy:** Po úspěšném SDK 52 a Firebase v22 (3-6 měsíců)
- **Co:** Zapnutí `newArchEnabled: true`
- **Dopad:** Možné breaking changes v native modulech

### Expo SDK 53
- **Kdy:** Po release Expo SDK 53 (pravděpodobně Q3/Q4 2026)
- **Co:** Další major upgrade

---

## 📝 Poznámky

### Proč zůstat na Firebase v20?
1. **Stabilita:** v20 je prověřená a funguje s SDK 52
2. **Riziko:** Upgrade na v22 vyžaduje refaktoring kódu (modular API)
3. **Čas:** Děláme upgrade ve fázích - nejdřív SDK, pak Firebase
4. **Rollback:** Pokud by byl problém, je snazší se vrátit

### Proč New Architecture zůstává vypnutá?
1. **Stabilita:** Old Architecture je stále podporovaná a stabilní
2. **Kompatibilita:** Ne všechny knihovny ještě plně podporují New Architecture
3. **Čas:** Novou architekturu zapneme v samostatné fázi po úspěšném SDK 52 upgrade

### Testování strategie
1. **Nejdřív lokálně:** Dev buildy na emulátorech
2. **Pak na zařízeních:** TestFlight / Internal Testing
3. **Pak produkce:** Staged rollout (10% → 50% → 100%)

---

**Datum vytvoření:** Leden 2026  
**Autor:** Upgrade plán pro FC Zličín App  
**Status:** Draft - čeká na schválení a provedení
