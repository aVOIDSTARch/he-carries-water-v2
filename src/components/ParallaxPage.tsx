/**

- ParallaxPage.tsx
- Root scene container for hecarrieswater.com
-
- Responsibilities:
- - Locks to viewport dimensions (100vw × 100vh, no scroll)
- - Enforces maxWidth with dark grey letterbox fill on sides
- - Scene always centers horizontally within the viewport — shrinks from both sides
- - Broadcasts scene dimensions as CSS custom properties to all descendants
- - Accepts and orders ParallaxLayer children by z-index ascending
- - Provides ResizeContext so nested components can react to viewport changes
- - Initializes the orbital scene coordinator
-
- Centering model:
- - Outermost div: position fixed, fills viewport, background = letterbox color
- - Scene div: position absolute, left 50%, translateX(-50%)
- ```
  This ensures the scene is always centered on the viewport midpoint
  ```
- ```
  and shrinks symmetrically from both sides as viewport narrows below maxWidth
  ```
-
- Usage:
- <ParallaxPage client:load maxWidth={2560}>
- ```
  <ParallaxLayer zIndex={4} mode="fill" passThrough>
  ```
- ```
    <StarfieldCanvas />
  ```
- ```
  </ParallaxLayer>
  ```
- ```
  <ParallaxLayer zIndex={62} mode="content">
  ```
- ```
    <MainNav />
  ```
- ```
  </ParallaxLayer>
  ```
- </ParallaxPage>

*/

import { createContext, isValidElement, toChildArray } from 'preact';
import { useState, useEffect, useRef, useContext } from 'preact/hooks';
import type { ComponentChildren, ComponentChild } from 'preact';
import { DEFAULT_Z_CONFIG, validateZConfig, type ZConfig } from '@utils/z-config';
import { initScene, destroyScene } from '@utils/orbital-store';

// ─── Resize Context ───────────────────────────────────────────────────────────
export interface SceneDimensions {
  viewWidth: number;
  viewHeight: number;
  sceneWidth: number;   // min(viewWidth, maxWidth)
  sceneHeight: number;  // always equals viewHeight
  maxWidth: number;
}

const ResizeContext = createContext<SceneDimensions>({
  viewWidth: 0,
  viewHeight: 0,
  sceneWidth: 0,
  sceneHeight: 0,
  maxWidth: Infinity,
  });

/**
- Hook for nested components that need current scene dimensions.
-
- @example
- const { sceneWidth, sceneHeight } = useSceneDimensions();
*/
export function useSceneDimensions(): SceneDimensions {
  return useContext(ResizeContext);
}

// ─── Types ────────────────────────────────────────────────────────────────────
export interface ParallaxPageProps {
  /**
  - ParallaxLayer components defining the scene stack.
  - Sorted by zIndex ascending before render — declare in any order.
  */
  children: ComponentChildren;

  /**
  - Maximum scene width in px.
  - Above this the scene centers and the remaining viewport fills with letterboxColor.
  - Default: Infinity (scene fills full viewport width)
  */
  maxWidth?: number;

  /**
  - Z-index configuration. Use createZConfig() to override defaults.
  - Default: DEFAULT_Z_CONFIG
  */
  zConfig?: ZConfig;

  /**
  - Colour of the letterbox areas shown when viewport exceeds maxWidth.
  - Default: '#1a1a1a'
  */
  letterboxColor?: string;

  /**
  - Whether to initialize the orbital scene coordinator on mount.
  - Set false only if managing initScene() externally.
  - Default: true
  */
  initOrbitalScene?: boolean;

