/**
 * orbital-geometry.ts
 * Pure geometry — no DOM, no framework dependencies.
 * Calculates orbital div dimensions and positioning for hecarrieswater.com
 *
 * Coordinate model:
 *   - The imaginary planet center sits far below the viewport, center-aligned on X
 *   - The orbital div is a square whose side = orbital diameter
 *   - Its center aligns with the planet center (large negative top value)
 *   - The top edge of the div touches or exceeds the top of the viewport
 *   - distanceFromTopVHPercent anchors the celestial body image within the div
 *
 * Usage:
 *   import { getOrbitalObjectPropsSet, OrbitalDistanceTier } from '@utils/orbital-geometry';
 *   const props = getOrbitalObjectPropsSet(vh, vw, 8, OrbitalDistanceTier.SOLAR);
 */

// ─── Enum ─────────────────────────────────────────────────────────────────────

export enum OrbitalDistanceTier {
  ORBITING          = 'ORBITING',
  MID_DISTANCE_CLOSE = 'MID_DISTANCE_CLOSE',
  MID_DISTANCE_FAR  = 'MID_DISTANCE_FAR',
  SOLAR             = 'SOLAR',
  STELLAR           = 'STELLAR',
}

// ─── Z-index ranges per tier ──────────────────────────────────────────────────
// 0–3 reserved for background / horizon divs

export const TIER_Z_INDEX_BASE: Record<OrbitalDistanceTier, number> = {
  [OrbitalDistanceTier.STELLAR]:           4,
  [OrbitalDistanceTier.SOLAR]:            10,
  [OrbitalDistanceTier.MID_DISTANCE_FAR]: 20,
  [OrbitalDistanceTier.MID_DISTANCE_CLOSE]:30,
  [OrbitalDistanceTier.ORBITING]:         40,
};

// Each tier has 10 slots (base + 0–9) for layering within the same tier
export function getTierZIndex(tier: OrbitalDistanceTier, slot: number = 0): number {
  const clamped = Math.max(0, Math.min(9, Math.floor(slot)));
  return TIER_Z_INDEX_BASE[tier] + clamped;
}

// ─── Radius multipliers per tier ──────────────────────────────────────────────
// Applied to (viewWidth / 2) — the half-chord of the viewport arc

const TIER_RADIUS_MULTIPLIER: Record<OrbitalDistanceTier, number> = {
  [OrbitalDistanceTier.ORBITING]:           1.2,
  [OrbitalDistanceTier.MID_DISTANCE_CLOSE]: 2.0,
  [OrbitalDistanceTier.MID_DISTANCE_FAR]:   3.5,
  [OrbitalDistanceTier.SOLAR]:              6.0,
  [OrbitalDistanceTier.STELLAR]:           10.0,
};

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OrbitalDivProps {
  /** Orbital div width and height in px — it is always a square */
  diameter: number;

  /** Absolute top position in px — will be a large negative number for most tiers */
  top: number;

  /** Absolute left position in px — centers the div horizontally on the viewport */
  left: number;

  /**
   * Distance in px from the top of the orbital div to the celestial body anchor point.
   * Derived from distanceFromTopVHPercent × viewHeight.
   * Place the image element at this offset from the top of the div.
   */
  objectOffsetFromTop: number;

  /** The tier this object belongs to */
  tier: OrbitalDistanceTier;

  /** Orbital radius in px — useful for debugging or secondary calculations */
  radius: number;

  /** Planet center Y in px relative to the viewport top — will be a large positive number */
  planetCenterY: number;
}

export interface OrbitalObjectPropsSet extends OrbitalDivProps {
  /** Computed z-index base for this tier — add slot index (0–9) for layering within tier */
  zIndexBase: number;
}

// ─── Core function ────────────────────────────────────────────────────────────

