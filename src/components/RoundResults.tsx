import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { colors } from '../theme/colors';

interface Match {
  id: number;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  date: string;
}

interface RoundResultsProps {
  matches: Match[];
  currentMatchId?: number;
}

const RoundResults: React.FC<RoundResultsProps> = ({ matches, currentMatchId }) => {
  const { globalStyles } = useTheme();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={[globalStyles.title, styles.headerTitle]}>
          Výsledky kola
        </Text>
      </View>

      {matches.map((match) => (
        <View
          key={match.id}
          style={[
            styles.matchCard,
            currentMatchId === match.id && styles.currentMatch
          ]}
        >
          <View style={styles.matchContent}>
            <View style={styles.teamContainer}>
              <Text style={[globalStyles.text, styles.teamName]}>{match.homeTeam}</Text>
            </View>

            <View style={styles.scoreContainer}>
              <Text style={[globalStyles.title, styles.score]}>
                {match.homeScore}:{match.awayScore}
              </Text>
            </View>

            <View style={styles.teamContainer}>
              <Text style={[globalStyles.text, styles.teamName]}>{match.awayTeam}</Text>
            </View>
          </View>

          {currentMatchId === match.id && (
            <View style={styles.currentMatchIndicator}>
              <Text style={[globalStyles.text, styles.currentMatchText]}>
                Aktuální zápas
              </Text>
            </View>
          )}
        </View>
      ))}

      {matches.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={[globalStyles.text, styles.emptyText]}>
            Žádné další zápasy kola nejsou k dispozici
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 15,
  },
  header: {
    marginBottom: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.brandBlue,
    marginBottom: 4,
  },
  matchCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: colors.black,
  },
  currentMatch: {
    borderWidth: 2,
    borderColor: colors.brandBlue,
    backgroundColor: colors.gray200,
  },
  matchContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  teamContainer: {
    flex: 1,
    alignItems: 'center',
  },
  teamName: {
    fontWeight: '600',
    fontSize: 14,
    textAlign: 'center',
    color: colors.gray900,
  },
  scoreContainer: {
    flex: 1,
    alignItems: 'center',
  },
  score: {
    fontWeight: 'bold',
    fontSize: 16,
    color: colors.brandBlue,
  },
  currentMatchIndicator: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.gray500,
    alignItems: 'center',
  },
  currentMatchText: {
    color: colors.brandBlue,
    fontWeight: '600',
    fontSize: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: colors.gray700,
    textAlign: 'center',
  },
});

export default RoundResults;
