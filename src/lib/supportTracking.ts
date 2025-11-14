/**
 * Support Tracking System
 * Manages Buy Me a Coffee prompts with behavioral economics principles
 * - Tracks successful refinements
 * - Implements milestone-based display logic
 * - Respects user preferences (dismiss, snooze)
 * - Privacy-first: all data stored locally
 */

const STORAGE_KEY = "pp.support.tracking";
const MILESTONES = [3, 7, 15, 25, 35, 50, 75, 100];
const COOLDOWN_MS = 48 * 60 * 60 * 1000; // 48 hours
const SNOOZE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface SupportTracking {
  stats: {
    totalSuccessfulRefinements: number;
    lastShownTimestamp: number | null;
    timesShown: number;
    timesDismissed: number;
    lastDismissedTimestamp: number | null;
  };
  preferences: {
    neverShowAgain: boolean;
    snoozedUntil: number | null;
  };
}

function getDefaultTracking(): SupportTracking {
  return {
    stats: {
      totalSuccessfulRefinements: 0,
      lastShownTimestamp: null,
      timesShown: 0,
      timesDismissed: 0,
      lastDismissedTimestamp: null,
    },
    preferences: {
      neverShowAgain: false,
      snoozedUntil: null,
    },
  };
}

function loadTracking(): SupportTracking {
  if (typeof window === "undefined") return getDefaultTracking();
  
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultTracking();
    
    const parsed = JSON.parse(raw) as SupportTracking;
    return parsed;
  } catch {
    return getDefaultTracking();
  }
}

function saveTracking(tracking: SupportTracking): void {
  if (typeof window === "undefined") return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tracking));
  } catch (error) {
    console.warn("Failed to save support tracking:", error);
  }
}

/**
 * Records a successful refinement and checks if support toast should be shown
 * @returns true if toast should be shown, false otherwise
 */
export function trackSuccessAndCheckShow(): boolean {
  const tracking = loadTracking();
  
  // Increment success count
  tracking.stats.totalSuccessfulRefinements += 1;

  // Save updated count
  saveTracking(tracking);
  
  // Check if we should show the toast
  return shouldShowSupportToast();
}

/**
 * Determines if support toast should be shown based on current state
 */
export function shouldShowSupportToast(): boolean {
  const tracking = loadTracking();
  const now = Date.now();
  
  // Check if user opted out permanently
  if (tracking.preferences.neverShowAgain) {
    return false;
  }
  
  // Check if snoozed
  if (tracking.preferences.snoozedUntil && now < tracking.preferences.snoozedUntil) {
    return false;
  }
  
  // Check cooldown period
  if (tracking.stats.lastShownTimestamp && now - tracking.stats.lastShownTimestamp < COOLDOWN_MS) {
    return false;
  }
  
  // Check if we're at a milestone
  const count = tracking.stats.totalSuccessfulRefinements;
  
  if (count <= 100) {
    return MILESTONES.includes(count);
  }
  
  // After 100, show every 25 refinements
  return count % 25 === 0;
}

/**
 * Records that the toast was shown
 */
export function recordToastShown(): void {
  const tracking = loadTracking();
  
  tracking.stats.lastShownTimestamp = Date.now();
  tracking.stats.timesShown += 1;
  
  saveTracking(tracking);
}

/**
 * Records that user dismissed the toast with "Not now"
 */
export function dismissSupport(): void {
  const tracking = loadTracking();
  
  tracking.stats.timesDismissed += 1;
  tracking.stats.lastDismissedTimestamp = Date.now();
  
  // After 3 dismissals, offer "don't show again" option (handled in component)
  
  saveTracking(tracking);
}

/**
 * Records that user snoozed for 7 days
 */
export function snoozeSupport(): void {
  const tracking = loadTracking();
  
  tracking.preferences.snoozedUntil = Date.now() + SNOOZE_MS;
  tracking.stats.timesDismissed += 1;
  tracking.stats.lastDismissedTimestamp = Date.now();
  
  saveTracking(tracking);
}

/**
 * Records that user opted out permanently
 */
export function neverShowAgain(): void {
  const tracking = loadTracking();
  
  tracking.preferences.neverShowAgain = true;
  
  saveTracking(tracking);
}

/**
 * Gets current tracking stats (for debugging/admin)
 */
export function getTrackingStats(): SupportTracking {
  return loadTracking();
}

/**
 * Resets all tracking data (for testing)
 */
export function resetTracking(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Checks if user has dismissed multiple times (to show "don't show again" option)
 */
export function shouldOfferNeverShowAgain(): boolean {
  const tracking = loadTracking();
  return tracking.stats.timesDismissed >= 3;
}