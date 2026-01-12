import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

interface ErrorViewProps {
  error: Error;
  onRetry?: () => void;
}

const ErrorView: React.FC<ErrorViewProps> = ({ error, onRetry }) => {
  const { globalStyles } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>⚠️</Text>
      <Text style={[globalStyles.title, styles.title]}>Chyba při načítání</Text>
      <Text style={[globalStyles.text, styles.message]}>{error.message}</Text>
      {onRetry && (
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <Text style={[globalStyles.button, styles.retryText]}>Zkusit znovu</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontWeight: 'bold',
    color: '#FF0000',
    marginBottom: 8,
  },
  message: {
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#014fa1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

export default ErrorView;
