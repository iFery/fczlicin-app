import React, { createContext, useContext, ReactNode } from 'react';
import { StyleSheet, TextStyle, ViewStyle } from 'react-native';

export const typography = {
  fontFamily: {
    regular: 'Rajdhani-Regular',
    medium: 'Rajdhani-Medium',
    semiBold: 'Rajdhani-SemiBold',
    bold: 'Rajdhani-Bold',
  },
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
};

interface GlobalStyles {
  heading: TextStyle;
  title: TextStyle;
  subtitle: TextStyle;
  text: TextStyle;
  caption: TextStyle;
  button: TextStyle;
}

const globalStyles: GlobalStyles = StyleSheet.create({
  text: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.md,
    color: '#333333',
  },
  heading: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.lg,
    color: '#333333',
  },
  title: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xl,
    color: '#333333',
  },
  subtitle: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.md,
    color: '#666666',
  },
  caption: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.sm,
    color: '#666666',
  },
  button: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.md,
    color: '#FFFFFF',
  },
});

interface ThemeContextType {
  globalStyles: GlobalStyles;
}

const ThemeContext = createContext<ThemeContextType>({
  globalStyles,
});

export const useTheme = () => useContext(ThemeContext);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  return (
    <ThemeContext.Provider value={{ globalStyles }}>
      {children}
    </ThemeContext.Provider>
  );
};
