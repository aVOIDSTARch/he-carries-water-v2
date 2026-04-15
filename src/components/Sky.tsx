/**
- Sky.tsx
- Reactive atmospheric gradient layer for hecarrieswater.com
-
- Renders a full-scene gradient that evolves continuously with the sun's
- rotational position. Uses computeSkyGradient() from gradient.ts.
-
- The gradient updates every time the sun position ticks (onTimeUpdate).
- Between ticks the gradient is static — no CSS animation, no loop.
- At 5-minute resolution the transition between states is imperceptible.
-
- Usage:
- // Register sun in orbital-store before this mounts
- <Sky client:load sunBodyId="sun" palette={EARTH_SKY_PALETTE} />
-
- Must be used as an Astro island (client:load or client:idle).
- Place inside a ParallaxLayer at the BACKGROUND or STELLAR tier.
*/

import { useState, useEffect } from 'preact/hooks';
import { useStore } from '@nanostores/preact';
import { $rotations } from '@utils/orbital-store';
import {
  computeSkyGradient,
  EARTH_SKY_PALETTE,
  type SkyPalette,
  type GradientResult,
} from '@utils/gradient';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SkyProps {
  /**
  - The orbital store ID of the sun body.
  - Must match the id used in registerOrbitalBody().
  - Default: 'sun'
  */
  sunBodyId?: string;

  /**
  - Sky color palette. Use EARTH_SKY_PALETTE or provide a custom SkyPalette.
  - All colors and stop positions are configurable.
  */
  palette?: SkyPalette;

  /**
  - CSS transition duration for gradient changes in ms.
  - Set to 0 to disable transition (instant update on each tick).
  - Default: 120000 (2 minutes — smooth blend between 5-minute ticks)
  */
  transitionDuration?: number;

  /** Optional className on the sky div */
  className?: string;

  /**
  - Whether to show debug info overlay (sun elevation, twilight factor, angle).
  - Default: false
  */
  debug?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Sky({
  sunBodyId = 'sun',
  palette = EARTH_SKY_PALETTE,
  transitionDuration = 120_000,
  className = '',
  debug = false,
}: SkyProps) {
  const rotations = useStore($rotations);
  const sunRotation = rotations[sunBodyId];
  const [gradient, setGradient] = useState<GradientResult | null>(null);

  useEffect(() => {
    if (!sunRotation) return;
    const result = computeSkyGradient(sunRotation.degrees, palette);
      setGradient(result);
  }, [sunRotation?.degrees, palette]);

  // Hold render until sun rotation is available
  if (!gradient) return null;

  const skyStyle = {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    background: gradient.css,
    // CSS transition smooths the gradient change between time ticks.
    // Duration should be >= the update interval to avoid visible jumps.
    transition: transitionDuration > 0 ? `background ${transitionDuration}ms linear`: undefined,
    pointerEvents: 'none',
  };

  const debugStyle = {
    position: 'absolute',
    top: 8,
    left: 8,
    fontSize: 11,
    fontFamily: 'monospace',
    color: 'rgba(255,255,255,0.6)',
    pointerEvents: 'none',
    lineHeight: 1.6,
  };

  return (
    <div
      style={skyStyle}
      className={`sky-layer${className ? ` ${className}` : ''}`}
      aria-hidden="true"
    >{debug && (
      <div style={debugStyle}>
        <div>sun: {sunRotation?.degrees.toFixed(1)}°</div>
        <div>elevation: {gradient.sunElevation.toFixed(3)}</div>
        <div>twilight: {gradient.twilightFactor.toFixed(3)}</div>
        <div>angle: {gradient.angle.toFixed(1)}°</div>
      </div>)}
    </div>
  );
}
