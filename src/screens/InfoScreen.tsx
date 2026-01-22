import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/linking';
import { Ionicons } from '@expo/vector-icons';
import { Linking } from 'react-native';

type InfoScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface InfoMenuItem {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}

export default function InfoScreen() {
  const navigation = useNavigation<InfoScreenNavigationProp>();

  const menuItems: InfoMenuItem[] = [
    {
      id: 'news',
      title: 'Novinky',
      icon: 'newspaper-outline',
      onPress: () => navigation.navigate('News'),
    },
    {
      id: 'notifications',
      title: 'Notifikace',
      icon: 'notifications-outline',
      onPress: () => navigation.navigate('NotificationsList'),
    },
    {
      id: 'settings',
      title: 'Nastavení',
      icon: 'settings',
      onPress: () => navigation.navigate('Settings'),
    },
    {
      id: 'debug',
      title: 'Debug',
      icon: 'bug',
      onPress: () => navigation.navigate('Debug'),
    },
    {
      id: 'privacy',
      title: 'Zásady ochrany osobních údajů',
      icon: 'document-text-outline',
      onPress: () => {
        Linking.openURL('https://www.fczlicin.cz/privacy-policy/');
      },
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.menuItem}
            onPress={item.onPress}
            activeOpacity={0.7}
          >
            <View style={styles.iconContainer}>
              <Ionicons 
                name={item.icon} 
                size={24} 
                color="#014fa1" 
              />
            </View>
            <Text style={styles.menuItemTitle}>{item.title}</Text>
            <View style={styles.spacer} />
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 16,
    shadowColor: '#000',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  iconContainer: {
    marginRight: 16,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  spacer: {
    flex: 1,
  },
});