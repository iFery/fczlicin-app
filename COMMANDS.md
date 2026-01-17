# Příkazy pro vývoj a build

## Vývoj

### `npm start`
Spustí Expo dev server pro development.

### `npm run android`
Lokální Android build s DEV Firebase config.

### `npm run ios`
Lokální iOS build s DEV Firebase config.

### `npm run web`
Spustí webovou verzi aplikace.

### `npm run run:android`
Stejné jako `npm run android` (alias).

### `npm run run:ios`
Stejné jako `npm run ios` (alias).

---

## Firebase konfigurace

### `npm run firebase:dev`
Zkopíruje DEV Firebase config do nativních projektů.

### `npm run firebase:prod`
Zkopíruje PROD Firebase config do nativních projektů.

---

## Buildy

### `npm run build:aab`
Vytvoří Android AAB (App Bundle) pro Google Play s PROD Firebase config.

### `npm run build:android`
EAS build pro Android (cloud build).

### `npm run build:ios`
EAS build pro iOS (cloud build).

### `npm run build:all`
EAS build pro Android i iOS (cloud build).

---

## Testy

### `npm test`
Spustí Jest testy.

### `npm run test:watch`
Spustí Jest testy v watch módu.

### `npm run test:coverage`
Spustí Jest testy s coverage reportem.

### `npm run test:unit`
Spustí pouze unit testy.

### `npm run test:integration`
Spustí pouze integration testy.

### `npm run test:ci`
Spustí testy pro CI/CD prostředí.

---

## E2E testy (Detox)

### `npm run test:e2e`
Spustí E2E testy pomocí Detox.

### `npm run test:e2e:build`
Vytvoří build pro E2E testy.
