/**
 * OfflineBlockedScreen - Fullscreen blocking screen when app cannot start
 * Shown when offline and no cached data is available
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Linking,
  Platform,
} from 'react-native';
import { useBootstrap } from '../providers/BootstrapProvider';
import { useTheme } from '../theme/ThemeProvider';

export function OfflineBlockedScreen() {
  const { retry } = useBootstrap();
  const { globalStyles } = useTheme();

  const handleOpenSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      
      <View style={styles.content}>
        <Text style={[globalStyles.heading, styles.title]}>Jste offline</Text>
        
        <Text style={[globalStyles.text, styles.description]}>
          Aplikace potřebuje při prvním spuštění připojení k internetu.{'\n'}
          Jakmile se data jednou načtou, aplikace bude fungovat i bez připojení.
        </Text>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.primaryButton} onPress={retry}>
            <Text style={[globalStyles.button, styles.primaryButtonText]}>Zkusit znovu</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={handleOpenSettings}>
            <Text style={[globalStyles.text, styles.secondaryButtonText]}>Otevřít nastavení připojení</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#014fa1',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    color: '#CCCCCC',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  actions: {
    width: '100%',
    maxWidth: 320,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#014fa1',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#014fa1',
  },
  secondaryButtonText: {
    color: '#014fa1',
    fontSize: 16,
    fontWeight: '600',
  },
});





