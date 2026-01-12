import React, { useMemo, memo } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

interface MatchCardProps {
  match: any;
}

const MatchCard: React.FC<MatchCardProps> = ({ match }) => {
  const { globalStyles } = useTheme();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('cs-CZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('cs-CZ', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const resultColor = useMemo(() => {
    // If status is not 'finished', check if it's scheduled or live
    // If status is undefined but scores exist, treat as finished
    const isFinished = match.status === 'finished' || (match.status !== 'scheduled' && match.status !== 'live' && match.homeScore != null && match.awayScore != null);
    
    if (!isFinished) {
      return match.status === 'scheduled' ? '#ffc107' : match.status === 'live' ? '#dc3545' : '#666666';
    }

    const isFCZlicinHome = match.homeTeam === 'FC Zličín';
    const isFCZlicinAway = match.awayTeam === 'FC Zličín';
    
    if (!isFCZlicinHome && !isFCZlicinAway) {
      return '#666666';
    }

    const homeScore = match.homeScore ?? 0;
    const awayScore = match.awayScore ?? 0;

    if (isFCZlicinHome) {
      if (homeScore > awayScore) {
        return '#28a745'; // Green for win
      } else if (homeScore < awayScore) {
        return '#dc3545'; // Red for loss
      } else {
        return '#014fa1'; // Blue for draw
      }
    } else {
      if (awayScore > homeScore) {
        return '#28a745'; // Green for win
      } else if (awayScore < homeScore) {
        return '#dc3545'; // Red for loss
      } else {
        return '#014fa1'; // Blue for draw
      }
    }
  }, [match.status, match.homeTeam, match.awayTeam, match.homeScore, match.awayScore]);

  return (
    <View style={styles.matchCard}>
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
            {match.round}.KOLO | {new Date(match.date).toLocaleDateString('cs-CZ', { weekday: 'long' }).toUpperCase()}
          </Text>
          <Text style={[globalStyles.caption, styles.matchDate]}>
            {formatDate(match.date)} {formatTime(match.date)}
          </Text>
          <Text 
            style={[globalStyles.title, styles.score, { color: resultColor }]} 
            numberOfLines={1}
          >
            {match.homeScore} : {match.awayScore}
          </Text>
          {match.competition && (
            <Text style={[globalStyles.caption, styles.competition]}>
              {match.competition}
            </Text>
          )}
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
    </View>
  );
};

const styles = StyleSheet.create({
  matchCard: {
    marginHorizontal: 16,
    marginVertical: 15,
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
    fontSize: 10,
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
    fontSize: 11,
  },
  score: {
    fontWeight: 'bold',
  },
  competition: {
    color: '#666666',
    fontSize: 10,
    fontStyle: 'italic',
  },
});

export default memo(MatchCard);
