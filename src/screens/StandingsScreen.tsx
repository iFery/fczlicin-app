import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity, 
  Image
} from 'react-native';
import { useStandings, useSeasons, useTeams, useCompetition, useCurrentSeason } from '../hooks/useFootballData';
import { LoadingSpinner, ErrorView, FilterModal, NoCompetitionView } from '../components';
import { useTheme } from '../theme/ThemeProvider';
import type { Standing } from '../api/footballEndpoints';
import { colors } from '../theme/colors';
import { analyticsService } from '../services/analytics';
import { AnalyticsEvent } from '../services/analyticsEvents';

import headerBg from 'assets/header-standings-bg.png';

const StandingsScreen: React.FC = () => {
  const { data: seasons } = useSeasons();
  const { data: teams, loading: teamsLoading } = useTeams();
  const { data: currentSeason } = useCurrentSeason();
  
  const [selectedSeason, setSelectedSeason] = useState<string>('');
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const { globalStyles } = useTheme();
  const lastViewRef = useRef<{ seasonId: string; teamId: string }>({ seasonId: '', teamId: '' });

  // Update selected season/team when data loads
  useEffect(() => {
    const seasonIds = seasons?.map((season) => season.id.toString()) ?? [];
    const teamIds = teams?.map((team) => team.id.toString()) ?? [];

    if (!selectedSeason) {
      if (currentSeason) {
        setSelectedSeason(currentSeason.id.toString());
      } else if (seasonIds.length > 0) {
        setSelectedSeason(seasonIds[0]);
      }
    } else if (seasonIds.length > 0 && !seasonIds.includes(selectedSeason)) {
      setSelectedSeason(currentSeason?.id.toString() || seasonIds[0]);
    }

    if (!selectedTeam) {
      if (teamIds.length > 0) {
        setSelectedTeam(teamIds[0]);
      }
    } else if (teamIds.length > 0 && !teamIds.includes(selectedTeam)) {
      setSelectedTeam(teamIds[0]);
    }
  }, [currentSeason, seasons, teams, selectedSeason, selectedTeam]);

  // Convert string IDs to numbers for hooks
  const teamId = parseInt(selectedTeam, 10) || 1;
  const seasonId = parseInt(selectedSeason, 10) || 22;

  const { data: standings, loading: isLoading, error, refetch } = useStandings(teamId, seasonId);
  const { data: competition, loading: competitionLoading, lastUpdated: competitionLastUpdated } = useCompetition(teamId, seasonId);

  const competitionValue = Array.isArray(competition) && competition.length > 0 
    ? competition[0]?.competition 
    : competition?.competition;

  // Získáme názvy týmu a sezóny z cache nebo použijeme výchozí hodnoty
  const getTeamName = () => {
    if (teamsLoading || !teams) return 'Načítání...';
    const team = teams.find(t => t.id.toString() === selectedTeam);
    return team?.name || 'Muži A'; // Fallback na výchozí tým
  };

  const getSeasonName = () => {
    if (!seasons || seasons.length === 0) return 'Načítání...';
    const season = seasons.find(s => s.id.toString() === selectedSeason);
    return season?.name || 'Načítání...';
  };


  const handleFilterApply = (seasonId: string, teamId: string) => {
    analyticsService.logEvent(AnalyticsEvent.STANDINGS_FILTER_APPLY, {
      season_id: seasonId,
      team_id: teamId,
      previous_season_id: selectedSeason,
      previous_team_id: selectedTeam,
    });
    setSelectedSeason(seasonId);
    setSelectedTeam(teamId);
  };

  const handleFilterOpen = () => {
    setFilterModalVisible(true);
  };

  // Show loading while competition is being fetched or hasn't been loaded yet
  // Check if competition is still loading OR if it hasn't been loaded yet (lastUpdated is null)
  // AND competition is null (which means it's still defaultData)
  const isCompetitionStillLoading = competitionLoading || (competitionLastUpdated === null && competition?.competition === null);
  const isInitialLoading = isCompetitionStillLoading || (isLoading && standings?.length === 0);

  useEffect(() => {
    if (!isInitialLoading && selectedSeason && selectedTeam) {
      const hasChanged =
        lastViewRef.current.seasonId !== selectedSeason ||
        lastViewRef.current.teamId !== selectedTeam;
      if (hasChanged) {
        analyticsService.logEvent(AnalyticsEvent.STANDINGS_VIEW, {
          season_id: selectedSeason,
          team_id: selectedTeam,
          competition: competitionValue ?? undefined,
        });
        lastViewRef.current = { seasonId: selectedSeason, teamId: selectedTeam };
      }
    }
  }, [isInitialLoading, selectedSeason, selectedTeam, competitionValue]);

  // Zobrazit celostránkový loader pouze při chybě
  if (error) {
    return <ErrorView error={new Error(error)} onRetry={refetch} />;
  }

  // Kontrola, zda tým v dané sezóně hrál nějakou soutěž
  // Only show NoCompetitionView if competition is loaded and is null
  if (!isCompetitionStillLoading && competitionValue === null) {
    return (
      <View style={styles.container}>
        {/* Záhlaví */}
        <View style={styles.header}>
          <Image 
            source={headerBg} 
            style={styles.headerImage}
            resizeMode="cover"
          />
          <View style={styles.headerOverlay}>
            <Text style={[globalStyles.heading, styles.headerTitle]}>Tabulka</Text>
            <View style={styles.headerBottom}>
              <View style={styles.headerInfo}>
                <Text style={[globalStyles.text, styles.headerTeam]}>{getTeamName()}</Text>
                <Text style={[globalStyles.caption, styles.headerSeason]}>
                  {(() => {
                    const seasonName = getSeasonName();
                    const competitionName = Array.isArray(competition) && competition.length > 0 
                      ? competition[0]?.competition 
                      : competition?.competition;
                    return `${seasonName}${competitionName ? ` | ${competitionName}` : ''}`;
                  })()}
                </Text>
              </View>
              <TouchableOpacity style={styles.filterButton} onPress={handleFilterOpen}>
                <Text style={[globalStyles.caption, styles.filterButtonText]}>☰</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Obsah s informací o neexistující soutěži */}
        <NoCompetitionView 
          teamName={getTeamName()} 
          seasonName={getSeasonName()}
          onOpenFilters={handleFilterOpen}
        />

        {/* Filter Modal */}
        <FilterModal
          visible={filterModalVisible}
          onClose={() => setFilterModalVisible(false)}
          onApply={handleFilterApply}
          selectedSeason={selectedSeason}
          selectedTeam={selectedTeam}
        />
      </View>
    );
  }

  const renderStandingItem = (item: Standing) => (
    <View key={item.team} style={[
      styles.standingRow,
      item.team === 'FC Zličín' && styles.fczlicinRow
    ]}>
      <View style={styles.positionContainer}>
        <Text style={[globalStyles.caption, styles.position]}>{item.position}</Text>
      </View>
      <Text style={[globalStyles.text, styles.teamName]}>{item.team}</Text>
      <Text style={[globalStyles.caption, styles.stats]}>{item.played}</Text>
      <Text style={[globalStyles.caption, styles.stats]}>{item.won}</Text>
      <Text style={[globalStyles.caption, styles.stats]}>{item.drawn}</Text>
      <Text style={[globalStyles.caption, styles.stats]}>{item.lost}</Text>
      <Text style={[globalStyles.caption, styles.goals]}>{item.goalsFor}:{item.goalsAgainst}</Text>
      <View style={styles.pointsContainer}>
        <Text style={[globalStyles.text, styles.points]}>{item.points}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Záhlaví */}
      <View style={styles.header}>
        <Image 
          source={headerBg} 
          style={styles.headerImage}
          resizeMode="cover"
        />
        <View style={styles.headerOverlay}>
          <Text style={[globalStyles.heading, styles.headerTitle]}>Tabulka</Text>
          <View style={styles.headerBottom}>
              <View style={styles.headerInfo}>
                <Text style={[globalStyles.text, styles.headerTeam]}>{getTeamName()}</Text>
                <Text style={[globalStyles.caption, styles.headerSeason]}>
                  {(() => {
                    const seasonName = getSeasonName();
                    const competitionName = Array.isArray(competition) && competition.length > 0 
                      ? competition[0]?.competition 
                      : competition?.competition;
                    return `${seasonName}${competitionName ? ` | ${competitionName}` : ''}`;
                  })()}
                </Text>
              </View>
            <TouchableOpacity style={styles.filterButton} onPress={handleFilterOpen}>
                <Text style={[globalStyles.caption, styles.filterButtonText]}>☰</Text>
              </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Tabulka */}
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {isInitialLoading || isLoading ? (
          <LoadingSpinner inline size="large" />
        ) : (
          <>
            <View style={styles.tableHeader}>
              <Text style={[globalStyles.caption, styles.headerPosition]}>#</Text>
              <Text style={[globalStyles.caption, styles.headerTeamTable]}>Tým</Text>
              <Text style={[globalStyles.caption, styles.headerZapasy]}>Z</Text>
              <Text style={[globalStyles.caption, styles.headerZapasy]}>V</Text>
              <Text style={[globalStyles.caption, styles.headerZapasy]}>R</Text>
              <Text style={[globalStyles.caption, styles.headerZapasy]}>P</Text>
              <Text style={[globalStyles.caption, styles.headerGoals]}>S</Text>
              <Text style={[globalStyles.caption, styles.headerPoints]}>B</Text>
            </View>

            {standings?.map((item) => renderStandingItem(item))}
          </>
        )}
      </ScrollView>

      {/* Filter Modal */}
      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        onApply={handleFilterApply}
        selectedSeason={selectedSeason}
        selectedTeam={selectedTeam}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray300,
  },
  header: {
    height: 200,
    position: 'relative',
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.overlay40,
    padding: 20,
  },
  headerBottom: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  headerTitle: {
    color: colors.white,
    textAlign: 'center',
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    transform: [{ translateY: -14 }],
    fontSize: 28,
  },
  headerInfo: {
    alignItems: 'flex-start',
  },
  headerTeam: {
    color: colors.white,
    fontWeight: 'bold',
  },
  headerSeason: {
    color: colors.white,
    opacity: 0.8,
  },
  filterButton: {
    backgroundColor: colors.overlayWhite20,
    padding: 8,
    borderRadius: 6,
  },
  filterButtonText: {
    color: colors.white,
  },
  scrollView: {
    flex: 1,
    paddingBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray500,
  },
  headerPosition: {
    flex: 1,
    textAlign: 'center',
    fontWeight: 'bold',
    color: colors.gray900,
  },
  headerTeamTable: {
    flex: 3,
    fontWeight: 'bold',
    color: colors.gray900,
  },
  headerZapasy: {
    flex: 0.5,
    textAlign: 'center',
    fontWeight: 'bold',
    color: colors.gray900,
  },
  headerGoals: {
    flex: 1,
    textAlign: 'center',
    fontWeight: 'bold',
    color: colors.gray900,
  },
  headerPoints: {
    flex: 1,
    textAlign: 'center',
    fontWeight: 'bold',
    color: colors.gray900,
  },
  standingRow: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray400,
    alignItems: 'center',
  },
  fczlicinRow: {
    backgroundColor: colors.infoLight,
  },
  positionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  position: {
    color: colors.black,
    fontWeight: 'bold',
  },
  teamName: {
    flex: 3,
    fontWeight: 'bold',
    color: colors.gray900,
    fontSize: 13,
  },
  stats: {
    flex: 0.5,
    textAlign: 'center',
    color: colors.gray700,
  },
  goals: {
    flex: 1,
    textAlign: 'center',
    color: colors.gray700,
  },
  pointsContainer: {
    flex: 1,
    alignItems: 'center',
  },
  points: {
    fontWeight: 'bold',
    color: colors.brandBlue,
    fontSize: 13,
  },
});

export default StandingsScreen;
