/**

- OrbitalDivElement.tsx
- Pure presentational component — no store access, no reactivity.
- Renders the orbital div with correct dimensions, position, and transform origin.
- 
- The div is a square orbital plane. Its center aligns with the imaginary planet center
- far below the viewport. Rotation applied by the parent (OrbitalObject) rotates the
- entire plane around that center point, carrying the anchored celestial body with it.
- 
- The celestial body image is anchored via objectOffsetFromTop — an absolute pixel
- distance from the top of the div, placing the image at the correct sky position.
- 
- Usage:
- <OrbitalDivElement
- ```
  props={sunGeometry}
  ```
- ```
  zIndex={10}
  ```
- ```
  rotation="rotate(145.0000deg)"
  ```
- 
- ```
  <img src={sunImage} alt="sun" />
  ```
- </OrbitalDivElement>

*/

import type { ReactNode } from ‘react’;
import type { OrbitalObjectPropsSet } from ‘@utils/orbital-geometry’;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OrbitalDivElementProps {
/** Geometry props from getOrbitalObjectPropsSet() via the geometry store */
props: OrbitalObjectPropsSet;

/** Z-index for this specific layer — use getTierZIndex() from orbital-geometry */
zIndex: number;

/**

- CSS rotate string — e.g. “rotate(145.0000deg)”
- Pass directly from RotationalPosition.cssRotation
  */
  rotation: string;

/** The celestial body image or element to anchor within the orbital div */
children: ReactNode;

/** Optional additional className for the orbital div */
className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function OrbitalDivElement({
props,
zIndex,
rotation,
children,
className = ‘’,
}: OrbitalDivElementProps) {
const {
diameter,
top,
left,
objectOffsetFromTop,
} = props;

/**

- Transform origin is the center of the div — which corresponds to the planet center.
- CSS default transform-origin is ‘50% 50%’ (center of the element), which is correct here.
- We make it explicit for clarity and resilience against inherited styles.
  */
  const orbitalDivStyle: React.CSSProperties = {
  position: ‘absolute’,
  width: `${diameter}px`,
  height: `${diameter}px`,
  top: `${top}px`,
  left: `${left}px`,
  zIndex,
  transform: rotation,
  transformOrigin: ‘50% 50%’,
  // No overflow hidden — celestial objects may legitimately exit the viewport
  pointerEvents: ‘none’,
  willChange: ‘transform’,
  };

/**

- Anchor div: positions the celestial body at objectOffsetFromTop pixels
- from the top of the orbital div. Centered horizontally within the div.
- The celestial body image should be centered on this anchor point.
  */
  const anchorStyle: React.CSSProperties = {
  position: ‘absolute’,
  top: `${objectOffsetFromTop}px`,
  left: ‘50%’,
  transform: ‘translateX(-50%)’,
  display: ‘flex’,
  alignItems: ‘center’,
  justifyContent: ‘center’,
  pointerEvents: ‘none’,
  };

return (
<div
style={orbitalDivStyle}
className={`orbital-div-element${className ? ` ${className}` : ''}`}
aria-hidden=“true”
>
<div style={anchorStyle} className="orbital-anchor">
{children}
</div>
</div>
);
}