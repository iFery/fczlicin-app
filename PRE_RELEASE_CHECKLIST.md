# 📋 Pre-Release Checklist - Google Play & App Store

**Datum kontroly:** 17. ledna 2026  
**Verze aplikace:** 1.1.0

---

## ✅ CO JE PŘIPRAVENÉ (OK)

### 🎯 Základní konfigurace
- ✅ **Expo SDK 52** - aktuální verze
- ✅ **Bundle Identifier / Package Name**: `cz.fczlicin.app` (stejný pro Android i iOS)
- ✅ **App Name**: FC Zličín
- ✅ **App Icons**: Přítomné (1024x1024 PNG)
  - `assets/icon.png` ✓
  - `assets/adaptive-icon.png` ✓
- ✅ **Splash Screen**: Konfigurován
- ✅ **Target SDK Android**: Nastaven na 35 v `app.config.js`
- ✅ **Min SDK Android**: 24 (Expo SDK 52 požadavek)
- ✅ **iOS Deployment Target**: 15.1 (Expo SDK 52 požadavek)
- ✅ **Firebase**: Konfigurován (dev i prod verze)
- ✅ **EAS Build**: Konfigurován v `eas.json` (development, preview, production profily)

### 📱 Versions
- ✅ **Android versionName**: 1.1.0
- ✅ **Android versionCode**: 1
- ✅ **iOS CFBundleShortVersionString**: 1.1.0
- ✅ **iOS CFBundleVersion**: 1

---

## 🔴 KRITICKÉ - MUSÍ SE OPRAVIT PŘED RELEASE

### 1. ⚠️ EAS Project ID
**Status:** ❌ **NENÍ NASTAVENO**

**Problém:**
- `app.json`: `"projectId": "your-project-id"` (placeholder)
- `app.config.js`: `process.env.EAS_PROJECT_ID || 'your-project-id'` (fallback na placeholder)

**Co udělat:**
```bash
# Přihlásit se do EAS a vytvořit/get project ID
eas login
eas project:init
# Nebo nastavit EAS_PROJECT_ID jako secret
eas secret:create --name EAS_PROJECT_ID --value "vase-skutecne-project-id"
```

**Soubory k opravě:**
- `app.json` (odstranit, pokud se používá `app.config.js`)
- `app.config.js` - zajistit, že `EAS_PROJECT_ID` je nastaven

---

### 2. 🔐 Android Production Signing
**Status:** ❌ **POUŽÍVÁ SE DEBUG KEYSTORE PRO RELEASE**

**Problém:**
```gradle
// android/app/build.gradle - řádek 112
release {
    signingConfig signingConfigs.debug  // ❌ POUŽÍVÁ DEBUG!
}
```

**Co udělat:**
1. **Vytvořit production keystore:**
```bash
cd android/app
keytool -genkeypair -v -storetype PKCS12 -keystore release.keystore -alias release-key -keyalg RSA -keysize 2048 -validity 10000
```

2. **Nastavit signing v `android/app/build.gradle`:**
```gradle
signingConfigs {
    debug {
        // ... existing debug config
    }
    release {
        if (project.hasProperty('MYAPP_RELEASE_STORE_FILE')) {
            storeFile file(MYAPP_RELEASE_STORE_FILE)
            storePassword MYAPP_RELEASE_STORE_PASSWORD
            keyAlias MYAPP_RELEASE_KEY_ALIAS
            keyPassword MYAPP_RELEASE_KEY_PASSWORD
        }
    }
}
buildTypes {
    release {
        signingConfig signingConfigs.release  // ✅ Použít release keystore
        // ... rest of config
    }
}
```

3. **Přidat do `android/gradle.properties` (NE commitujte!):**
```properties
MYAPP_RELEASE_STORE_FILE=release.keystore
MYAPP_RELEASE_STORE_PASSWORD=vas-heslo
MYAPP_RELEASE_KEY_ALIAS=release-key
MYAPP_RELEASE_KEY_PASSWORD=vas-heslo
```

4. **Přidat `release.keystore` a `gradle.properties` do `.gitignore`**

**⚠️ DŮLEŽITÉ:** Zálohovat keystore! Bez něj nelze aktualizovat aplikaci!

---

### 3. 🍎 iOS Info.plist - LSMinimumSystemVersion
**Status:** ❌ **NESOULAD S DEPLOYMENT TARGET**

**Problém:**
- `ios/FCZlin/Info.plist`: `LSMinimumSystemVersion = "12.0"` (řádek 44)
- `app.config.js`: `deploymentTarget = "15.1"`
- `ios/Podfile`: `platform :ios, '15.1'`

**Co udělat:**
```xml
<!-- ios/FCZlin/Info.plist -->
<key>LSMinimumSystemVersion</key>
<string>15.1</string>  <!-- Změnit z 12.0 na 15.1 -->
```

---

