import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

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
});

export default MatchDetails;
