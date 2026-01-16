# FC Zličín - Mobilní aplikace fotbalového klubu

Mobilní aplikace pro fotbalový klub FC Zličín vyvinutá v React Native s Expo. Přináší přehled zápasů a výsledků, tabulky, novinky, soupisku, osobní nastavení a push notifikace.

## 🚀 Technologie

- **Framework**: React Native s Expo (Managed workflow)
- **Build**: Expo EAS Build
- **Navigace**: React Navigation (Tab + Stack)
- **Push notifikace**: expo-notifications + Firebase Cloud Messaging (FCM)
- **Firebase**: Remote Config, Crashlytics
- **Jazyk**: TypeScript

## 📋 Požadavky

- Node.js (v18 nebo novější)
- npm nebo yarn
- Expo CLI (`npx expo` – není potřeba globální instalace)
- EAS CLI (`npm install -g eas-cli`) pro EAS Build
- Firebase projekt s nakonfigurovanými službami:
  - Firebase Cloud Messaging (FCM)
  - Remote Config
  - Crashlytics

## 🔧 Instalace

1. **Nainstalujte závislosti:**
```bash
npm install
```

2. **Připravte Firebase konfiguraci:**
   - Stáhněte `google-services.json` z Firebase Console pro Android
   - Stáhněte `GoogleService-Info.plist` z Firebase Console pro iOS
   - Uložte soubory do `config/firebase/dev` (nebo `config/firebase/prod` pro produkci)
   - Soubory jsou v `.gitignore` a do repozitáře se necommitují

3. **Zkopírujte konfiguraci do nativních projektů:**
```bash
# development prostředí
npm run firebase:dev

# nebo produkční prostředí
npm run firebase:prod
```

4. **(Volitelné) Nastavte EAS projekt:**
```bash
eas login
eas build:configure
```

5. **Vytvořte development build a spusťte aplikaci:**
```bash
# Pro Android emulátor nebo USB připojené zařízení
npm run android

# Pro iOS simulátor (pouze macOS)
npm run ios

# Nebo přímo, pokud už máte zkopírovanou Firebase konfiguraci
npx expo run:android
npx expo run:ios

# Nebo vytvořte build přes EAS (viz EMULATOR_SETUP.md)
eas build --profile development --platform android
```

**⚠️ Důležité**: Aplikace NEMŮŽE běžet v Expo Go kvůli nativním Firebase modulům. 
Musíte vytvořit custom development build. 

**📱 Pro spuštění na fyzickém Android zařízení přes USB:** Viz [USB_DEBUGGING.md](./USB_DEBUGGING.md)

Viz také [EMULATOR_SETUP.md](./EMULATOR_SETUP.md) pro detailní návod pro emulátory.

## 📱 Build aplikace

### Development build (lokálně - doporučeno)
```bash
# Android (zajistí kopii Firebase configu)
npm run android

# iOS (pouze macOS)
npm run ios
```

### Development build (EAS Build - cloud)
```bash
eas build --profile development --platform android
eas build --profile development --platform ios
```

### Production build
```bash
# EAS Build (doporučeno)
eas build --profile production --platform all

# NEBO lokálně (po prvním npx expo run:android/ios)
cd android && ./gradlew bundleRelease
cd ios && xcodebuild ...
```

**Poznámka**: Před produkčním buildem přepněte Firebase konfiguraci na `prod` (`npm run firebase:prod`).

**Poznámka**: Firebase integrace vyžaduje custom build (expo-dev-client), protože Expo Go nepodporuje nativní Firebase moduly. **Nemusíte ale používat EAS Build** - můžete buildovat lokálně. Viz [BUILD_OPTIONS.md](./BUILD_OPTIONS.md) pro detailní vysvětlení všech možností.

## 🏗️ Struktura projektu

```
src/
├── api/
│   ├── client.ts              # HTTP klient
│   └── footballEndpoints.ts   # Zápasy, tabulky, tým
├── navigation/
│   ├── AppNavigator.tsx      # Hlavní stack navigace
│   └── TabNavigator.tsx      # Tab bar navigace
├── screens/
│   ├── HomeScreen.tsx         # Přehled
│   ├── MatchesListScreen.tsx  # Zápasy a výsledky
│   ├── MatchDetailScreen.tsx  # Detail zápasu
│   ├── StandingsScreen.tsx    # Tabulka soutěže
│   ├── NewsScreen.tsx         # Novinky
│   ├── NewsDetailScreen.tsx   # Detail novinky
│   ├── TeamListScreen.tsx     # Soupiska
│   ├── PlayerDetailScreen.tsx # Detail hráče
│   ├── InfoScreen.tsx         # Informace o klubu
│   └── SettingsScreen.tsx     # Nastavení aplikace
├── components/
│   ├── MatchCard.tsx          # Karta zápasu
│   ├── NewsCard.tsx           # Karta novinky
│   └── NotificationPermissionModal.tsx # Soft-ask notifikací
├── services/
│   ├── firebase.ts           # Firebase inicializace
│   ├── notifications.ts      # Push notifikace (FCM)
│   ├── remoteConfig.ts       # Remote Config služba
│   ├── crashlytics.ts        # Crashlytics služba
│   └── updateService.ts      # Kontrola update aplikace
└── utils/
    ├── cacheManager.ts       # Cache a offline podpora
    └── navigationValidation.ts # Validace navigace
```

