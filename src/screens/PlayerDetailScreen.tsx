import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeProvider';
import { usePlayerById } from '../hooks/useFootballData';
import { LoadingSpinner, ErrorView } from '../components';
import type { RootStackParamList } from '../navigation/linking';
import type { PlayerDetail } from '../api/footballEndpoints';
import { colors } from '../theme/colors';

type PlayerDetailRouteProp = RouteProp<RootStackParamList, 'PlayerDetail'>;
type PlayerCompetition = NonNullable<PlayerDetail['competitions']>[number];

const PlayerDetailScreen: React.FC = () => {
  const route = useRoute<PlayerDetailRouteProp>();
  const { playerId, teamId } = route.params;
  const { globalStyles } = useTheme();

  const playerIdNum = parseInt(playerId, 10);
  const teamIdNum = parseInt(teamId, 10);
  const { data: player, loading: isLoading, error, refetch } = usePlayerById(playerIdNum, teamIdNum);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorView error={new Error(error)} onRetry={refetch} />;
  }

  if (!player) {
    return (
      <View style={styles.container}>
        <Text style={[globalStyles.text, styles.errorText]}>Hráč nebyl nalezen</Text>
      </View>
    );
  }

  const calculateAge = (birthYear: number) => {
    return new Date().getFullYear() - birthYear;
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[globalStyles.title, styles.playerName]}>{player.name}</Text>
        </View>

        <View style={styles.infoSection}>
          <Text style={[globalStyles.heading, styles.sectionTitle]}>Základní informace</Text>
          {player.position && (
            <View style={styles.infoRow}>
              <Text style={[globalStyles.text, styles.infoLabel]}>Pozice:</Text>
              <Text style={[globalStyles.text, styles.infoValue]}>{player.position}</Text>
            </View>
          )}
          {player.team && (
            <View style={styles.infoRow}>
              <Text style={[globalStyles.text, styles.infoLabel]}>Tým:</Text>
              <Text style={[globalStyles.text, styles.infoValue]}>{player.team}</Text>
            </View>
          )}
          {player.year && (
            <>
              <View style={styles.infoRow}>
                <Text style={[globalStyles.text, styles.infoLabel]}>Rok narození:</Text>
                <Text style={[globalStyles.text, styles.infoValue]}>{player.year}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[globalStyles.text, styles.infoLabel]}>Věk:</Text>
                <Text style={[globalStyles.text, styles.infoValue]}>{calculateAge(player.year)} let</Text>
              </View>
            </>
          )}
        </View>

        {player.competitions && player.competitions.length > 0 && (
          <View style={styles.statsSection}>
            <Text style={[globalStyles.heading, styles.sectionTitle]}>Statistiky za sezóny</Text>
            {player.competitions.map((competition: PlayerCompetition, index: number) => (
              <View key={index} style={styles.competitionCard}>
                <View style={styles.competitionHeader}>
                  <Text style={[globalStyles.text, styles.seasonName]}>
                    Sezóna {competition.seasonName}
                  </Text>
                  <Text style={[globalStyles.caption, styles.competitionName]}>
                    {competition.competitionName}
                  </Text>
                </View>
                
                <View style={styles.statsGrid}>
                  <View style={styles.statItem}>
                    <Text style={[globalStyles.title, styles.statValue]}>{competition.statistics.matches}</Text>
                    <Text style={[globalStyles.caption, styles.statLabel]}>Zápasy</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[globalStyles.title, styles.statValue]}>{competition.statistics.goals}</Text>
                    <Text style={[globalStyles.caption, styles.statLabel]}>Góly</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[globalStyles.title, styles.statValue]}>{competition.statistics.minutes}</Text>
                    <Text style={[globalStyles.caption, styles.statLabel]}>Minuty</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[globalStyles.title, styles.statValue]}>{competition.statistics.yellow_cards}</Text>
                    <Text style={[globalStyles.caption, styles.statLabel]}>Žluté</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[globalStyles.title, styles.statValue]}>{competition.statistics.red_cards}</Text>
                    <Text style={[globalStyles.caption, styles.statLabel]}>Červené</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray500,
  },
  playerName: {
    color: colors.brandBlue,
  },
  infoSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: colors.gray900,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray400,
  },
  infoLabel: {
    color: colors.gray700,
  },
  infoValue: {
    fontWeight: 'bold',
    color: colors.gray900,
  },
  statsSection: {
    marginBottom: 24,
  },
  competitionCard: {
    backgroundColor: colors.gray200,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.brandBlue,
  },
  competitionHeader: {
    marginBottom: 12,
  },
  seasonName: {
    fontWeight: 'bold',
    color: colors.brandBlue,
  },
  competitionName: {
    color: colors.gray700,
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    width: '18%',
    marginBottom: 8,
  },
  statValue: {
    fontWeight: 'bold',
    color: colors.brandBlue,
  },
  statLabel: {
    color: colors.gray700,
    marginTop: 4,
    textAlign: 'center',
  },
  errorText: {
    textAlign: 'center',
    marginTop: 50,
    color: colors.gray700,
  },
});

export default PlayerDetailScreen;
