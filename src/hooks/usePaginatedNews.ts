/**
 * Custom hook for fetching paginated news
 * Supports infinite scroll and load more functionality
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { newsApi } from '../api';
import type { News } from '../types';

const DEFAULT_LIMIT = 10;

export interface UsePaginatedNewsResult {
  news: News[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

export interface UsePaginatedNewsOptions {
  limit?: number;
  initialLoad?: boolean;
}

/**
 * Hook to fetch and manage paginated news
 */
export function usePaginatedNews(
  options: UsePaginatedNewsOptions = {}
): UsePaginatedNewsResult {
  const { limit = DEFAULT_LIMIT, initialLoad = true } = options;
  
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(initialLoad);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  
  const isMountedRef = useRef(true);
  const isLoadingRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadNews = useCallback(
    async (currentOffset: number, isLoadMore: boolean = false) => {
      // Prevent concurrent requests
      if (isLoadingRef.current) {
        return;
      }

      try {
        isLoadingRef.current = true;
        
        if (isLoadMore) {
          setLoadingMore(true);
        } else {
          setLoading(true);
        }
        
        setError(null);

        const response = await newsApi.getPaginated(limit, currentOffset);
        const newNews = response.data;

        if (!isMountedRef.current) {
          return;
        }

        // Check if we have more items
        const receivedItems = newNews.length;
        const hasMoreItems = receivedItems === limit;

        if (isLoadMore) {
          // Append to existing news
          setNews((prev) => [...prev, ...newNews]);
        } else {
          // Replace news (refresh)
          setNews(newNews);
        }

        setHasMore(hasMoreItems);
        setOffset(currentOffset + receivedItems);
      } catch (err) {
        if (!isMountedRef.current) {
          return;
        }

        const errorMessage = err instanceof Error 
          ? err.message 
          : 'Nepodařilo se načíst novinky';
        
        setError(errorMessage);
        console.error('Error loading news:', err);
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
          setLoadingMore(false);
        }
        isLoadingRef.current = false;
      }
    },
    [limit]
  );

  // Initial load
  useEffect(() => {
    if (initialLoad) {
      loadNews(0, false);
    }
  }, [initialLoad, loadNews]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore || loading) {
      return;
    }
    await loadNews(offset, true);
  }, [hasMore, loadingMore, loading, offset, loadNews]);

  const refresh = useCallback(async () => {
    setOffset(0);
    setHasMore(true);
    await loadNews(0, false);
  }, [loadNews]);

  return {
    news,
    loading,
    loadingMore,
    error,
    hasMore,
    loadMore,
    refresh,
  };
}
