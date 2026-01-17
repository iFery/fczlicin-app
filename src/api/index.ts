/**
 * Centralized API exports
 */
export * from './client';
export * from './endpoints';

// Re-export commonly used types
export type { ApiError, ApiRequestOptions, ApiResponse } from './client';
export * from './footballEndpoints';

