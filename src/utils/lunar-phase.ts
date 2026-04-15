/**
 * lunar-phase.ts
 * Pure lunar phase calculation for hecarrieswater.com
 * Used by OrbitalObjectPhase.tsx
 *
 * Calculates the current lunar phase angle from the day of year
 * using the synodic month period (29.53059 days).
 *
 * Phase angle:
 *   0°   = New Moon      (fully dark)
 *   90°  = First Quarter (right half lit)
 *   180° = Full Moon     (fully lit)
 *   270° = Last Quarter  (left half lit)
 *
 * SVG shadow model:
 *   The phase is rendered as a dark overlay SVG.
 *   The terminator is approximated as an ellipse whose x-radius
 *   varies from -moonRadius (new) through 0 (quarter) to +moonRadius (full).
 *   A negative x-radius flips the ellipse to the opposite side.
 */

// ─── Constants ────────────────────────────────────────────────────────────────

/** Mean synodic month in days */
const SYNODIC_MONTH = 29.53059;

/**
 * Known new moon epoch — 2000-01-06 18:14 UTC (J2000 reference)
 * Days since Unix epoch (1970-01-01): 10951.759722
 */
const NEW_MOON_EPOCH_DAYS = 10951.759722;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LunarPhase {
  /** Phase angle in degrees [0, 360) — 0 = new, 180 = full */
  angle: number;
  /** Normalized phase [0, 1) */
  normalized: number;
  /** Days into current lunation [0, 29.53) */
  age: number;
  /** Human-readable phase name */
  name: PhaseName;
  /** Illumination fraction [0, 1] — 0 = new, 1 = full */
  illumination: number;
  /**
   * Terminator x-scale factor [-1, 1]
   *   -1 = new moon (terminator fully covers right side)
   *    0 = quarter (terminator is a straight vertical line)
   *    1 = full moon (terminator fully reveals all)
   * Used to drive the SVG ellipse x-radius in OrbitalObjectPhase
   */
  terminatorScale: number;
  /** Whether the lit portion is on the right (waxing) or left (waning) side */
  isWaxing: boolean;
}

export type PhaseName =
  | 'New Moon'
  | 'Waxing Crescent'
  | 'First Quarter'
  | 'Waxing Gibbous'
  | 'Full Moon'
  | 'Waning Gibbous'
  | 'Last Quarter'
  | 'Waning Crescent';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getPhaseName(normalized: number): PhaseName {
  if (normalized < 0.0625)  return 'New Moon';
  if (normalized < 0.25)    return 'Waxing Crescent';
  if (normalized < 0.3125)  return 'First Quarter';
  if (normalized < 0.5)     return 'Waxing Gibbous';
  if (normalized < 0.5625)  return 'Full Moon';
  if (normalized < 0.75)    return 'Waning Gibbous';
  if (normalized < 0.8125)  return 'Last Quarter';
  return 'Waning Crescent';
}

/** Days since Unix epoch for a given Date */
function daysSinceEpoch(date: Date): number {
  return date.getTime() / 86_400_000;
}

// ─── Core calculation ─────────────────────────────────────────────────────────

/**
 * Calculate the current lunar phase from a Date object.
 *
 * @param date  Date to calculate phase for. Defaults to now.
 * @returns     LunarPhase with all values needed to render the phase overlay
 *
 * @example
 *   const phase = getLunarPhase();
 *   // phase.terminatorScale drives the SVG ellipse in OrbitalObjectPhase
 */
export function getLunarPhase(date: Date = new Date()): LunarPhase {
  const daysSince = daysSinceEpoch(date) - NEW_MOON_EPOCH_DAYS;
  const age = ((daysSince % SYNODIC_MONTH) + SYNODIC_MONTH) % SYNODIC_MONTH;
  const normalized = age / SYNODIC_MONTH;

  // Phase angle: 0° = new, 180° = full
  const angle = normalized * 360;

  // Illumination: 0 at new, 1 at full, follows cosine
  const illumination = (1 - Math.cos((angle * Math.PI) / 180)) / 2;

  // Waxing = first half of lunation (new → full)
  const isWaxing = normalized < 0.5;

  // Terminator scale:
  //   New moon (0°):    scale = -1 (dark covers right — no light visible)
  //   First quarter:    scale =  0 (straight terminator)
  //   Full moon (180°): scale =  1 (fully revealed)
  //   Last quarter:     scale =  0 (straight terminator, opposite side)
  //   Back to new:      scale = -1
  //
  // Use cosine of phase angle mapped to [-1, 1]
  const terminatorScale = Math.cos((angle * Math.PI) / 180);

  return {
    angle,
    normalized,
    age,
    name: getPhaseName(normalized),
    illumination,
    terminatorScale,
    isWaxing,
  };
}

/**
 * Get lunar phase for a specific day of year and year.
 * Useful for testing or rendering a specific date.
 *
 * @param dayOfYear  1–366
 * @param year       Full year, e.g. 2026
 */
export function getLunarPhaseForDay(dayOfYear: number, year: number): LunarPhase {
  const date = new Date(year, 0, dayOfYear);
  return getLunarPhase(date);
}
