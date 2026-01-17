# Android Release Keystore

This directory contains the release signing keystore for Android builds.

## Setup

1. Place your `upload-keystore.jks` file in this directory
2. The keystore will be automatically copied to `android/app/` during prebuild
3. Configure your signing credentials in `android/app/keystore.properties`

## Security

- **DO NOT commit the keystore file to git** (it's in .gitignore)
- Keep a secure backup of your keystore file
- If you lose the keystore, you won't be able to update your app on Google Play

## File Structure

```
config/keystore/
  ├── upload-keystore.jks      (place your keystore here)
  └── keystore.properties      (place your signing credentials here)
```

The plugin will automatically copy both files to `android/app/` during prebuild.

## Setup keystore.properties

1. Edit `config/keystore/keystore.properties`
2. Fill in your actual values:
   - `MYAPP_UPLOAD_STORE_PASSWORD` - your keystore password
   - `MYAPP_UPLOAD_KEY_ALIAS` - your key alias (usually `upload-key`)
   - `MYAPP_UPLOAD_KEY_PASSWORD` - your key password
3. The file is gitignored and won't be committed
