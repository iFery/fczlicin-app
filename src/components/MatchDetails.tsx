import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, typography } from '../theme/ThemeProvider';

interface MatchDetailsProps {
  match: any;
}

const MatchDetails: React.FC<MatchDetailsProps> = ({ match }) => {
  const { globalStyles } = useTheme();

  const hasValidValue = (value: any): boolean => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (typeof value === 'number') return true;
    if (typeof value === 'boolean') return true;
    return String(value).trim().length > 0;
  };

  // Check if match is upcoming (not yet played)
  const isUpcoming = () => {
    const isScheduled = match.status === 'scheduled';
    const hasNoScore = (match.homeScore == null || match.homeScore === undefined) && 
                       (match.awayScore == null || match.awayScore === undefined);
    const isNotFinished = match.status !== 'finished' && match.status !== 'live';
    const isFutureDate = match.date ? new Date(match.date) > new Date() : false;
    
    return isScheduled || (hasNoScore && isNotFinished && isFutureDate);
  };

  if (isUpcoming()) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.placeholderContainer}>
          <View style={styles.placeholderContent}>
            <Ionicons name="calendar-outline" size={64} color="#CCCCCC" />
            <Text style={[styles.placeholderTitle, { fontFamily: typography.fontFamily.bold }]}>
              Zápas ještě nebyl odehrán
            </Text>
            <Text style={[styles.placeholderText, { fontFamily: typography.fontFamily.regular }]}>
              Detaily a statistiky budou k dispozici po skončení zápasu
            </Text>
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.detailsSection}>
        <Text style={[globalStyles.title, styles.sectionTitle]}>Detaily zápasu</Text>
        
        {hasValidValue(match.attendance) && (
          <View style={styles.detailRow}>
            <Text style={[globalStyles.text, styles.detailLabel]}>Návštěvnost:</Text>
            <Text style={[globalStyles.text, styles.detailValue]}>{match.attendance} diváků</Text>
          </View>
        )}

        {hasValidValue(match.goals) && (
          <View style={styles.detailRow}>
            <Text style={[globalStyles.text, styles.detailLabel]}>Góly:</Text>
            <Text style={[globalStyles.text, styles.detailValue]}>{match.goals}</Text>
          </View>
        )}

        {hasValidValue(match.yellowCards) && (
          <View style={styles.detailRow}>
            <Text style={[globalStyles.text, styles.detailLabel]}>Žluté karty:</Text>
            <Text style={[globalStyles.text, styles.detailValue]}>{match.yellowCards}</Text>
          </View>
        )}

        {hasValidValue(match.redCards) && (
          <View style={styles.detailRow}>
            <Text style={[globalStyles.text, styles.detailLabel]}>Červené karty:</Text>
            <Text style={[globalStyles.text, styles.detailValue]}>{match.redCards}</Text>
          </View>
        )}

        {hasValidValue(match.referees) && (
          <View style={styles.detailRow}>
            <Text style={[globalStyles.text, styles.detailLabel]}>Rozhodčí:</Text>
            <Text style={[globalStyles.text, styles.detailValue]}>{match.referees}</Text>
          </View>
        )}
      </View>

      {(hasValidValue(match.homeLineup) || hasValidValue(match.awayLineup)) && (
        <View style={styles.lineupsSection}>
          <Text style={[globalStyles.title, styles.sectionTitle]}>Sestavy týmů</Text>
          
          {hasValidValue(match.homeTeam) && (
            <View style={styles.lineupContainer}>
              <Text style={[globalStyles.text, styles.teamTitle]}>{match.homeTeam}</Text>
              {hasValidValue(match.homeLineup) && (
                <Text style={[globalStyles.text, styles.lineupText]}>{match.homeLineup}</Text>
              )}
            </View>
          )}

          {hasValidValue(match.awayTeam) && (
            <View style={styles.lineupContainer}>
              <Text style={[globalStyles.text, styles.teamTitle]}>{match.awayTeam}</Text>
              {hasValidValue(match.awayLineup) && (
                <Text style={[globalStyles.text, styles.lineupText]}>{match.awayLineup}</Text>
              )}
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  detailsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#014fa1',
    textAlign: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  detailLabel: {
    fontWeight: '600',
    color: '#666666',
    flex: 1,
  },
  detailValue: {
    flex: 2,
    textAlign: 'right',
  },
  lineupsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  lineupContainer: {
    marginBottom: 20,
  },
  teamTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#014fa1',
    marginBottom: 8,
  },
  lineupText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333333',
  },
  placeholderContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 40,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    minHeight: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderTitle: {
    fontSize: 20,
    color: '#666666',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  placeholderText: {
    fontSize: 16,
    color: '#999999',
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default MatchDetails;
