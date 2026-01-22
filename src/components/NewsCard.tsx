/**
 * NewsCard Component
 * Displays a single news item in a card format
 */

import React, { memo } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import type { News } from '../types';
import { colors } from '../theme/colors';

interface NewsCardProps {
  news: News;
  onPress: (news: News) => void;
}

const NewsCard: React.FC<NewsCardProps> = ({ news, onPress }) => {
  const { globalStyles } = useTheme();

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('cs-CZ', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(news)}
      activeOpacity={0.8}
    >
      {news.image_url && (
        <Image
          source={{ uri: news.image_url }}
          style={styles.image}
          resizeMode="cover"
        />
      )}
      <View style={styles.content}>
        {news.category && (
          <View style={styles.categoryBadge}>
            <Text style={[globalStyles.caption, styles.categoryText]}>
              {news.category}
            </Text>
          </View>
        )}
        <Text style={[globalStyles.title, styles.title]} numberOfLines={2}>
          {news.title}
        </Text>
        {news.perex && (
          <Text style={[globalStyles.text, styles.perex]} numberOfLines={3}>
            {news.perex}
          </Text>
        )}
        <Text style={[globalStyles.caption, styles.date]}>
          {formatDate(news.date)}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    overflow: 'hidden',
    borderBottomWidth: 4,
    borderBottomColor: colors.brandBlue,
  },
  image: {
    width: '100%',
    height: 200,
    backgroundColor: colors.gray400,
  },
  content: {
    padding: 16,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.brandBlue,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 10,
  },
  categoryText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 11,
  },
  title: {
    color: colors.gray900,
    marginBottom: 8,
    fontSize: 18,
    lineHeight: 24,
  },
  perex: {
    color: colors.gray700,
    marginBottom: 12,
    fontSize: 14,
    lineHeight: 20,
  },
  date: {
    color: colors.brandBlue,
    fontSize: 12,
  },
});

export default memo(NewsCard);
