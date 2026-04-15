/**

- OrbitalObjectPhase.tsx
- Wraps OrbitalObject with an SVG phase shadow overlay.
- For hecarrieswater.com
- 
- Renders the moon (or any orbital body) with a dark shadow overlay
- whose shape reflects the current lunar phase derived from the day of year.
- 
- Phase geometry:
- The SVG contains two overlapping paths:
- 1. A base semicircle defining the dark (shadow) side
- 1. A terminator ellipse whose x-radius interpolates between
- ```
   -imageRadius (new moon) through 0 (quarter) to +imageRadius (full moon)
  ```
- The combination of these two paths produces accurate crescent,
- gibbous, and quarter shapes.
- 
- The overlay counter-rotates with the orbital div (same as the image in OrbitalObject)
- so the phase shadow stays correctly oriented regardless of orbital position.
- 
- Usage:
- // Replaces OrbitalObject for moon bodies
- <OrbitalObjectPhase
- ```
  client:load
  ```
- ```
  id="moon"
  ```
- ```
  src="/images/moon.png"
  ```
- ```
  alt="Moon"
  ```
- ```
  imageSize={48}
  ```
- ```
  shadowOpacity={0.92}
  ```
- />
- 
- Must be registered in orbital-store before mounting:
- registerOrbitalBody({ id: 'moon', tier: OrbitalDistanceTier.ORBITING, … })
  */

import { useMemo } from 'preact/hooks';
import { useStore } from '@nanostores/preact';
import { $rotations, $geometry } from '@utils/orbital-store';
import { getTierZIndex } from '@utils/orbital-geometry';
import OrbitalDivElement from './OrbitalDivElement';
import { getLunarPhase, type LunarPhase } from '@utils/lunar-phase';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OrbitalObjectPhaseProps {
/** Body ID — must match registerOrbitalBody id */
id: string;

/** Image source for the moon/body */
src: string;

/** Alt text */
alt?: string;

/** Z-index slot within the tier (0–9). Default: 0 */
zIndexSlot?: number;

/**

- Width and height of the body image in px.
- The phase SVG sizes to match this exactly.
- Default: 48
  */
  imageSize?: number;

/**

- Opacity of the shadow overlay (0–1).
- 1 = fully opaque shadow, 0 = invisible.
- Default: 0.92 — leaves a subtle luminosity in the shadow
  */
  shadowOpacity?: number;

/**

- Shadow color. Default: '#000000'
- Can be used to tint the shadow for atmospheric effect.
  */
  shadowColor?: string;

/** Optional className on the image element */
imageClassName?: string;

/** Optional className on the orbital div */
className?: string;
}

// ─── SVG Phase Overlay ────────────────────────────────────────────────────────

interface PhaseOverlayProps {
size: number;
phase: LunarPhase;
rotation: string;       // CSS rotate string for counter-rotation
shadowOpacity: number;
shadowColor: string;
}

