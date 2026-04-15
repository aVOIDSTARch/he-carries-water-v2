# HCW Site System

hecarrieswater.com is built in Astro with Preact islands and Nano Stores. It has two distinct systems layered on the same page:

1. **Mondrian overlay** -- a colored grid that covers the page on first load, animates away cell by cell to reveal the homepage, and shows "Coming Soon" when the site is not yet live.
2. **Parallax homepage** -- a time-driven, astronomically-modeled scene beneath the Mondrian overlay: a living sky, orbiting sun and moon, and drifting clouds.

Both systems are assembled in `src/pages/index.astro`. The Mondrian overlay sits in front (`--z-mondrian`); the parallax homepage (`<Homepage client:load />`) sits behind it in an `underlayer` div.

**Page structure:**

```
index.astro
├── underlayer (z-index: --z-base)
│   ├── <Homepage client:load />     — Preact island, parallax scene
│   └── <script src="register-orbitals.ts" />  — registers celestial bodies
├── <Mondrian live={REVEAL_ENABLED} />    — SSR grid, Preact component
└── <script src="mondrian.ts" />           — client JS: jiggle + reveal
```

**Z-index stack** (defined in `src/styles/index-home.css`):

```css
--z-base:     500;   /* underlayer / homepage */
--z-mondrian: 501;   /* Mondrian grid */
--z-content:  502;   /* text / labels within Mondrian */
--z-scan:     503;   /* scan-line effect */
--z-grain:    1000;  /* film grain overlay */
```

-----

## Part 1 -- Mondrian Overlay

### Overview

The Mondrian overlay is a full-viewport CSS grid of 11 colored cells, modeled loosely on a Mondrian painting. It serves as the coming-soon/loading face of the site.

When `REVEAL_ENABLED = false` (default), the grid stays in place forever. Mouse jiggle is always active regardless of this flag.

When `REVEAL_ENABLED = true`, clicking cell 4 (the center hero cell) fires the reveal sequence: cells animate out one by one in a random order, uncovering the parallax homepage beneath.

### Files

| File | Purpose |
|---|---|
| `src/components/Mondrian.tsx` | Preact component -- pure HTML/JSX grid structure |
| `src/utils/mondrian.ts` | Client script -- jiggle physics + reveal sequence |
| `src/styles/index-home.css` | All Mondrian CSS: grid, colors, animations |

### `src/components/Mondrian.tsx`

A purely presentational Preact component. Renders the grid structure and cell content. Has one prop:

```ts
interface MondrianProps {
  live: boolean; // true: show 'Enter' on cell 4 / false: show 'Coming Soon'
}
```

**Cell map:**

| ID | Class | Color | Position |
|----|-------|-------|----------|
| 1 | `c-tl` | bone | top-left |
| 2 | `c-ml` | magenta (flicker) | mid-left |
| 3 | `c-tr` | acid | top-right tall |
| 4 | `c-center` | electric | center hero -- click target for reveal |
| 5 | `c-mr` | plasma | mid-right top |
| 6 | `c-bl` | void | bottom-left |
| 7 | `c-cb` | bone | center-bottom |
| 8 | `c-cbr` | magenta (flicker) | center-right |
| 9 | `c-ba` | acid | bottom strip |
| 10 | `c-br` | electric | bottom-right large |
| 11 | `c-trp` | plasma | right accent |

Every cell has `data-cell-id` (1--11) and `data-jiggle` attributes. The client script selects cells by these attributes -- not by class name.

**Astro usage:**

```astro
---
const REVEAL_ENABLED: boolean = false;
---
<Mondrian live={REVEAL_ENABLED} />
```

### `src/utils/mondrian.ts`

Plain TypeScript client script (loaded via `<script type="module">`). Two independent systems:

#### Mouse Jiggle

Tracks `mousemove` coordinates and each animation frame pushes nearby cells away from the cursor using inverse-square falloff. Always active -- no flag needed.

**Tuning constants:**

```ts
const JIGGLE = {
  influence: 320,  // px radius within which cells react
  maxPush:   18,   // max translate offset in px
  maxRotate: 2.8,  // max rotation in degrees
  lerpIn:    0.10, // interpolation speed toward pushed state
  lerpOut:   0.07, // interpolation speed back to rest
};
```

