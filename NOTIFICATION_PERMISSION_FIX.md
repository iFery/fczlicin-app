# Oprava: Notifikace se znovu zobrazují při spuštění

## Problém
- Měl jsi notifikace již povolené
- Spustil jsi aplikaci a znova se ti zeptala na notifikace (což by nemělo)

## Příčina
Aplikace kontrolovala pouze **interní flag v store** (`notificationPromptShown` a `lastPromptDate`), ale **NEKONTROLOVALA aktuální permission status z OS**.

Logika byla:
1. Při spuštění se kontroluje: "Už jsem dnes zobrazil dialog?" 
2. Pokud ne → zobraz dialog pro notifikace
3. **Ale:** Nezáleží na tom, že OS už říkal "permission granted"!

## Řešení
V `App.tsx` jsme přidali **dodatečnou kontrolu aktuálního OS permission statusu**:

```typescript
// Zkontroluj actual permission status z OS PŘED zobrazením dialogu
const { status: actualPermissionStatus } = await Notifications.getPermissionsAsync();

if (actualPermissionStatus === 'granted') {
  // Permission je již povoleno → NEZOBRAZUJ dialog
  console.log('Notification permission already granted, skipping prompt');
  return;
}
```

## Jak to teď funguje

1. **Při prvním spuštění:**
   - App kontroluje: "Je povoleno?" → Ne
   - App zobrazí: NotificationPermissionScreen
   - Uživatel klikne: "Povolit notifikace"
   - App uloží flag: `notificationPromptShown = true`, `lastPromptDate = dnes`

2. **Při dalších spuštěních DNES:**
   - App kontroluje: "Už jsem dnes zobrazil dialog?" → Ano
   - App NEZOBRAZÍ dialog

3. **Při spuštění ZÍTRA:**
   - App kontroluje: "Už jsem dnes zobrazil dialog?" → Ne (reset daily)
   - **NOVÁ logika:** App kontroluje: "Je permission povoleno?" → Ano!
   - App NEZOBRAZÍ dialog (protože permission je již granted)

## Soubory které byly změněny
- `App.tsx` - Přidána kontrola `Notifications.getPermissionsAsync()` v useEffect pro zobrazení notifikační obrazovky

## Testování
Chcete-li otestovat:
1. Odinstalujte aplikaci
2. Spusťte znova
3. Povolte notifikace
4. Zavřete aplikaci a spusťte ji znova
5. Notifikační dialog by se **NEMĚL** zobrazit podruhé