### 4. 🤖 Android Target SDK - Nesoulad mezi soubory
**Status:** ⚠️ **ROOT BUILD.GRADLE MÁ 34, ALE APP.CONFIG.JS MÁ 35**

**Problém:**
- `android/build.gradle` (řádek 8): `targetSdkVersion = 34`
- `app.config.js` (řádek 75): `targetSdkVersion: 35`
- `android/app/build.gradle` (řádek 94-95): nepoužívá explicitně, ale dědí z root

**Co udělat:**
```gradle
// android/build.gradle - řádek 8
targetSdkVersion = Integer.parseInt(findProperty('android.targetSdkVersion') ?: '35')  // Změnit z 34 na 35
```

**Alternativa:** Nastavit přes `app.config.js` (má přednost), ale pro konzistenci opravit i root.

---

### 5. 📝 Android Permissions - Potenciálně zbytečné
**Status:** ⚠️ **MOŽNÁ NEJSOU POTŘEBNÉ**

**Problém:**
`android/app/src/main/AndroidManifest.xml` obsahuje:
```xml
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"/>
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE"/>
```

**Pro Android 10+ (API 29+):** Tyto permission jsou většinou zbytečné kvůli Scoped Storage.

**Co udělat:**
- Zkontrolovat, zda aplikace skutečně potřebuje přístup k úložišti
- Pokud ne, odstranit tyto permission (může být problém s Google Play review)

---

### 6. 📄 Version Consistency - app.json
**Status:** ⚠️ **NESOULAD VERZÍ**

**Problém:**
- `app.json`: `version: "1.0.0"`
- `app.config.js`: `version: "1.1.0"` ← **toto má přednost**

**Co udělat:**
- Pokud se používá `app.config.js`, může se `app.json` ignorovat nebo odstranit
- Pokud se používá oba, synchronizovat verze

**Doporučení:** `app.config.js` je pokročilejší, použít jen ten.

---

## 🟡 DŮLEŽITÉ - DOPORUČUJE SE OPRAVIT

### 7. 📋 Privacy Policy & Terms of Service
**Status:** ❓ **NENÍ JASNÉ, ZDA EXISTUJE**

**Co je potřeba:**
- ✅ Privacy Policy (povinné pro Google Play i App Store)
- ⚠️ Terms of Service (doporučeno)
- ✅ URL na web, kde jsou dostupné

**Kde publikovat:**
- Google Play Console → Store settings → App content → Privacy policy
- App Store Connect → App Information → Privacy Policy URL

**⚠️ Poznámka:** Pokud aplikace sbírá jakákoliv data (i analytiku), Privacy Policy je **povinná**.

---

### 8. 📱 App Store Assets (Screenshots, Description)
**Status:** ❓ **NENÍ JASNÉ**

**Co je potřeba pro Google Play:**
- [ ] Feature graphic (1024 x 500 PNG)
- [ ] Screenshoty minimálně pro telefon (min 2, max 8)
  - Minimální rozlišení: 320px (min) x 320px - 3840px x 3840px (max)
- [ ] Screenshoty pro tablet (volitelné, ale doporučeno)
- [ ] Krátký popis (max 80 znaků)
- [ ] Dlouhý popis (max 4000 znaků)
- [ ] Kategorie aplikace

