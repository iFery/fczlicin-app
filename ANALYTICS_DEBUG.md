# 🔍 Firebase Analytics - DebugView a Testování

## ⏱ Latenční doby

Firebase Analytics má různé latence podle typu zobrazení:

| Typ zobrazení | Latenční doba |
|---------------|---------------|
| **DebugView** (vývoj) | ⚡ Téměř v reálném čase (sekundy) |
| **Odeslání z zařízení** | 📤 Do ~1 hodiny (batching) |
| **Zobrazení v konzoli** | 📊 3-24 hodin |
| **Finální data** | ✅ 24-48 hodin |

## 🚀 DebugView - Okamžité testování

DebugView umožňuje vidět eventy **téměř v reálném čase** během vývoje.

### Android - Zapnutí DebugView

1. **Připojte zařízení nebo emulátor**
2. **Spusťte ADB příkaz:**
   ```bash
   adb shell setprop debug.firebase.analytics.app cz.fczlicin.app
   ```
3. **Restartujte aplikaci**
4. **Otevřete Firebase Console → Analytics → DebugView**

### iOS - Zapnutí DebugView

1. **V Xcode:**
   - Otevřete projekt
   - Edit Scheme → Run → Arguments
   - Přidejte argument: `-FIRDebugEnabled`
2. **Nebo přes terminál:**
   ```bash
   # Spusťte aplikaci s argumentem
   xcodebuild -workspace ios/FCZlin.xcworkspace \
     -scheme FCZlin \
     -configuration Debug \
     -FIRDebugEnabled
   ```
3. **Otevřete Firebase Console → Analytics → DebugView**

### Vypnutí DebugView

**Android:**
```bash
adb shell setprop debug.firebase.analytics.app .none.
```

**iOS:**
- Odstraňte argument `-FIRDebugEnabled` z Xcode Scheme

## 📊 Sledované Eventy

Aplikace loguje následující eventy pro permissions:

- `permission_request_clicked` - Uživatel klikl na tlačítko pro povolení
- `permission_granted` - Permissions byly povolené
- `permission_denied` - Permissions byly zamítnuté
- `permission_skipped` - Uživatel klikl na "Možná později"
- `permission_settings_clicked` - Uživatel klikl na "Otevřít nastavení"

### Metadata eventů:

- `permission_type`: Typ permission (např. "notifications")
- `source`: Zdroj akce (např. "notification_permission_screen", "settings_screen")
- `trigger`: Co spustilo akci (např. "toggle_switch")

## 🧪 Testování v Development

V development módu se eventy také vypisují do konzole:

```typescript
import { analyticsService } from './services/analytics';

// Tato metoda vypíše event i do konzole (pouze v __DEV__)
analyticsService.logEventWithDebug('test_event', { test: 'value' });
```

## 📝 Poznámky

- **DebugView funguje pouze na vývojových zařízeních**
- **Produkční buildy používají standardní batching (1 hodina)**
- **Eventy se mohou zobrazit s prodlevou až 48 hodin v produkčních reportech**
- **Pro okamžité testování vždy používejte DebugView**

## 🔗 Užitečné odkazy

- [Firebase Analytics DebugView](https://firebase.google.com/docs/analytics/debugview)
- [React Native Firebase Analytics](https://rnfirebase.io/analytics/usage)