function PhaseOverlay({
size,
phase,
rotation,
shadowOpacity,
shadowColor,
}: PhaseOverlayProps) {
const r = size / 2;
const { terminatorScale, isWaxing } = phase;

/**

- SVG phase geometry:
- 
- We draw the shadow as a filled path using two arcs:
- - One semicircle arc on the shadow side
- - One terminator ellipse arc
- 
- The terminator ellipse x-radius = r * |terminatorScale|
- When terminatorScale is negative, the ellipse bulges toward the lit side
- (crescent shadow). When positive, toward the shadow side (gibbous shadow).
- 
- For waxing (new → full): shadow is on the left, lit on the right
- For waning (full → new): shadow is on the right, lit on the left
  */

const cx = r;
const cy = r;
const rx = Math.abs(terminatorScale) * r; // terminator ellipse x-radius
const ry = r;                              // terminator ellipse y-radius = full radius

// Determine which side is shadowed
const shadowOnLeft = isWaxing;

// Build SVG path for the shadow region
// Path traces: top of circle → around shadow semicircle → back via terminator ellipse
let shadowPath: string;

if (shadowOnLeft) {
// Shadow on left half
// Outer arc: left semicircle (top → bottom, going left)
// Terminator: ellipse from bottom → top
// terminatorScale < 0: crescent (ellipse bulges left = into lit area, small shadow)
// terminatorScale > 0: gibbous (ellipse bulges right = into shadow, large shadow)
const terminatorSweep = terminatorScale <= 0 ? 0 : 1;
shadowPath = [
`M ${cx} ${cy - r}`,
`A ${r} ${r} 0 0 0 ${cx} ${cy + r}`,        // left semicircle arc
`A ${rx} ${ry} 0 0 ${terminatorSweep} ${cx} ${cy - r}`, // terminator arc back
].join(' ');
} else {
// Shadow on right half
const terminatorSweep = terminatorScale <= 0 ? 1 : 0;
shadowPath = [
`M ${cx} ${cy - r}`,
`A ${r} ${r} 0 0 1 ${cx} ${cy + r}`,        // right semicircle arc
`A ${rx} ${ry} 0 0 ${terminatorSweep} ${cx} ${cy - r}`, // terminator arc back
].join(' ');
}

// Hide overlay entirely at full moon (no shadow)
const overlayOpacity = phase.normalized > 0.48 && phase.normalized < 0.52
? 0
: shadowOpacity;

const overlayStyle = {
position: 'absolute',
top: 0,
left: '50%',
transform: `translateX(-50%) ${rotation.replace('rotate(', 'rotate(-')}`,
width: size,
height: size,
pointerEvents: 'none',
// Counter-rotate the overlay to stay upright with the image
};

return (
<div style={overlayStyle}>
<svg
width={size}
height={size}
viewBox={`0 0 ${size} ${size}`}
xmlns="http://www.w3.org/2000/svg"
aria-hidden="true"
>
{/* Clip the shadow to the circular moon boundary */}
<defs>
<clipPath id={`moon-clip-${size}`}>
<circle cx={cx} cy={cy} r={r} />
</clipPath>
</defs>
<path
d={shadowPath}
fill={shadowColor}
fillOpacity={overlayOpacity}
clipPath={`url(#moon-clip-${size})`}
/>
</svg>
</div>
);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function OrbitalObjectPhase({
id,
src,
alt = '',
zIndexSlot = 0,
imageSize = 48,
shadowOpacity = 0.92,
shadowColor = '#000000',
imageClassName = '',
className = '',
}: OrbitalObjectPhaseProps) {
const rotations = useStore($rotations);
const geometry = useStore($geometry);

const rotation = rotations[id];
const geo = geometry[id];

// Compute lunar phase once per render — derives from current date
const phase: LunarPhase = useMemo(() => getLunarPhase(), []);

if (!rotation || !geo) return null;

const zIndex = getTierZIndex(geo.tier, zIndexSlot);

// Counter-rotate the image and overlay so both stay visually upright
const counterRotation = rotation.cssRotation.replace('rotate(', 'rotate(-');

const imageStyle = {
width: `${imageSize}px`,
height: `${imageSize}px`,
display: 'block',
transform: counterRotation,
pointerEvents: 'none',
userSelect: 'none',
position: 'relative',
};

// Wrapper positions both the image and the phase overlay together
const wrapperStyle = {
position: 'relative',
width: imageSize,
height: imageSize,
display: 'flex',
alignItems: 'center',
justifyContent: 'center',
};

return (
<OrbitalDivElement
props={geo}
zIndex={zIndex}
rotation={rotation.cssRotation}
className={className}
>
<div style={wrapperStyle}>
<img
src={src}
alt={alt}
style={imageStyle}
className={imageClassName}
draggable={false}
/>
<PhaseOverlay
size={imageSize}
phase={phase}
rotation={rotation.cssRotation}
shadowOpacity={shadowOpacity}
shadowColor={shadowColor}
/>
</div>
</OrbitalDivElement>
);
}