/**
 * z-config.ts
 * Configurable z-index ranges for hecarrieswater.com
 *
 * The ORDER of tiers is immutable — back to front is enforced.
 * The NUMERIC RANGES are configurable via createZConfig().
 *
 * Default ranges:
 *   BACKGROUND:          0–3
 *   STELLAR:             4–9
 *   SOLAR:              10–19
 *   MID_DISTANCE_FAR:   20–29
 *   MID_DISTANCE_CLOSE: 30–39
 *   ORBITING:           40–49
 *   ATMOSPHERE:         50–54
 *   HORIZON:            55–59
 *   FOREGROUND:         60–69
 *
 * Usage:
 *   import { DEFAULT_Z_CONFIG, getZ } from '@utils/z-config';
 *   const z = getZ(DEFAULT_Z_CONFIG, 'ATMOSPHERE', 2);
 */

// ─── Tier order — immutable ───────────────────────────────────────────────────
// This array defines the canonical back-to-front stacking order.
// It cannot be reordered at runtime — only the numeric values are configurable.

export const TIER_ORDER = [
  'BACKGROUND',
  'STELLAR',
  'SOLAR',
  'MID_DISTANCE_FAR',
  'MID_DISTANCE_CLOSE',
  'ORBITING',
  'ATMOSPHERE',
  'HORIZON',
  'FOREGROUND',
] as const;

export type TierName = typeof TIER_ORDER[number];

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TierRange {
  base: number;   // lowest z-index in this tier
  slots: number;  // number of available slots (base to base + slots - 1)
}

export type ZConfig = Record<TierName, TierRange>;

// ─── Default configuration ────────────────────────────────────────────────────

export const DEFAULT_Z_CONFIG: ZConfig = {
  BACKGROUND:          { base: 0,  slots: 4  },
  STELLAR:             { base: 4,  slots: 6  },
  SOLAR:               { base: 10, slots: 10 },
  MID_DISTANCE_FAR:    { base: 20, slots: 10 },
  MID_DISTANCE_CLOSE:  { base: 30, slots: 10 },
  ORBITING:            { base: 40, slots: 10 },
  ATMOSPHERE:          { base: 50, slots: 5  },
  HORIZON:             { base: 55, slots: 5  },
  FOREGROUND:          { base: 60, slots: 10 },
};

// ─── Validation ───────────────────────────────────────────────────────────────

/**
 * Validate that a ZConfig has non-overlapping, ascending ranges
 * matching the immutable TIER_ORDER. Logs warnings — does not throw.
 */
export function validateZConfig(config: ZConfig): boolean {
  let valid = true;
  let cursor = 0;

  for (const tier of TIER_ORDER) {
    const range = config[tier];

    if (range.base < cursor) {
      console.warn(
        `[z-config] Tier "${tier}" base (${range.base}) overlaps with previous tier ending at ${cursor}. ` +
        `Order is immutable — ranges must be strictly ascending.`
      );
      valid = false;
    }

    if (range.slots < 1) {
      console.warn(`[z-config] Tier "${tier}" must have at least 1 slot.`);
      valid = false;
    }

    cursor = range.base + range.slots;
  }

  return valid;
}

// ─── Factory ──────────────────────────────────────────────────────────────────

/**
 * Create a validated custom ZConfig by merging overrides into the defaults.
 * Only override the tiers you need to change — unspecified tiers use defaults.
 *
 * @example
 *   const myConfig = createZConfig({
 *     FOREGROUND: { base: 80, slots: 20 },
 *   });
 */
export function createZConfig(overrides: Partial<ZConfig> = {}): ZConfig {
  const config: ZConfig = { ...DEFAULT_Z_CONFIG, ...overrides };
  validateZConfig(config);
  return config;
}

// ─── Accessors ────────────────────────────────────────────────────────────────

/**
 * Get a specific z-index value from a config.
 *
 * @param config  ZConfig (use DEFAULT_Z_CONFIG or your custom config)
 * @param tier    TierName
 * @param slot    Slot within the tier (0 to slots-1). Default: 0
 *
 * @example
 *   getZ(DEFAULT_Z_CONFIG, 'ATMOSPHERE', 2); // 52
 */
export function getZ(config: ZConfig, tier: TierName, slot: number = 0): number {
  const range = config[tier];
  const clamped = Math.max(0, Math.min(range.slots - 1, Math.floor(slot)));
  return range.base + clamped;
}

/**
 * Get the full numeric range for a tier as [min, max] inclusive.
 */
export function getTierRange(config: ZConfig, tier: TierName): [number, number] {
  const range = config[tier];
  return [range.base, range.base + range.slots - 1];
}

/**
 * Get the base z-index for a tier.
 */
export function getTierBase(config: ZConfig, tier: TierName): number {
  return config[tier].base;
}