/**
 * Calculate all layout props needed to position and size an orbital div element.
 *
 * @param viewHeightInPixels          Current viewport height in px (window.innerHeight)
 * @param viewWidthInPixels           Current viewport width in px (window.innerWidth)
 * @param distanceFromTopVHPercent    Distance from top of viewport to celestial body anchor,
 *                                    expressed as a percentage of vh (e.g. 8 = 8vh from top).
 *                                    Range: 0–100.
 * @param tier                        OrbitalDistanceTier enum value — controls radius scale
 *
 * @returns OrbitalObjectPropsSet — all props needed by OrbitalDivElement and OrbitalObject
 *
 * @example
 *   // Sun — 10vh from top, solar distance
 *   const sunProps = getOrbitalObjectPropsSet(
 *     window.innerHeight,
 *     window.innerWidth,
 *     10,
 *     OrbitalDistanceTier.SOLAR
 *   );
 *
 *   // Moon — 20vh from top, orbiting distance
 *   const moonProps = getOrbitalObjectPropsSet(
 *     window.innerHeight,
 *     window.innerWidth,
 *     20,
 *     OrbitalDistanceTier.ORBITING
 *   );
 */
export function getOrbitalObjectPropsSet(
  viewHeightInPixels: number,
  viewWidthInPixels: number,
  distanceFromTopVHPercent: number,
  tier: OrbitalDistanceTier,
): OrbitalObjectPropsSet {
  const halfWidth = viewWidthInPixels / 2;
  const multiplier = TIER_RADIUS_MULTIPLIER[tier];

  // Radius: scaled from the viewport half-width by the tier multiplier
  // This ensures the arc chord across the viewport is always the full viewport width
  const radius = halfWidth * multiplier;

  // Orbital div is a square with side = diameter
  const diameter = radius * 2;

  // Planet center sits directly below the viewport center.
  // For the circle to be tangent to the top of the viewport (y = 0),
  // the circle center must be at y = radius from the top of the circle.
  // Since the div's top edge is the topmost point of the circle,
  // the planet center (div center) is at y = radius from the div's top edge.
  //
  // Planet center Y relative to the viewport top:
  //   = radius (distance from top of div to its center)
  //   - (radius - 0) offset... simplified:
  //
  // The div top is placed so the circle is tangent to viewport top (y=0).
  // Div top = planetCenterY - radius
  // For tangency at y=0: planetCenterY - radius = 0 → planetCenterY = radius
  //
  // However: the planet center should be BELOW the viewport for a realistic arc.
  // We achieve this by anchoring the circle tangent to viewport top,
  // which naturally places the planet center at y = radius below the viewport top.
  // For large radii (SOLAR, STELLAR) this is well below the viewport bottom.
  const planetCenterY = radius; // px from viewport top — positive = below top edge

  // Div top: place the div so its center is at planetCenterY
  // top = planetCenterY - radius = 0 for a perfectly top-tangent circle
  // This means the div top is flush with the viewport top for all tiers.
  // The div extends downward by diameter (which is far below the viewport for large tiers).
  const divTop = planetCenterY - radius; // = 0, but kept as formula for clarity

  // Div left: center the div horizontally on the viewport
  const divLeft = halfWidth - radius;

  // Object anchor: convert VH percentage to pixels from top of the div
  // distanceFromTopVHPercent is relative to the viewport, so:
  const objectOffsetFromTop = (distanceFromTopVHPercent / 100) * viewHeightInPixels;

  return {
    diameter,
    top: divTop,
    left: divLeft,
    objectOffsetFromTop,
    tier,
    radius,
    planetCenterY,
    zIndexBase: TIER_Z_INDEX_BASE[tier],
  };
}

// ─── Responsive helper ────────────────────────────────────────────────────────

/**
 * Re-calculate orbital props on viewport resize.
 * Wire this to a ResizeObserver or window 'resize' event in the scene coordinator.
 *
 * @example
 *   window.addEventListener('resize', () => {
 *     const updated = recalcOnResize(
 *       currentProps.tier,
 *       currentProps.distanceFromTopVHPercent
 *     );
 *     orbitalStore.setKey('sunProps', updated);
 *   });
 */
export function recalcOnResize(
  tier: OrbitalDistanceTier,
  distanceFromTopVHPercent: number,
): OrbitalObjectPropsSet {
  return getOrbitalObjectPropsSet(
    window.innerHeight,
    window.innerWidth,
    distanceFromTopVHPercent,
    tier,
  );
}
