# 📋 Souhrn oprav názvosloví projektu

## ✅ Provedené změny (automaticky opraveno)

### 1. Zdrojové soubory
- ✅ `src/components/NotificationPermissionModal.tsx`
  - Změněno: "FM CITY FEST" → "FC Zličín"

- ✅ `src/services/updateService.ts`
  - Opraveny komentáře odkazující na starou aplikaci
  - Přidány TODO poznámky pro aktualizaci App Store ID

### 2. Konfigurační soubory
- ✅ `app.config.js`
  - Cesta k iOS Firebase: `ios/FMCityFest/` → `ios/FCZlicin/`

- ✅ `scripts/copy-firebase-config.js`
  - Cesta k iOS Firebase: `ios/FMCityFest/` → `ios/FCZlicin/`

- ✅ `android/settings.gradle`
  - `rootProject.name`: `'FCZlin'` → `'FCZlicin'`

## ⚠️ Změny vyžadující ruční zásah

### 1. iOS projekt přejmenování
**Status:** ⏳ Čeká na provedení

**Co je potřeba:**
- Přejmenovat iOS projekt z `FCZlin` na `FCZlicin` přes Xcode

**Návod:**
- 📖 Viz `docs/IOS_PROJECT_RENAME_GUIDE.md` pro podrobný návod

**Rychlý postup:**
1. Otevřete `ios/FCZlin.xcodeproj` v Xcode
2. Klikněte na název projektu v Project Navigator
3. Přejmenujte z `FCZlin` na `FCZlicin`
4. Zaškrtněte "Rename project content items"
5. Uložte a zavřete Xcode
6. Spusťte `npx expo prebuild --clean` nebo `pod install`

### 2. App Store ID aktualizace
**Status:** ⏳ Čeká na ověření

**Soubor:** `src/services/updateService.ts`

**Aktuální hodnota:**
```typescript
const IOS_APP_STORE_ID = '6747171420'; // Odkazuje na starou aplikaci "fm-city-fest"
```

**Co je potřeba:**
- Ověřit, zda je toto ID správné pro FC Zličín aplikaci
- Pokud ne, aktualizovat na správné App Store ID

**Kde najít správné ID:**
- App Store Connect → Vaše aplikace → App Information → Apple ID
- Nebo z URL: `https://apps.apple.com/app/id{APP_ID}`

## ✅ Správně nastavené soubory (žádné změny potřeba)

- ✅ `app.config.js` - všechny názvy správně
  - `name: 'FC Zličín'`
  - `slug: 'fczlicin-app'`
  - `bundleIdentifier: 'cz.fczlicin.app'`
  - `package: 'cz.fczlicin.app'`

- ✅ `package.json` - správný název projektu
  - `"name": "fczlicin-app"`

- ✅ `src/navigation/linking.ts` - správný scheme
  - `prefixes: [prefix, 'fczlicin://']`

- ✅ Android konfigurace - všechny názvy správně
  - Package: `cz.fczlicin.app`
  - Namespace: `cz.fczlicin.app`

## 📝 Poznámky

### Staré názvy v dokumentaci
V adresáři `docs/` zůstávají některé odkazy na starý projekt "FMCityFest" v dokumentaci. Tyto soubory jsou pouze dokumentační a neovlivňují funkčnost aplikace. Pokud chcete, můžete je později aktualizovat.

### CocoaPods soubory
Soubory v `ios/Pods/Target Support Files/Pods-FCZlin/` se automaticky regenerují po přejmenování projektu a spuštění `pod install` nebo `npx expo prebuild`.

## 🎯 Další kroky

1. **Přejmenovat iOS projekt** podle návodu v `IOS_PROJECT_RENAME_GUIDE.md`
2. **Ověřit a aktualizovat App Store ID** v `updateService.ts`
3. **Otestovat build** iOS aplikace
4. **Otestovat build** Android aplikace (mělo by fungovat bez změn)

## ✅ Checklist

- [x] Opraveny všechny odkazy na FMCityFest v zdrojových souborech
- [x] Opraveny cesty k Firebase konfiguraci
- [x] Opraven Android rootProject.name
- [ ] Přejmenován iOS projekt (čeká na provedení)
- [ ] Ověřeno a aktualizováno App Store ID (čeká na ověření)
- [ ] Otestován iOS build
- [ ] Otestován Android build

---

**Vytvořeno:** 2025-01-16  
**Poslední aktualizace:** 2025-01-16
