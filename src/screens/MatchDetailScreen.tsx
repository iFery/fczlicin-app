import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useMatchDetail, useMatchPlayerStats, useRoundResults } from '../hooks/useFootballData';
import { LoadingSpinner, ErrorView, TabView, MatchCard, MatchDetails, MatchPlayerStats, RoundResults } from '../components/index';
import { useTheme } from '../theme/ThemeProvider';
import type { RootStackParamList } from '../navigation/linking';
import { colors } from '../theme/colors';
import { analyticsService } from '../services/analytics';
import { AnalyticsEvent } from '../services/analyticsEvents';

type MatchDetailRouteProp = RouteProp<RootStackParamList, 'MatchDetail'>;

const MatchDetailScreen: React.FC = () => {
  const route = useRoute<MatchDetailRouteProp>();
  const { matchId, teamName, source } = route.params;
  const matchIdNum = parseInt(matchId, 10);
  const { data: match, loading: matchLoading, error: matchError } = useMatchDetail(matchIdNum);
  const { data: playerStats, loading: statsLoading, error: statsError } = useMatchPlayerStats(matchIdNum);
  const { data: roundResults, loading: roundLoading, error: roundError } = useRoundResults(matchIdNum);
  const { globalStyles } = useTheme();

  useEffect(() => {
    analyticsService.logEvent(AnalyticsEvent.MATCH_OPEN, {
      match_id: matchId,
      source: source || 'unknown',
    });
  }, [matchId, source]);

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
    ...(match
      ? [
          {
            key: 'details',
            title: 'Detail zápasu',
            component: <MatchDetails match={match} />,
          },
        ]
      : []),
    {
      key: 'stats',
      title: 'Statistiky',
      component: <MatchPlayerStats players={playerStats.players} match={match ?? undefined} />
    },
    {
      key: 'round',
      title: 'Další zápasy',
      component: <RoundResults matches={roundResults.matches} currentMatchId={matchIdNum} />
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
    backgroundColor: colors.gray300,
  },
  errorText: {
    color: colors.errorText,
    textAlign: 'center',
    marginTop: 50,
  },
});

export default MatchDetailScreen;
