import React, { useMemo, memo } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import type { Match } from '../api/footballEndpoints';
import { colors } from '../theme/colors';

interface MatchCardProps {
  match: Match;
  teamName?: string; // Optional team name (e.g., "Muži A", "Muži B")
}

const MatchCard: React.FC<MatchCardProps> = ({ match, teamName }) => {
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
      return match.status === 'scheduled' ? colors.warningStrong : match.status === 'live' ? colors.error : colors.gray700;
    }

    const isFCZlicinHome = match.homeTeam === 'FC Zličín';
    const isFCZlicinAway = match.awayTeam === 'FC Zličín';
    
    if (!isFCZlicinHome && !isFCZlicinAway) {
      return colors.gray700;
    }

    const homeScore = match.homeScore ?? 0;
    const awayScore = match.awayScore ?? 0;

    if (isFCZlicinHome) {
      if (homeScore > awayScore) {
        return colors.success; // Green for win
      } else if (homeScore < awayScore) {
        return colors.error; // Red for loss
      } else {
        return colors.brandBlue; // Blue for draw
      }
    } else {
      if (awayScore > homeScore) {
        return colors.success; // Green for win
      } else if (awayScore < homeScore) {
        return colors.error; // Red for loss
      } else {
        return colors.brandBlue; // Blue for draw
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
            {match.round ? `${match.round}.` : ''}KOLO {teamName ? `| ${teamName.toUpperCase()}` : `| ${new Date(match.date).toLocaleDateString('cs-CZ', { weekday: 'long' }).toUpperCase()}`}
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
    fontSize: 10,
  },
  teamName: {
    fontWeight: 'bold',
    color: colors.gray900,
    textAlign: 'center',
    fontSize: 12,
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
    fontSize: 11,
  },
  score: {
    fontWeight: 'bold',
  },
  competition: {
    color: colors.gray700,
    fontSize: 10,
    fontStyle: 'italic',
  },
});

export default memo(MatchCard);
