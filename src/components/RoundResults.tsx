import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { useNavigation } from '@react-navigation/native';

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
  const navigation = useNavigation();

  const handleMatchPress = (matchId: number) => {
    (navigation as any).navigate('MatchDetail', { matchId: matchId.toString() });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={[globalStyles.title, styles.headerTitle]}>
          Výsledky kola
        </Text>
      </View>

      {matches.map((match, index) => (
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
    color: '#014fa1',
    marginBottom: 4,
  },
  headerSubtitle: {
    color: '#666666',
    fontSize: 14,
  },
  matchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
  },
  currentMatch: {
    borderWidth: 2,
    borderColor: '#014fa1',
    backgroundColor: '#F8F9FA',
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
    color: '#333333',
  },
  scoreContainer: {
    flex: 1,
    alignItems: 'center',
  },
  score: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#014fa1',
  },
  currentMatchIndicator: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    alignItems: 'center',
  },
  currentMatchText: {
    color: '#014fa1',
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
    color: '#666666',
    textAlign: 'center',
  },
});

export default RoundResults;