Each cell has independent lerped state `{ tx, ty, rot }`. The loop runs at native `requestAnimationFrame` rate. Cells marked `cell-gone` are skipped.

#### Reveal Sequence

Controlled by `REVEAL_ENABLED` at the top of the file (mirrors the Astro frontmatter constant):

```ts
const REVEAL_ENABLED = false; // master switch
```

**Config:**

```ts
const REVEAL_CONFIG = {
  interval:   520,        // ms between each cell starting its exit
  startDelay: 1800,       // ms before first cell exits after page load
  showLabels: true,       // show data-cell-id labels (dev aid)
  exitDuration: [600, 1200] as [number, number], // per-cell animation range ms
} as const;
```

**Exit animation types** (10 total, one is picked randomly per cell):

| Index | Name | Effect |
|---|---|---|
| 0 | `spinOut` | Spin clockwise 360 |
| 1 | `spinOut` | Spin counter-clockwise 360 |
| 2 | `shrinkOut` | Shrink to nothing |
| 3 | `expandOut` | Expand and vanish |
| 4 | `slideUp` | Slide off top |
| 5 | `slideDown` | Slide off bottom |
| 6 | `slideLeft` | Slide off left |
| 7 | `slideRight` | Slide off right |
| 8 | `flipOut` | Flip out |
| 9 | `dissolve` | Blur and fade |

~55% of cells also get a pre-shake animation (280--480ms) before their exit animation fires.

**Reveal trigger:**

When `REVEAL_ENABLED = true`, a click listener is added to cell 4. On click, `runRevealSequence()`:

1. Shuffles the 11 cell IDs into a random order
2. Logs the order to the console in magenta (`[HCW] Reveal sequence: 7 → 3 → ...`)
3. Fires `exitCell()` for each ID with `REVEAL_CONFIG.interval` ms between starts
4. After `exitCell()` resolves the cell gets class `cell-gone` and its transform is cleared

**To enable the site (go live):**

Set `REVEAL_ENABLED = true` in both files:

- `src/pages/index.astro` -- the `const REVEAL_ENABLED: boolean` in frontmatter (passed as `live` prop to Mondrian)
- `src/utils/mondrian.ts` -- the `const REVEAL_ENABLED` at the top of the file

-----

## Part 2 -- Parallax Homepage

### Overview

The parallax homepage is a layered, viewport-locked scene that renders the sky, orbiting celestial bodies, and clouds. All positional values derive from the visitor's local time -- the scene is always live, never on a fixed loop.

The root component is `src/components/Homepage.tsx`. It is mounted as a Preact island (`client:load`) in the `underlayer` div. Celestial bodies are registered before the island mounts via `src/utils/register-orbitals.ts`.

### Architecture

```
Homepage.tsx
└── ParallaxPage
    ├── ParallaxLayer (BACKGROUND)  → Sky
    ├── ParallaxLayer (SOLAR)       → OrbitalObject id="sun"
    ├── ParallaxLayer (ORBITING)    → OrbitalObject id="moon"
    ├── ParallaxLayer (ATMOSPHERE)  → Clouds
    └── ParallaxLayer (FOREGROUND)  → UI / navigation
```

**Data flow:**

```
local-time.ts
    └── onTimeUpdate()
            └── orbital-store.ts
                    ├── $rotations  ──→  OrbitalObject, Sky
                    └── $geometry   ──→  OrbitalObject
                                             └── OrbitalDivElement
```

### `src/components/Homepage.tsx`

Root assembly component. Composes all layers inside `ParallaxPage`. Not an island itself -- it is the component passed to Astro's `client:load` directive.

```astro
<Homepage client:load />
```

### File Reference

#### `src/utils/local-time.ts`

Manages client-side time state. Date is captured once per visit and held immutably. Time updates every 60 seconds via `setInterval`. Uses `@js-temporal/polyfill`.

**Exports:**

| Symbol | Description |
|---|---|
| `initTime()` | Start the time module. Call once before any other time functions. |
| `getLocalTime()` | Returns `LocalTime \| null` -- `{ hour, minute, second, formatted }` |
| `getLocalDate()` | Returns `LocalDate \| null` -- `{ year, month, day, formatted }` |
| `onTimeUpdate(cb)` | Register a callback fired on every tick. Returns an unsubscribe function. |
| `destroyTime()` | Tear down the interval. Wire to `astro:before-swap` if using View Transitions. |