## 🔔 Push notifikace

Aplikace podporuje push notifikace přes Firebase Cloud Messaging (FCM) fungující:
- ✅ Když je aplikace na popředí
- ✅ Když je aplikace na pozadí
- ✅ Když je aplikace úplně ukončena

### Testování notifikací

1. Otevřete obrazovku **Nastavení** v aplikaci
2. Zkontrolujte, že je zobrazen FCM token
3. Použijte tlačítko "Odeslat testovací notifikaci" pro lokální test
4. Pro testování FCM notifikací z Firebase Console:
   - Zkopírujte FCM token z obrazovky Nastavení
   - Odešlete testovací notifikaci z Firebase Console pomocí tohoto tokenu

## ☁️ Firebase Remote Config

Aplikace je připojena k Firebase Remote Config, což umožňuje měnit texty, flagy a feature toggles bez nového releasu.

### Použití

```typescript
import { remoteConfigService } from './services/remoteConfig';

// Získání hodnoty
const value = remoteConfigService.getString('test_key', 'default');
const flag = remoteConfigService.getBoolean('feature_enabled', false);

// Aktualizace hodnot
await remoteConfigService.fetchAndActivate();
```

### Nastavení v Firebase Console

1. Otevřete Firebase Console → Remote Config
2. Přidejte parametry (např. `test_key`, `maintenance_mode`)
3. Nastavte hodnoty pro různé podmínky
4. Publikujte změny

## 🐛 Firebase Crashlytics

Aplikace automaticky reportuje chyby do Firebase Crashlytics.

### Testování Crashlytics

1. Otevřete obrazovku **Nastavení**
2. Klikněte na tlačítko "Force Crash (Test)"
3. Po restartu aplikace se crash objeví v Firebase Console → Crashlytics

### Manuální reportování chyb

```typescript
import { crashlyticsService } from './services/crashlytics';

try {
  // Váš kód
} catch (error) {
  crashlyticsService.recordError(error);
}
```

## 🧪 Testování

### Na reálných zařízeních

**Důležité**: Notifikace se v emulátorech chovají jinak než na reálných zařízeních. Pro testování notifikací použijte reálné zařízení.

### Ověření funkcionalit

- ✅ Push notifikace fungují i když je aplikace vypnutá
- ✅ Remote Config změny se aplikují bez releasu
- ✅ Crashlytics zaznamenává chyby
- ✅ Navigace mezi obrazovkami funguje správně

## 📝 Konfigurace

### app.config.js

Hlavní konfigurační soubor Expo projektu (nahrazuje `app.json`) s podporou prostředí. Obsahuje:
- Název a slug aplikace
- Bundle identifiers (iOS/Android)
- Cesty k Firebase konfiguračním souborům (kopírované skriptem)
- Expo pluginy
- `extra` konfiguraci (např. `API_URL`, `EAS_PROJECT_ID`)

### eas.json

Konfigurace pro EAS Build s profily:
- `development`: Development build s expo-dev-client
- `preview`: Preview build pro testování
- `production`: Production build pro store

## 🔐 Bezpečnost

- Firebase konfigurační soubory (`google-services.json`, `GoogleService-Info.plist`) jsou v `.gitignore`
- Ukládejte je do `config/firebase/<env>` a kopírujte skriptem `npm run firebase:dev` / `npm run firebase:prod`
- Pro CI/CD použijte EAS Secrets nebo bezpečné environment variables

## 🚧 Vývoj

### Přidání nové obrazovky

1. Vytvořte komponentu v `src/screens/`
2. Přidejte route do `AppNavigator.tsx` nebo `TabNavigator.tsx`
3. Definujte typy v `RootStackParamList` nebo `TabParamList`

### Přidání nové služby

1. Vytvořte soubor v `src/services/`
2. Exportujte singleton instanci služby
3. Importujte a použijte v komponentách

## 📚 Další zdroje

- [Expo Documentation](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [EAS Build](https://docs.expo.dev/build/introduction/)

## 📄 Licence

Tento projekt je soukromý a určen pouze pro interní použití.

## 👥 Kontakt

Pro dotazy a podporu kontaktujte vývojový tým.

---

**Poznámka**: Před produkčním nasazením ověřte nebo doplňte:
- Stabilní API a data (nastavení `API_URL`)
- Autentizaci uživatelů (pokud je vyžadována)
- CI/CD pipeline
- Automatické testy


