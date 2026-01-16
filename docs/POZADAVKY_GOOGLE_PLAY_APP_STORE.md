# Požadavky Google Play a App Store (2025-2026)

Tento dokument shrnuje aktuální a budoucí požadavky pro publikaci aplikací na Google Play a Apple App Store.

**Poslední aktualizace:** Leden 2026

---

## 📱 Google Play Store - Požadavky

### 🔢 Target API Level (Android SDK)

| Situace | Požadovaná verze | Datum platnosti |
|---------|-----------------|-----------------|
| **Nové aplikace** | Android 15 (API level **35**) nebo vyšší | Od 31. srpna 2025 |
| **Aktualizace existujících aplikací** | Android 15 (API level **35**) nebo vyšší | Od 31. srpna 2025 |
| **Existující aplikace** (zůstat viditelné) | Minimálně Android 14 (API level **34**) | Kontinuálně |
| **Wear OS, Android TV, Android Automotive OS** | Minimálně Android 14 (API level **34**) | Od 31. srpna 2025 |
| **Prodloužení termínu** | Možné do 1. listopadu 2025 | Na vyžádání |

#### Důležité poznámky:
- Aplikace s target API level 33 (Android 13) nebo nižší budou skryté novým uživatelům na novějších verzích Androidu
- Stávající uživatelé si mohou aplikace stále znovu instalovat
- Cílem je zajistit moderní bezpečnost, výkon, soukromí a kompatibilitu

### 🏗️ 64-bit architektura

| Požadavek | Datum platnosti | Poznámka |
|-----------|----------------|----------|
| **Nativní kód**: Podpora 32-bit i 64-bit | Od 1. srpna 2019 | Povinné pro aplikace s nativním kódem |
| **TV platformy** (Google TV/Android TV): Podpora 64-bit | Od 1. srpna 2026 | Musí obsahovat 64-bit verzi pokud je nativní kód |
| **16 KB stránky paměti**: Pro API level 35+ | Od 1. listopadu 2025 | Pokud cílíte na Android 15+ |
| **Zastavení 32-bit aplikací** na 64-bit zařízeních | Od 1. srpna 2021 | Aplikace pouze s 32-bit kódem nelze nainstalovat |

#### Co dělat:
- Ověřte pomocí APK Analyzer přítomnost 64-bit knihoven (`arm64-v8a`, `x86_64`)
- Pokud aplikace obsahuje nativní knihovny (`.so`), musí mít i 64-bit verzi
- Používejte Android App Bundles (AAB) pro optimální velikost

### 🔐 Data Safety Form

| Požadavek | Datum zavedení | Status |
|-----------|---------------|--------|
| **Vyplnění formuláře** | Povinné od 20. července 2022 | ✅ Povinné |
| **Privacy Policy** | Povinné i bez sběru dat | ✅ Povinné |
| **Mechanismus smazání účtu** | Pokud aplikace umožňuje vytváření účtů | ✅ Povinné |

#### Co musí formulář obsahovat:
1. Typy sbíraných dat (umístění, kontakty, fotografie, atd.)
2. Účel použití dat (funkčnost, analytika, reklama, atd.)
3. Zda se data sdílejí s třetími stranami
4. Zda jsou data zašifrována při přenosu
5. Zásady uchovávání a mazání dat
6. Webový odkaz pro smazání účtu (pokud je tvorba účtů možná)

#### Definice:
- **Sběr dat**: Data přenášející se mimo zařízení (k vám nebo třetím stranám)
- **Sdílení dat**: Předávání dat třetím stranám (včetně SDK, WebView pod vaší kontrolou)
- **Ephemerální zpracování**: Data pouze v paměti, neuchovávaná dlouhodobě

### 📦 Minimální SDK verze (minSdkVersion)

- Google Play **nepožaduje** univerzální minimální SDK verzi
- Některé Google SDK (např. Google Maps) vyžadují minimálně **API level 23** (Android 6.0 Marshmallow)
- Expo SDK 52+ zvýšilo `minSdkVersion` z 23 na **24**

---

## 🍎 Apple App Store - Požadavky

### 🔧 Xcode a iOS SDK