**Co je potřeba pro App Store:**
- [ ] Screenshoty pro iPhone (6.7", 6.5", 5.5")
- [ ] Screenshoty pro iPad (volitelné, pokud `supportsTablet: true`)
- [ ] App Preview video (volitelné)
- [ ] Description (max 4000 znaků)
- [ ] Keywords (max 100 znaků)
- [ ] Support URL
- [ ] Marketing URL (volitelné)

---

### 9. 🔒 iOS Privacy Manifest
**Status:** ❓ **NEJASNÉ, ZDA EXISTUJE**

**Co je potřeba:**
- Soubor `PrivacyInfo.xcprivacy` v iOS projektu
- Deklarace Required Reason APIs

**Kontrola:**
```bash
find ios/ -name "PrivacyInfo.xcprivacy"
```

**Pokud neexistuje:**
- Vytvořit podle [Apple dokumentace](https://developer.apple.com/documentation/bundleresources/privacy_manifest_files)
- Deklarovat všechny Required Reason APIs, které aplikace používá

---

### 10. 🛡️ Google Play Data Safety Form
**Status:** ❓ **NENÍ JASNÉ, ZDA JE VYPLNĚN**

**Co je potřeba:**
1. Přihlásit se do Google Play Console
2. Vyplnit Data Safety formulář:
   - Typy sbíraných dat
   - Účel použití dat
   - Zda se data sdílejí s třetími stranami
   - Bezpečnostní opatření (šifrování)

**⚠️ Poznámka:** Aplikace používá Firebase (Analytics, Crashlytics, Messaging, Remote Config), takže sbírá data!

---

### 11. 🧪 Testing & QA
**Status:** ⚠️ **PŘED RELEASE DOPORUČUJE SE OVĚŘIT**

**Co testovat:**
- [ ] Build production APK/AAB pro Android
- [ ] Build production IPA pro iOS
- [ ] Test na fyzických zařízeních (min Android 7.0, iOS 15.1)
- [ ] Test na nejnovějších verzích OS (Android 15, iOS 18)
- [ ] Test všech hlavních funkcí:
  - [ ] Zobrazení zápasů
  - [ ] Zobrazení tabulky
  - [ ] Notifikace
  - [ ] Offline režim
  - [ ] Deep linking
- [ ] Performance test (startup time, scroll performance)

---

### 12. 🏷️ Version Code Management
**Status:** ⚠️ **MUSÍ SE ZVYŠOVAT PŘI KAŽDÉ AKTUALIZACI**

**Současný stav:**
- Android `versionCode`: 1
- iOS `CFBundleVersion`: 1

**Co vědět:**
- **Android:** `versionCode` se musí zvyšovat při každé aktualizaci (nemůže být stejné nebo nižší)
- **iOS:** `CFBundleVersion` se musí zvyšovat při každé aktualizaci
- `versionName` / `CFBundleShortVersionString` mohou zůstat stejné (např. 1.1.0 → 1.1.1)

**⚠️ Poznámka:** Pro první release je `versionCode: 1` OK, ale při dalších aktualizacích vždy zvyšovat.

---

## 🟢 VOLITELNÉ - NICE TO HAVE

### 13. 📦 Android App Bundle (AAB)
**Status:** ✅ **EAS BUILD TO PODPORUJE**

**Co vědět:**
- Google Play preferuje AAB místo APK
- EAS Build automaticky vytváří AAB pro Google Play
- Pro internal testing může být APK OK

---

### 14. 🔔 App Store Connect Metadata
**Status:** ❓ **NENÍ JASNÉ**

**Co je potřeba:**
- App Store Connect účet (Apple Developer Program - $99/rok)
- Vytvoření App Record v App Store Connect
- Vyplnění všech povinných metadat

---

### 15. 🎨 App Icon Variations
**Status:** ✅ **ZÁKLADNÍ EXISTUJÍ**

**Doporučení:**
- Ověřit, že ikony vypadají dobře na různých rozlišeních
- Android adaptive icon: Ověřit různé shape masky (circle, square, rounded square)

---

## 📝 SHRNUTÍ - CO UDĚLAT PŘED RELEASE

### 🔴 Kritické (musí se opravit):
1. ✅ Nastavit EAS Project ID
2. ✅ Vytvořit production Android keystore a konfigurovat signing
3. ✅ Opravit iOS `LSMinimumSystemVersion` na 15.1
4. ✅ Opravit Android `targetSdkVersion` v root `build.gradle` na 35
5. ✅ Zkontrolovat/odstranit zbytečné Android permissions
6. ✅ Synchronizovat version v `app.json` s `app.config.js` (nebo odstranit `app.json`)

### 🟡 Důležité (doporučuje se před release):
7. ✅ Vytvořit/zajistit Privacy Policy
8. ✅ Připravit App Store assets (screenshots, description)
9. ✅ Vytvořit iOS Privacy Manifest (pokud neexistuje)
10. ✅ Vyplnit Google Play Data Safety Form
11. ✅ Otestovat production buildy
12. ✅ Naplánovat version code management

### 🟢 Volitelné (může se udělat později):
13. ✅ Ověřit AAB formát pro Android
14. ✅ Nastavit App Store Connect metadata
15. ✅ Ověřit ikony na různých rozlišeních

---

## 🚀 NÁSLEDUJÍCÍ KROKY

### Krok 1: Opravit kritické problémy
```bash
# 1. EAS Project ID
eas login
eas project:init

# 2. Android keystore (viz sekce 2 výše)

# 3-6. Opravit konfigurační soubory (viz výše)
```

### Krok 2: Připravit store listings
- Vytvořit Privacy Policy
- Připravit screenshots
- Napsat popis aplikace

### Krok 3: Testování
```bash
# Production build pro Android
eas build --platform android --profile production

# Production build pro iOS
eas build --platform ios --profile production
```

### Krok 4: Submission
```bash
# Android - automatický submit (nebo manuální přes Play Console)
eas submit --platform android

# iOS - automatický submit (nebo manuální přes App Store Connect)
eas submit --platform ios
```

---

## 📚 ODKAZY NA DOKUMENTACI

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [EAS Submit Documentation](https://docs.expo.dev/submit/introduction/)
- [Google Play Console](https://play.google.com/console)
- [App Store Connect](https://appstoreconnect.apple.com)
- [Expo Release Workflow](https://docs.expo.dev/guides/adhoc-builds/)

---

**Poznámka:** Tento checklist by měl být aktualizován před každým release.
