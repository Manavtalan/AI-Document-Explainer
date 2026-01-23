/**
 * Browser Fingerprint Generator
 * 
 * Creates a stable fingerprint from browser characteristics to track
 * usage across sessions. Not perfect (users can change browsers/devices)
 * but raises the bar significantly for abuse.
 */

/**
 * Generate a simple hash from a string
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Collect browser fingerprint signals
 */
function collectSignals(): Record<string, string> {
  const signals: Record<string, string> = {};
  
  try {
    // Screen properties
    signals.screenWidth = String(window.screen.width);
    signals.screenHeight = String(window.screen.height);
    signals.colorDepth = String(window.screen.colorDepth);
    signals.pixelRatio = String(window.devicePixelRatio || 1);
    
    // Timezone
    signals.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    signals.timezoneOffset = String(new Date().getTimezoneOffset());
    
    // Language
    signals.language = navigator.language;
    signals.languages = (navigator.languages || []).join(',');
    
    // Platform
    signals.platform = navigator.platform;
    signals.userAgent = navigator.userAgent;
    
    // Hardware concurrency (CPU cores)
    signals.hardwareConcurrency = String(navigator.hardwareConcurrency || 'unknown');
    
    // Memory (if available)
    const nav = navigator as Navigator & { deviceMemory?: number };
    signals.deviceMemory = String(nav.deviceMemory || 'unknown');
    
    // Touch support
    signals.touchPoints = String(navigator.maxTouchPoints || 0);
    
    // Canvas fingerprint (lightweight version)
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = 200;
        canvas.height = 50;
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillStyle = '#f60';
        ctx.fillRect(125, 1, 62, 20);
        ctx.fillStyle = '#069';
        ctx.fillText('SimpleDocSense', 2, 15);
        ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
        ctx.fillText('Fingerprint', 4, 17);
        signals.canvas = simpleHash(canvas.toDataURL());
      }
    } catch {
      signals.canvas = 'unavailable';
    }
    
    // WebGL renderer (if available)
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (gl && gl instanceof WebGLRenderingContext) {
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          signals.webglVendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
          signals.webglRenderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        }
      }
    } catch {
      signals.webglVendor = 'unavailable';
    }
    
  } catch (error) {
    console.warn('Error collecting fingerprint signals:', error);
  }
  
  return signals;
}

/**
 * Generate a stable browser fingerprint
 * Returns a hash string that should be relatively consistent for the same browser/device
 */
export function generateFingerprint(): string {
  try {
    const signals = collectSignals();
    
    // Combine all signals into a single string
    const signalString = Object.entries(signals)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}:${value}`)
      .join('|');
    
    // Generate hash
    const fingerprint = simpleHash(signalString);
    
    // Add a prefix for identification and return
    return `fp_${fingerprint}`;
  } catch (error) {
    console.warn('Error generating fingerprint:', error);
    // Return a random fallback (less effective but still provides some tracking)
    return `fp_fallback_${Math.random().toString(36).substring(2, 15)}`;
  }
}

/**
 * Get cached fingerprint or generate new one
 * Caches in sessionStorage for consistency within a session
 */
export function getFingerprint(): string {
  const cacheKey = 'browser_fingerprint';
  
  try {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      return cached;
    }
    
    const fingerprint = generateFingerprint();
    sessionStorage.setItem(cacheKey, fingerprint);
    return fingerprint;
  } catch {
    // If sessionStorage is unavailable, generate fresh each time
    return generateFingerprint();
  }
}