| Požadavek | Hodnota | Datum platnosti |
|-----------|---------|-----------------|
| **Xcode verze** | Xcode **16** nebo novější | Od 24. dubna 2025 |
| **iOS SDK** | iOS **18** SDK nebo novější | Od 24. dubna 2025 |
| **Budoucí požadavek** | iOS 26 SDK / Xcode 26 | Od dubna 2026 |

#### Minimum Deployment Target:
- Aplikace může podporovat starší iOS verze (např. iOS 15, 16, 17)
- Xcode 16 podporuje deployment target až do **iOS 12**
- Expo SDK 52+ zvýšilo minimální podporovanou verzi z iOS 13.4 na **iOS 15.1**

### 🔒 Privacy Manifest (iOS 17+)

| Požadavek | Datum zavedení | Status |
|-----------|---------------|--------|
| **Privacy Manifest soubor** (`PrivacyInfo.xcprivacy`) | Od 1. května 2024 | ✅ Povinné |
| **Deklarace Required Reason APIs** | Od 1. května 2024 | ✅ Povinné |
| **Podpis SDK** (u vybraných SDK) | Od 1. května 2024 | ✅ Povinné |

#### Co obsahuje Privacy Manifest:
1. **NSPrivacyAccessedAPITypes**: Seznam citlivých API, která aplikace používá
2. **Důvodové kódy**: Povolené důvody pro použití těchto API
3. **Deklarace SDK**: Informace o třetích SDK a jejich použití dat

#### Required Reason APIs:
- Systémové API pro přístup k informacím o zařízení
- API pro přístup k souborům a časovým razítkům
- UserDefaults a další datové úložiště

#### Seznam SDK vyžadujících manifest:
- Apple identifikovala přibližně **86 běžně používaných SDK**
- Každé z těchto SDK musí mít svůj vlastní privacy manifest
- Pokud SDK manifest nemá, musíte ho pokrýt v manifestu aplikace

### 💳 StoreKit 2 (In-App Purchases)

| Požadavek | Hodnota | Poznámka |
|-----------|---------|----------|
| **Minimální podpora** | iOS 15+ | StoreKit 2 vyžaduje iOS 15+ |
| **StoreKit 1 deprecace** | Deprecated | Nové funkce pouze ve StoreKit 2 |
| **SHA-256 certifikáty** | Od 24. ledna 2025 | Receipt signing přešlo na SHA-256 |

#### Co dělat:
- Migrujte na StoreKit 2 API pro nový vývoj
- Ověřte, že receipt validation podporuje SHA-256 certifikáty
- Nebo použijte server-side verifikaci (App Store Server API)
- Aktualizujte třetí SDK (např. RevenueCat) na verze podporující StoreKit 2

### 📋 App Store Privacy Nutrition Labels

- Popis sbíraných dat a jejich použití
- Typy dat (umístění, kontakty, atd.)
- Účely použití
- Sdílení s třetími stranami
- Tracking aktivit

---

## 🚀 React Native / Expo Specifické Požadavky

### Expo SDK Verze

| Verze Expo | Android Target API | iOS Deployment Target | Status |
|------------|-------------------|----------------------|--------|
| **SDK 52+** | API 35+ | iOS 15.1+ | ✅ Doporučeno pro 2025 |
| **SDK 51** | API 34+ | iOS 13.4+ | ⚠️ Vyžaduje upgrade |
| **SDK 50** | API 34+ | iOS 13.4+ | ⚠️ Vyžaduje upgrade |

#### Současný stav projektu:
- **Expo SDK**: 51
- **Doporučení**: Upgrade na Expo SDK 52 nebo novější pro splnění všech požadavků 2025

### Build Konfigurace

#### Android (app/build.gradle):
```gradle
android {
    compileSdkVersion 35  // Minimálně 35 od 31.8.2025
    targetSdkVersion 35   // Minimálně 35 od 31.8.2025
    minSdkVersion 24      // Expo SDK 52+ vyžaduje 24+
}
```

#### iOS (Podfile / Info.plist):
- Xcode 16+ s iOS 18 SDK
- Deployment target: minimálně iOS 15.1 (Expo SDK 52+)

---

## ⏰ Časová osa požadavků

