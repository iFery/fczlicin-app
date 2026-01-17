#!/usr/bin/env node

/**
 * DEPRECATED: This script is no longer needed!
 * 
 * Release signing configuration is now handled automatically by the Expo config plugin:
 * plugins/withAndroidSigning.js
 * 
 * The plugin runs during prebuild, so no manual script is required.
 * 
 * This file is kept for reference/fallback purposes only.
 * 
 * Script to apply release signing configuration to build.gradle after expo prebuild
 * This ensures that custom signing config is preserved even after prebuild --clean
 * 
 * Usage:
 *   node scripts/apply-gradle-signing.js
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const buildGradlePath = path.join(rootDir, 'android', 'app', 'build.gradle');

if (!fs.existsSync(buildGradlePath)) {
  console.error(`❌ build.gradle not found at: ${buildGradlePath}`);
  console.error('   Run "expo prebuild" first');
  process.exit(1);
}

let content = fs.readFileSync(buildGradlePath, 'utf8');

// Check if changes are already applied
if (content.includes('def keystorePropertiesFile = file("keystore.properties")') && 
    content.includes('signingConfig signingConfigs.release')) {
  console.log('✅ Release signing configuration already applied');
  process.exit(0);
}

console.log('📝 Applying release signing configuration to build.gradle...');

// 1. Add Firebase Crashlytics plugin at the top (if not present)
if (!content.includes('apply plugin: "com.google.firebase.crashlytics"')) {
  content = content.replace(
    /apply plugin: "com\.facebook\.react"\n/,
    'apply plugin: "com.facebook.react"\napply plugin: "com.google.firebase.crashlytics"\n'
  );
}

// 2. Add keystore properties loading after plugins
if (!content.includes('def keystorePropertiesFile = file("keystore.properties")')) {
  const pluginSection = /apply plugin: "com\.google\.firebase\.crashlytics"\n\n/;
  if (pluginSection.test(content)) {
    content = content.replace(
      pluginSection,
      `apply plugin: "com.google.firebase.crashlytics"\n\n// Load keystore properties if the file exists\ndef keystorePropertiesFile = file("keystore.properties")\ndef keystoreProperties = new Properties()\nif (keystorePropertiesFile.exists()) {\n    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))\n}\n\n`
    );
  } else {
    // Fallback: add after react plugin
    content = content.replace(
      /apply plugin: "com\.facebook\.react"\n/,
      `apply plugin: "com.facebook.react"\napply plugin: "com.google.firebase.crashlytics"\n\n// Load keystore properties if the file exists\ndef keystorePropertiesFile = file("keystore.properties")\ndef keystoreProperties = new Properties()\nif (keystorePropertiesFile.exists()) {\n    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))\n}\n\n`
    );
  }
}

// 3. Add release signing config
if (!content.includes('signingConfigs.release') && !content.includes('release {')) {
  // Find the closing brace of debug signing config
  const debugConfigMatch = content.match(/(\s+debug \{[^}]+keyPassword 'android'[^}]*\})/s);
  if (debugConfigMatch) {
    const releaseConfig = `
        release {
            // Try to load from keystore.properties first, then fall back to project properties
            def storeFileProp = keystoreProperties['MYAPP_UPLOAD_STORE_FILE'] ?: findProperty('MYAPP_UPLOAD_STORE_FILE')
            if (storeFileProp) {
                storeFile file(storeFileProp)
                storePassword keystoreProperties['MYAPP_UPLOAD_STORE_PASSWORD'] ?: findProperty('MYAPP_UPLOAD_STORE_PASSWORD')
                keyAlias keystoreProperties['MYAPP_UPLOAD_KEY_ALIAS'] ?: findProperty('MYAPP_UPLOAD_KEY_ALIAS')
                keyPassword keystoreProperties['MYAPP_UPLOAD_KEY_PASSWORD'] ?: findProperty('MYAPP_UPLOAD_KEY_PASSWORD')
            }
        }`;
    content = content.replace(debugConfigMatch[0], debugConfigMatch[0] + releaseConfig);
  }
}

// 4. Change release buildType to use release signing
if (content.includes('signingConfig signingConfigs.debug') && content.includes('buildTypes')) {
  content = content.replace(
    /(\s+release \{[^}]*?signingConfig )signingConfigs\.debug/m,
    '$1signingConfigs.release'
  );
}

// 5. Add Firebase Crashlytics plugin at the end (if not present)
if (!content.includes("apply plugin: 'com.google.firebase.crashlytics'")) {
  content = content.replace(
    /(apply plugin: 'com\.google\.gms\.google-services')\n/,
    "$1\napply plugin: 'com.google.firebase.crashlytics'\n"
  );
}

fs.writeFileSync(buildGradlePath, content, 'utf8');
console.log('✅ Release signing configuration applied successfully');
