# 📱 Návod: Přejmenování iOS projektu z FCZlin na FCZlicin

Tento návod popisuje bezpečné přejmenování iOS projektu z `FCZlin` na `FCZlicin` pro Expo projekt.

## ⚠️ Důležité upozornění

- **Zálohujte projekt** před začátkem (commit do gitu nebo záloha adresáře)
- iOS projekt je nekompletní (chybí project.pbxproj) - potřebuje se vygenerovat přes Expo prebuild
- Po prebuildu bude projekt kompletní a bude možné ho přejmenovat v Xcode

## 🔍 Diagnostika problému

Pokud vidíte chybu:
```
Project cannot be opened because it is missing its project.pbxproj file.
```

To znamená, že iOS projekt není kompletní a potřebuje se vygenerovat přes `npx expo prebuild`.

## 📋 Postup krok za krokem

### Krok 1: Příprava - záloha a kontrola

1. Zálohujte projekt (commit do gitu):
   ```bash
   cd /Users/janfranc/Development/fczlicin-app
   git add .
   git commit -m "Backup before iOS project rename"
   ```

2. Zkontrolujte aktuální stav iOS adresáře:
   ```bash
   ls -la ios/
   ```

### Krok 2: Vygenerování kompletního iOS projektu

Expo projekt potřebuje "prebuild" pro vytvoření kompletního nativního projektu.

1. Přejděte do hlavního adresáře projektu:
   ```bash
   cd /Users/janfranc/Development/fczlicin-app
   ```

2. **Možnost A: Vygenerovat projekt s novým názvem přímo**

   Nejdřív upravíme app.config.js, aby se projekt vygeneroval s názvem FCZlicin. 
   Ale Expo obvykle používá slug nebo název aplikace. Nejjednodušší je:
   
   - Smazat nekompletní iOS projekt
   - Spustit prebuild
   - Přejmenovat v Xcode

3. Odstraňte nekompletní iOS projekt:
   ```bash
   cd /Users/janfranc/Development/fczlicin-app
   rm -rf ios/FCZlin.xcodeproj ios/FCZlin ios/Pods ios/build
   ```

4. Vygenerujte kompletní iOS projekt:
   ```bash
   npx expo prebuild --platform ios
   ```

   Tím se vytvoří kompletní iOS projekt s názvem podle slug (`fczlicin-app`) nebo názvu aplikace.

### Krok 3: Kontrola vygenerovaného projektu

1. Zkontrolujte, jaký název má vygenerovaný projekt:
   ```bash
   ls -la ios/
   ```

   Expo obvykle vytváří projekt s názvem podle slug, takže může být `fczlicin-app.xcodeproj` nebo podobně.

2. Otevřete projekt v Xcode a zkontrolujte, že se otevře bez chyb:
   ```bash
   open ios/*.xcodeproj
   # nebo pokud existuje workspace
   open ios/*.xcworkspace
   ```

### Krok 4: Přejmenování projektu v Xcode

**Pokud se projekt vygeneroval s jiným názvem než FCZlicin:**

1. V **Project Navigator** (levý panel) klikněte na **nejvyšší položku** - název projektu
2. Klikněte na název projektu znovu (nebo stiskněte Enter) - název se stane editovatelným
3. Změňte název na `FCZlicin`
4. Stiskněte **Enter** nebo klikněte mimo pole

### Krok 5: Potvrzení přejmenování

Xcode se zeptá: **"Rename project content items?"**

- ✅ **Zaškrtněte** "Rename project content items"
- Klikněte na **"Rename"**

Tím se automaticky přejmenují:
- Všechny reference v projektu
- Název targetu
- Název scheme
- Všechny související soubory

### Krok 6: Uložení a zavření Xcode

1. Uložte projekt: `Cmd + S` nebo `File → Save`
2. Zavřete Xcode

### Krok 7: Aktualizace CocoaPods

1. Přejděte do iOS adresáře:
   ```bash
   cd /Users/janfranc/Development/fczlicin-app/ios
   ```

2. Nainstalujte Pods:
   ```bash
   pod install
   ```

   Tím se vytvoří workspace a regenerují všechny soubory s novým názvem.

### Krok 8: Kontrola přejmenování

V terminálu zkontrolujte, že se soubory přejmenovaly:

