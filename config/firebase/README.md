# 🔥 Firebase Configuration Files

Tato složka obsahuje Firebase konfigurační soubory pro různá prostředí.

## 📁 Struktura

```
config/firebase/
├── dev/
│   ├── google-services.json          # Android DEV
│   └── GoogleService-Info.plist      # iOS DEV
└── prod/
    ├── google-services.json          # Android PROD
    └── GoogleService-Info.plist      # iOS PROD
```

## 🚀 Použití

### ✅ Automatické kopírování (NOVÉ - výchozí chování)

**Firebase config se nyní automaticky kopíruje při každém spuštění `app.config.js`!**

To znamená, že už **NEMUSÍTE** manuálně spouštět `firebase:dev` před buildem:

```bash
# Development build - automaticky použije DEV config
npx expo run:android
npx expo run:ios
npm run android  # také funguje
npm run ios      # také funguje

# Production build - automaticky použije PROD config
APP_ENV=production npx expo run:android
NODE_ENV=production npx expo run:android
```

**Jak to funguje:**
- `app.config.js` automaticky detekuje prostředí z `APP_ENV`, `EAS_BUILD_PROFILE` nebo `NODE_ENV`
- Správný config se zkopíruje z `config/firebase/{env}/` do kořenového adresáře
- Expo plugin pak zkopíruje soubory do správných native složek během prebuildu

### Manuální kopírování (volitelné)

Pokud potřebujete manuálně zkopírovat config (např. pro testování):

```bash
# Development
npm run firebase:dev
# nebo
node scripts/copy-firebase-config.js dev

# Production
npm run firebase:prod
# nebo
node scripts/copy-firebase-config.js prod
```

## 📋 Co se děje automaticky

1. **Při načtení `app.config.js`** (před každým prebuildem):
   - Detekuje prostředí z environment variables
   - Zkopíruje soubory z `config/firebase/{env}/` do kořenového adresáře:
     - `google-services.json` (Android)
     - `GoogleService-Info.plist` (iOS)

2. **Během prebuildu** (Expo plugin):
   - Expo Firebase plugin zkopíruje soubory z kořenového adresáře do:
     - `android/app/google-services.json`
     - `ios/{project}/GoogleService-Info.plist`

## 🔐 Bezpečnost

- **Development soubory** mohou být citlivé - zvažte přidání do `.gitignore`
- **Production soubory** obvykle mohou být v gitu (pokud neobsahují citlivé údaje)
- Kopírované soubory v `android/app/` a `ios/FMCityFest/` jsou v `.gitignore`

## 📝 Přidání nového prostředí

1. Vytvořte složku: `config/firebase/{new-env}/`
2. Přidejte Firebase soubory
3. Upravte `scripts/copy-firebase-config.js` - přidejte environment do `ENVIRONMENTS`
4. Přidejte npm script do `package.json` (volitelné)

## ✅ Ověření

Po spuštění build scriptu zkontrolujte:
- `android/app/google-services.json` existuje
- `ios/FMCityFest/GoogleService-Info.plist` existuje
- Soubory obsahují správné Firebase project ID pro dané prostředí