**Types:**

```ts
interface LocalTime { hour: number; minute: number; second: number; formatted: string; }
interface LocalDate { year: number; month: number; day: number; formatted: string; }
```

-----

#### `src/utils/celestial-body-position.ts`

Converts a `LocalTime` into a rotational degree value for a celestial body.

**Coordinate convention:**

- `0deg` = noon = top-center of viewport
- `90deg` = 18:00 = right
- `180deg` = midnight = bottom-center
- `270deg` = 06:00 = left

All output is normalized to `[0, 360)` regardless of `rotationsPerDay`.

**Core export:**

```ts
getBodyRotationalValue(
  time: LocalTime,
  offset: number = 0,       // hour offset from noon (0--24)
  rotationsPerDay: number = 1
): RotationalPosition
```

**`RotationalPosition`:**

```ts
interface RotationalPosition {
  degrees: number;       // [0, 360) -- CSS-ready
  radians: number;       // [0, 2pi) -- canvas/WebGL-ready
  cssRotation: string;   // "rotate(Xdeg)"
  cssTransform: string;  // alias for cssRotation
  progress: number;      // [0, 1) normalized position
}
```

**Preset factories:**

| Export | Config |
|---|---|
| `getSunPosition(time)` | offset 0, 1 rotation/day |
| `getMoonPosition(time)` | offset 12, 1 rotation/day |
| `makeBodyPosition(offset, rotationsPerDay)` | Returns a configured `(time) => RotationalPosition` function |

**Conversion utilities:** `toRadians(deg)`, `toDegrees(rad)`, `toCSSRotation(deg)`

**DOM helpers:** `applyRotation(el, position)`, `applyRotations([...])`, `getTransformOrigin(x, y)`

-----

#### `src/utils/orbital-geometry.ts`

Pure geometry -- no DOM, no framework. Calculates the dimensions and absolute position of an orbital div element.

**The geometry model:**

The imaginary planet center sits far below the viewport, horizontally centered. The orbital div is a square whose side equals the orbital diameter. Its center aligns with the planet center. A celestial body image anchored at `objectOffsetFromTop` pixels from the top transits the sky at that height as the div rotates. The orbital radius derives from `viewWidth / 2` scaled by a tier multiplier, so the transit arc always spans the full viewport width.

**`OrbitalDistanceTier` enum:**

| Tier | Radius multiplier | Character |
|---|---|---|
| `ORBITING` | 1.2x half-width | Moons, satellites -- tight arc |
| `MID_DISTANCE_CLOSE` | 2.0x | Near objects |
| `MID_DISTANCE_FAR` | 3.5x | Far landscape objects |
| `SOLAR` | 6.0x | Sun -- flat, distant arc |
| `STELLAR` | 10.0x | Stars -- nearly straight transit |

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
  diameter: number;
  top: number;
  left: number;
  objectOffsetFromTop: number;
  tier: OrbitalDistanceTier;
  radius: number;
  planetCenterY: number;
  zIndexBase: number;
}
```

**Other exports:** `getTierZIndex(tier, slot)`, `recalcOnResize(tier, distanceFromTopVHPercent)`

-----

#### `src/utils/orbital-store.ts`

Nano Store scene coordinator. Owns the single `onTimeUpdate` subscription and fans rotation values out to all registered bodies. Handles viewport resize via `ResizeObserver`.

**Stores:**

```ts
$rotations: MapStore<Record<string, RotationalPosition>>   // updated every time tick
$geometry:  MapStore<Record<string, OrbitalObjectPropsSet>> // updated on resize
```

Both are keyed by body ID string.

**Lifecycle:**

```ts
initScene()                   // call once on mount -- starts time and resize observer
registerOrbitalBody(config)   // register a body before its island mounts
unregisterOrbitalBody(id)     // remove a body and clear its store entries
destroyScene()                // full teardown -- wire to astro:before-swap
```

**`OrbitalBodyConfig`:**

```ts
interface OrbitalBodyConfig {
  id: string;
  tier: OrbitalDistanceTier;
  distanceFromTopVHPercent: number;
  getPosition: (time: LocalTime) => RotationalPosition;
  zIndexSlot?: number;  // 0--9, default 0
}
```

**Convenience accessors:** `getBodyGeometry(id)`, `getBodyRotation(id)`

-----

#### `src/utils/register-orbitals.ts`

Registers all celestial bodies before the Homepage island mounts. Loaded as a `<script type="module">` in index.astro. Does not call `initScene()` -- that is handled by `ParallaxPage`.

```ts
registerOrbitalBody({ id: 'sun',  tier: SOLAR,    distanceFromTopVHPercent: 10, getPosition: getSunPosition });
registerOrbitalBody({ id: 'moon', tier: ORBITING, distanceFromTopVHPercent: 20, getPosition: getMoonPosition });
```

-----

#### `src/utils/z-config.ts`

Configurable z-index ranges with an immutable tier order. The sequence back-to-front is fixed in code; numeric ranges are configurable.

**Default stack (within the parallax scene):**

| Tier | Range | Slots | Use |
|---|---|---|---|
| `BACKGROUND` | 0--3 | 4 | Sky gradients, base fills |
| `STELLAR` | 4--9 | 6 | Stars, distant nebulae |
| `SOLAR` | 10--19 | 10 | Sun, distant planets |
| `MID_DISTANCE_FAR` | 20--29 | 10 | Far landscape |
| `MID_DISTANCE_CLOSE` | 30--39 | 10 | Near landscape, asteroids |
| `ORBITING` | 40--49 | 10 | Moons, satellites |
| `ATMOSPHERE` | 50--54 | 5 | Clouds, haze, lens effects |
| `HORIZON` | 55--59 | 5 | Horizon line, far terrain |
| `FOREGROUND` | 60--69 | 10 | UI, navigation |

These values sit inside the underlayer at `--z-base: 500` and are independent of the Mondrian z-stack above them.

**Usage:**

```ts
import { DEFAULT_Z_CONFIG, getZ } from '@utils/z-config';