```bash
cd /Users/janfranc/Development/fczlicin-app/ios
ls -la | grep FCZlicin
```

Měli byste vidět:
- `FCZlicin.xcodeproj`
- `FCZlicin/` (adresář)
- `FCZlicin.xcworkspace` (po pod install)

### Krok 9: Aktualizace Firebase konfigurace

1. Zkopírujte Firebase konfiguraci do nového adresáře:
   ```bash
   cd /Users/janfranc/Development/fczlicin-app
   npm run firebase:dev
   ```

2. Zkontrolujte, že soubor existuje:
   ```bash
   ls -la ios/FCZlicin/GoogleService-Info.plist
   ```

### Krok 10: Testování

1. Otevřete workspace v Xcode:
   ```bash
   cd /Users/janfranc/Development/fczlicin-app/ios
   open FCZlicin.xcworkspace
   ```

2. Zkuste build:
   - V Xcode: `Product → Build` (Cmd + B)
   - Nebo z terminálu:
     ```bash
     cd /Users/janfranc/Development/fczlicin-app
     npm run ios
     ```

## 🔍 Alternativní postup (pokud prebuild vytvoří jiný název)

Pokud `expo prebuild` vytvoří projekt s názvem `fczlicin-app` nebo podobně, můžete:

### Varianta 1: Přejmenovat před prebuildem

1. Upravte `app.config.js` - přidejte explicitní název iOS projektu (ale Expo to nepodporuje přímo)
2. Nebo použijte slug, který se mapuje na název projektu

### Varianta 2: Přejmenovat po prebuildu v Xcode

Postupujte podle Kroků 4-10 výše.

## ⚠️ Možné problémy a řešení

### Problém: Prebuild vytvoří projekt s jiným názvem
**Řešení:** 
- To je normální - Expo používá slug nebo název aplikace
- Přejmenujte projekt v Xcode podle Kroků 4-5

### Problém: Po prebuildu se projekt stále neotevře
**Řešení:**
- Zkontrolujte, že prebuild proběhl úspěšně
- Zkuste smazat `ios/` adresář a spustit prebuild znovu
- Zkontrolujte logy prebuildu pro chyby

### Problém: Xcode neumožňuje přejmenování
**Řešení:** 
- Zkontrolujte, že máte otevřený projekt (ne workspace)
- Zkuste zavřít a znovu otevřít Xcode
- Zkontrolujte, že nemáte otevřený projekt v jiném okně

### Problém: Po přejmenování se projekt nebuildí
**Řešení:**
- Spusťte `pod install` znovu
- Vyčistěte build folder: `Product → Clean Build Folder` (Shift + Cmd + K)
- Zkuste smazat `DerivedData` v Xcode preferences
- Spusťte `npx expo prebuild --clean` znovu

### Problém: Firebase konfigurace se nenačítá
**Řešení:**
- Spusťte `npm run firebase:dev` pro zkopírování konfigurace
- Zkontrolujte, že soubor existuje: `ios/FCZlicin/GoogleService-Info.plist`
- Zkontrolujte cestu v `app.config.js` - měla by být `'./ios/FCZlicin/GoogleService-Info.plist'`

## 📝 Poznámky

- Expo projekty potřebují `prebuild` pro vytvoření kompletních nativních projektů
- Název projektu se obvykle generuje z slug (`fczlicin-app`) nebo názvu aplikace
- Po přejmenování v Xcode se všechny reference aktualizují automaticky
- Workspace soubor (`.xcworkspace`) se vytváří při `pod install`

## ✅ Checklist

- [ ] Záloha projektu vytvořena
- [ ] Nekompletní iOS projekt odstraněn
- [ ] `npx expo prebuild --platform ios` spuštěn úspěšně
- [ ] Projekt se otevře v Xcode bez chyb
- [ ] Projekt přejmenován z aktuálního názvu na FCZlicin
- [ ] "Rename project content items" zaškrtnuto
- [ ] Xcode uložen a zavřen
- [ ] `pod install` spuštěn
- [ ] Firebase konfigurace zkopírována do nového adresáře
- [ ] Projekt se úspěšně buildí

---

**Po dokončení tohoto návodu by měl být iOS projekt kompletně vygenerován, přejmenován a všechny reference aktualizovány.**
