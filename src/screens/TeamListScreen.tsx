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
import { usePlayers, useTeams } from '../hooks/useFootballData';
import { LoadingSpinner, ErrorView, FilterModal } from '../components';
import { useTheme } from '../theme/ThemeProvider';
import type { RootStackParamList } from '../navigation/linking';
import type { Player, PlayersResponse } from '../api/footballEndpoints';
import { colors } from '../theme/colors';

import headerBg from 'assets/header-team-bg.png';

const TeamListScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [selectedTeam, setSelectedTeam] = useState<string>('1'); // Default: Muži A
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const { globalStyles } = useTheme();

  const { data: teams } = useTeams();
  const teamId = parseInt(selectedTeam, 10) || 1;
  const { data: players, loading: isLoading, error, refetch } = usePlayers(teamId);

  // Initialize with first team when teams load
  useEffect(() => {
    if (teams && teams.length > 0 && !selectedTeam) {
      setSelectedTeam(teams[0].id.toString());
    }
  }, [teams, selectedTeam]);

  const handleFilterApply = (_seasonId: string, teamId: string) => {
    setSelectedTeam(teamId);
    setFilterModalVisible(false);
  };

  const handleFilterOpen = () => {
    setFilterModalVisible(true);
  };

  const getTeamName = () => {
    if (!teams || teams.length === 0) return 'Načítání...';
    const team = teams.find(t => t.id.toString() === selectedTeam);
    return team?.name || 'Načítání...';
  };

  // Zobrazit celostránkový loader pouze při chybě
  if (error) {
    return <ErrorView error={new Error(error)} onRetry={refetch} />;
  }

  const renderPlayerCard = (player: Player) => (
    <TouchableOpacity 
      key={player.id} 
      style={styles.playerCard}
      onPress={() => navigation.navigate('PlayerDetail', { 
        playerId: player.id.toString(),
        teamId: selectedTeam 
      })}
      activeOpacity={0.7}
    >
      <View style={styles.playerInfo}>
        <Text style={[globalStyles.text, styles.playerName]}>{player.name}</Text>
        {player.birthYear && (
          <Text style={[globalStyles.caption, styles.playerAge]}>
            {new Date().getFullYear() - player.birthYear} let
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderPositionSection = (title: string, playerData: PlayersResponse[keyof PlayersResponse]) => (
    <View style={styles.section}>
      <Text style={[globalStyles.heading, styles.sectionTitle]}>{title}</Text>
      <View style={styles.playerGrid}>
        {playerData.map(player => renderPlayerCard(player))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Image 
          source={headerBg} 
          style={styles.headerImage}
          resizeMode="cover"
        />
        <View style={styles.headerOverlay}>
          <Text style={[globalStyles.heading, styles.headerTitle]}>Tým</Text>
          <View style={styles.headerBottom}>
            <View style={styles.headerInfo}>
              <Text style={[globalStyles.text, styles.headerTeam]}>{getTeamName()}</Text>
            </View>
            <TouchableOpacity style={styles.filterButton} onPress={handleFilterOpen}>
              <Text style={[globalStyles.caption, styles.filterButtonText]}>☰</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <LoadingSpinner inline size="large" />
        ) : (
          <>
            {players?.goalkeepers && players.goalkeepers.length > 0 && renderPositionSection('Brankáři', players.goalkeepers)}
            {players?.defenders && players.defenders.length > 0 && renderPositionSection('Obránci', players.defenders)}
            {players?.midfielders && players.midfielders.length > 0 && renderPositionSection('Záložníci', players.midfielders)}
            {players?.forwards && players.forwards.length > 0 && renderPositionSection('Útočníci', players.forwards)}
          </>
        )}
      </ScrollView>

      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        onApply={handleFilterApply}
        selectedSeason=""
        selectedTeam={selectedTeam}
        showSeasonFilter={false} // Skryjeme filtr sezóny
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
  headerBottom: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  headerInfo: {
    alignItems: 'flex-start',
  },
  headerTeam: {
    color: colors.white,
    fontWeight: 'bold',
  },
  filterButton: {
    backgroundColor: colors.overlayWhite20,
    padding: 8,
    borderRadius: 6,
  },
  filterButtonText: {
    color: colors.white,
  },
  content: {
    flex: 1,
    padding: 16,
    paddingBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: colors.brandBlue,
    marginBottom: 16,
  },
  playerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  playerCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontWeight: 'bold',
    color: colors.gray900,
    marginBottom: 4,
  },
  playerAge: {
    color: colors.gray700,
  },
});

export default TeamListScreen;
