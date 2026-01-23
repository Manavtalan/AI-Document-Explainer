/**
 * Free Usage Limiter - Task 5.1
 * 
 * Tracks daily free usage via localStorage.
 * Soft limit - fails open if localStorage unavailable.
 * Respects Founder Mode - bypasses all limits when enabled.
 */

import { isFounderMode } from './founderMode';

const STORAGE_KEY = 'free_explanation_last_used_date';

/**
 * Get today's date in YYYY-MM-DD format (local timezone)
 */
function getTodayDateString(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Check if localStorage is available
 */
function isLocalStorageAvailable(): boolean {
  try {
    const testKey = '__test__';
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if free usage has been used today
 * Returns true if already used, false if available
 * 
 * IMPORTANT: Fails open - if localStorage unavailable or parsing fails,
 * returns false (allow usage) to never accidentally block legitimate users.
 */
export function hasUsedFreeToday(): boolean {
  // Founder Mode: always allow usage
  if (isFounderMode()) {
    return false;
  }
  
  try {
    if (!isLocalStorageAvailable()) {
      console.warn('localStorage unavailable - allowing free usage');
      return false;
    }

    const lastUsedDate = localStorage.getItem(STORAGE_KEY);
    
    if (!lastUsedDate) {
      return false;
    }

    const today = getTodayDateString();
    return lastUsedDate === today;
  } catch (error) {
    console.warn('Error checking free usage - allowing usage:', error);
    return false;
  }
}

/**
 * Mark free usage as used for today
 * Call this ONLY after successful explanation generation
 */
export function markFreeUsageUsed(): void {
  // Founder Mode: don't track usage
  if (isFounderMode()) {
    return;
  }
  
  try {
    if (!isLocalStorageAvailable()) {
      console.warn('localStorage unavailable - cannot mark usage');
      return;
    }

    const today = getTodayDateString();
    localStorage.setItem(STORAGE_KEY, today);
  } catch (error) {
    console.warn('Error marking free usage:', error);
  }
}

/**
 * Reset free usage (for testing/debugging only)
 */
export function resetFreeUsage(): void {
  try {
    if (isLocalStorageAvailable()) {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Ignore errors
  }
}

/**
 * Get the last used date (for debugging)
 */
export function getLastUsedDate(): string | null {
  try {
    if (!isLocalStorageAvailable()) {
      return null;
    }
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}
