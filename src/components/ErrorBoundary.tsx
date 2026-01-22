/**
 * Error Boundary component to catch React render errors
 */

import React, { Component, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../theme/colors';

type CrashlyticsServiceType = typeof import('../services/crashlytics').crashlyticsService;

// Lazy import crashlyticsService to avoid Firebase initialization during module import
let crashlyticsService: CrashlyticsServiceType | null = null;
let crashlyticsServicePromise: Promise<CrashlyticsServiceType | null> | null = null;
const getCrashlyticsService = async (): Promise<CrashlyticsServiceType | null> => {
  if (crashlyticsService) {
    return crashlyticsService;
  }
  if (!crashlyticsServicePromise) {
    crashlyticsServicePromise = import('../services/crashlytics')
      .then((module) => {
        crashlyticsService = module.crashlyticsService;
        return crashlyticsService;
      })
      .catch((error) => {
        console.warn('⚠️ [ErrorBoundary.tsx] Failed to load crashlyticsService:', error);
        return null;
      });
  }
  return crashlyticsServicePromise;
};

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to Crashlytics (lazy loaded)
    getCrashlyticsService()
      .then((service) => {
        if (service) {
          service.recordError(error);
          service.log(`ErrorBoundary: ${errorInfo.componentStack}`);
        }
      })
      .catch((e) => {
        console.warn('⚠️ [ErrorBoundary] Failed to log to Crashlytics:', e);
      });
    
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <Text style={styles.title}>Něco se pokazilo</Text>
          <Text style={styles.message}>
            Omlouváme se za nepříjemnosti. Aplikace narazila na neočekávanou chybu.
          </Text>
          {__DEV__ && this.state.error && (
            <Text style={styles.errorText}>{this.state.error.message}</Text>
          )}
          <TouchableOpacity style={styles.button} onPress={this.handleReset}>
            <Text style={styles.buttonText}>Zkusit znovu</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: colors.white,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: colors.black,
  },
  message: {
    fontSize: 16,
    color: colors.gray700,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  errorText: {
    fontSize: 12,
    color: colors.gray600,
    fontFamily: 'monospace',
    marginBottom: 24,
    textAlign: 'center',
  },
  button: {
    backgroundColor: colors.iosBlue,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});





