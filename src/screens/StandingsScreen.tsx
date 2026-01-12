import React, { useState, useEffect } from 'react';
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

import headerBg from 'assets/header-standings-bg.png';

const StandingsScreen: React.FC = () => {
  const { data: seasons } = useSeasons();
  const { data: teams, loading: teamsLoading } = useTeams();
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
    if (currentSeason && currentSeason.id.toString() !== selectedSeason) {
      setSelectedSeason(currentSeason.id.toString());
    }
    if (teams && teams.length > 0 && teams[0].id.toString() !== selectedTeam) {
      setSelectedTeam(teams[0].id.toString());
    }
  }, [currentSeason, teams]);

  // Convert string IDs to numbers for hooks
  const teamId = parseInt(selectedTeam, 10) || 1;
  const seasonId = parseInt(selectedSeason, 10) || 22;

  const { data: standings, loading: isLoading, error, refetch } = useStandings(teamId, seasonId);
  const { data: competition, loading: competitionLoading, lastUpdated: competitionLastUpdated } = useCompetition(teamId, seasonId);


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
    setSelectedSeason(seasonId);
    setSelectedTeam(teamId);
  };

  const handleFilterOpen = () => {
    setFilterModalVisible(true);
  };

  // Zobrazit celostránkový loader pouze při chybě
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

  // Kontrola, zda tým v dané sezóně hrál nějakou soutěž
  // Only show NoCompetitionView if competition is loaded and is null
  const competitionValue = Array.isArray(competition) && competition.length > 0 
    ? competition[0]?.competition 
    : competition?.competition;
  if (competitionValue === null) {
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

  const renderStandingItem = (item: any, _index: number) => (
    <View key={item.team} style={[
      styles.standingRow,
      item.team === 'FC Zličín' && styles.fczlicinRow
    ]}>
      <View style={[styles.positionContainer]}>
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
        {isLoading ? (
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

            {standings?.map((item, index) => renderStandingItem(item, index))}
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
  scrollView: {
    flex: 1,
    paddingBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerPosition: {
    flex: 1,
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#333333',
  },
  headerTeamTable: {
    flex: 3,
    fontWeight: 'bold',
    color: '#333333',
  },
  headerZapasy: {
    flex: 0.5,
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#333333',
  },
  headerGoals: {
    flex: 1,
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#333333',
  },
  headerPoints: {
    flex: 1,
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#333333',
  },
  standingRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    alignItems: 'center',
  },
  fczlicinRow: {
    backgroundColor: '#E3F2FD',
  },
  positionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  position: {
    color: '#000',
    fontWeight: 'bold',
  },
  teamName: {
    flex: 3,
    fontWeight: 'bold',
    color: '#333333',
    fontSize: 13,
  },
  stats: {
    flex: 0.5,
    textAlign: 'center',
    color: '#666666',
  },
  goals: {
    flex: 1,
    textAlign: 'center',
    color: '#666666',
  },
  pointsContainer: {
    flex: 1,
    alignItems: 'center',
  },
  points: {
    fontWeight: 'bold',
    color: '#014fa1',
    fontSize: 13,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
});

export default StandingsScreen;
