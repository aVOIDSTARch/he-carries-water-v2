/**
 * gradient.ts
 * Pure gradient calculation utility for hecarrieswater.com
 * Used by Sky.tsx to produce a four-stop atmospheric gradient
 * that evolves continuously with the sun's position.
 *
 * Color model:
 *   Based on Earth atmospheric scattering — Rayleigh scattering produces
 *   blue zenith, Mie scattering produces warm horizon glow at low sun angles.
 *   All values are configurable via SkyPalette.
 *
 * Gradient stops (top to bottom):
 *   0. Zenith      — deep sky, tracks from near-black → deep blue → violet at twilight
 *   1. Upper mid   — transition zone, shifts toward horizon character
 *   2. Lower mid   — atmospheric scattering band — warm at dawn/dusk, pale at noon
 *   3. Horizon     — warmest point — red-orange at twilight, pale blue-white at noon
 *
 * Angle model:
 *   The gradient angle tracks the sun's rotational position.
 *   Sun degrees from celestial-body-position.ts:
 *     0°   = noon  = top  → gradient angle 180° (light from above)
 *     90°  = 18:00 = right → gradient angle 270° (light from right)
 *     180° = midnight      → gradient angle 0°   (light from below — dark)
 *     270° = 06:00 = left  → gradient angle 90°  (light from left)
 *
 *   Negative rotationsPerDay on the sun reverses sunrise/sunset hemisphere.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RGBColor {
  r: number;  // 0–255
  g: number;  // 0–255
  b: number;  // 0–255
  a?: number; // 0–1, default 1
}

export interface SkyColorStop {
  color: RGBColor;
  position: number; // 0–1 position in gradient
}

export interface GradientResult {
  /** CSS linear-gradient string — drop directly into background style */
  css: string;
  /** Gradient angle in degrees */
  angle: number;
  /** The four computed color stops */
  stops: [SkyColorStop, SkyColorStop, SkyColorStop, SkyColorStop];
  /** 0–1 normalized sun elevation — 1 = noon, 0 = midnight */
  sunElevation: number;
  /** 0–1 twilight factor — peaks at dawn and dusk */
  twilightFactor: number;
}

/**
 * Full sky palette — all colors configurable.
 * Defaults model Earth's atmosphere.
 */
export interface SkyPalette {
  // Zenith colors
  zenithNoon: RGBColor;
  zenithNight: RGBColor;
  zenithTwilight: RGBColor;

  // Upper mid colors
  upperMidNoon: RGBColor;
  upperMidNight: RGBColor;
  upperMidTwilight: RGBColor;

  // Lower mid colors
  lowerMidNoon: RGBColor;
  lowerMidNight: RGBColor;
  lowerMidTwilight: RGBColor;

  // Horizon colors
  horizonNoon: RGBColor;
  horizonNight: RGBColor;
  horizonTwilight: RGBColor;

  // Stop positions — 0–1, must be ascending
  stopPositions: [number, number, number, number];
}

// ─── Default Earth palette ────────────────────────────────────────────────────

export const EARTH_SKY_PALETTE: SkyPalette = {
  // Zenith
  zenithNoon:      { r: 10,  g: 50,  b: 140 }, // deep blue
  zenithNight:     { r: 2,   g: 3,   b: 15  }, // near black
  zenithTwilight:  { r: 40,  g: 15,  b: 80  }, // deep violet

  // Upper mid
  upperMidNoon:    { r: 30,  g: 100, b: 200 }, // bright blue
  upperMidNight:   { r: 5,   g: 8,   b: 30  }, // dark blue-black
  upperMidTwilight:{ r: 80,  g: 40,  b: 120 }, // purple

  // Lower mid — atmospheric scattering band
  lowerMidNoon:    { r: 120, g: 180, b: 230 }, // pale sky blue
  lowerMidNight:   { r: 8,   g: 12,  b: 40  }, // dark navy
  lowerMidTwilight:{ r: 220, g: 100, b: 50  }, // amber-orange

  // Horizon
  horizonNoon:     { r: 180, g: 220, b: 245 }, // pale blue-white
  horizonNight:    { r: 10,  g: 15,  b: 45  }, // dark navy
  horizonTwilight: { r: 255, g: 80,  b: 20  }, // deep red-orange

  stopPositions: [0, 0.35, 0.72, 1],
};

// ─── Math utilities ───────────────────────────────────────────────────────────

/** Linear interpolation between two values */
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}

/** Interpolate between two RGBColors */
function lerpColor(a: RGBColor, b: RGBColor, t: number): RGBColor {
  return {
    r: Math.round(lerp(a.r, b.r, t)),
    g: Math.round(lerp(a.g, b.g, t)),
    b: Math.round(lerp(a.b, b.b, t)),
    a: lerp(a.a ?? 1, b.a ?? 1, t),
  };
}

