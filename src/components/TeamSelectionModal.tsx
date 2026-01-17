import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import { useTeams } from '../hooks/useFootballData';
import type { Team } from '../api/footballEndpoints';
import { invalidateCache } from '../utils/cacheManager';
import { CACHE_KEY_PATTERNS } from '../config/cacheConfig';

const { height } = Dimensions.get('window');

interface TeamSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  selectedTeamIds: number[];
  onSave: (teamIds: number[]) => void;
}

const TeamSelectionModal: React.FC<TeamSelectionModalProps> = ({
  visible,
  onClose,
  selectedTeamIds,
  onSave,
}) => {
  const { globalStyles } = useTheme();
  const { data: teams, loading, error, refetch } = useTeams();
  const insets = useSafeAreaInsets();
  const [localSelectedIds, setLocalSelectedIds] = useState<number[]>(selectedTeamIds);
  const [hasRefetched, setHasRefetched] = useState(false);

  // Reset local selection when modal opens
  useEffect(() => {
    if (visible) {
      setLocalSelectedIds(selectedTeamIds);
      setHasRefetched(false);
    }
  }, [visible, selectedTeamIds, teams]);

  // Force refetch when modal opens if no teams (invalidate cache first if empty)
  useEffect(() => {
    if (visible && !hasRefetched) {
      const teamsArray = Array.isArray(teams) ? teams : [];
      
      // If we have no teams, invalidate cache and force refetch once
      if (teamsArray.length === 0 && !loading) {
        setHasRefetched(true);
        // Invalidate cache first to force fresh fetch
        invalidateCache(CACHE_KEY_PATTERNS.TEAMS)
          .then(() => refetch())
          .catch(() => {
            // Ignore refetch errors
          });
      }
    }
  }, [visible, teams, loading, error, refetch, hasRefetched]);

  const handleToggleTeam = (teamId: number) => {
    setLocalSelectedIds((prev) => {
      if (prev.includes(teamId)) {
        return prev.filter((id) => id !== teamId);
      } else {
        return [...prev, teamId];
      }
    });
  };

  const handleSave = () => {
    onSave(localSelectedIds);
    onClose();
  };

  const handleCancel = () => {
    setLocalSelectedIds(selectedTeamIds);
    onClose();
  };

  // Group teams by category - ensure teams is an array
  const teamsArray = Array.isArray(teams) ? teams : [];
  
  const teamsByCategory = teamsArray.reduce(
    (acc, team) => {
      const category = team.category === 'seniors' ? 'seniors' : 'youth';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(team);
      return acc;
    },
    {} as Record<string, Team[]>
  );

  const renderTeamItem = (team: Team, index: number, array: Team[]) => {
    const isSelected = localSelectedIds.includes(team.id);
    const isLast = index === array.length - 1;
    return (
      <TouchableOpacity
        key={team.id}
        style={[
          styles.teamItem, 
          isSelected && styles.teamItemSelected,
          !isLast && styles.teamItemSpacing
        ]}
        onPress={() => handleToggleTeam(team.id)}
        activeOpacity={0.7}
      >
        <View style={styles.teamItemContent}>
          <View style={[styles.checkbox, isSelected && styles.checkboxSelected, { marginRight: 12 }]}>
            {isSelected && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
          </View>
          <Text style={[globalStyles.text, styles.teamName, isSelected && styles.teamNameSelected]}>
            {team.name}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const selectedCount = localSelectedIds.length;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1} 
          onPress={onClose}
        />
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={[globalStyles.heading, styles.headerTitle]}>Vybrat týmy</Text>
              {selectedCount > 0 && (
                <View style={[styles.badge, { marginLeft: 12 }]}>
                  <Text style={styles.badgeText}>{selectedCount}</Text>
                </View>
              )}
            </View>
            <TouchableOpacity 
              onPress={onClose} 
              style={styles.closeButton} 
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={24} color="#333333" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#014fa1" />
              <Text style={[globalStyles.caption, styles.loadingText]}>
                Načítání týmů...
              </Text>
            </View>
          ) : error ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="alert-circle-outline" size={48} color="#FF4444" />
              <Text style={[globalStyles.text, styles.emptyText]}>
                Chyba při načítání týmů
              </Text>
              <Text style={[globalStyles.caption, styles.emptyText, { marginTop: 8, fontSize: 12 }]}>
                {error}
              </Text>
              <TouchableOpacity 
                style={styles.retryButton} 
                onPress={() => refetch()}
                activeOpacity={0.7}
              >
                <Ionicons name="refresh" size={18} color="#014fa1" style={{ marginRight: 8 }} />
                <Text style={styles.retryButtonText}>Zkusit znovu</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.contentWrapper}>
              <ScrollView 
                style={styles.content} 
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled={true}
              >
              {Object.keys(teamsByCategory).length > 0 ? (
                Object.entries(teamsByCategory).map(([category, categoryTeams]) => (
                  <View key={category} style={styles.categorySection}>
                    <View style={styles.categoryHeader}>
                      <View style={styles.categoryIcon}>
                        <Ionicons 
                          name={category === 'seniors' ? 'people' : 'people-outline'} 
                          size={18} 
                          color="#014fa1" 
                        />
                      </View>
                      <Text style={[globalStyles.heading, styles.categoryTitle, { marginLeft: 10 }]}>
                        {category === 'seniors' ? 'Muži' : 'Mládež'}
                      </Text>
                    </View>
                    <View style={styles.teamsList}>
                      {categoryTeams.map((team, index, array) => renderTeamItem(team, index, array))}
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyContainer}>
                  <Ionicons name="football-outline" size={48} color="#666" />
                  <Text style={[globalStyles.text, styles.emptyText]}>
                    Žádné týmy k dispozici
                  </Text>
                  <Text style={[globalStyles.caption, styles.emptyText, { marginTop: 8, fontSize: 12 }]}>
                    {teamsArray.length === 0 ? 'Týmy se nenačetly' : 'Žádné týmy nebyly nalezeny'}
                  </Text>
                  <TouchableOpacity 
                    style={styles.retryButton} 
                    onPress={() => refetch()}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="refresh" size={18} color="#014fa1" style={{ marginRight: 8 }} />
                    <Text style={styles.retryButtonText}>Zkusit znovu</Text>
                  </TouchableOpacity>
                </View>
              )}
              </ScrollView>
            </View>
          )}

          {/* Footer */}
          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            <View style={styles.footerInfo}>
              <Text style={[globalStyles.caption, styles.footerText]}>
                {selectedCount === 0 
                  ? 'Vyberte alespoň jeden tým' 
                  : selectedCount === 1
                  ? '1 tým vybrán'
                  : `${selectedCount} týmů vybráno`}
              </Text>
            </View>
            <View style={styles.footerButtons}>
              <TouchableOpacity 
                style={[styles.footerButton, styles.cancelButton]} 
                onPress={handleCancel} 
                activeOpacity={0.7}
              >
                <Text style={[globalStyles.button, styles.cancelButtonText]}>Zrušit</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.footerButton, 
                  styles.saveButton,
                  selectedCount === 0 && styles.saveButtonDisabled
                ]} 
                onPress={handleSave}
                disabled={selectedCount === 0}
                activeOpacity={0.7}
              >
                <Text style={[
                  globalStyles.button, 
                  styles.saveButtonText,
                  selectedCount === 0 && styles.saveButtonTextDisabled
                ]}>
                  Uložit
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.9,
    flexDirection: 'column',
    flexShrink: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    flexShrink: 0,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    color: '#333333',
    fontSize: 24,
    fontWeight: '700',
  },
  badge: {
    backgroundColor: '#014fa1',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    paddingHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Rajdhani-SemiBold',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentWrapper: {
    height: height * 0.6,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 8,
  },
  loadingContainer: {
    padding: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#666666',
    marginTop: 16,
  },
  categorySection: {
    marginBottom: 32,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(1, 79, 161, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryTitle: {
    color: '#014fa1',
    fontSize: 18,
    fontWeight: '700',
  },
  teamsList: {
    // gap is not supported in React Native, use marginBottom on children instead
  },
  teamItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  teamItemSpacing: {
    marginBottom: 8,
  },
  teamItemSelected: {
    backgroundColor: 'rgba(1, 79, 161, 0.08)',
    borderColor: '#014fa1',
  },
  teamItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#CCCCCC',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#014fa1',
    borderColor: '#014fa1',
  },
  teamName: {
    color: '#333333',
    fontSize: 16,
    flex: 1,
  },
  teamNameSelected: {
    fontWeight: '600',
    color: '#014fa1',
  },
  emptyContainer: {
    padding: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#666666',
    marginTop: 16,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(1, 79, 161, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#014fa1',
  },
  retryButtonText: {
    color: '#014fa1',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    backgroundColor: '#F9F9F9',
    flexShrink: 0,
  },
  footerInfo: {
    marginBottom: 16,
  },
  footerText: {
    color: '#666666',
    textAlign: 'center',
    fontSize: 14,
  },
  footerButtons: {
    flexDirection: 'row',
  },
  footerButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#E0E0E0',
    marginRight: 12,
  },
  cancelButtonText: {
    color: '#333333',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#014fa1',
  },
  saveButtonDisabled: {
    backgroundColor: '#E0E0E0',
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonTextDisabled: {
    color: '#999999',
  },
});

export default TeamSelectionModal;
