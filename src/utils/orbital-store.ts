/**
 * orbital-store.ts
 * Nano Store scene coordinator for hecarrieswater.com
 *
 * - Single source of truth for all orbital body rotation values
 * - One onTimeUpdate subscription fans out to all registered body calculators
 * - Scene coordinator owns the update loop; OrbitalObject components are pure consumers
 * - Handles viewport resize and re-registers geometry props
 *
 * Usage:
 *   // In your scene setup script (runs once, client-side):
 *   import { registerOrbitalBody, initScene, destroyScene } from '@utils/orbital-store';
 *   import { OrbitalDistanceTier, getOrbitalObjectPropsSet } from '@utils/orbital-geometry';
 *   import { getSunPosition, getMoonPosition } from '@utils/celestial-body-position';
 *
 *   initScene();
 *
 *   registerOrbitalBody({
 *     id: 'sun',
 *     tier: OrbitalDistanceTier.SOLAR,
 *     distanceFromTopVHPercent: 10,
 *     getPosition: getSunPosition,
 *     zIndexSlot: 0,
 *   });
 *
 *   // In OrbitalObject.tsx:
 *   import { useStore } from '@nanostores/react';
 *   import { $rotations } from '@utils/orbital-store';
 *   const rotations = useStore($rotations);
 *   const rotation = rotations['sun']; // RotationalPosition
 */

import { map, type MapStore } from 'nanostores';
import { initTime, onTimeUpdate, destroyTime, getLocalTime, type LocalTime } from '@utils/local-time';
import { getOrbitalObjectPropsSet, recalcOnResize, type OrbitalObjectPropsSet, type OrbitalDistanceTier } from '@utils/orbital-geometry';
import type { RotationalPosition } from '@utils/celestial-body-position';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OrbitalBodyConfig {
  /** Unique identifier — used as the key in $rotations and $geometry stores */
  id: string;

  /** Distance tier — controls radius scale and z-index range */
  tier: OrbitalDistanceTier;

  /** Distance from top of viewport to celestial body anchor, as % of vh */
  distanceFromTopVHPercent: number;

  /**
   * Position calculator — receives current LocalTime, returns RotationalPosition.
   * Use presets from celestial-body-position.ts or getBodyRotationalValue directly.
   *
   * @example
   *   getPosition: getSunPosition
   *   getPosition: (time) => getBodyRotationalValue(time, 6, 2)
   */
  getPosition: (time: LocalTime) => RotationalPosition;

  /** Slot within the tier's z-index range (0–9). Default: 0 */
  zIndexSlot?: number;
}

export type RotationMap = Record<string, RotationalPosition>;
export type GeometryMap = Record<string, OrbitalObjectPropsSet>;

// ─── Stores ───────────────────────────────────────────────────────────────────

/** Live rotation values — keyed by body ID. Updated every time tick. */
export const $rotations: MapStore<RotationMap> = map<RotationMap>({});

/** Geometry props — keyed by body ID. Updated on resize. */
export const $geometry: MapStore<GeometryMap> = map<GeometryMap>({});

// ─── Module state ─────────────────────────────────────────────────────────────

const _registry = new Map<string, OrbitalBodyConfig>();
let _unsubscribeTime: (() => void) | null = null;
let _resizeObserver: ResizeObserver | null = null;
let _initialized = false;

// ─── Internal ─────────────────────────────────────────────────────────────────

function computeAllRotations(time: LocalTime): void {
  const next: RotationMap = {};
  for (const [id, config] of _registry) {
    next[id] = config.getPosition(time);
  }
  $rotations.set(next);
}

function computeGeometryFor(id: string, config: OrbitalBodyConfig): void {
  const props = getOrbitalObjectPropsSet(
    window.innerHeight,
    window.innerWidth,
    config.distanceFromTopVHPercent,
    config.tier,
  );
  $geometry.setKey(id, props);
}

function recomputeAllGeometry(): void {
  for (const [id, config] of _registry) {
    computeGeometryFor(id, config);
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Initialise the scene coordinator.
 * Call once on the client, before any registerOrbitalBody calls.
 * Safe to call multiple times — subsequent calls are no-ops.
 */
export function initScene(): void {
  if (_initialized) return;
  _initialized = true;

  initTime();

  // Single time subscription — fans out to all registered bodies
  _unsubscribeTime = onTimeUpdate((time) => {
    computeAllRotations(time);
  });

  // Single resize observer — recomputes all geometry on viewport change
  _resizeObserver = new ResizeObserver(() => {
    recomputeAllGeometry();
  });
  _resizeObserver.observe(document.documentElement);
}

/**
 * Register a celestial body with the scene coordinator.
 * Immediately computes its initial geometry and rotation.
 * Must be called after initScene().
 *
 * @param config  OrbitalBodyConfig describing the body's behavior and position
 */
export function registerOrbitalBody(config: OrbitalBodyConfig): void {
  if (!_initialized) {
    console.warn('[orbital-store] registerOrbitalBody called before initScene().');
  }

  _registry.set(config.id, config);
  computeGeometryFor(config.id, config);

  // If the scene is already running, compute the initial rotation immediately.
  // Without this, $rotations won't include the new body until the next 60-second tick.
  if (_initialized) {
    const time = getLocalTime();
    if (time) $rotations.setKey(config.id, config.getPosition(time));
  }
}

/**
 * Remove a body from the scene.
 * Clears its entries from both stores.
 */
export function unregisterOrbitalBody(id: string): void {
  _registry.delete(id);
  const rotations = { ...$rotations.get() };
  const geometry = { ...$geometry.get() };
  delete rotations[id];
  delete geometry[id];
  $rotations.set(rotations);
  $geometry.set(geometry);
}

/**
 * Tear down the scene coordinator.
 * Call on Astro page transitions (astro:before-swap).
 */
export function destroyScene(): void {
  _unsubscribeTime?.();
  _unsubscribeTime = null;
  _resizeObserver?.disconnect();
  _resizeObserver = null;
  _registry.clear();
  $rotations.set({});
  $geometry.set({});
  _initialized = false;
  destroyTime();
}

/**
 * Get the current geometry props for a registered body.
 * Convenience accessor — prefer useStore($geometry) in React components.
 */
export function getBodyGeometry(id: string): OrbitalObjectPropsSet | undefined {
  return $geometry.get()[id];
}

/**
 * Get the current rotation for a registered body.
 * Convenience accessor — prefer useStore($rotations) in React components.
 */
export function getBodyRotation(id: string): RotationalPosition | undefined {
  return $rotations.get()[id];
}