/** Blend three colors: day, twilight, night based on elevation and twilight factor */
function blendSkyColor(
  day: RGBColor,
  twilight: RGBColor,
  night: RGBColor,
  sunElevation: number,
  twilightFactor: number,
): RGBColor {
  // First blend day → twilight as sun descends
  const dayToTwilight = lerpColor(day, twilight, 1 - sunElevation);
  // Then blend twilight → night as twilight fades
  return lerpColor(dayToTwilight, night, Math.max(0, 1 - sunElevation - twilightFactor));
}

/** Convert RGBColor to CSS rgba() string */
function toCSS(c: RGBColor): string {
  const alpha = c.a !== undefined ? c.a : 1;
  return `rgba(${c.r}, ${c.g}, ${c.b}, ${alpha.toFixed(3)})`;
}

// ─── Core calculation ─────────────────────────────────────────────────────────

/**
 * Compute a four-stop atmospheric gradient from the sun's rotational position.
 *
 * @param sunDegrees    Sun's current position [0, 360) from celestial-body-position.ts
 *                      0° = noon (top), 180° = midnight (bottom)
 * @param palette       SkyPalette — use EARTH_SKY_PALETTE or provide custom
 *
 * @returns GradientResult with CSS string and all computed values
 *
 * @example
 *   const sunPos = getSunPosition(time);
 *   const gradient = computeSkyGradient(sunPos.degrees, EARTH_SKY_PALETTE);
 *   el.style.background = gradient.css;
 */
export function computeSkyGradient(
  sunDegrees: number,
  palette: SkyPalette = EARTH_SKY_PALETTE,
): GradientResult {
  // ── Sun elevation ──
  // Convert sun degrees to elevation factor [0, 1]
  // 0° = noon = elevation 1 (highest)
  // 180° = midnight = elevation 0 (lowest)
  // Uses cosine so elevation drops smoothly through the day
  const elevationRaw = Math.cos((sunDegrees * Math.PI) / 180);
  const sunElevation = Math.max(0, elevationRaw); // clamp to [0, 1] — no negative elevation

  // ── Twilight factor ──
  // Peaks sharply at dawn (270°) and dusk (90°) — when sun is near the horizon
  // Use a bell curve centered on the horizon crossings
  const duskAngle = 90;
  const dawnAngle = 270;
  const twilightWidth = 35; // degrees of arc over which twilight spreads

  const duskDistance = Math.abs(((sunDegrees - duskAngle + 180) % 360) - 180);
  const dawnDistance = Math.abs(((sunDegrees - dawnAngle + 180) % 360) - 180);
  const minDistance = Math.min(duskDistance, dawnDistance);

  // Gaussian-ish bell: peaks at 1 when sun is at horizon, falls to 0 outside twilightWidth
  const twilightFactor = Math.max(0, 1 - (minDistance / twilightWidth) ** 2) * (1 - sunElevation * 0.8);

  // ── Color stop computation ──
  const zenith = blendSkyColor(
    palette.zenithNoon, palette.zenithTwilight, palette.zenithNight,
    sunElevation, twilightFactor
  );
  const upperMid = blendSkyColor(
    palette.upperMidNoon, palette.upperMidTwilight, palette.upperMidNight,
    sunElevation, twilightFactor
  );
  const lowerMid = blendSkyColor(
    palette.lowerMidNoon, palette.lowerMidTwilight, palette.lowerMidNight,
    sunElevation, twilightFactor * 1.4  // twilight is more intense near horizon
  );
  const horizon = blendSkyColor(
    palette.horizonNoon, palette.horizonTwilight, palette.horizonNight,
    sunElevation, twilightFactor * 1.8  // most intense at horizon
  );

  // ── Gradient angle ──
  // Sun degrees → CSS gradient angle
  // 0° (noon, top) → 180deg (gradient flows top to bottom, brightest at top)
  // 90° (dusk, right) → 270deg (brightest from right)
  // 180° (midnight) → 0deg (gradient inverted, dark from below)
  // 270° (dawn, left) → 90deg (brightest from left)
  const angle = (sunDegrees + 180) % 360;

  // ── Assemble stops ──
  const [p0, p1, p2, p3] = palette.stopPositions;

  const stops: [SkyColorStop, SkyColorStop, SkyColorStop, SkyColorStop] = [
    { color: zenith,   position: p0 },
    { color: upperMid, position: p1 },
    { color: lowerMid, position: p2 },
    { color: horizon,  position: p3 },
  ];

  // ── CSS string ──
  const stopStrings = stops.map(s => `${toCSS(s.color)} ${(s.position * 100).toFixed(1)}%`);
  const css = `linear-gradient(${angle.toFixed(2)}deg, ${stopStrings.join(', ')})`;

  return { css, angle, stops, sunElevation, twilightFactor };
}

/**
 * Compute only the CSS string — convenience wrapper for simple use cases.
 *
 * @example
 *   el.style.background = skyGradientCSS(sunPos.degrees);
 */
export function skyGradientCSS(
  sunDegrees: number,
  palette: SkyPalette = EARTH_SKY_PALETTE,
): string {
  return computeSkyGradient(sunDegrees, palette).css;
}
