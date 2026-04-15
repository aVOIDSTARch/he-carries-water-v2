# HCW Parallax System

A time-driven, astronomically-modeled parallax scene system for hecarrieswater.com. Built in Astro with React islands and Nano Stores. Designed to serve as the landing page experience beneath the existing blocks design.

The scene renders a layered viewport locked to 100vw × 100vh. Celestial bodies orbit an imaginary planet whose center sits far below the visible viewport, producing realistic transit arcs across the sky. All positional values derive from the visitor’s local time — the scene is always live, never animated on a fixed loop.

-----

## Architecture Overview

```
ParallaxPage
└── ParallaxLayer (× n, sorted by z-index)
    └── [component] e.g. OrbitalObject, background div, UI layer
        └── OrbitalObject
            └── OrbitalDivElement
                └── <img src={...} />
```

**Data flow:**

```
local-time.ts
    └── onTimeUpdate()
            └── orbital-store.ts (scene coordinator)
                    ├── $rotations (Nano Store) ──→ OrbitalObject.tsx
                    └── $geometry  (Nano Store) ──→ OrbitalObject.tsx
                                                        └── OrbitalDivElement.tsx
```

-----

## File Reference

### `src/utils/local-time.ts`

Manages client-side time state. The date is captured once per visit and held immutably. The time updates every 60 seconds via `setInterval`.

Uses `@js-temporal/polyfill` for `Temporal.Now.plainTimeISO()` and `Temporal.Now.plainDateISO()`.

**Exports:**

|Symbol            |Description                                                                   |
|------------------|------------------------------------------------------------------------------|
|`initTime()`      |Start the time module. Call once before any other time functions.             |
|`getLocalTime()`  |Returns `LocalTime | null` — `{ hour, minute, second, formatted }`            |
|`getLocalDate()`  |Returns `LocalDate | null` — `{ year, month, day, formatted }`                |
|`onTimeUpdate(cb)`|Register a callback fired on every tick. Returns an unsubscribe function.     |
|`destroyTime()`   |Tear down the interval. Wire to `astro:before-swap` if using View Transitions.|

**Types:**

```ts
interface LocalTime { hour: number; minute: number; second: number; formatted: string; }
interface LocalDate { year: number; month: number; day: number; formatted: string; }
```

-----

### `src/utils/celestial-body-position.ts`

Converts a `LocalTime` into a rotational degree value for a celestial body.

**Coordinate convention:**

- `0°` = noon = top-center of viewport
- `90°` = 18:00 = right
- `180°` = midnight = bottom-center
- `270°` = 06:00 = left

All output is normalized to `[0, 360)` regardless of `rotationsPerDay`.

**Core export:**

```ts
getBodyRotationalValue(
  time: LocalTime,
  offset: number = 0,       // hour offset from noon (0–24)
  rotationsPerDay: number = 1
): RotationalPosition
```

`rotationsPerDay: 2` means 720° of travel per day, normalized back into `[0, 360)`. At 3am (90° into a normal day) the object sits at 180° — it has completed half of its doubled cycle.

**`RotationalPosition`:**

```ts
interface RotationalPosition {
  degrees: number;       // [0, 360) — CSS-ready
  radians: number;       // [0, 2π) — canvas/WebGL-ready
  cssRotation: string;   // "rotate(Xdeg)"
  cssTransform: string;  // alias for cssRotation
  progress: number;      // [0, 1) normalized position
}
```

**Preset factories:**

|Export                                     |Config                                                      |
|-------------------------------------------|------------------------------------------------------------|
|`getSunPosition(time)`                     |offset 0, 1 rotation/day                                    |
|`getMoonPosition(time)`                    |offset 12, 1 rotation/day                                   |
|`makeBodyPosition(offset, rotationsPerDay)`|Returns a configured `(time) => RotationalPosition` function|

**Conversion utilities:** `toRadians(deg)`, `toDegrees(rad)`, `toCSSRotation(deg)`

**DOM helpers:** `applyRotation(el, position)`, `applyRotations([...])`, `getTransformOrigin(x, y)`

-----

### `src/utils/orbital-geometry.ts`

Pure geometry — no DOM, no framework. Calculates the dimensions and absolute position of an orbital div element.

**The geometry model:**

The imaginary planet center sits far below the viewport, horizontally centered. The orbital div is a square whose side equals the orbital diameter. Its center aligns with the planet center, placing the top edge of the div at or near the top of the viewport. A celestial body image anchored within the div at `objectOffsetFromTop` pixels from the top transits the sky at that height as the div rotates.

The orbital radius is derived from `viewWidth / 2` (the arc chord half-length) scaled by a tier multiplier. This ensures the transit arc always spans the full viewport width regardless of screen size.

