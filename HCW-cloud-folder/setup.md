# hecarrieswater.com — Setup Guide

Complete setup for the utility stack: time, orbital geometry, parallax scene, and z-index configuration.

-----

## 1. Prerequisites

Node 22+ is required for native Temporal support in the Astro SSR runtime.
The polyfill covers the client regardless of Node version, but keeping Node 22+ avoids any SSR edge cases.

```bash
node --version  # should be >= 22.0.0
```

-----

## 2. Install Dependencies

```bash
pnpm install @js-temporal/polyfill nanostores @nanostores/react
```

|Package                |Purpose                                                                  |
|-----------------------|-------------------------------------------------------------------------|
|`@js-temporal/polyfill`|Temporal API for `local-time.ts` — covers browsers without native support|
|`nanostores`           |Lightweight store for orbital rotation and geometry state                |
|`@nanostores/preact`    |React bindings for Nano Stores — used in `OrbitalObject.tsx`             |

-----

## 3. tsconfig.json

Add path aliases so `@utils` and `@components` resolve correctly.

```json
 "compilerOptions": {
    "paths": {
      "baseUrl": ["."],
      "@utils/*": [
        "./src/utils/*"
      ],
      "@components/*": [
        "./src/components/*"
      ]
    },
    "jsx": "react-jsx",
    "jsxImportSource": "preact"
  }
```

> **Note:** `"jsx": "react-jsx"` and `"jsxImportSource": "preact"` are required for `.tsx` components
> to use React without explicit `import React from 'react'` in every file.

-----

## 4. astro.config.mjs

Add the React integration and Vite path aliases to match `tsconfig.json`.

```js
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
  integrations: [react()],
  vite: {
    resolve: {
      alias: {
        '@utils': '/src/utils',
        '@components': '/src/components',
      },
    },
  },
});
```

Install the Astro React integration if not already present:

```bash
npx astro add react
```

This command also installs `react` and `react-dom` as dependencies automatically.

-----

## 5. File Structure

Place files as follows:

```
src/
├── utils/
│   ├── local-time.ts
│   ├── celestial-body-position.ts
│   ├── orbital-geometry.ts
│   ├── orbital-store.ts
│   └── z-config.ts
└── components/
    ├── OrbitalDivElement.tsx
    ├── OrbitalObject.tsx
    ├── ParallaxLayer.tsx
    └── ParallaxPage.tsx
```

-----

## 6. Astro Page Wiring

### 6a. Scene initialization script

The orbital scene coordinator and body registration must run in a client-side `<script>` block.
`ParallaxPage` calls `initScene()` internally by default — you only need this block for
`registerOrbitalBody` calls.

```astro
---
// src/pages/index.astro
import ParallaxPage from '@components/ParallaxPage';
import ParallaxLayer from '@components/ParallaxLayer';
import OrbitalObject from '@components/OrbitalObject';
import { DEFAULT_Z_CONFIG, getZ } from '@utils/z-config';
---

<script>
  import { registerOrbitalBody } from '@utils/orbital-store';
  import { OrbitalDistanceTier } from '@utils/orbital-geometry';
  import { getSunPosition, getMoonPosition, makeBodyPosition } from '@utils/celestial-body-position';

  // Register all celestial bodies before the islands mount.
  // initScene() is called by ParallaxPage — do not call it here.

  registerOrbitalBody({
    id: 'sun',
    tier: OrbitalDistanceTier.SOLAR,
    distanceFromTopVHPercent: 10,
    getPosition: getSunPosition,
    zIndexSlot: 0,
  });

  registerOrbitalBody({
    id: 'moon',
    tier: OrbitalDistanceTier.ORBITING,
    distanceFromTopVHPercent: 20,
    getPosition: getMoonPosition,
    zIndexSlot: 0,
  });

  // Example: custom body with offset and speed
  registerOrbitalBody({
    id: 'alien-star',
    tier: OrbitalDistanceTier.STELLAR,
    distanceFromTopVHPercent: 5,
    getPosition: makeBodyPosition(3.5, 0.75),
    zIndexSlot: 2,
  });
</script>

<ParallaxPage client:load maxWidth={2560}>
  <ParallaxLayer zIndex={getZ(DEFAULT_Z_CONFIG, 'BACKGROUND', 0)} mode="fill" passThrough>
    <!-- Background component -->
  </ParallaxLayer>

  <ParallaxLayer zIndex={getZ(DEFAULT_Z_CONFIG, 'SOLAR', 0)} mode="fill" passThrough>
    <OrbitalObject client:load id="sun" src="/images/sun.png" alt="Sun" imageSize={64} />
  </ParallaxLayer>

  <ParallaxLayer zIndex={getZ(DEFAULT_Z_CONFIG, 'ORBITING', 0)} mode="fill" passThrough>
    <OrbitalObject client:load id="moon" src="/images/moon.png" alt="Moon" imageSize={32} />
  </ParallaxLayer>

  <ParallaxLayer zIndex={getZ(DEFAULT_Z_CONFIG, 'ATMOSPHERE', 0)} mode="fill" passThrough>
    <!-- Atmosphere / haze component -->
  </ParallaxLayer>

  <ParallaxLayer zIndex={getZ(DEFAULT_Z_CONFIG, 'FOREGROUND', 0)} mode="content">
    <!-- UI / navigation -->
  </ParallaxLayer>
</ParallaxPage>
```

