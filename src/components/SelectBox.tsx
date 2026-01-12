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

const { height } = Dimensions.get('window');

interface SelectOption {
  id: string | number;
  name: string;
}

interface SelectBoxProps {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  label?: string;
}

const SelectBox: React.FC<SelectBoxProps> = ({
  value,
  onValueChange,
  options,
  placeholder = 'Vyberte možnost',
  label
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const { globalStyles } = useTheme();

  const selectedOption = options.find(option => option.id.toString() === value);

  const handleSelect = (optionId: string | number) => {
    onValueChange(optionId.toString());
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[globalStyles.subtitle, styles.label]}>{label}</Text>
      )}
      
      <TouchableOpacity 
        style={styles.selectButton} 
        onPress={() => setModalVisible(true)}
      >
        <Text style={[
          globalStyles.text, 
          styles.selectButtonText,
          !selectedOption && styles.placeholderText
        ]}>
          {selectedOption ? selectedOption.name : placeholder}
        </Text>
        <Text style={styles.arrow}>▼</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.overlay} 
          activeOpacity={1} 
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <ScrollView style={styles.optionsList}>
              {options.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.option,
                    value === option.id.toString() && styles.selectedOption
                  ]}
                  onPress={() => handleSelect(option.id)}
                >
                  <Text style={[
                    globalStyles.text,
                    styles.optionText,
                    value === option.id.toString() && styles.selectedOptionText
                  ]}>
                    {option.name}
                  </Text>
                  {value === option.id.toString() && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
    color: '#333333',
    fontWeight: 'bold',
  },
  selectButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    minHeight: 48,
  },
  selectButtonText: {
    color: '#333333',
    flex: 1,
  },
  placeholderText: {
    color: '#999999',
  },
  arrow: {
    color: '#666666',
    fontSize: 12,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    maxHeight: height * 0.6,
    width: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  optionsList: {
    maxHeight: height * 0.5,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  selectedOption: {
    backgroundColor: '#014fa1',
  },
  optionText: {
    color: '#333333',
    flex: 1,
  },
  selectedOptionText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  checkmark: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

export default SelectBox;