**`OrbitalDistanceTier` enum:**

|Tier                |Radius multiplier|Character                      |
|--------------------|-----------------|-------------------------------|
|`ORBITING`          |1.2× half-width  |Moons, satellites — tight arc  |
|`MID_DISTANCE_CLOSE`|2.0×             |Near objects                   |
|`MID_DISTANCE_FAR`  |3.5×             |Far landscape objects          |
|`SOLAR`             |6.0×             |Sun — flat, distant arc        |
|`STELLAR`           |10.0×            |Stars — nearly straight transit|

**Core export:**

```ts
getOrbitalObjectPropsSet(
  viewHeightInPixels: number,
  viewWidthInPixels: number,
  distanceFromTopVHPercent: number,
  tier: OrbitalDistanceTier
): OrbitalObjectPropsSet
```

**`OrbitalObjectPropsSet`:**

```ts
interface OrbitalObjectPropsSet {
  diameter: number;            // orbital div width and height in px
  top: number;                 // absolute top in px (0 for all tiers — flush with viewport top)
  left: number;                // absolute left in px (centers div on viewport)
  objectOffsetFromTop: number; // px from div top to celestial body anchor
  tier: OrbitalDistanceTier;
  radius: number;
  planetCenterY: number;       // px from viewport top to planet center
  zIndexBase: number;          // base z-index for the tier
}
```

**Other exports:** `getTierZIndex(tier, slot)`, `recalcOnResize(tier, distanceFromTopVHPercent)`

-----

### `src/utils/orbital-store.ts`

Nano Store scene coordinator. Owns the single `onTimeUpdate` subscription and fans rotation values out to all registered bodies. Handles viewport resize by recomputing geometry for all registered bodies via `ResizeObserver`.

**Stores:**

```ts
$rotations: MapStore<Record<string, RotationalPosition>>  // updated every time tick
$geometry:  MapStore<Record<string, OrbitalObjectPropsSet>> // updated on resize
```

Both are keyed by body ID string.

**Lifecycle:**

```ts
initScene()                    // call once on mount — starts time and resize observer
registerOrbitalBody(config)    // register a body before its island mounts
unregisterOrbitalBody(id)      // remove a body and clear its store entries
destroyScene()                 // full teardown — wire to astro:before-swap
```

**`OrbitalBodyConfig`:**

```ts
interface OrbitalBodyConfig {
  id: string;
  tier: OrbitalDistanceTier;
  distanceFromTopVHPercent: number;
  getPosition: (time: LocalTime) => RotationalPosition;
  zIndexSlot?: number;         // 0–9, default 0
}
```

**Convenience accessors:** `getBodyGeometry(id)`, `getBodyRotation(id)`

-----

### `src/utils/z-config.ts`

Configurable z-index ranges with an immutable tier order. The sequence back-to-front is fixed in code. The numeric ranges are configurable via `createZConfig()`.

**Default stack:**

|Tier                |Range|Slots|Intended use                |
|--------------------|-----|-----|----------------------------|
|`BACKGROUND`        |0–3  |4    |Sky gradients, base fills   |
|`STELLAR`           |4–9  |6    |Stars, distant nebulae      |
|`SOLAR`             |10–19|10   |Sun, distant planets        |
|`MID_DISTANCE_FAR`  |20–29|10   |Far landscape               |
|`MID_DISTANCE_CLOSE`|30–39|10   |Near landscape, asteroids   |
|`ORBITING`          |40–49|10   |Moons, satellites           |
|`ATMOSPHERE`        |50–54|5    |Clouds, haze, lens effects  |
|`HORIZON`           |55–59|5    |Horizon line, far terrain   |
|`FOREGROUND`        |60–69|10   |UI, navigation, close design|

**Usage:**

```ts
import { DEFAULT_Z_CONFIG, createZConfig, getZ } from '@utils/z-config';

// Use defaults
const z = getZ(DEFAULT_Z_CONFIG, 'ATMOSPHERE', 2); // → 52

// Custom config — only override what you need
const myConfig = createZConfig({
  FOREGROUND: { base: 80, slots: 20 },
});
```

`createZConfig()` validates that ranges are non-overlapping and ascending. Violations log warnings but do not throw.

-----

### `src/components/OrbitalDivElement.tsx`

Pure presentational component. Renders the orbital div with correct dimensions, absolute position, and transform origin. Places the celestial body image at `objectOffsetFromTop` pixels from the top of the div via an inner anchor div.

Accepts no store access — all values passed as props. The orbital div rotates around its own center (`transformOrigin: '50% 50%'`), which corresponds to the planet center.

**Props:**

```ts
interface OrbitalDivElementProps {
  props: OrbitalObjectPropsSet;
  zIndex: number;
  rotation: string;          // e.g. "rotate(145.0000deg)"
  children: ReactNode;       // the celestial body image
  className?: string;
}
```

