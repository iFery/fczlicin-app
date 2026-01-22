import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { colors } from '../theme/colors';

interface NoCompetitionViewProps {
  teamName: string;
  seasonName: string;
  onOpenFilters?: () => void;
}

const NoCompetitionView: React.FC<NoCompetitionViewProps> = ({ 
  teamName, 
  seasonName,
  onOpenFilters 
}) => {
  const { globalStyles } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Text style={styles.icon}>📅</Text>
          </View>
        </View>
        
        <Text style={[globalStyles.heading, styles.title]}>
          Žádná data pro tuto sezónu
        </Text>
        
        <Text style={[globalStyles.text, styles.message]}>
          Tým <Text style={styles.teamNameHighlight}>{teamName}</Text> v sezóně{' '}
          <Text style={styles.seasonNameHighlight}>{seasonName}</Text> nehrál žádnou soutěž.
        </Text>
        
        <Text style={[globalStyles.caption, styles.subtitle]}>
          Tým mohl být založen později, neúčastnil se soutěží v této sezóně, nebo data ještě nejsou k dispozici.
        </Text>

        {onOpenFilters && (
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={onOpenFilters}
            activeOpacity={0.8}
          >
            <Text style={[globalStyles.button, styles.actionButtonText]}>
              Vybrat jinou sezónu nebo tým
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    backgroundColor: colors.white,
  },
  content: {
    alignItems: 'center',
    maxWidth: 320,
  },
  iconContainer: {
    marginBottom: 24,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.gray050,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.gray025,
  },
  icon: {
    fontSize: 48,
  },
  title: {
    color: colors.gray900,
    textAlign: 'center',
    marginBottom: 16,
    fontSize: 22,
  },
  message: {
    color: colors.gray700,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 24,
    fontSize: 16,
  },
  teamNameHighlight: {
    fontWeight: '600',
    color: colors.brandBlue,
  },
  seasonNameHighlight: {
    fontWeight: '600',
    color: colors.brandBlue,
  },
  subtitle: {
    color: colors.gray600,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
    fontSize: 14,
  },
  actionButton: {
    backgroundColor: colors.brandBlue,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 8,
    minWidth: 200,
    alignItems: 'center',
    shadowColor: colors.brandBlue,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default NoCompetitionView;
