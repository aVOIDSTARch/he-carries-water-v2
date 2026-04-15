/**

- ParallaxLayer.tsx
- A single layer in the ParallaxPage stack.
-
- Centering model:
- All layers — regardless of mode — are centered on the scene's horizontal midpoint
- using left: 50% + translateX(-50%). This means every layer shrinks and grows
- symmetrically from the center, never anchoring to the left edge.
-
- Sizing modes:
- 'fill'    — layer width matches –scene-width, height matches –scene-height (default)
- ```
            The layer still uses left 50% + translateX(-50%) so it is centered,
  ```
- ```
            not left-anchored. For exact-fit content this is equivalent, but for
  ```
- ```
            content wider than the scene it overflows symmetrically.
  ```
- ```
            Use for: backgrounds, orbital planes, atmosphere, horizon.
  ```
-
- 'content' — layer sizes to its children.
- ```
            Centered on the scene X axis, top-aligned.
  ```
- ```
            Use for: UI elements, foreground components, anything self-sized.
  ```
-
- Usage:
- <ParallaxLayer zIndex={52} mode="fill" passThrough>
- ```
  <AtmosphereHaze />
  ```
- </ParallaxLayer>
-
- <ParallaxLayer zIndex={62} mode="content">
- ```
  <NavigationUI />
  ```
- </ParallaxLayer>
*/

import type { ComponentChildren } from 'preact';

// ─── Types ────────────────────────────────────────────────────────────────────
export type ParallaxLayerMode = 'fill' | 'content';

export interface ParallaxLayerProps {
  /** Z-index for this layer — use getZ() from z-config.ts */
  zIndex: number;

  /** Nested component or element to render within this layer */
  children: ComponentChildren;

  /**
  - Sizing mode.
  - 'fill'    — fills scene width and height (default)
  - 'content' — sizes to children, centered on scene X axis, top-aligned
  */
  mode?: ParallaxLayerMode;

  /** Optional className applied to the layer div */
  className?: string;

  /** Optional inline styles merged into the layer div — applied last, can override */
  style?: Record<string, string | number>;

  /**
  - Whether pointer events pass through this layer to layers below.
  - Default: false
  - Set true for purely visual layers (backgrounds, atmosphere, orbitals)
  - so clicks reach interactive foreground layers.
  */
  passThrough?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function ParallaxLayer({
  zIndex,
  children,
  mode = 'fill',
  className = '',
  style = {},
  passThrough = false,
}: ParallaxLayerProps) {
  // Base: all layers share these properties regardless of mode.
  // left: 50% + translateX(-50%) centers every layer on the scene midpoint.
  // This is the core of the symmetric centering — nothing anchors to the left edge.
  const baseStyle = {
    position: 'absolute',
    top: 0,
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex,
    pointerEvents: passThrough ? 'none' : 'auto',
  };

  const fillStyle = {
    ...baseStyle,
    // Use CSS custom properties broadcast by ParallaxPage.
    // These update on resize so fill layers always match the current scene dimensions.
    width: 'var(–scene-width)',
    height: 'var(–scene-height)',
  };

  const contentStyle = {
    ...baseStyle,
    // Size to children — no explicit width or height.
    // The left 50% + translateX(-50%) in baseStyle centers the content block.
    width: 'auto',
    height: 'auto',
  };

  const layerStyle = {
    ...(mode === 'fill' ? fillStyle : contentStyle),
    // Consumer-provided styles applied last — can override anything above if needed.
    ...style,
  };

  return (
    <div
      style={layerStyle}
      className={`parallax-layer parallax-layer--${mode}${className ? ` ${className}` : ''}`}
      data-z={zIndex}> {children}
    </div>
  );
}
