import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity, 
  Image
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMatchCalendar, useMatchResults, useSeasons, useTeams, useCompetition, useCurrentSeason } from '../hooks/useFootballData';
import { useTheme } from '../theme/ThemeProvider';
import Card from '../components/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorView from '../components/ErrorView';
import FilterModal from '../components/FilterModal';
import NoCompetitionView from '../components/NoCompetitionView';
import type { RootStackParamList } from '../navigation/linking';
import type { Match } from '../api/footballEndpoints';
import { colors } from '../theme/colors';
import { analyticsService } from '../services/analytics';
import { AnalyticsEvent } from '../services/analyticsEvents';

import headerBg from '../../assets/header-matches-bg.png';

const MatchesListScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [activeTab, setActiveTab] = useState<'calendar' | 'results'>('results');
  const { data: seasons } = useSeasons();
  const { data: teams } = useTeams();
  const { data: currentSeason } = useCurrentSeason();
  
  // Initialize with current season and first team, or defaults
  const defaultSeason = currentSeason?.id?.toString() || seasons?.[0]?.id?.toString() || '22';
  const defaultTeam = teams?.[0]?.id?.toString() || '1';
  
  const [selectedSeason, setSelectedSeason] = useState<string>(defaultSeason);
  const [selectedTeam, setSelectedTeam] = useState<string>(defaultTeam);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const { globalStyles } = useTheme();

  // Update selected season/team when data loads
  useEffect(() => {
    if (currentSeason && !selectedSeason) {
      setSelectedSeason(currentSeason.id.toString());
    }
    if (teams && teams.length > 0 && !selectedTeam) {
      setSelectedTeam(teams[0].id.toString());
    }
  }, [currentSeason, teams, selectedSeason, selectedTeam]);

  const { data: calendarMatches, loading: calendarLoading, error: calendarError, refetch: refetchCalendar } = useMatchCalendar(parseInt(selectedTeam), parseInt(selectedSeason));
  const { data: resultMatches, loading: resultsLoading, error: resultsError, refetch: refetchResults } = useMatchResults(parseInt(selectedTeam), parseInt(selectedSeason));
  const { data: competition, loading: competitionLoading, lastUpdated: competitionLastUpdated } = useCompetition(parseInt(selectedTeam), parseInt(selectedSeason));

  const selectedSeasonData = seasons?.find(season => season.id.toString() === selectedSeason);
  const isCurrentSeason = selectedSeasonData?.id === currentSeason?.id;
  const isOlderSeason = selectedSeasonData && selectedSeasonData.id < (currentSeason?.id || 0);

  useEffect(() => {
    if (isOlderSeason && activeTab === 'calendar') {
      setActiveTab('results');
    }
  }, [selectedSeason, isOlderSeason, activeTab]);

  const matches = activeTab === 'calendar' ? calendarMatches : resultMatches;
  const isLoading = activeTab === 'calendar' ? calendarLoading : resultsLoading;
  const error = activeTab === 'calendar' ? calendarError : resultsError;
  const refetch = activeTab === 'calendar' ? refetchCalendar : refetchResults;

  const getTeamName = () => {
    const team = teams?.find(t => t.id.toString() === selectedTeam);
    return team?.name || 'Načítání...';
  };

  const getSeasonName = () => {
    const season = seasons?.find(s => s.id.toString() === selectedSeason);
    return season?.name || 'Načítání...';
  };

  const handleFilterApply = (seasonId: string, teamId: string) => {
    analyticsService.logEvent(AnalyticsEvent.MATCHES_FILTER_APPLY, {
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

  if (error) {
    return <ErrorView error={new Error(error)} onRetry={refetch} />;
  }

  // Show loading while competition is being fetched or hasn't been loaded yet
  // Check if competition is still loading OR if it hasn't been loaded yet (lastUpdated is null)
  // AND competition is null (which means it's still defaultData)
  const isCompetitionStillLoading = competitionLoading || (competitionLastUpdated === null && competition?.competition === null);
  
  // Combine loading states - if competition OR matches are loading, show loading
  const isInitialLoading = isCompetitionStillLoading || (isLoading && matches?.length === 0);

  // Only show NoCompetitionView if competition is loaded and is null
  if (!isCompetitionStillLoading && competition?.competition === null) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Image 
            source={headerBg} 
            style={styles.headerImage}
            resizeMode="cover"
          />
          <View style={styles.headerOverlay}>
            <Text style={[globalStyles.heading, styles.headerTitle]}>Zápasy</Text>
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

        <NoCompetitionView 
          teamName={getTeamName()} 
          seasonName={getSeasonName()}
          onOpenFilters={handleFilterOpen}
        />

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

  const getResultColor = (match: Match) => {
    if (match.status !== 'finished') {
      switch (match.status) {
        case 'scheduled':
          return colors.warningStrong;
        case 'live':
          return colors.error;
        default:
          return colors.gray700;
      }
    }

    const isFCZlicinHome = match.homeTeam === 'FC Zličín';
    const isFCZlicinAway = match.awayTeam === 'FC Zličín';
    
    if (!isFCZlicinHome && !isFCZlicinAway) {
      return colors.gray700;
    }

    const homeScore = match.homeScore || 0;
    const awayScore = match.awayScore || 0;

    if (isFCZlicinHome) {
      if (homeScore > awayScore) {
        return colors.success;
      } else if (homeScore < awayScore) {
        return colors.error;
      } else {
        return colors.brandBlue;
      }
    } else {
      if (awayScore > homeScore) {
        return colors.success;
      } else if (awayScore < homeScore) {
        return colors.error;
      } else {
        return colors.brandBlue;
      }
    }
  };

  const groupMatchesByMonth = (matchData: Match[]) => {
    const grouped: Record<string, Match[]> = {};
    
    const sortedMatches = matchData?.sort((a, b) => {
      try {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      } catch (error) {
        console.error('Error sorting matches:', error);
        return 0;
      }
    }) || [];
    
    sortedMatches.forEach(match => {
      try {
        if (!match.date) {
          console.warn('Match without date:', match);
          return;
        }
        const date = new Date(match.date);
        const monthKey = `${date.toLocaleDateString('cs-CZ', { month: 'long', year: '2-digit' })}`;
        if (!grouped[monthKey]) grouped[monthKey] = [];
        grouped[monthKey].push(match);
      } catch (error) {
        console.error('Error processing match:', error, match);
      }
    });
    
    const sortedGrouped: Record<string, Match[]> = {};
    Object.keys(grouped)
      .sort((a, b) => {
        try {
          const dateA = new Date(sortedMatches.find(match => 
            new Date(match.date).toLocaleDateString('cs-CZ', { month: 'long', year: '2-digit' }) === a
          )?.date || 0);
          const dateB = new Date(sortedMatches.find(match => 
            new Date(match.date).toLocaleDateString('cs-CZ', { month: 'long', year: '2-digit' }) === b
          )?.date || 0);
          return dateB.getTime() - dateA.getTime();
        } catch (error) {
          console.error('Error sorting months:', error);
          return 0;
        }
      })
      .forEach(month => {
        sortedGrouped[month] = grouped[month];
      });
    
    return sortedGrouped;
  };

  const groupedMatches = groupMatchesByMonth(matches || []);

  const handleTabPress = (tab: 'calendar' | 'results') => {
    if (tab !== activeTab) {
      analyticsService.logEvent(AnalyticsEvent.MATCHES_TAB_SWITCH, {
        tab,
        season_id: selectedSeason,
        team_id: selectedTeam,
      });
      setActiveTab(tab);
    }
  };

  const renderMatchItem = (match: Match) => {
    try {
      if (!match || !match.id) {
        console.warn('Invalid match data:', match);
        return null;
      }
      
      const hasDetail = match.hasDetail !== false; // Default true pokud není specifikováno
      const canOpenDetail = activeTab === 'results' && hasDetail;
      
      const handleMatchPress = () => {
        if (!canOpenDetail) return;
        navigation.navigate('MatchDetail', {
          matchId: match.id.toString(),
          source: 'matches_list',
        });
      };

      return (
        <TouchableOpacity
          key={match.id}
          onPress={handleMatchPress}
          activeOpacity={1}
          disabled={activeTab === 'calendar' || !hasDetail}
        >
          <Card style={styles.matchCard}>
            <View style={styles.matchContent}>
              <View style={styles.teamContainer}>
                {match.homeTeamLogo ? (
                  <Image 
                    source={{ uri: match.homeTeamLogo }} 
                    style={styles.teamLogo}
                    resizeMode="contain"
                  />
                ) : (
                  <View style={[styles.teamLogo, styles.placeholderLogo]}>
                    <Text style={[globalStyles.caption, styles.logoText]}>{match.homeTeam?.toUpperCase()}</Text>
                  </View>
                )}
                <Text style={[globalStyles.text, styles.teamName]}>{match.homeTeam}</Text>
              </View>

              <View style={styles.matchInfo}>
                <Text style={[globalStyles.subtitle, styles.roundText]}>
                  {match.round ? `${match.round}.KOLO` : 'KOLO'} | {new Date(match.date).toLocaleDateString('cs-CZ', { weekday: 'long' }).toUpperCase()}
                </Text>
                <Text style={[globalStyles.caption, styles.matchDate]}>
                  {new Date(match.date).toLocaleDateString('cs-CZ', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  })} {new Date(match.date).toLocaleTimeString('cs-CZ', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </Text>
                {(match.homeScore != null && match.awayScore != null) ? (
                  <Text style={[globalStyles.title, styles.score, { color: getResultColor(match) }]}>
                    {match.homeScore} : {match.awayScore}
                  </Text>
                ) : null}
              </View>

              <View style={styles.teamContainer}>
                {match.awayTeamLogo ? (
                  <Image 
                    source={{ uri: match.awayTeamLogo }} 
                    style={styles.teamLogo}
                    resizeMode="contain"
                  />
                ) : (
                  <View style={[styles.teamLogo, styles.placeholderLogo]}>
                    <Text style={[globalStyles.caption, styles.logoText]}>{match.awayTeam?.toUpperCase()}</Text>
                  </View>
                )}
                <Text style={[globalStyles.text, styles.teamName]}>{match.awayTeam}</Text>
              </View>
            </View>
          </Card>
        </TouchableOpacity>
      );
    } catch (error) {
      console.error('Error rendering match item:', error, match);
      return null;
    }
  };

  const renderMonthSection = (month: string, monthMatches: Match[]) => (
    <View key={month} style={styles.monthSection}>
      <Text style={[globalStyles.heading, styles.monthTitle]}>{month}</Text>
      {monthMatches.map(renderMatchItem)}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image 
          source={headerBg} 
          style={styles.headerImage}
          resizeMode="cover"
        />
        <View style={styles.headerOverlay}>
          <Text style={[globalStyles.heading, styles.headerTitle]}>Zápasy</Text>
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

      {isCurrentSeason && (
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'calendar' && styles.activeTab]}
            onPress={() => handleTabPress('calendar')}
          >
            <Text style={[globalStyles.text, styles.tabText, activeTab === 'calendar' && styles.activeTabText]}>
              Kalendář
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'results' && styles.activeTab]}
            onPress={() => handleTabPress('results')}
          >
            <Text style={[globalStyles.text, styles.tabText, activeTab === 'results' && styles.activeTabText]}>
              Výsledky
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {isInitialLoading || isLoading ? (
          <LoadingSpinner inline size="large" />
        ) : (
          Object.entries(groupedMatches).map(([month, monthMatches]) => 
            renderMonthSection(month, monthMatches)
          )
        )}
      </ScrollView>

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
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: colors.gray300,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 6,
    backgroundColor: colors.white,
  },
  activeTab: {
    backgroundColor: colors.brandBlue,
  },
  tabText: {
    color: colors.gray700,
  },
  activeTabText: {
    color: colors.white,
  },
  scrollView: {
    flex: 1,
    paddingBottom: 20,
  },
  monthSection: {
    marginBottom: 20,
  },
  monthTitle: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    color: colors.gray900,
    backgroundColor: colors.white,
    marginBottom: 10,
    textTransform: 'capitalize'
  },
  matchCard: {
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 15,
    backgroundColor: colors.white,
    borderRadius: 12,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  matchContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  teamContainer: {
    alignItems: 'center',
    flex: 1,
  },
  teamLogo: {
    width: 50,
    height: 60,
    marginBottom: 8,
  },
  placeholderLogo: {
    backgroundColor: colors.brandBlue,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontWeight: 'bold',
    color: colors.white,
    textAlign: 'center',
  },
  teamName: {
    color: colors.gray900,
    textAlign: 'center',
    fontSize: 14,
  },
  matchInfo: {
    alignItems: 'center',
    flex: 2,
  },
  roundText: {
    fontWeight: 'bold',
    color: colors.brandBlue,
    marginBottom: 4,
    fontSize: 12,
  },
  matchDate: {
    color: colors.gray700,
    marginBottom: 8,
  },
  score: {
    fontWeight: 'bold',
  },
});

export default MatchesListScreen;