-----

### `src/components/OrbitalObject.tsx`

Reactive Astro island. Subscribes to `$rotations` and `$geometry` via `useStore`. Renders `OrbitalDivElement` with the current rotation and geometry, and passes the image as a child.

Counter-rotates the image by the inverse of the div rotation so the image stays visually upright as the orbital plane rotates. Remove the counter-rotation for objects with a meaningful heading (comets, directional satellites).

**Props:**

```ts
interface OrbitalObjectProps {
  id: string;                // must match registerOrbitalBody id
  src: string;               // image source path
  alt?: string;
  zIndexSlot?: number;       // 0–9, default 0
  imageSize?: number;        // px, default 48
  imageClassName?: string;
  className?: string;
}
```

Renders `null` until both `$rotations[id]` and `$geometry[id]` are populated. No flash, no placeholder.

**Astro usage:**

```astro
<OrbitalObject client:load id="sun" src="/images/sun.png" alt="Sun" imageSize={64} />
```

-----

### `src/components/ParallaxLayer.tsx`

A single layer in the `ParallaxPage` stack. All layers center on the scene’s horizontal midpoint via `left: 50%` + `translateX(-50%)` — nothing anchors to the left edge.

**Modes:**

`'fill'` — width and height match `--scene-width` and `--scene-height`. Use for backgrounds, orbital planes, atmosphere, and horizon layers.

`'content'` — sizes to children, centered on scene X axis. Use for UI elements and foreground components.

**Props:**

```ts
interface ParallaxLayerProps {
  zIndex: number;
  children: ReactNode;
  mode?: 'fill' | 'content';   // default: 'fill'
  passThrough?: boolean;        // default: false — set true for non-interactive layers
  className?: string;
  style?: CSSProperties;
}
```

Set `passThrough={true}` on every visual-only layer (backgrounds, orbitals, atmosphere) so pointer events reach interactive foreground layers.

-----

### `src/components/ParallaxPage.tsx`

Root scene container. Must be used as an Astro island (`client:load`).

**Centering model:**

- Outermost div: `position: fixed`, fills viewport, `backgroundColor` = letterbox color
- Scene div: `position: absolute`, `left: 50%`, `transform: translateX(-50%)`

When `viewWidth > maxWidth` the scene centers and letterbox color fills both sides equally. When `viewWidth <= maxWidth` the scene fills edge to edge. Resize always recenters from the viewport midpoint — never anchors left.

Holds render until `ResizeObserver` fires the first measurement. No layout flash.

**CSS custom properties broadcast to all descendants:**

|Property           |Value                            |
|-------------------|---------------------------------|
|`--scene-width`    |Scene width in px                |
|`--scene-height`   |Scene height in px (always 100vh)|
|`--scene-max-width`|maxWidth in px, or `none`        |
|`--view-width`     |Full viewport width in px        |
|`--view-height`    |Full viewport height in px       |
|`--letterbox-color`|Letterbox fill color             |

**Props:**

```ts
interface ParallaxPageProps {
  children: ReactNode;
  maxWidth?: number;           // default: Infinity
  zConfig?: ZConfig;           // default: DEFAULT_Z_CONFIG
  letterboxColor?: string;     // default: '#1a1a1a'
  initOrbitalScene?: boolean;  // default: true
  className?: string;
}
```

`ParallaxPage` calls `initScene()` on mount and `destroyScene()` on unmount. Set `initOrbitalScene={false}` only if managing the orbital lifecycle externally.

Children are sorted by `zIndex` prop ascending before render regardless of declaration order.

**`useSceneDimensions()` hook** — available to any nested component:

```ts
const { viewWidth, viewHeight, sceneWidth, sceneHeight, maxWidth } = useSceneDimensions();
```

-----

## Dependencies

|Package                |Version|Purpose                                                |
|-----------------------|-------|-------------------------------------------------------|
|`@js-temporal/polyfill`|latest |Temporal API for browsers without native support       |
|`nanostores`           |latest |Lightweight reactive stores                            |
|`@nanostores/react`    |latest |React bindings for Nano Stores                         |
|`react` / `react-dom`  |latest |Component runtime (installed via `npx astro add react`)|

-----

## Key Constraints

- `registerOrbitalBody()` must be called before the corresponding `OrbitalObject` island mounts
- All `ParallaxLayer` components must be direct children of `ParallaxPage`
- `passThrough={true}` is required on non-interactive layers or clicks will not reach the foreground
- The `TIER_ORDER` array in `z-config.ts` is immutable — ranges are configurable, sequence is not
- Node 22+ recommended for native Temporal support in the SSR runtime