### ✅ Aktuálně platné (2025-2026)

| Datum | Platforma | Požadavek |
|-------|-----------|-----------|
| **24. ledna 2025** | iOS | SHA-256 receipt signing |
| **24. dubna 2025** | iOS | Xcode 16 + iOS 18 SDK povinné |
| **31. srpna 2025** | Android | Target API level 35 pro nové aplikace a aktualizace |
| **1. listopadu 2025** | Android | 16 KB stránky paměti pro API 35+ |
| **1. listopadu 2025** | Android | Prodloužení termínu pro target API 35 (konec) |

### 🔮 Budoucí požadavky

| Datum | Platforma | Požadavek |
|-------|-----------|-----------|
| **Duben 2026** | iOS | iOS 26 SDK / Xcode 26 povinné |
| **1. srpna 2026** | Android (TV) | 64-bit podpora pro Google TV/Android TV |

---

## ✅ Akční plán - Co je třeba udělat

### 🔴 Kritické (do 31. srpna 2025)

1. **Android Target API Level**
   - [ ] Upgrade target API level na **35** (Android 15)
   - [ ] Otestovat kompatibilitu s Android 15
   - [ ] Ověřit podporu 16 KB stránek paměti (pokud máte nativní kód)

2. **Expo SDK Upgrade**
   - [ ] Upgrade z Expo SDK 51 na **Expo SDK 52+**
   - [ ] Ověřit kompatibilitu všech závislostí
   - [ ] Aktualizovat `minSdkVersion` na 24+

### 🟡 Důležité (již platné)

3. **iOS Build Requirements**
   - [ ] Zajistit buildy s **Xcode 16** a **iOS 18 SDK**
   - [ ] Ověřit, že deployment target je alespoň iOS 15.1

4. **Privacy Manifest (iOS)**
   - [ ] Vytvořit/aktualizovat `PrivacyInfo.xcprivacy`
   - [ ] Deklarovat všechny Required Reason APIs
   - [ ] Ověřit, že všechny SDK mají vlastní manifesty

5. **Data Safety Form (Google Play)**
   - [ ] Vyplnit/aktualizovat formulář v Play Console
   - [ ] Zajistit Privacy Policy
   - [ ] Implementovat mechanismus smazání účtu (pokud je potřeba)

6. **StoreKit (pokud používáte IAP)**
   - [ ] Migrovat na StoreKit 2
   - [ ] Ověřit SHA-256 certificate support v receipt validation

### 🟢 Kontinuální

7. **64-bit Support (Android)**
   - [ ] Ověřit podporu 64-bit architektur
   - [ ] Připravit se na TV požadavky (srpen 2026)

8. **Testování**
   - [ ] Testovat na nejnovějších verzích OS
   - [ ] Testovat na starších podporovaných verzích
   - [ ] Ověřit funkčnost po upgradech

---

## 📚 Užitečné odkazy

### Google Play
- [Target API Level Requirements](https://developer.android.com/google/play/requirements/target-sdk)
- [64-bit Architecture Support](https://developer.android.com/games/optimize/64-bit)
- [Data Safety Form Guide](https://support.google.com/googleplay/android-developer/answer/10787469)

### Apple App Store
- [Upcoming Requirements](https://developer.apple.com/news/upcoming-requirements/)
- [Privacy Manifest Documentation](https://developer.apple.com/documentation/bundleresources/privacy_manifest_files)
- [StoreKit 2 Documentation](https://developer.apple.com/documentation/storekit)

### Expo
- [Expo SDK 52 Changelog](https://expo.dev/changelog/2024-11-12-sdk-52)
- [Expo Build Requirements](https://docs.expo.dev/versions/latest)

---

## 📝 Poznámky

- Tento dokument by měl být pravidelně aktualizován, protože požadavky se mohou měnit
- Před každým release zkontrolujte aktuální stav požadavků
- Některé požadavky mohou mít výjimky pro specifické typy aplikací (např. Wear OS, TV)
- Pokud potřebujete prodloužení termínu, kontaktujte příslušný store včas

---

**Datum vytvoření:** Leden 2026  
**Autor:** Dokumentace požadavků aplikace FC Zlicin
