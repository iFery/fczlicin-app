/**
 * News Detail Screen
 * Displays full news article with HTML content
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Linking,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/linking';
import { newsApi, type ApiError } from '../api';
import { loadFromCache } from '../utils/cacheManager';
import { useTheme } from '../theme/ThemeProvider';
import type { News } from '../types';

type NewsDetailScreenRouteProp = RouteProp<RootStackParamList, 'NewsDetail'>;
type NewsDetailScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const CACHE_KEY = 'news';

export default function NewsDetailScreen() {
  const route = useRoute<NewsDetailScreenRouteProp>();
  const navigation = useNavigation<NewsDetailScreenNavigationProp>();
  const { newsId } = route.params;
  const [news, setNews] = useState<News | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { globalStyles } = useTheme();

  useEffect(() => {
    let isMounted = true;

    const loadNewsDetail = async () => {
      try {
        if (!isMounted) return;
        setLoading(true);
        setError(null);

        // Try to find in cache first
        const cachedNews = await loadFromCache<News[]>(CACHE_KEY);
        if (cachedNews && isMounted) {
          const cachedItem = cachedNews.find((item) => item.id === newsId);
          if (cachedItem) {
            setNews(cachedItem);
            setLoading(false);
          }
        }

        // Fetch from API to get full details
        try {
          const response = await newsApi.getById(newsId);
          if (!isMounted) return;

          const newsData = response.data;

          // Fix relative URLs to absolute
          if (newsData.text) {
            newsData.text = newsData.text.replace(/src="\/media/g, 'src="https://www.fczlicin.cz/media');
            newsData.text = newsData.text.replace(/href="\/([^"]*)"/g, 'href="https://www.fczlicin.cz/$1"');
            newsData.text = newsData.text.replace(/href="(media\/[^"]*)"/g, 'href="https://www.fczlicin.cz/$1"');
          }

          setNews(newsData);
        } catch (apiError) {
          // Ignore AbortError - it's just a cancelled request when component unmounts
          if (apiError instanceof Error && apiError.name === 'AbortError') {
            return;
          }

          // If API fails but we have cached data, use it
          if (!news && isMounted) {
            throw apiError;
          }
        }
      } catch (err) {
        // Ignore AbortError - it's just a cancelled request
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }

        if (!isMounted) return;

        const apiError = err as ApiError;
        setError(apiError.message || 'Nepodařilo se načíst detail novinky');
        console.error('Error loading news detail:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadNewsDetail();

    return () => {
      isMounted = false;
    };
  }, [newsId]);

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('cs-CZ', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const handleLinkPress = (url: string) => {
    Linking.openURL(url).catch((err) => {
      console.warn('Nešlo otevřít odkaz:', url, err);
    });
  };

  /**
   * Decode HTML entities to their actual characters
   * This is a workaround for API returning HTML-encoded entities
   * TODO: Ideally, backend should return clean text without HTML entities
   */
  const decodeHtmlEntities = (text: string): string => {
    // Create a temporary textarea element to decode HTML entities
    // In React Native, we use a simple replace approach for common entities
    const entityMap: Record<string, string> = {
      '&aacute;': 'á',
      '&Aacute;': 'Á',
      '&eacute;': 'é',
      '&Eacute;': 'É',
      '&iacute;': 'í',
      '&Iacute;': 'Í',
      '&oacute;': 'ó',
      '&Oacute;': 'Ó',
      '&uacute;': 'ú',
      '&Uacute;': 'Ú',
      '&yacute;': 'ý',
      '&Yacute;': 'Ý',
      '&scaron;': 'š',
      '&Scaron;': 'Š',
      '&ccaron;': 'č',
      '&Ccaron;': 'Č',
      '&rcaron;': 'ř',
      '&Rcaron;': 'Ř',
      '&zcaron;': 'ž',
      '&Zcaron;': 'Ž',
      '&dcaron;': 'ď',
      '&Dcaron;': 'Ď',
      '&tcaron;': 'ť',
      '&Tcaron;': 'Ť',
      '&ncaron;': 'ň',
      '&Ncaron;': 'Ň',
      '&nbsp;': ' ',
      '&quot;': '"',
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
    };

    let decoded = text;
    Object.entries(entityMap).forEach(([entity, char]) => {
      decoded = decoded.replace(new RegExp(entity, 'g'), char);
    });

    // Handle numeric entities like &#225; (á)
    decoded = decoded.replace(/&#(\d+);/g, (match, dec) => {
      return String.fromCharCode(parseInt(dec, 10));
    });

    // Handle hex entities like &#xE1; (á)
    decoded = decoded.replace(/&#x([0-9A-Fa-f]+);/g, (match, hex) => {
      return String.fromCharCode(parseInt(hex, 16));
    });

    return decoded;
  };

  // Simple HTML rendering (without external library for now)
  const renderHtmlContent = (html: string) => {
    // Basic HTML parsing - for production, consider using react-native-render-html
    // Strip HTML tags and decode HTML entities
    const plainText = html
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/\n+/g, '\n') // Normalize line breaks
      .trim();
    
    // Decode HTML entities
    const decodedText = decodeHtmlEntities(plainText);
    
    // Split into paragraphs
    const paragraphs = decodedText.split('\n').filter((p) => p.trim().length > 0);

    return (
      <View style={styles.htmlContent}>
        {paragraphs.map((paragraph, index) => (
          <Text key={index} style={[globalStyles.text, styles.htmlParagraph]}>
            {paragraph}
          </Text>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color="#014fa1" />
      </View>
    );
  }

  if (error || !news) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.content}>
          <Text style={[globalStyles.text, styles.errorText]}>{error || 'Novinka nebyla nalezena'}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {news.image_url && (
            <Image source={{ uri: news.image_url }} style={styles.newsImage} resizeMode="cover" />
          )}
          <Text style={[globalStyles.title, styles.newsTitle]}>{news.title}</Text>
          <Text style={[globalStyles.caption, styles.newsDate]}>{formatDate(news.date)}</Text>
          {news.text && renderHtmlContent(news.text)}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 30,
  },
  newsImage: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    marginBottom: 16,
  },
  newsTitle: {
    color: '#333333',
    marginBottom: 8,
  },
  newsDate: {
    color: '#666666',
    marginBottom: 20,
  },
  htmlContent: {
    marginTop: 8,
  },
  htmlParagraph: {
    color: '#333333',
    lineHeight: 24,
    marginBottom: 16,
  },
  errorText: {
    color: '#DC3545',
    textAlign: 'center',
    marginVertical: 20,
  },
});


