/**
 * Founder Mode - Internal Access Control
 * 
 * Allows founder/team to use the product without rate limits or paywalls.
 * Invisible to regular users. Enabled via environment variable.
 * 
 * SECURITY: This is safe because:
 * - Environment variables are set at build time
 * - Users cannot modify VITE_ variables at runtime
 * - No UI exposure of this feature
 */

/**
 * Check if Founder Mode is enabled
 * Uses VITE_ prefix for client-side access
 */
export function isFounderMode(): boolean {
  return import.meta.env.VITE_FOUNDER_MODE === 'true';
}

/**
 * Check if Dev Mode is enabled (for dev reset functionality)
 */
export function isDevMode(): boolean {
  return import.meta.env.VITE_DEV_MODE === 'true';
}

/**
 * Dev reset - clears all localStorage keys used for limiting
 * Only works in Dev Mode
 */
export function devReset(): void {
  if (!isDevMode()) return;
  
  try {
    // Clear rate limiting
    localStorage.removeItem('free_explanation_last_used_date');
    
    // Clear feedback tracking
    sessionStorage.removeItem('feedback_submitted');
    sessionStorage.removeItem('doc_session_id');
    
    // Clear pro request tracking
    localStorage.removeItem('pro_requested');
    localStorage.removeItem('pro_requested_date');
    
    console.log('[DEV] Reset complete - reloading...');
    window.location.reload();
  } catch (error) {
    console.warn('[DEV] Reset failed:', error);
  }
}

/**
 * Log founder mode status on app init (dev only)
 */
export function logFounderStatus(): void {
  if (isDevMode()) {
    console.log('[DEV] Founder Mode:', isFounderMode() ? 'ENABLED' : 'disabled');
    console.log('[DEV] Dev Mode:', isDevMode() ? 'ENABLED' : 'disabled');
    
    if (isDevMode()) {
      console.log('[DEV] To reset limits, run: window.__devReset()');
      // Expose reset function globally for console access
      (window as unknown as { __devReset: () => void }).__devReset = devReset;
    }
  }
}
