/**
 * celestial-body-position.ts
 * Converts local time into rotational position values for celestial body animation.
 * For hecarrieswater.com
 *
 * Coordinate convention:
 *   0°   = noon  = top-center of viewport  (12:00)
 *   90°  = 18:00 = right
 *   180° = midnight = bottom-center         (00:00)
 *   270° = 06:00 = left
 *
 * All output is normalized to [0, 360) regardless of rotationsPerDay.
 *
 * Usage:
 *   import { getBodyRotationalValue, toDegrees, toRadians, toCSSRotation } from '@utils/celestial-body-position';
 *
 *   // Sun — noon at top, one rotation per day
 *   const deg = getBodyRotationalValue(time);
 *
 *   // Fast object — completes two full cycles per day, offset 6h so it starts at dawn
 *   const deg = getBodyRotationalValue(time, 6, 2);
 */

import type { LocalTime } from '@utils/local-time';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface RotationalPosition {
  degrees: number;       // [0, 360) — CSS-ready, 0° = top
  radians: number;       // [0, 2π) — canvas/WebGL-ready, 0 = top
  cssRotation: string;   // "rotate(Xdeg)" — drop directly into el.style.transform
  cssTransform: string;  // "rotate(Xdeg)" alias — explicit for clarity at call site
  progress: number;      // [0, 1) — normalized position within current cycle
}

// ─── Constants ────────────────────────────────────────────────────────────────

const HOURS_PER_DAY = 24;
const DEG_PER_HOUR = 360 / HOURS_PER_DAY;   // 15° per hour
const TWO_PI = Math.PI * 2;

// ─── Core calculation ─────────────────────────────────────────────────────────

/**
 * Convert a LocalTime into a normalized rotational position for a celestial body.
 *
 * @param time            LocalTime object from local-time.ts
 * @param offset          Hours to shift the starting position. 0 = noon at top.
 *                        Range: 0–24. E.g. 6 shifts so that 6am sits at top.
 * @param rotationsPerDay Scalar multiplier for rotation speed.
 *                        1 = one full rotation per 24h (sun-like).
 *                        2 = two full rotations per 24h (position doubles).
 *                        Fractional values slow the object down.
 *
 * @returns RotationalPosition with degrees, radians, css helpers, and progress
 */
export function getBodyRotationalValue(
  time: LocalTime,
  offset: number = 0,
  rotationsPerDay: number = 1,
): RotationalPosition {
  // Total elapsed hours as a float, including minutes and seconds
  const elapsedHours = time.hour + time.minute / 60 + time.second / 3600;

  // Apply hour offset — shift the clock so offset hours = noon position
  // Noon (12h) is the zero point, so subtract 12 to centre on noon
  const shiftedHours = elapsedHours - 12 + offset;

  // Convert to raw degrees of travel, scaled by rotation speed
  const rawDegrees = shiftedHours * DEG_PER_HOUR * rotationsPerDay;

  // Normalize to [0, 360)
  const degrees = ((rawDegrees % 360) + 360) % 360;

  // Derived values
  const radians = (degrees / 360) * TWO_PI;
  const progress = degrees / 360;
  const cssRotation = `rotate(${degrees.toFixed(4)}deg)`;

  return {
    degrees,
    radians,
    cssRotation,
    cssTransform: cssRotation,
    progress,
  };
}

// ─── Conversion utilities ─────────────────────────────────────────────────────

/**
 * Convert a rotational degrees value [0, 360) to radians [0, 2π).
 * Use when passing to canvas ctx.rotate() or WebGL.
 */
export function toRadians(degrees: number): number {
  return (degrees / 360) * TWO_PI;
}

/**
 * Convert radians to normalize degrees [0, 360).
 */
export function toDegrees(radians: number): number {
  return ((radians / TWO_PI) * 360 + 360) % 360;
}

/**
 * Produce a CSS rotate() string from a degrees value.
 * Drop directly into el.style.transform.
 */
export function toCSSRotation(degrees: number): string {
  return `rotate(${degrees.toFixed(4)}deg)`;
}

/**
 * Produce a CSS transform string that rotates around a custom transform origin.
 * Use when the orbital div's transform-origin is not already set in CSS.
 *
 * @param degrees         Rotational position [0, 360)
 * @param originX         Transform origin X — defaults to '50vw' (viewport centre)
 * @param originY         Transform origin Y — defaults to '50vh' (viewport centre)
 *
 * @example
 *   el.style.transformOrigin = getTransformOrigin();
 *   el.style.transform = toCSSRotation(degrees);
 */
export function getTransformOrigin(
  originX: string = '50vw',
  originY: string = '50vh',
): string {
  return `${originX} ${originY}`;
}

/**
 * Apply a rotational position directly to a DOM element's transform.
 * Sets transform-origin to viewport centre by default.
 *
 * @param el              The orbital div element to rotate
 * @param position        RotationalPosition from getBodyRotationalValue()
 * @param originX         Transform origin X — defaults to '50vw'
 * @param originY         Transform origin Y — defaults to '50vh'
 *
 * @example
 *   const pos = getBodyRotationalValue(time, 0, 1);
 *   applyRotation(sunOrbitalDiv, pos);
 */
export function applyRotation(
  el: HTMLElement,
  position: RotationalPosition,
  originX: string = '50vw',
  originY: string = '50vh',
): void {
  el.style.transformOrigin = getTransformOrigin(originX, originY);
  el.style.transform = position.cssRotation;
}

/**
 * Apply rotation to multiple orbital divs simultaneously.
 * Each entry pairs an element with its own RotationalPosition,
 * allowing a single call to update an entire scene.
 *
 * @example
 *   applyRotations([
 *     { el: sunDiv,  position: getBodyRotationalValue(time, 0, 1)    },
 *     { el: moonDiv, position: getBodyRotationalValue(time, 12, 1)   },
 *     { el: fastDiv, position: getBodyRotationalValue(time, 0, 2)    },
 *   ]);
 */
export function applyRotations(
  entries: Array<{ el: HTMLElement; position: RotationalPosition; originX?: string; originY?: string }>,
): void {
  for (const { el, position, originX, originY } of entries) {
    applyRotation(el, position, originX, originY);
  }
}

// ─── Preset factories ─────────────────────────────────────────────────────────
// Convenience wrappers for common celestial configurations.
// Each returns a RotationalPosition directly.

/** Sun — noon at top, one rotation per day */
export const getSunPosition = (time: LocalTime): RotationalPosition =>
  getBodyRotationalValue(time, 0, 1);

/** Moon — offset 12h from sun (midnight at top), one rotation per day */
export const getMoonPosition = (time: LocalTime): RotationalPosition =>
  getBodyRotationalValue(time, 12, 1);

/**
 * Custom body factory — returns a pre-configured position getter.
 * Use when you have a fixed offset/speed and want a clean call site.
 *
 * @example
 *   const getAlienStar = makeBodyPosition(3.5, 0.75);
 *   const pos = getAlienStar(time);
 */
export function makeBodyPosition(
  offset: number,
  rotationsPerDay: number,
): (time: LocalTime) => RotationalPosition {
  return (time: LocalTime) => getBodyRotationalValue(time, offset, rotationsPerDay);
}
