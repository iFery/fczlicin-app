/**
 * Global Firebase error handler
 * Catches "No Firebase App" errors and attempts to fix them
 */

import firebase from '@react-native-firebase/app';
import { ensureFirebaseInitialized, isFirebaseReady } from '../services/firebase';

/**
 * Wraps a function that uses Firebase and handles "No Firebase App" errors
 */
export async function withFirebaseErrorHandling<T>(
  fn: () => Promise<T> | T,
  retries: number = 2
): Promise<T | null> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Ensure Firebase is initialized before calling the function
      await ensureFirebaseInitialized();
      
      if (!isFirebaseReady()) {
        if (attempt < retries) {
          console.warn(`Firebase not ready, retrying... (attempt ${attempt + 1}/${retries + 1})`);
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
          continue;
        }
        console.error('Firebase not ready after retries');
        return null;
      }

      return await fn();
    } catch (error: any) {
      const errorMessage = error?.message || '';
      
      // Check if it's the "No Firebase App" error
      if (
        errorMessage.includes('No Firebase App') ||
        errorMessage.includes('has been created') ||
        errorMessage.includes('initializeApp')
      ) {
        if (attempt < retries) {
          console.warn(`Firebase not initialized, retrying... (attempt ${attempt + 1}/${retries + 1})`);
          // Wait longer on each retry
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
          // Try to ensure Firebase is initialized
          await ensureFirebaseInitialized();
          continue;
        }
        console.error('Firebase initialization failed after retries:', error);
        return null;
      }
      
      // If it's a different error, throw it
      throw error;
    }
  }
  
  return null;
}

/**
 * Checks if an error is a Firebase initialization error
 */
export function isFirebaseInitError(error: any): boolean {
  const errorMessage = error?.message || '';
  return (
    errorMessage.includes('No Firebase App') ||
    errorMessage.includes('has been created') ||
    errorMessage.includes('initializeApp')
  );
}
