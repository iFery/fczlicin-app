# 🔍 Analýza Nepoužívaných Souborů

## Screens (Obrazovky)

### ❓ **PartnersScreen.tsx** - PODEZŘELÉ
- **Cesta:** `src/screens/PartnersScreen.tsx`
- **Status:** Je v navigaci, ale **NENÍ nikde volán** `navigate('Partners')`
- **Používá:** `usePartners` hook
- **Je v:** TabNavigator, linking.ts, deepLinkService.ts
- **Otázka:** Používá se tato stránka? Je připravená pro deep linking, ale není v UI menu?

### ❓ **FAQScreen.tsx** - PODEZŘELÉ
- **Cesta:** `src/screens/FAQScreen.tsx`
- **Status:** Je v navigaci, ale **NENÍ nikde volán** `navigate('FAQ')`
- **Používá:** `useFAQ` hook
- **Je v:** TabNavigator, linking.ts, deepLinkService.ts
- **Otázka:** Používá se tato stránka? Je připravená pro deep linking, ale není v UI menu?

### ❓ **MapScreen.tsx** - PODEZŘELÉ
- **Cesta:** `src/screens/MapScreen.tsx`
- **Status:** Je v navigaci, ale **NENÍ nikde volán** `navigate('Map')`
- **Používá:** `react-native-image-pan-zoom`
- **Je v:** TabNavigator, linking.ts, deepLinkService.ts
- **Otázka:** Používá se tato stránka? Je připravená pro deep linking, ale není v UI menu?

### ✅ **NewsScreen.tsx** - POUŽÍVÁ SE
- **Cesta:** `src/screens/NewsScreen.tsx`
- **Status:** ✅ Volá se z `InfoScreen.tsx` → `navigate('News')`

### ✅ **SettingsScreen.tsx** - POUŽÍVÁ SE
- **Cesta:** `src/screens/SettingsScreen.tsx`
- **Status:** ✅ Volá se z `InfoScreen.tsx` → `navigate('Settings')`

### ✅ **DebugScreen.tsx** - POUŽÍVÁ SE
- **Cesta:** `src/screens/DebugScreen.tsx`
- **Status:** ✅ Volá se z `InfoScreen.tsx` → `navigate('Debug')`

---

## Hooks

### ❓ **usePartners.ts** - PODEZŘELÉ
- **Cesta:** `src/hooks/usePartners.ts`
- **Status:** Používá se pouze v `PartnersScreen.tsx`, který není volán
- **Otázka:** Pokud se PartnersScreen nepoužívá, pak se ani tento hook nepoužívá

### ❓ **useFAQ.ts** - PODEZŘELÉ
- **Cesta:** `src/hooks/useFAQ.ts`
- **Status:** Používá se pouze v `FAQScreen.tsx`, který není volán
- **Otázka:** Pokud se FAQScreen nepoužívá, pak se ani tento hook nepoužívá

---

## API Endpoints

### ❓ **partnersApi** v `endpoints.ts` - PODEZŘELÉ
- **Status:** Používá se pouze v `usePartners` hooku, který není používán
- **Otázka:** Pokud se PartnersScreen nepoužívá, pak se ani tento API endpoint nepoužívá

### ❓ **faqApi** v `endpoints.ts` - PODEZŘELÉ
- **Status:** Používá se pouze v `useFAQ` hooku, který není používán
- **Otázka:** Pokud se FAQScreen nepoužívá, pak se ani tento API endpoint nepoužívá

---

## Preload Service

### ❓ **preloadPartners()** v `preloadService.ts` - PODEZŘELÉ
- **Status:** Načítá partners data, ale pokud se PartnersScreen nepoužívá, není potřeba
- **Otázka:** Je potřeba preloadovat partners data?

### ❓ **preloadFAQ()** v `preloadService.ts` - PODEZŘELÉ
- **Status:** Načítá FAQ data, ale pokud se FAQScreen nepoužívá, není potřeba
- **Otázka:** Je potřeba preloadovat FAQ data?

---

## Komponenty

### ✅ Všechny komponenty v `/components` se zdají být použity

---

## Shrnutí

### Screens k potvrzení:
1. **PartnersScreen.tsx** - není volán z UI
2. **FAQScreen.tsx** - není volán z UI
3. **MapScreen.tsx** - není volán z UI

### Hooks k potvrzení:
1. **usePartners.ts** - používá se pouze v nepoužívaném screenu
2. **useFAQ.ts** - používá se pouze v nepoužívaném screenu

### API k potvrzení:
1. **partnersApi** - používá se pouze v nepoužívaném hooku
2. **faqApi** - používá se pouze v nepoužívaném hooku

### Preload funkce k potvrzení:
1. **preloadPartners()** - preloaduje nepoužívaná data
2. **preloadFAQ()** - preloaduje nepoužívaná data

---

**Poznámka:** Všechny tyto soubory jsou připravené pro deep linking (jsou v `linking.ts` a `deepLinkService.ts`), ale nejsou volány z UI. Možná jsou připravené pro budoucí použití nebo jsou dostupné pouze přes deep links.