const z = getZ(DEFAULT_Z_CONFIG, 'ATMOSPHERE', 2); // -> 52
```

-----

#### `src/components/Sky.tsx`

Reactive atmospheric gradient layer. Subscribes to `$rotations` via `useStore` and recomputes a full-scene CSS gradient from the sun's current rotational position on every time tick.

**Props:**

```ts
interface SkyProps {
  sunBodyId?: string;          // default: 'sun'
  palette?: SkyPalette;        // default: EARTH_SKY_PALETTE
  transitionDuration?: number; // ms, default: 120000 (2 min CSS transition between ticks)
  className?: string;
  debug?: boolean;             // show sun angle / elevation overlay
}
```

**Usage:**

```astro
<!-- Inside a ParallaxLayer at BACKGROUND tier -->
<Sky />
```

Holds render until sun rotation is available in the store. No flash.

-----

#### `src/components/Clouds.tsx`

Mathematically evolving cloud layer. Renders SVG ellipse clusters that slowly drift, change size, and fade. No image assets, no presets.

**Behavior:**

- Cloud count drifts within a viewport-width-derived range
- Each cloud independently evolves: x position, y position, scale, opacity, speed
- All properties interpolate toward slowly-changing target values (no snapping)
- Clouds that drift off the trailing edge despawn; new clouds spawn from the leading edge
- Runs at 30fps (clouds do not need 60fps)

**Props:**

```ts
interface CloudsProps {
  cloudBaseRGB?: [number, number, number]; // default: [255, 255, 255]
  maxPuffsPerCloud?: number;               // default: 6
  yRange?: [number, number];               // fraction of scene height [min, max], default: [0.05, 0.45]
  speedRange?: [number, number];           // px/second [min, max], default: [4, 18]
  sizeRange?: [number, number];            // base cloud size px [min, max], default: [60, 220]
  className?: string;
}
```

**Usage:**

```astro
<!-- Inside a ParallaxLayer at ATMOSPHERE tier with passThrough -->
<Clouds />
```

-----

#### `src/components/OrbitalDivElement.tsx`

Pure presentational component. Renders the orbital div with correct dimensions, absolute position, and transform origin. Places the celestial body image at `objectOffsetFromTop` pixels from the top of the div. No store access -- all values passed as props.

**Props:**

```ts
interface OrbitalDivElementProps {
  props: OrbitalObjectPropsSet;
  zIndex: number;
  rotation: string;             // e.g. "rotate(145.0000deg)"
  children: ComponentChildren;  // the celestial body image
  className?: string;
}
```

-----

#### `src/components/OrbitalObject.tsx`

Reactive Preact island. Subscribes to `$rotations` and `$geometry` via `useStore`. Renders `OrbitalDivElement` with the current rotation and geometry. Counter-rotates the image by the inverse of the div rotation so it stays visually upright.

**Props:**

```ts
interface OrbitalObjectProps {
  id: string;           // must match registerOrbitalBody id
  src: string;
  alt?: string;
  zIndexSlot?: number;  // 0--9, default 0
  imageSize?: number;   // px, default 48
  imageClassName?: string;
  className?: string;
}
```

Renders `null` until both `$rotations[id]` and `$geometry[id]` are populated.

-----

#### `src/components/OrbitalObjectPhase.tsx`

Extends `OrbitalObject` with a lunar phase shadow overlay. Computes the current phase from the real calendar date via `getLunarPhase()` and renders an SVG path over the moon image that matches the crescent/gibbous/quarter shape.

**Props:** same as `OrbitalObject` plus:

```ts
imageSize?: number;       // default: 48 -- SVG overlay sizes to match
shadowOpacity?: number;   // 0--1, default: 0.92
shadowColor?: string;     // default: '#000000'
```

The phase shadow is hidden entirely at full moon (normalized phase 0.48--0.52).

-----

#### `src/components/ParallaxLayer.tsx`

A single layer in the `ParallaxPage` stack.

**Modes:**

`'fill'` -- width and height match `--scene-width` and `--scene-height`. Use for backgrounds, orbital planes, atmosphere, and horizon layers.

`'content'` -- sizes to children, centered on scene X axis. Use for UI elements.

**Props:**

```ts
interface ParallaxLayerProps {
  zIndex: number;
  children: ComponentChildren;
  mode?: 'fill' | 'content';   // default: 'fill'
  passThrough?: boolean;        // default: false
  className?: string;
  style?: Record<string, string | number>;
}
```

Set `passThrough={true}` on every visual-only layer so pointer events reach interactive foreground layers.

-----

#### `src/components/ParallaxPage.tsx`

Root scene container. Must be used as a Preact island (`client:load`).

**Centering model:**

- Outermost div: `position: fixed`, fills viewport, letterbox color fills sides when scene < viewport
- Scene div: `position: absolute`, `left: 50%`, `transform: translateX(-50%)`

Holds render until `ResizeObserver` fires the first measurement.

**CSS custom properties broadcast to all descendants:**

| Property | Value |
|---|---|
| `--scene-width` | Scene width in px |
| `--scene-height` | Scene height in px (always 100vh) |
| `--scene-max-width` | maxWidth in px, or `none` |
| `--view-width` | Full viewport width in px |
| `--view-height` | Full viewport height in px |
| `--letterbox-color` | Letterbox fill color |

**Props:**

```ts
interface ParallaxPageProps {
  children: ComponentChildren;
  maxWidth?: number;           // default: Infinity
  zConfig?: ZConfig;           // default: DEFAULT_Z_CONFIG
  letterboxColor?: string;     // default: '#1a1a1a'
  initOrbitalScene?: boolean;  // default: true
  className?: string;
}
```

`ParallaxPage` calls `initScene()` on mount and `destroyScene()` on unmount.

Children are sorted by `zIndex` prop ascending before render regardless of declaration order.

**`useSceneDimensions()` hook** -- available to any nested component:

```ts
const { viewWidth, viewHeight, sceneWidth, sceneHeight, maxWidth } = useSceneDimensions();
```

-----

## Dependencies

| Package | Purpose |
|---|---|
| `preact` | Component runtime |
| `@nanostores/preact` | Preact bindings for Nano Stores |
| `nanostores` | Lightweight reactive stores |
| `@js-temporal/polyfill` | Temporal API for browsers without native support |

Install Preact support via `npx astro add preact`.

-----

## Key Constraints

- `registerOrbitalBody()` must be called (via `register-orbitals.ts`) before the `Homepage` island mounts
- All `ParallaxLayer` components must be direct children of `ParallaxPage`
- `passThrough={true}` is required on all non-interactive layers or pointer events will not reach the foreground
- The `TIER_ORDER` array in `z-config.ts` is immutable -- ranges are configurable, sequence is not
- `REVEAL_ENABLED` must be set to the same value in both `index.astro` and `mondrian.ts`
- Node 22+ recommended for native Temporal support in the SSR runtime
