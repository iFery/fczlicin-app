/**
 * API endpoint definitions
 * Centralized endpoint management for type safety and easier refactoring
 */

import { apiClient } from './client';
import type { Event, News } from '../types';

/**
 * API Response type for timeline (events) endpoint
 */
export interface TimelineApiResponse {
  config: {
    dayOne: {
      start: string;
      end: string;
    };
    dayTwo: {
      start: string;
      end: string;
    };
  };
  stages: Array<{
    stage: string;
    stage_name: string;
    class: string;
    stageColors: string;
    stageColorsArtist: string;
    sort: number;
  }>;
  events: Array<{
    id?: string;
    name?: string;
    time?: string;
    artist?: string;
    stage?: string;
    stage_name?: string;
    description?: string;
    image?: string;
    date?: string;
    start?: string;
    end?: string;
    interpret_id?: number;
    [key: string]: unknown;
  }>;
}

/**
 * Events API (timeline)
 */
export const eventsApi = {
  getAll: () => apiClient.get<TimelineApiResponse>('/timeline.php'),
  getById: (id: string) => apiClient.get<Event>(`/timeline.php?id=${id}`),
};

/**
 * News API Response type
 * Matches the actual API response structure from /api/news endpoint
 * API returns: id, title, content, imageUrl, publishedAt, category
 */
export interface NewsApiResponse {
  id: number;
  title: string;
  content?: string;
  imageUrl?: string;
  publishedAt: string;
  category?: string;
}

/**
 * Transform news API response to our format
 */
function transformNews(response: NewsApiResponse[]): News[] {
  if (!Array.isArray(response)) {
    console.warn('News API response is not an array:', response);
    return [];
  }
  
  return response.map((item) => ({
    id: item.id.toString(),
    title: item.title || '',
    date: item.publishedAt || '',
    image_url: item.imageUrl,
    text: item.content,
    perex: undefined, // API doesn't return perex separately, it's part of content
    category: item.category,
  }));
}

/**
 * News API
 */
export const newsApi = {
  getAll: () =>
    apiClient.get<NewsApiResponse[]>('/api/news').then((response) => {
      // Handle case where API returns array directly or wrapped in data
      const newsData = Array.isArray(response.data) ? response.data : [];
      return {
        ...response,
        data: transformNews(newsData),
      };
    }),
  getPaginated: (limit: number = 10, offset: number = 0) => {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });
    return apiClient.get<NewsApiResponse[]>(`/api/news?${params.toString()}`).then((response) => {
      // Handle case where API returns array directly or wrapped in data
      const newsData = Array.isArray(response.data) ? response.data : [];
      return {
        ...response,
        data: transformNews(newsData),
      };
    });
  },
  getById: (id: string) => 
    apiClient.get<NewsApiResponse[]>('/api/news').then((response) => {
      const newsData = Array.isArray(response.data) ? response.data : [];
      const newsItem = newsData.find((item) => item.id.toString() === id);
      if (!newsItem) {
        throw new Error('News not found');
      }
      const transformed = transformNews([newsItem]);
      return { ...response, data: transformed[0] };
    }),
};


