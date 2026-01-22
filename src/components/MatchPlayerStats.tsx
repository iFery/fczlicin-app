import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, typography } from '../theme/ThemeProvider';
import type { Match, PlayerStat } from '../api/footballEndpoints';
import { colors } from '../theme/colors';

interface MatchPlayerStatsProps {
  players: PlayerStat[];
  match?: Match; // Optional match prop to check if it's upcoming
}

const MatchPlayerStats: React.FC<MatchPlayerStatsProps> = ({ players, match }) => {
  const { globalStyles } = useTheme();

  // Check if match is upcoming (not yet played)
  const isUpcoming = () => {
    if (!match) {
      // If no match prop, check if players array is empty as fallback
      return players.length === 0;
    }
    const isScheduled = match.status === 'scheduled';
    const hasNoScore = (match.homeScore == null || match.homeScore === undefined) && 
                       (match.awayScore == null || match.awayScore === undefined);
    const isNotFinished = match.status !== 'finished' && match.status !== 'live';
    const isFutureDate = match.date ? new Date(match.date) > new Date() : false;
    
    return isScheduled || (hasNoScore && isNotFinished && isFutureDate);
  };

  const sortedPlayers = [...players].sort((a, b) => b.minutes - a.minutes);
  const upcoming = isUpcoming();

  // Show placeholder if upcoming match or no stats available
  if (upcoming || players.length === 0) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.placeholderContainer}>
          <View style={styles.placeholderContent}>
            <Ionicons name="stats-chart-outline" size={64} color={colors.gray450} />
            <Text style={[styles.placeholderTitle, { fontFamily: typography.fontFamily.bold }]}>
              {upcoming ? 'Statistiky zatím nejsou k dispozici' : 'Statistiky hráčů nejsou k dispozici'}
            </Text>
            {upcoming ? (
              <Text style={[styles.placeholderText, { fontFamily: typography.fontFamily.regular }]}>
                Statistiky hráčů budou zobrazeny po skončení zápasu
              </Text>
            ) : (
              <Text style={[styles.placeholderText, { fontFamily: typography.fontFamily.regular }]}>
                Statistiky hráčů pro tento zápas nejsou k dispozici
              </Text>
            )}
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={[globalStyles.text, styles.headerCell, styles.nameCell]}>Hráč</Text>
        <Text style={[globalStyles.text, styles.headerCell]}>Minuty</Text>
        <Text style={[globalStyles.text, styles.headerCell]}>Góly</Text>
        <Text style={[globalStyles.text, styles.headerCell]}>ŽK</Text>
        <Text style={[globalStyles.text, styles.headerCell]}>ČK</Text>
      </View>

      {sortedPlayers.map((player, index) => (
        <View key={index} style={styles.row}>
          <Text style={[globalStyles.text, styles.cell, styles.nameCell]}>
            {player.name}
          </Text>
          <Text style={[globalStyles.text, styles.cell]}>
            {player.minutes}
          </Text>
          <Text style={[globalStyles.text, styles.cell]}>
            {player.goals}
          </Text>
          <Text style={[globalStyles.text, styles.cell]}>
            {player.yellowCards}
          </Text>
          <Text style={[globalStyles.text, styles.cell]}>
            {player.redCards}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    backgroundColor: colors.brandBlue,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  headerCell: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
    flex: 1,
  },
  nameCell: {
    flex: 2,
    textAlign: 'left',
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray400,
  },
  cell: {
    fontSize: 14,
    textAlign: 'center',
    flex: 1,
  },
  placeholderContainer: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 40,
    marginVertical: 16,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    minHeight: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderTitle: {
    fontSize: 20,
    color: colors.gray700,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  placeholderText: {
    fontSize: 16,
    color: colors.gray600,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
});

export default MatchPlayerStats;
