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
import { useMatchCalendar, useMatchResults, useSeasons, useTeams, useCompetition, useCurrentSeason } from '../hooks/useFootballData';
import { useTheme } from '../theme/ThemeProvider';
import Card from '../components/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorView from '../components/ErrorView';
import FilterModal from '../components/FilterModal';
import NoCompetitionView from '../components/NoCompetitionView';

import headerBg from '../../assets/header-matches-bg.png';

const MatchesListScreen: React.FC = () => {
  const navigation = useNavigation();
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
  
  if (isCompetitionStillLoading) {
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
                  {getSeasonName()}
                </Text>
              </View>
              <TouchableOpacity style={styles.filterButton} onPress={handleFilterOpen}>
                <Text style={[globalStyles.caption, styles.filterButtonText]}>☰</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <LoadingSpinner inline size="large" />
        </View>
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

  // Only show NoCompetitionView if competition is loaded and is null
  if (competition?.competition === null) {
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

  const getResultColor = (match: any) => {
    if (match.status !== 'finished') {
      switch (match.status) {
        case 'scheduled':
          return '#ffc107';
        case 'live':
          return '#dc3545';
        default:
          return '#666666';
      }
    }

    const isFCZlicinHome = match.homeTeam === 'FC Zličín';
    const isFCZlicinAway = match.awayTeam === 'FC Zličín';
    
    if (!isFCZlicinHome && !isFCZlicinAway) {
      return '#666666';
    }

    const homeScore = match.homeScore || 0;
    const awayScore = match.awayScore || 0;

    if (isFCZlicinHome) {
      if (homeScore > awayScore) {
        return '#28a745';
      } else if (homeScore < awayScore) {
        return '#dc3545';
      } else {
        return '#014fa1';
      }
    } else {
      if (awayScore > homeScore) {
        return '#28a745';
      } else if (awayScore < homeScore) {
        return '#dc3545';
      } else {
        return '#014fa1';
      }
    }
  };

  const groupMatchesByMonth = (matchData: any[]) => {
    const grouped: { [key: string]: any[] } = {};
    
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
    
    const sortedGrouped: { [key: string]: any[] } = {};
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

  const renderMatchItem = (match: any) => {
    try {
      if (!match || !match.id) {
        console.warn('Invalid match data:', match);
        return null;
      }
      
      return (
        <TouchableOpacity
          key={match.id}
          onPress={() => activeTab === 'results' ? (navigation as any).navigate('MatchDetail', { matchId: match.id.toString() }) : null}
          activeOpacity={activeTab === 'results' ? 0.7 : 1}
          disabled={activeTab === 'calendar'}
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
                <Text style={[globalStyles.title, styles.score, { color: getResultColor(match) }]}>
                  {match.homeScore} : {match.awayScore}
                </Text>
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

  const renderMonthSection = (month: string, monthMatches: any[]) => (
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
            onPress={() => setActiveTab('calendar')}
          >
            <Text style={[globalStyles.text, styles.tabText, activeTab === 'calendar' && styles.activeTabText]}>
              Kalendář
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'results' && styles.activeTab]}
            onPress={() => setActiveTab('results')}
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
        {isLoading ? (
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
    backgroundColor: '#F5F5F5',
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
    backgroundColor: 'rgba(0,0,0,0.4)',
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
    color: '#FFFFFF',
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
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  headerSeason: {
    color: '#FFFFFF',
    opacity: 0.8,
  },
  filterButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 8,
    borderRadius: 6,
  },
  filterButtonText: {
    color: '#FFFFFF',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#F5F5F5',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 6,
    backgroundColor: '#FFF',
  },
  activeTab: {
    backgroundColor: '#014fa1',
  },
  tabText: {
    color: '#666666',
  },
  activeTabText: {
    color: '#FFFFFF',
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
    color: '#333333',
    backgroundColor: '#FFFFFF',
    marginBottom: 10,
    textTransform: 'capitalize'
  },
  matchCard: {
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
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
    backgroundColor: '#014fa1',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  teamName: {
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
    fontSize: 12,
  },
  matchInfo: {
    alignItems: 'center',
    flex: 2,
  },
  roundText: {
    fontWeight: 'bold',
    color: '#014fa1',
    marginBottom: 4,
    fontSize: 12,
  },
  matchDate: {
    color: '#666666',
    marginBottom: 8,
  },
  score: {
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
});

export default MatchesListScreen;
