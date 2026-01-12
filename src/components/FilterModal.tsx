import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Modal, 
  StyleSheet, 
  ScrollView,
  Dimensions 
} from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import SelectBox from './SelectBox';
import { useSeasons, useTeams } from '../hooks/useFootballData';

const { height } = Dimensions.get('window');

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (seasonId: string, teamId: string) => void;
  selectedSeason: string;
  selectedTeam: string;
  showSeasonFilter?: boolean;
}

const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  onClose,
  onApply,
  selectedSeason,
  selectedTeam,
  showSeasonFilter = true
}) => {
  const [localSelectedSeason, setLocalSelectedSeason] = useState(selectedSeason);
  const [localSelectedTeam, setLocalSelectedTeam] = useState(selectedTeam);
  const { globalStyles } = useTheme();

  const { data: seasons } = useSeasons();
  const { data: teams } = useTeams();

  const handleApply = () => {
    onApply(localSelectedSeason, localSelectedTeam);
    onClose();
  };

  const handleCancel = () => {
    setLocalSelectedSeason(selectedSeason);
    setLocalSelectedTeam(selectedTeam);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={[globalStyles.heading, styles.headerTitle]}>Filtry</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {showSeasonFilter && (
              <SelectBox
                label="Sezóna"
                value={localSelectedSeason}
                onValueChange={setLocalSelectedSeason}
                options={seasons?.map(season => ({ id: season.id, name: season.name })) || []}
                placeholder="Vyberte sezónu"
              />
            )}

            <SelectBox
              label="Tým"
              value={localSelectedTeam}
              onValueChange={setLocalSelectedTeam}
              options={teams?.map(team => ({ id: team.id, name: team.name })) || []}
              placeholder="Vyberte tým"
            />
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
              <Text style={[globalStyles.button, styles.cancelButtonText]}>Zrušit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
              <Text style={[globalStyles.button, styles.applyButtonText]}>Potvrdit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    color: '#333333',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#666666',
  },
  content: {
    padding: 20,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666666',
  },
  applyButton: {
    flex: 1,
    marginLeft: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#014fa1',
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#FFFFFF',
  },
});

export default FilterModal;
