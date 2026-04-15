/**

- OrbitalObject.tsx
- Reactive Astro island — subscribes to orbital-store, renders OrbitalDivElement with image.
- 
- This component is the public-facing interface for placing a celestial body in the scene.
- It reads rotation and geometry from Nano Stores (written by the scene coordinator)
- and passes them down to the purely presentational OrbitalDivElement.
- 
- Must be used as an Astro island:
- <OrbitalObject client:load id="sun" src={sunImg} alt="The Sun" zIndexSlot={0} />
- 
- Prerequisites:
- - initScene() must have been called in a parent <script> before this mounts
- - registerOrbitalBody({ id: ‘sun’, … }) must have been called for this id
- 
- Usage:
- import OrbitalObject from ‘@components/OrbitalObject’;
- 
- <OrbitalObject
- ```
  client:load
  ```
- ```
  id="sun"
  ```
- ```
  src="/images/sun.png"
  ```
- ```
  alt="The Sun"
  ```
- ```
  zIndexSlot={0}
  ```
- ```
  imageSize={64}
  ```
- />
  */

import { useStore } from ‘@nanostores/react’;
import { $rotations, $geometry } from ‘@utils/orbital-store’;
import { getTierZIndex } from ‘@utils/orbital-geometry’;
import OrbitalDivElement from ‘./OrbitalDivElement’;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OrbitalObjectProps {
/**

- Unique body ID — must match the id used in registerOrbitalBody().
- Used to look up rotation and geometry from the stores.
  */
  id: string;

/** Image source path for the celestial body */
src: string;

/** Alt text for the image — use descriptive text or empty string for decorative */
alt?: string;

/**

- Z-index slot within the tier’s range (0–9).
- Added to the tier’s base z-index from TIER_Z_INDEX_BASE.
- Default: 0
  */
  zIndexSlot?: number;

/**

- Width and height of the celestial body image in px.
- The image is rendered as a square. Default: 48
  */
  imageSize?: number;

/** Optional additional className applied to the image element */
imageClassName?: string;

/** Optional additional className applied to the orbital div */
className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function OrbitalObject({
id,
src,
alt = ‘’,
zIndexSlot = 0,
imageSize = 48,
imageClassName = ‘’,
className = ‘’,
}: OrbitalObjectProps) {
const rotations = useStore($rotations);
const geometry = useStore($geometry);

const rotation = rotations[id];
const geo = geometry[id];

// Render nothing until the scene coordinator has computed both values.
// This prevents a flash of incorrectly positioned elements on mount.
if (!rotation || !geo) return null;

const zIndex = getTierZIndex(geo.tier, zIndexSlot);

const imageStyle: React.CSSProperties = {
width: `${imageSize}px`,
height: `${imageSize}px`,
display: ‘block’,
// Counter-rotate the image so it stays visually upright as the div rotates.
// Remove this if the image should rotate with the orbital plane (e.g. a directional comet).
transform: rotation.cssRotation.replace(‘rotate(’, ‘rotate(-’).replace(’)’, ‘)’),
pointerEvents: ‘none’,
userSelect: ‘none’,
};

return (
<OrbitalDivElement
props={geo}
zIndex={zIndex}
rotation={rotation.cssRotation}
className={className}
>
<img
src={src}
alt={alt}
style={imageStyle}
className={imageClassName}
draggable={false}
/>
</OrbitalDivElement>
);
}