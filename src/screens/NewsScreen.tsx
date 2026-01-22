/**
 * News Screen
 * Displays paginated list of news articles with infinite scroll
 * Best UX practice: Infinite scroll with "Load More" button as fallback
 */

import React, { useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/linking';
import NewsCard from '../components/NewsCard';
import { usePaginatedNews } from '../hooks/usePaginatedNews';
import { useTheme } from '../theme/ThemeProvider';
import type { News } from '../types';
import { colors } from '../theme/colors';
import { analyticsService } from '../services/analytics';
import { AnalyticsEvent } from '../services/analyticsEvents';

type NewsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const ITEMS_PER_PAGE = 10;
const INFINITE_SCROLL_THRESHOLD = 0.7; // Load more when 70% scrolled

export default function NewsScreen() {
  const navigation = useNavigation<NewsScreenNavigationProp>();
  const { 
    news, 
    loading, 
    loadingMore, 
    error, 
    hasMore, 
    loadMore, 
    refresh 
  } = usePaginatedNews({ limit: ITEMS_PER_PAGE });
  const { globalStyles } = useTheme();
  const flatListRef = useRef<FlatList>(null);

  const handleNewsPress = useCallback((newsItem: News) => {
    navigation.navigate('NewsDetail', {
      newsId: newsItem.id,
      newsTitle: newsItem.title,
      source: 'news_list',
    });
  }, [navigation]);

  const keyExtractor = useCallback((item: News) => item.id, []);

  // Memoized render function for performance
  const renderNewsItem = useCallback(
    ({ item }: { item: News }) => (
      <NewsCard news={item} onPress={handleNewsPress} />
    ),
    [handleNewsPress]
  );

  // Infinite scroll handler
  const handleLoadMore = useCallback(() => {
    analyticsService.logEvent(AnalyticsEvent.NEWS_LOAD_MORE, {
      source: 'news_list',
    });
    loadMore();
  }, [loadMore]);

  const handleEndReached = useCallback(() => {
    if (hasMore && !loadingMore && !loading) {
      handleLoadMore();
    }
  }, [hasMore, loadingMore, loading, handleLoadMore]);

  // Scroll handler for infinite scroll (load when 70% scrolled)
  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
      const scrollPosition = (layoutMeasurement.height + contentOffset.y) / contentSize.height;
      
      if (scrollPosition > INFINITE_SCROLL_THRESHOLD && hasMore && !loadingMore && !loading) {
        loadMore();
      }
    },
    [hasMore, loadingMore, loading, loadMore]
  );

  // No custom header - using navigation header
  const listHeaderComponent = useMemo(() => null, []);

  // Memoized footer component with Load More button
  const listFooterComponent = useMemo(() => {
    if (loadingMore) {
      return (
        <View style={styles.footerContainer}>
          <ActivityIndicator size="small" color={colors.brandBlue} />
          <Text style={[globalStyles.caption, styles.loadingMoreText]}>
            Načítání dalších novinek...
          </Text>
        </View>
      );
    }

    if (!hasMore && news.length > 0) {
      return (
        <View style={styles.footerContainer}>
          <Text style={[globalStyles.caption, styles.endText]}>
            Zobrazili jste všechny novinky
          </Text>
        </View>
      );
    }

    if (hasMore && news.length > 0) {
      return (
        <View style={styles.footerContainer}>
          <TouchableOpacity
            style={styles.loadMoreButton}
            onPress={handleLoadMore}
            activeOpacity={0.7}
          >
            <Text style={[globalStyles.button, styles.loadMoreButtonText]}>
              Načíst další novinky
            </Text>
            <Ionicons name="arrow-down" size={16} color={colors.white} style={styles.loadMoreIcon} />
          </TouchableOpacity>
        </View>
      );
    }

    return null;
  }, [loadingMore, hasMore, news.length, handleLoadMore, globalStyles]);

  // Memoized empty/error component
  const listEmptyComponent = useMemo(() => {
    if (loading) {
      return null; // Show loading in main container
    }

    if (error) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle" size={48} color={colors.error} />
          <Text style={[globalStyles.text, styles.errorText]}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              analyticsService.logEvent(AnalyticsEvent.NEWS_REFRESH, {
                source: 'news_list',
              });
              refresh();
            }}
            activeOpacity={0.7}
          >
            <Text style={[globalStyles.button, styles.retryButtonText]}>
              Zkusit znovu
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="newspaper-outline" size={48} color={colors.gray700} />
        <Text style={[globalStyles.text, styles.emptyText]}>
          Žádné novinky nejsou k dispozici
        </Text>
      </View>
    );
  }, [loading, error, refresh, globalStyles]);

  if (loading && news.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.brandBlue} />
        <Text style={[globalStyles.caption, styles.loadingText]}>
          Načítání novinek...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={news}
        renderItem={renderNewsItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={listHeaderComponent}
        ListFooterComponent={listFooterComponent}
        ListEmptyComponent={listEmptyComponent}
        contentContainerStyle={styles.content}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        onScroll={handleScroll}
        scrollEventThrottle={400}
        // Performance optimizations for smooth 60fps scrolling
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={5}
        initialNumToRender={10}
        // Maintain existing scroll behavior
        bounces={true}
        overScrollMode="auto"
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray300,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  loadingText: {
    color: colors.gray700,
    marginTop: 16,
  },
  content: {

    paddingBottom: 20,
    flexGrow: 1,
  },
  emptyContainer: {
    paddingVertical: 64,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 300,
  },
  errorText: {
    color: colors.error,
    textAlign: 'center',
    marginVertical: 20,
    fontSize: 16,
  },
  emptyText: {
    color: colors.gray700,
    textAlign: 'center',
    marginTop: 16,
    fontSize: 16,
  },
  retryButton: {
    backgroundColor: colors.brandBlue,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: colors.white,
    fontWeight: '600',
  },
  footerContainer: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingMoreText: {
    color: colors.brandBlue,
    marginTop: 12,
  },
  endText: {
    color: colors.gray700,
    textAlign: 'center',
  },
  loadMoreButton: {
    backgroundColor: colors.brandBlue,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loadMoreButtonText: {
    color: colors.white,
    fontWeight: '600',
    marginRight: 8,
  },
  loadMoreIcon: {
    marginLeft: 4,
  },
});