### 6b. View Transitions (if used)

If you enable Astro’s `<ViewTransitions />`, wire scene lifecycle to transition events:

```astro
<script>
  import { initScene, destroyScene } from '@utils/orbital-store';

  document.addEventListener('astro:before-swap', destroyScene);
  document.addEventListener('astro:after-swap', () => {
    // registerOrbitalBody calls for the incoming page go here
    initScene();
  });
</script>
```

> **Note:** `ParallaxPage` calls `initScene()` on mount and `destroyScene()` on unmount.
> If using View Transitions with `client:load`, the component remounts automatically
> and handles this lifecycle itself. The manual wiring above is only needed if
> `initOrbitalScene={false}` is set on `ParallaxPage`.

-----

## 7. CSS Custom Properties Reference

`ParallaxPage` broadcasts these custom properties to all descendants:

|Property           |Value                                    |
|-------------------|-----------------------------------------|
|`--scene-width`    |Scene width in px (capped at maxWidth)   |
|`--scene-height`   |Scene height in px (always 100vh)        |
|`--scene-max-width`|maxWidth in px, or `none`                |
|`--view-width`     |Full viewport width in px                |
|`--view-height`    |Full viewport height in px               |
|`--letterbox-color`|Letterbox fill colour (default `#1a1a1a`)|

Use in any nested component:

```css
.my-component {
  width: var(--scene-width);
  max-width: var(--scene-max-width);
}
```

-----

## 8. Z-Index Reference (defaults)

|Tier                |Range|Slots|Use                           |
|--------------------|-----|-----|------------------------------|
|`BACKGROUND`        |0–3  |4    |Sky gradients, base fills     |
|`STELLAR`           |4–9  |6    |Stars, distant nebulae        |
|`SOLAR`             |10–19|10   |Sun, distant planets          |
|`MID_DISTANCE_FAR`  |20–29|10   |Far landscape, distant objects|
|`MID_DISTANCE_CLOSE`|30–39|10   |Near landscape, asteroids     |
|`ORBITING`          |40–49|10   |Moons, satellites             |
|`ATMOSPHERE`        |50–54|5    |Clouds, haze, lens effects    |
|`HORIZON`           |55–59|5    |Horizon line, far terrain     |
|`FOREGROUND`        |60–69|10   |UI, navigation, close design  |

Custom config example:

```ts
import { createZConfig, getZ } from '@utils/z-config';

const myConfig = createZConfig({
  FOREGROUND: { base: 80, slots: 20 }, // expand foreground range
});

const uiZ = getZ(myConfig, 'FOREGROUND', 5); // 85
```

-----

## 9. TypeScript Strict Mode Note

All utilities are written for Astro’s `strict` tsconfig preset.
If you encounter errors on optional chaining or null assertions, confirm your tsconfig
extends `astro/tsconfigs/strict` as shown in step 3.
