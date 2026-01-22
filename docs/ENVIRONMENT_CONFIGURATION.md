# Environment Configuration & Firebase Setup

## 📋 Obsah
1. [Přehled](#přehled)
2. [Problém, který řešíme](#problém-který-řešíme)
3. [Architektura řešení](#architektura-řešení)
4. [Komponenty řešení](#komponenty-řešení)
5. [Instalace a nastavení](#instalace-a-nastavení)
6. [Workflow a použití](#workflow-a-použití)
7. [Technické detaily](#technické-detaily)
8. [Troubleshooting](#troubleshooting)

---

## Přehled

Toto řešení automaticky spravuje prostředí aplikace (development/production) a správné Firebase konfigurační soubory pro Expo/React Native aplikace. Eliminuje potřebu manuálně kopírovat Firebase soubory nebo pamatovat si nastavení `APP_ENV` proměnné.

### Klíčové vlastnosti

✅ **Automatická detekce prostředí** - prostředí se detekuje z různých zdrojů v prioritním pořadí  
✅ **Automatické kopírování Firebase config** - správný config se zkopíruje na základě detekovaného prostředí  
✅ **Zero-config workflow** - stačí spustit standardní příkazy, vše ostatní se stane automaticky  
✅ **Podpora Xcode builds** - automatická detekce při buildu v Xcode s Release konfigurací  
✅ **Fallback mechanismy** - více úrovní detekce zajišťuje správné nastavení i v edge cases

---

## Problém, který řešíme

### Původní problémy

1. **Manuální správa Firebase config souborů**
   - Vývojáři museli ručně kopírovat `google-services.json` a `GoogleService-Info.plist`
   - Riziko použití špatného configu (dev vs prod)
   - Chyby při zapomenutí aktualizace souborů

2. **Nekonzistentní nastavení prostředí**
   - `APP_ENV` proměnná nebyla vždy nastavena
   - Různé workflow pro Android a iOS
   - Xcode builds neměly způsob, jak automaticky detekovat prostředí

3. **Duplicitní krok v build procesu**
   - Skripty volaly `firebase:dev` nebo `firebase:prod` před každým buildem
   - Duplikace logiky kopírování souborů

### Řešení

Automatický systém, který:
- Detekuje prostředí z více zdrojů (environment variables, Xcode build config, Firebase config)
- Automaticky kopíruje správné Firebase soubory
- Poskytuje jednoduché, konzistentní workflow pro všechny build scénáře

---

## Architektura řešení

### Tok dat a rozhodování

```
┌─────────────────────────────────────────────────────────────┐
│                    Build Command Spustí                      │
│  (npx expo run:android, npm run build:aab, Xcode build)     │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                   app.config.js vykonán                      │
│  (spouští se při expo prebuild/start/run příkazech)         │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│            Environment Detection (prioritní pořadí)          │
│                                                               │
│  1. APP_ENV (z package.json skriptů)                        │
│  2. EAS_BUILD_PROFILE (z EAS cloud builds)                  │
│  3. NODE_ENV                                                 │
│  4. .xcode-build-env marker (z Xcode build script)          │
│  5. Firebase config comparison (porovnání project_id)       │
│  6. 'development' (default fallback)                        │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│         Firebase Config Copy (automaticky)                   │
│                                                               │
│  config/firebase/{env}/ → root/                             │
│  - google-services.json (Android)                           │
│  - GoogleService-Info.plist (iOS)                           │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              Expo Plugins spustí prebuild                    │
│  (kopíruje config z root/ do android/app/ a ios/)           │
└─────────────────────────────────────────────────────────────┘
```

### Xcode Build Workflow

```
┌─────────────────────────────────────────────────────────────┐
│              Xcode Build spustí (Release config)             │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│         xcode-firebase-config.sh (Build Phase)               │
│                                                               │
│  1. Detekuje CONFIGURATION (Release/Debug)                  │
│  2. Kopíruje Firebase config z config/firebase/{env}/       │
│  3. Vytvoří .xcode-build-env marker soubor                  │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  Při dalším spuštění app.config.js:                          │
│  - Čte .xcode-build-env marker                               │
│  - Nastaví správné prostředí                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Komponenty řešení

### 1. `app.config.js` - Hlavní konfigurační soubor

**Úloha:** Expo app konfigurace s automatickou detekcí prostředí a kopírováním Firebase config.

**Klíčové funkce:**
- Environment detection s prioritním systémem
- Automatické kopírování Firebase config souborů
- Nastavení `extra` config pro runtime přístup (via `Constants.expoConfig.extra`)

**Lokace:** `app.config.js` (root projektu)

**Kdy se spouští:**
- Při `npx expo start`
- Při `npx expo prebuild`
- Při `npx expo run:android` / `run:ios`
- Při jakémkoli Expo příkazu, který načítá konfiguraci

### 2. `scripts/xcode-firebase-config.sh` - Xcode Build Phase Script

**Úloha:** Automaticky kopíruje správný Firebase config při buildu v Xcode.

**Klíčové funkce:**
- Detekce Xcode build konfigurace (Release/Debug)
- Kopírování Firebase config do root a iOS projektu
- Vytvoření `.xcode-build-env` marker souboru

**Lokace:** `scripts/xcode-firebase-config.sh`

**Kdy se spouští:**
- Před kompilací při buildu v Xcode
- Automaticky jako Build Phase script

### 3. `package.json` skripty - Zjednodušené workflow

**Úloha:** Zajištění správného `APP_ENV` pro každý build příkaz.

**Klíčové skripty:**
- `run:android` / `run:ios` - nastavují `APP_ENV=development`
- `build:aab` - nastavuje `APP_ENV=production`
- `build:ios:prod` - nastavuje `APP_ENV=production` pro iOS

**Lokace:** `package.json` (sekce `scripts`)

### 4. Firebase Config struktura

**Úloha:** Oddělené Firebase konfigurace pro dev a prod prostředí.

**Struktura:**
```
config/firebase/
├── dev/
│   ├── google-services.json          # Android DEV
│   └── GoogleService-Info.plist      # iOS DEV
└── prod/
    ├── google-services.json          # Android PROD
    └── GoogleService-Info.plist      # iOS PROD
```

**Lokace:** `config/firebase/{env}/`

### 5. `.xcode-build-env` marker soubor

**Úloha:** Přenáší informaci o prostředí z Xcode build scriptu do `app.config.js`.

**Obsah:**
- `production` nebo `development` (jeden řádek textu)

**Lokace:** `.xcode-build-env` (root projektu, v `.gitignore`)

**Životní cyklus:**
- Vytvořen Xcode build scriptem při buildu
- Přečten `app.config.js` při dalším spuštění
- Měl by být v `.gitignore` (není commitován)

---

## Instalace a nastavení

### Krok 1: Firebase Config struktura

Vytvořte složkovou strukturu pro Firebase configy:

```bash
mkdir -p config/firebase/dev
mkdir -p config/firebase/prod
```

Do těchto složek zkopírujte odpovídající Firebase config soubory:
- `config/firebase/dev/google-services.json` (Android DEV)
- `config/firebase/dev/GoogleService-Info.plist` (iOS DEV)
- `config/firebase/prod/google-services.json` (Android PROD)
- `config/firebase/prod/GoogleService-Info.plist` (iOS PROD)

### Krok 2: Nastavení `.gitignore`

Přidejte do `.gitignore`:

```gitignore
# Environment variables
.env
.env.local
.env.*.local
.xcode-build-env

# Firebase config files (auto-generated in root and native folders)
google-services.json
GoogleService-Info.plist
android/app/google-services.json
ios/GoogleService-Info.plist

# Firebase config source (pokud nechcete commitovat)
# config/firebase/prod/
# config/firebase/dev/
```

**Poznámka:** Pokud chcete mít prod Firebase configy v gitu, můžete smazat `config/firebase/prod/` z `.gitignore`. Ale obecně se doporučuje je ignorovat (obsahují citlivé údaje).

### Krok 3: Nastavení `app.config.js`

Implementujte environment detection logiku. Klíčové části:

```javascript
const rootDir = path.resolve(__dirname);
let environment = process.env.APP_ENV || 
                  process.env.EAS_BUILD_PROFILE || 
                  process.env.NODE_ENV;

// Auto-detect from Xcode build marker
if (!environment) {
  const xcodeEnvMarker = path.join(rootDir, '.xcode-build-env');
  if (fs.existsSync(xcodeEnvMarker)) {
    const markerContent = fs.readFileSync(xcodeEnvMarker, 'utf8').trim();
    if (markerContent === 'production' || markerContent === 'development') {
      environment = markerContent;
    }
  }
}

// Auto-detect from Firebase config comparison
if (!environment) {
  // Porovná PROJECT_ID z root configu s prod configem
  // ... (viz kompletní implementace)
}

environment = environment || 'development';

// Automatické kopírování Firebase config
const envFolder = isProduction ? 'prod' : 'dev';
// ... kopírování logika
```

**Viz kompletní implementaci:** viz `app.config.js` v tomto projektu.

### Krok 4: Nastavení `package.json` skriptů

Upravte skripty:

```json
{
  "scripts": {
    "run:android": "APP_ENV=development npx expo run:android",
    "run:ios": "APP_ENV=development npx expo run:ios",
    "build:aab": "APP_ENV=production NODE_ENV=production npx expo prebuild --clean --platform android && cd android && APP_ENV=production NODE_ENV=production ./gradlew bundleRelease",
    "build:ios:prod": "APP_ENV=production NODE_ENV=production npx expo prebuild --clean --platform ios"
  }
}
```

**Důležité:** `--platform android` a `--platform ios` zajistí, že `expo prebuild` vytvoří pouze požadovaný native projekt, ne oba. To je důležité pro:
- Rychlejší buildy (nevytváří se zbytečný projekt)
- Bezpečnost (nekopíruje se Firebase config do druhého projektu)

### Krok 5: Nastavení Xcode Build Phase (iOS)

1. Otevřete Xcode projekt
2. Vyberte projekt v navigátoru
3. Vyberte Target → Build Phases
4. Klikněte na "+" → New Run Script Phase
5. Přesuňte script na začátek (před Compile Sources)
6. V "Shell" pole vložte:

```bash
"${SRCROOT}/../scripts/xcode-firebase-config.sh"
```

7. Ujistěte se, že "Run script only when installing" je **NEZATRŽENO**

### Krok 6: Vytvoření `scripts/xcode-firebase-config.sh`

Vytvořte script (viz kompletní implementaci v tomto projektu) a nastavte execute permissions:

```bash
chmod +x scripts/xcode-firebase-config.sh
```

### Krok 7: Testování

Otestujte všechny workflow (viz sekce [Workflow a použití](#workflow-a-použití)).

---

## Workflow a použití

### Development testování (Android/iOS)

**Příkaz:**
```bash
# Android
npx expo run:android

# iOS
npx expo run:ios
```

**Co se stane:**
1. `APP_ENV=development` je nastaven automaticky (z `package.json`)
2. `app.config.js` detekuje `development`
3. Zkopíruje `config/firebase/dev/*` do rootu
4. Expo plugins zkopírují config do native složek
5. Aplikace běží s dev Firebase configem

**Výstup:**
```
✅ [app.config.js] Copied dev Firebase config: google-services.json
✅ [app.config.js] Copied dev Firebase config: GoogleService-Info.plist
```

### Production Android Build (.aab)

**Příkaz:**
```bash
npm run build:aab
```

**Co se stane:**
1. `APP_ENV=production` je nastaven automaticky
2. `app.config.js` detekuje `production`
3. Zkopíruje `config/firebase/prod/*` do rootu
4. `expo prebuild --clean --platform android` vytvoří **pouze** Android projekt s prod configem (iOS se nevytváří)
5. Gradle build vytvoří `.aab` soubor

**Výhoda `--platform android`:**
- Vytvoří se pouze Android projekt (rychlejší prebuild)
- iOS Firebase config se nekopíruje (bezpečnější)
- Zajišťuje, že build je specificky pro Android

**Výstup:**
```
✅ [app.config.js] Copied prod Firebase config: google-services.json
✅ [app.config.js] Copied prod Firebase config: GoogleService-Info.plist
```

### Production iOS Build (Xcode)

**Možnost 1: Doporučené workflow**

```bash
# Krok 1: Připravit native projekt s production config
npm run build:ios:prod

# Krok 2: Otevřít Xcode a build
open ios/YourProject.xcworkspace
# V Xcode: Product → Archive (s Release konfigurací)
```

**Co se stane:**
1. `build:ios:prod` nastaví `APP_ENV=production` a spustí `expo prebuild --platform ios`
2. `app.config.js` zkopíruje prod Firebase config
3. Expo prebuild vytvoří **pouze** iOS projekt s prod configem (Android se nevytváří)
4. Xcode build script (`xcode-firebase-config.sh`) ověří a znovu zkopíruje config (pro jistotu)
5. Vytvoří `.xcode-build-env` marker

**Výhoda `--platform ios`:**
- Vytvoří se pouze iOS projekt (rychlejší prebuild)
- Android Firebase config se nekopíruje (bezpečnější)
- Zajišťuje, že prebuild je specificky pro iOS

**Možnost 2: Přímý build v Xcode**

```bash
# Otevřít Xcode přímo (bez předchozího prebuild)
open ios/YourProject.xcworkspace
# V Xcode: Product → Archive (s Release konfigurací)
```

**Co se stane:**
1. Xcode build script (`xcode-firebase-config.sh`) detekuje Release konfiguraci
2. Zkopíruje `config/firebase/prod/*` do rootu a iOS projektu
3. Vytvoří `.xcode-build-env` s hodnotou `production`
4. Při **dalším** spuštění `app.config.js` (např. při dalším prebuildu) se přečte marker a nastaví prostředí

**⚠️ Důležité:** Pokud builduješ přímo v Xcode bez předchozího `build:ios:prod`, marker soubor se použije až při dalším spuštění Expo příkazu. Pro okamžitou detekci použij **Možnost 1**.

### Verifikace prostředí v runtime

V aplikaci můžete zkontrolovat prostředí:

```typescript
import Constants from 'expo-constants';

const environment = Constants.expoConfig?.extra?.environment;
const isProduction = Constants.expoConfig?.extra?.isProduction;
const isDevelopment = Constants.expoConfig?.extra?.isDevelopment;

console.log('Environment:', environment);
console.log('Is Production:', isProduction);
```

**Hodnoty:**
- `environment`: `'development'` | `'production'` | `'preview'`
- `isProduction`: `true` | `false`
- `isDevelopment`: `true` | `false`

---

## Technické detaily

### Environment Detection Priority

Detekce prostředí probíhá v tomto pořadí (první nalezený se použije):

1. **`APP_ENV`** - Explicitní kontrola (nastaveno v `package.json` skriptech)
   - **Použití:** Lokální buildu, když chceme explicitně říct prostředí
   - **Příklad:** `APP_ENV=production npx expo prebuild`

2. **`EAS_BUILD_PROFILE`** - EAS cloud builds
   - **Použití:** EAS Build service automaticky nastavuje podle build profilu
   - **Příklad:** EAS nastaví podle `eas.json` profilu

3. **`NODE_ENV`** - Node.js environment (fallback)
   - **Použití:** Obecný fallback, pokud není nastaveno nic jiného
   - **Příklad:** `NODE_ENV=production npm run start`

4. **`.xcode-build-env` marker** - Xcode build script marker
   - **Použití:** Když builduješ přímo v Xcode, script vytvoří marker
   - **Lokace:** Root projektu (`.xcode-build-env`)
   - **Obsah:** Jednoduše `production` nebo `development`

5. **Firebase config comparison** - Porovnání PROJECT_ID
   - **Použití:** Fallback, když není žádné explicitní nastavení
   - **Logika:** Porovná `PROJECT_ID` z root `GoogleService-Info.plist` s prod configem
   - **Pokud match:** Nastaví `production`

6. **Default: `'development'`** - Finální fallback
   - **Použití:** Pokud nic z výše uvedeného není dostupné
   - **Bezpečné výchozí nastavení** pro vývoj

### Firebase Config Copy Mechanism

`app.config.js` automaticky kopíruje Firebase configy při každém spuštění:

**Zdroj:**
```
config/firebase/{env}/
├── google-services.json
└── GoogleService-Info.plist
```

**Cíl:**
```
Root projektu/
├── google-services.json              # Pro Expo plugin
└── GoogleService-Info.plist          # Pro Expo plugin

android/app/
└── google-services.json              # Pro Android build

ios/{ProjectName}/
└── GoogleService-Info.plist          # Pro iOS build
```

**Optimalizace:**
- Před kopírováním se porovná `project_id` existujícího souboru
- Pokud je stejný, kopírování se přeskočí (šetří I/O)
- Pokud je jiný nebo soubor neexistuje, provede se kopírování

### Xcode Build Script Details

`xcode-firebase-config.sh` se spouští jako Build Phase před kompilací:

**Pořadí v Build Phases:**
1. **xcode-firebase-config.sh** (náš script - měl by být první)
2. Compile Sources
3. Link Binary With Libraries
4. ... (ostatní phases)

**Detekce konfigurace:**
```bash
CONFIGURATION="${CONFIGURATION:-Debug}"  # Xcode automaticky nastavuje

if [ "$CONFIGURATION" = "Release" ]; then
  ENV="prod"
else
  ENV="dev"
fi
```

**Kopírování:**
- Kopíruje do rootu (pro `app.config.js` při dalším spuštění)
- Kopíruje do iOS projektu (pro aktuální build)
- Zkouší více možných lokací (FCZlin, FCZlicin, atd.)

**Marker soubor:**
- Vytvoří `.xcode-build-env` s hodnotou `production` nebo `development`
- `app.config.js` tento marker přečte při příštím spuštění

### Expo Plugin Integration

Expo Firebase plugin (`@react-native-firebase/app`) automaticky kopíruje configy:

**Z Expo dokumentace:**
```
Plugin očekává:
- Android: ./google-services.json (v rootu)
- iOS: ./GoogleService-Info.plist (v rootu)

Během prebuildu zkopíruje:
- Android: do android/app/google-services.json
- iOS: do ios/{ProjectName}/GoogleService-Info.plist
```

**Proč kopírujeme i do native složek?**
- Když native složky už existují (po prvním prebuildu)
- Expo plugin nemusí kopírovat znovu
- Zajistíme, že vždy máme správný config

### Runtime Configuration Access

Konfigurace je dostupná v runtime přes Expo Constants:

```typescript
import Constants from 'expo-constants';

// Struktura v app.config.js extra:
const extra = {
  apiUrl: 'https://www.fczlicin.cz',
  environment: 'production' | 'development' | 'preview',
  isProduction: true | false,
  isDevelopment: true | false,
};

// Přístup:
const env = Constants.expoConfig?.extra?.environment;
const apiUrl = Constants.expoConfig?.extra?.apiUrl;
```

**Kdy se hodnoty určují:**
- Při build time (když se spouští `app.config.js`)
- Kompilují se do bundle, ne mění se v runtime
- Pokud chceš změnit prostředí, musíš rebuildovat

---

## Troubleshooting

### Problém: Firebase config se nekopíruje správně

**Symptomy:**
- Aplikace používá špatný Firebase project
- Firebase funkce nefungují
- Chyby při inicializaci Firebase

**Diagnostika:**
1. Zkontroluj logy při buildu - měly by být vidět zprávy o kopírování:
   ```
   ✅ [app.config.js] Copied dev Firebase config: google-services.json
   ```

2. Zkontroluj, že source soubory existují:
   ```bash
   ls config/firebase/dev/
   ls config/firebase/prod/
   ```

3. Zkontroluj project_id v root configu vs source:
   ```bash
   # Android
   cat google-services.json | grep project_id
   cat config/firebase/prod/google-services.json | grep project_id
   
   # iOS
   grep -A 1 "PROJECT_ID" GoogleService-Info.plist
   grep -A 1 "PROJECT_ID" config/firebase/prod/GoogleService-Info.plist
   ```

**Řešení:**
- Zkontroluj, že `config/firebase/{env}/` složky obsahují správné soubory
- Spusť `npx expo prebuild --clean` pro čistý rebuild
- Zkontroluj, že `app.config.js` má správné cesty k config souborům

### Problém: Environment se detekuje jako development místo production

**Symptomy:**
- `Constants.expoConfig.extra.isProduction` je `false`
- Aplikace používá dev Firebase project i při produkčním buildu

**Diagnostika:**
1. Zkontroluj, co se loguje při buildu:
   ```bash
   APP_ENV=production npx expo prebuild --clean
   ```
   Mělo by logovat:
   ```
   ✅ [app.config.js] Copied prod Firebase config: ...
   ```

2. Zkontroluj `.xcode-build-env` soubor (pokud builduješ v Xcode):
   ```bash
   cat .xcode-build-env
   # Mělo by být: production
   ```

3. Zkontroluj `package.json` skripty - měly by nastavovat `APP_ENV`:
   ```json
   "build:aab": "APP_ENV=production ..."
   ```

**Řešení:**
- Ujisti se, že `APP_ENV=production` je nastaveno v příkazu (viz `package.json`)
- Pro Xcode build: Spusť `npm run build:ios:prod` před buildu v Xcode
- Nebo manuálně: `APP_ENV=production npx expo prebuild --clean`

### Problém: Xcode build používá dev config místo prod

**Symptomy:**
- iOS build v Xcode používá development Firebase i při Release konfiguraci

**Diagnostika:**
1. Zkontroluj, že Xcode Build Phase script existuje:
   - Xcode → Project → Target → Build Phases
   - Měl by být script `xcode-firebase-config.sh` na začátku

2. Zkontroluj logy v Xcode při buildu:
   - Měly by být vidět:
     ```
     📦 [Xcode] Release build detected - using PRODUCTION Firebase config
     ```

3. Zkontroluj, že script má execute permissions:
   ```bash
   ls -la scripts/xcode-firebase-config.sh
   chmod +x scripts/xcode-firebase-config.sh
   ```

**Řešení:**
- Přidej/možnost Build Phase script v Xcode
- Ujisti se, že script běží před Compile Sources
- Zkontroluj, že cesta k scriptu je správná: `"${SRCROOT}/../scripts/xcode-firebase-config.sh"`

### Problém: Marker soubor `.xcode-build-env` se nečte

**Symptomy:**
- Po buildu v Xcode se marker vytvoří, ale `app.config.js` ho nevidí

**Diagnostika:**
1. Zkontroluj, že marker existuje:
   ```bash
   cat .xcode-build-env
   ```

2. Zkontroluj, že je v `.gitignore` (měl by být)

3. Zkontroluj, kdy se `app.config.js` spouští - marker se přečte až při příštím spuštění

**Řešení:**
- Marker se používá až při **dalším** spuštění `app.config.js` (např. při dalším prebuildu)
- Pokud chceš okamžitou detekci, použij `APP_ENV=production` v `package.json` skriptu
- Nebo spusť `npm run build:ios:prod` před buildu v Xcode

### Problém: Duplicitní Firebase config kopírování

**Symptomy:**
- Konflikt mezi manuálním kopírováním a automatickým systémem

**Diagnostika:**
- Pokud voláš `npm run firebase:dev` nebo `firebase:prod` manuálně před buildem

**Řešení:**
- **Nepoužívej** `firebase:dev` nebo `firebase:prod` skripty manuálně
- `app.config.js` už vše kopíruje automaticky
- Pokud je potřebuješ (edge case), můžeš je použít, ale není to nutné

### Problém: Environment detection nefunguje pro EAS builds

**Symptomy:**
- EAS build detekuje špatné prostředí

**Diagnostika:**
- EAS používá `EAS_BUILD_PROFILE` proměnnou
- Zkontroluj `eas.json` konfiguraci

**Řešení:**
- `EAS_BUILD_PROFILE` má prioritu 2 v detection systému
- Ujisti se, že `eas.json` má správné profily definované
- Environment se detekuje automaticky z build profilu

---

## Best Practices

### 1. Vždy používej npm skripty místo přímých příkazů

✅ **Dobře:**
```bash
npm run build:aab
npx expo run:android
```

❌ **Špatně:**
```bash
npx expo run:android  # Bez APP_ENV (může detekovat špatně)
npx expo prebuild --clean  # Bez APP_ENV
```

### 2. Před Xcode buildem spusť prebuild

✅ **Doporučené:**
```bash
npm run build:ios:prod
# Pak build v Xcode
```

❌ **Méně spolehlivé:**
```bash
# Přímo build v Xcode bez prebuildu
```

### 3. Firebase config soubory

✅ **Ignorovat v gitu:**
- Root `google-services.json` a `GoogleService-Info.plist` (auto-generované)
- Native složky `android/app/` a `ios/` configy

⚠️ **Zvážit ignorování:**
- `config/firebase/prod/` (obsahuje citlivé klíče)

✅ **Může být v gitu:**
- `config/firebase/dev/` (pokud není citlivý)

### 4. Verifikace před release

Před produkčním release vždy ověř:
```typescript
import Constants from 'expo-constants';

console.log('Environment:', Constants.expoConfig?.extra?.environment);
console.log('Is Production:', Constants.expoConfig?.extra?.isProduction);
```

Mělo by být:
- `environment: 'production'`
- `isProduction: true`

### 5. Clean build při problémech

Pokud máš problémy s konfigurací:
```bash
# Android
rm -rf android/
APP_ENV=production npx expo prebuild --clean

# iOS
rm -rf ios/
APP_ENV=production npx expo prebuild --clean
```

---

## Shrnutí

Toto řešení poskytuje:

✅ **Automatickou správu prostředí** - žádné manuální nastavování `APP_ENV`  
✅ **Automatické kopírování Firebase config** - správný config vždy na správném místě  
✅ **Konzistentní workflow** - stejný proces pro všechny build scénáře  
✅ **Podporu Xcode builds** - automatická detekce při Release buildu  
✅ **Fallback mechanismy** - více úrovní detekce zajišťuje správné nastavení  

**Workflow:**
- Development: `npx expo run:android/ios` (automaticky `development`)
- Production Android: `npm run build:aab` (automaticky `production`)
- Production iOS: `npm run build:ios:prod` + Xcode build (automaticky `production`)

**Žádné manuální kroky, žádné zapomínání na nastavení prostředí nebo Firebase config!**
