import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

interface Player {
  name: string;
  minutes: number;
  goals: number;
  yellowCards: number;
  redCards: number;
}

interface MatchPlayerStatsProps {
  players: Player[];
}

const MatchPlayerStats: React.FC<MatchPlayerStatsProps> = ({ players }) => {
  const { globalStyles } = useTheme();

  const sortedPlayers = [...players].sort((a, b) => b.minutes - a.minutes);

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

      {sortedPlayers.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={[globalStyles.text, styles.emptyText]}>
            Statistiky hráčů nejsou k dispozici
          </Text>
        </View>
      )}
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
    backgroundColor: '#014fa1',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  headerCell: {
    color: '#FFFFFF',
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
    borderBottomColor: '#F0F0F0',
  },
  cell: {
    fontSize: 14,
    textAlign: 'center',
    flex: 1,
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

export default MatchPlayerStats;