  /** Optional className on the outermost viewport-lock div */
  className?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function measureDimensions(maxWidth: number): SceneDimensions {
  const viewWidth = window.innerWidth;
  const viewHeight = window.innerHeight;
  const sceneWidth = maxWidth === Infinity
    ? viewWidth
    : Math.min(viewWidth, maxWidth);
  return { viewWidth, viewHeight, sceneWidth, sceneHeight: viewHeight, maxWidth };
}

/**
- Sort ReactNode children by their zIndex prop ascending.
- Children without a numeric zIndex prop sort to the bottom (treated as 0).
*/
function sortByZIndex(children: ComponentChildren): ComponentChild[] {
  return toChildArray(children).sort((a, b) => {
    const zA = isValidElement(a) && typeof (a.props as { zIndex?: number }).zIndex === 'number' ?
      (a.props as unknown as { zIndex: number }).zIndex : 0;
    const zB = isValidElement(b) && typeof (b.props as { zIndex?: number }).zIndex === 'number' ?
      (b.props as unknown as { zIndex: number }).zIndex : 0;
    return zA - zB;
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ParallaxPage({
  children,
  maxWidth = Infinity,
  zConfig = DEFAULT_Z_CONFIG,
  letterboxColor = '#1a1a1a',
  initOrbitalScene = true,
  className = '',
}: ParallaxPageProps) {

  const [dimensions, setDimensions] = useState<SceneDimensions | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  // ── Validate z-config ──
  useEffect(() => {
    validateZConfig(zConfig);
  }, [zConfig]);

  // ── Orbital scene lifecycle ──
  useEffect(() => {
    if (initOrbitalScene) initScene();
    return () => {
      if (initOrbitalScene) destroyScene();
    };
  }, [initOrbitalScene]);

  // ── Dimension tracking ──
  useEffect(() => {
    function update() {
      setDimensions(measureDimensions(maxWidth));
    }

    update();

    resizeObserverRef.current = new ResizeObserver(update);
    resizeObserverRef.current.observe(document.documentElement);

    return () => {
      resizeObserverRef.current?.disconnect();
    };
  }, [maxWidth]);

  // ── Hold render until dimensions are measured ──
  // Prevents any flash of zero-width or mis-positioned content.
  if (!dimensions) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: letterboxColor,}}
        aria-hidden='true' />
    );
  }

  // ── CSS custom properties ──
  // Cast as CSSProperties to allow CSS variable strings.
  const cssVars = {
    '–scene-width': `${dimensions.sceneWidth}px`,
    '–scene-height': `${dimensions.sceneHeight}px`,
    '–scene-max-width': maxWidth === Infinity ? 'none' : `${maxWidth}px`,
    '–view-width': `${dimensions.viewWidth}px`,
    '–view-height': `${dimensions.viewHeight}px`,
    '–letterbox-color': letterboxColor,
  } as Record<string, string>;

  // ── Sorted layers ──
  const sortedLayers = sortByZIndex(children);

  // ── Styles ── //

  // Viewport lock: fills the entire screen, provides letterbox color as background.
  // position: fixed ensures it stays locked even if something tries to scroll.
  const viewportStyle = {
    position: 'fixed',
    inset: 0,
    width: '100vw',
    height: '100vh',
    overflow: 'hidden',
    backgroundColor: letterboxColor,
  };

  // Scene: centered on the viewport midpoint using absolute + left 50% + translateX(-50%).
  // This is the canonical CSS centering pattern that shrinks symmetrically from both sides.
  // When sceneWidth < viewWidth the letterbox color shows on both sides equally.
  // When sceneWidth === viewWidth it fills edge to edge with no overflow.
  const sceneStyle = {
    position: 'absolute',
    top: 0,
    left: '50%',
    transform: 'translateX(-50%)',
    width: `${dimensions.sceneWidth}px`,
    height: `${dimensions.sceneHeight}px`,
    overflow: 'hidden',
  };

  return (
    <ResizeContext.Provider value={dimensions}>
      <div
        style={{...viewportStyle, ...cssVars }}
        className={`parallax-page${className ? ` ${className}` : ''}`}
        aria-label='Scene'
      >
        <div
          style={sceneStyle}
          className="parallax-scene"
        >
          {sortedLayers}
        </div>
      </div>
    </ResizeContext.Provider>
  );
}
