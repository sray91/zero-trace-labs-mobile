/**
 * Shared mobile theme tokens.
 *
 * Centralizes the "nuclear-blue / glass-card" palette that the shipped screens used
 * inline, plus the web redesign's accent roles and the dashboard label maps. Reuse these
 * across the dashboard, welcome, and settings screens instead of re-hardcoding hex values.
 *
 * Web accent role -> mobile token:
 *   primary / brand = nuclear-blue   (nuclearStart -> nuclearEnd gradient)
 *   success         = success-green
 *   warning         = warning-yellow
 *   muted           = gray
 */

export const COLOR = {
  deepVoid: '#0C0E1A',
  nuclearStart: '#00D4FF',
  nuclearEnd: '#006CFF',
  warningStart: '#FFE066',
  warningEnd: '#FF9F1C',
  successStart: '#3DD598',
  successEnd: '#1EB980',
  danger: '#FF5470',
  white: '#FFFFFF',
  textMuted: '#8B93B6',
  glassBorder: 'rgba(0, 212, 255, 0.35)',
  glassBg: 'rgba(255, 255, 255, 0.04)',
  hairline: 'rgba(255, 255, 255, 0.1)',
  trackBg: 'rgba(255, 255, 255, 0.12)',
} as const;

/** Web accent roles mapped to a single representative color (for progress/labels). */
export const ACCENT = {
  'nuclear-blue': COLOR.nuclearStart,
  'success-green': COLOR.successStart,
  'warning-yellow': COLOR.warningEnd,
  'muted-gray': COLOR.textMuted,
} as const;

export type AccentRole = keyof typeof ACCENT;

/** Tier labels — reused verbatim from web `app/(app)/page.js`. */
export const TIER_LABEL: Record<number, string> = {
  1: 'Tier 1 – Crucial',
  2: 'Tier 2 – High',
  3: 'Tier 3 – Standard',
};

/** Removal-status labels — reused verbatim from web `app/(app)/page.js`. */
export const STATUS_LABEL: Record<string, string> = {
  not_started: 'Not Started',
  searched_not_found: 'Searched – Not Found',
  searched_found: 'Searched – Found',
  submitted: 'Opt-Out Submitted',
  removed: 'Removal Confirmed',
  reappeared: 'Re-appeared',
  handled_by_service: 'Handled by Service',
  skipped: 'Skipped',
};

/**
 * Status -> accent color for badges. Mirrors web `statusVariant`:
 *   removed / handled_by_service -> success
 *   submitted / searched_found   -> warning
 *   everything else              -> muted
 */
export function statusColor(status: string): string {
  if (status === 'removed' || status === 'handled_by_service') return COLOR.successStart;
  if (status === 'submitted' || status === 'searched_found') return COLOR.warningEnd;
  return COLOR.textMuted;
}
