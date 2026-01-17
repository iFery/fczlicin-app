import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useMatchDetail, useMatchPlayerStats, useRoundResults, useTeams } from '../hooks/useFootballData';
import { LoadingSpinner, ErrorView, TabView, MatchCard, MatchDetails, MatchPlayerStats, RoundResults } from '../components/index';
import { useTheme } from '../theme/ThemeProvider';

const MatchDetailScreen: React.FC = ({ route }: any) => {
  const { matchId, teamName } = route.params || {};
  const { data: match, loading: matchLoading, error: matchError } = useMatchDetail(parseInt(matchId));
  const { data: playerStats, loading: statsLoading, error: statsError } = useMatchPlayerStats(parseInt(matchId));
  const { data: roundResults, loading: roundLoading, error: roundError } = useRoundResults(parseInt(matchId));
  const { data: teams } = useTeams();
  const { globalStyles } = useTheme();

  // Try to get team name from route params, or from teams list based on match competition
  const getDisplayTeamName = (): string | undefined => {
    if (teamName) return teamName;
    
    // Try to find team from competition field or other match data
    // For now, return undefined and let MatchCard use fallback (day of week)
    return undefined;
  };

  if (matchLoading || statsLoading || roundLoading) {
    return <LoadingSpinner />;
  }

  if (matchError || statsError || roundError) {
    const errorMessage = matchError || statsError || roundError || 'Neznámá chyba';
    return <ErrorView error={new Error(typeof errorMessage === 'string' ? errorMessage : 'Neznámá chyba')} />;
  }

  if (!match) {
    return (
      <View style={styles.container}>
        <Text style={[globalStyles.text, styles.errorText]}>Zápas nebyl nalezen</Text>
      </View>
    );
  }

  const tabs = [
    {
      key: 'details',
      title: 'Detail zápasu',
      component: <MatchDetails match={match} />
    },
    {
      key: 'stats',
      title: 'Statistiky',
      component: <MatchPlayerStats players={playerStats?.players || []} match={match} />
    },
    {
      key: 'round',
      title: 'Další zápasy',
      component: <RoundResults matches={(roundResults as any)?.matches || []} currentMatchId={parseInt(matchId)} />
    }
  ];

  return (
    <View style={styles.container}>
      <MatchCard match={match} teamName={getDisplayTeamName()} />
      <TabView tabs={tabs} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  errorText: {
    color: '#FF0000',
    textAlign: 'center',
    marginTop: 50,
  },
});

export default MatchDetailScreen;
