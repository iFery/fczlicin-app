# Environment Configuration - Rychlá referenční příručka

> **Pro podrobnosti viz:** [ENVIRONMENT_CONFIGURATION.md](./ENVIRONMENT_CONFIGURATION.md)

## 🚀 Rychlý start

### Development testování
```bash
npx expo run:android    # Automaticky: APP_ENV=development → dev Firebase
npx expo run:ios        # Automaticky: APP_ENV=development → dev Firebase
```

### Production Android build
```bash
npm run build:aab       # Automaticky: APP_ENV=production → prod Firebase
```

### Production iOS build
```bash
npm run build:ios:prod  # Nastaví APP_ENV=production a prebuild
# Pak build v Xcode s Release konfigurací
```

## 📁 Struktura souborů

```
project-root/
├── app.config.js                          # Hlavní konfigurace (detekce + kopírování)
├── package.json                           # Skripty s APP_ENV
├── scripts/
│   └── xcode-firebase-config.sh          # Xcode Build Phase script
├── config/
│   └── firebase/
│       ├── dev/
│       │   ├── google-services.json      # Android DEV
│       │   └── GoogleService-Info.plist  # iOS DEV
│       └── prod/
│           ├── google-services.json      # Android PROD
│           └── GoogleService-Info.plist  # iOS PROD
└── .xcode-build-env                       # Marker (auto-generated, v .gitignore)
```

## 🔄 Environment Detection Priority

1. `APP_ENV` (z `package.json` skriptů)
2. `EAS_BUILD_PROFILE` (EAS cloud builds)
3. `NODE_ENV`
4. `.xcode-build-env` marker (z Xcode build script)
5. Firebase config comparison (PROJECT_ID match)
6. `'development'` (default)

## 🛠️ Setup Checklist

- [ ] Vytvoř `config/firebase/dev/` a `config/firebase/prod/` s Firebase soubory
- [ ] Uprav `app.config.js` s environment detection logikou
- [ ] Uprav `package.json` skripty (`APP_ENV=development/production`)
- [ ] Vytvoř `scripts/xcode-firebase-config.sh`
- [ ] Přidej Xcode Build Phase script (volá `xcode-firebase-config.sh`)
- [ ] Přidej `.xcode-build-env` do `.gitignore`
- [ ] Otestuj všechny workflow

## 🔍 Verifikace prostředí

```typescript
import Constants from 'expo-constants';

const env = Constants.expoConfig?.extra?.environment;
const isProd = Constants.expoConfig?.extra?.isProduction;
```

## ⚠️ Časté problémy

| Problém | Řešení |
|---------|--------|
| Špatný Firebase config | Zkontroluj `config/firebase/{env}/` soubory existují |
| Environment je `development` místo `production` | Zkontroluj `APP_ENV=production` v `package.json` skriptu |
| Xcode build používá dev config | Spusť `npm run build:ios:prod` před buildu v Xcode |
| Marker soubor se nečte | Marker se čte při **dalším** spuštění `app.config.js` |

## 📝 Klíčové příkazy

```bash
# Development
npx expo run:android
npx expo run:ios

# Production
npm run build:aab
npm run build:ios:prod

# Clean rebuild
rm -rf android/ ios/
APP_ENV=production npx expo prebuild --clean
```

---

**Více informací:** Viz [ENVIRONMENT_CONFIGURATION.md](./ENVIRONMENT_CONFIGURATION.md)
