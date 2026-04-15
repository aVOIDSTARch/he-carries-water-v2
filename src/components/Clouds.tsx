/**

- Clouds.tsx
- Mathematically evolving cloud layer for hecarrieswater.com
-
- Renders SVG-based clouds whose count, position, size, opacity, and speed
- are all slowly evolving random values. No presets, no fixed states.
-
- Cloud behavior:
- - Count drifts randomly within a viewport-width-derived range
- - Each cloud has independently evolving: x position, y position,
- ```
  x-scale, y-scale, opacity, and drift speed
  ```
- - All properties interpolate toward new target values over time (no snapping)
- - Clouds that drift off the trailing edge despawn
- - New clouds spawn from the leading edge to replace population drift
- - No wrapping — each cloud is a unique, mortal entity
-
- Cloud shape:
- SVG ellipse clusters — multiple overlapping blurred ellipses per cloud
- produce soft, organic forms without any image assets.
-
- Usage:
- <Clouds client:load />
-
- Place inside a ParallaxLayer at the ATMOSPHERE tier with passThrough={true}.
  */

import { useState, useEffect, useRef, useCallback } from 'preact/hooks';
import { useSceneDimensions } from './ParallaxPage';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CloudPuff {
/** Offset from cloud center in px */
dx: number;
dy: number;
rx: number; // ellipse x-radius
ry: number; // ellipse y-radius
opacity: number;
}

interface Cloud {
id: number;
/** X position in px — can exceed scene width (spawning / despawning) */
x: number;
/** Y position in px from top of scene */
y: number;
/** Base scale multiplier for the whole cloud */
scale: number;
/** Overall cloud opacity */
opacity: number;
/** Drift speed in px per second — positive = rightward */
speed: number;
/** Direction: 1 = right, -1 = left */
direction: 1 | -1;
/** Puffs that make up this cloud's shape */
puffs: CloudPuff[];

// Evolution targets — all properties drift toward these
targetOpacity: number;
targetScale: number;
targetY: number;

// Evolution rates — how quickly each property moves toward its target (0–1 per second)
opacityRate: number;
scaleRate: number;
yRate: number;
}

export interface CloudsProps {
/**

- Base color of clouds. Default: 'rgba(255,255,255,'
- Opacity is added per-puff so provide RGB only.
  */
  cloudBaseRGB?: [number, number, number];

/**

- Maximum number of puffs per cloud. Default: 6
- More puffs = more complex, heavier shapes.
  */
  maxPuffsPerCloud?: number;

/**

- Y range as fraction of scene height [min, max].
- Default: [0.05, 0.45] — clouds occupy upper 45% of scene
  */
  yRange?: [number, number];

/**

- Speed range in px/second [min, max]. Default: [4, 18]
  */
  speedRange?: [number, number];

/**

- Base cloud size range in px [min, max]. Default: [60, 220]
  */
  sizeRange?: [number, number];

/** Optional className on the cloud layer div */
className?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

let _cloudIdCounter = 0;
const BASE_CLOUDS_PER_1000PX = 3; // target density
const MAX_CLOUDS_PER_1000PX = 5;
const EVOLUTION_INTERVAL_MS = 8000; // how often targets change
const FRAME_RATE = 30; // renders per second — clouds don't need 60fps

// ─── Math utilities ───────────────────────────────────────────────────────────

function rand(min: number, max: number): number {
return min + Math.random() * (max - min);
}

function randInt(min: number, max: number): number {
return Math.floor(rand(min, max + 1));
}

function lerp(a: number, b: number, t: number): number {
return a + (b - a) * t;
}

function clamp(v: number, min: number, max: number): number {
return Math.max(min, Math.min(max, v));
}

// ─── Cloud generation ─────────────────────────────────────────────────────────

function generatePuffs( count: number, baseSize: number,): CloudPuff[] {
const puffs: CloudPuff[] = [];

// Central puff — always present
puffs.push({
dx: 0,
dy: 0,
rx: baseSize * rand(0.5, 0.9),
ry: baseSize * rand(0.25, 0.45),
opacity: rand(0.5, 0.85),
});

// Satellite puffs clustered around center
for (let i = 1; i < count; i++) {
const angle = rand(0, Math.PI * 2);
const dist = rand(0.2, 0.7) * baseSize;
puffs.push({
dx: Math.cos(angle) * dist,
dy: Math.sin(angle) * dist * 0.4,
rx: baseSize * rand(0.2, 0.6),
ry: baseSize * rand(0.1, 0.3),
opacity: rand(0.3, 0.7),
});
}

return puffs;
}

function spawnCloud(
sceneWidth: number,
sceneHeight: number,
direction: 1 | -1,
yRange: [number, number],
speedRange: [number, number],
sizeRange: [number, number],
maxPuffs: number,
offscreen: boolean = true,
): Cloud {
const baseSize = rand(sizeRange[0], sizeRange[1]);
const speed = rand(speedRange[0], speedRange[1]);
const yMin = sceneHeight * yRange[0];
const yMax = sceneHeight * yRange[1];

// Spawn off the leading edge if offscreen, or anywhere in scene if seeding
const x = offscreen
? direction === 1
? -baseSize * 2
: sceneWidth + baseSize * 2
: rand(-baseSize, sceneWidth + baseSize);

return {
id: ++_cloudIdCounter,
x,
y: rand(yMin, yMax),
scale: rand(0.8, 1.2),
opacity: rand(0.4, 0.85),
speed,
direction,
puffs: generatePuffs(randInt(2, maxPuffs), baseSize),
targetOpacity: rand(0.35, 0.9),
targetScale: rand(0.75, 1.3),
targetY: rand(yMin, yMax),
opacityRate: rand(0.01, 0.04),
scaleRate: rand(0.005, 0.02),
yRate: rand(0.003, 0.015),
};
}

function getTargetCount(sceneWidth: number): { min: number; max: number } {
const base = Math.floor((sceneWidth / 1000) * BASE_CLOUDS_PER_1000PX);
const max = Math.floor((sceneWidth / 1000) * MAX_CLOUDS_PER_1000PX);
return { min: Math.max(1, base), max: Math.max(2, max) };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Clouds({
cloudBaseRGB = [255, 255, 255],
maxPuffsPerCloud = 6,
yRange = [0.05, 0.45],
speedRange = [4, 18],
sizeRange = [60, 220],
className = '',
}: CloudsProps) {
const { sceneWidth, sceneHeight } = useSceneDimensions();
const [clouds, setClouds] = useState<Cloud[]>([]);
const cloudsRef = useRef<Cloud[]>([]);
const lastFrameRef = useRef<number>(Date.now());
const animFrameRef = useRef<number>(0);
const evolutionTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
const targetCountRef = useRef<number>(0);

// ── Spawn helpers ──

const spawnOne = useCallback((offscreen: boolean = true): Cloud => {
const direction: 1 | -1 = Math.random() > 0.5 ? 1 : -1;
return spawnCloud(
sceneWidth, sceneHeight, direction,
yRange, speedRange, sizeRange, maxPuffsPerCloud, offscreen
);
}, [sceneWidth, sceneHeight, yRange, speedRange, sizeRange, maxPuffsPerCloud]);

// ── Initial seed ──
useEffect(() => {
if (sceneWidth === 0) return;
const { min, max } = getTargetCount(sceneWidth);
const initialCount = randInt(min, max);
targetCountRef.current = initialCount;
const initial = Array.from({ length: initialCount }, () => spawnOne(false));
cloudsRef.current = initial;
setClouds([...initial]);
}, [sceneWidth]);

// ── Evolution: periodically set new targets ──
useEffect(() => {
evolutionTimerRef.current = setInterval(() => {
const { min, max } = getTargetCount(sceneWidth);
targetCountRef.current = randInt(min, max);


  cloudsRef.current = cloudsRef.current.map((cloud: Cloud )=> ({
    ...cloud,
    targetOpacity: rand(0.35, 0.9),
    targetScale: rand(0.75, 1.3),
    targetY: sceneHeight * rand(yRange[0], yRange[1]),
    opacityRate: rand(0.01, 0.04),
    scaleRate: rand(0.005, 0.02),
    yRate: rand(0.003, 0.015),
    // Occasionally shift speed target
    speed: rand(speedRange[0], speedRange[1]),
  }));
}, EVOLUTION_INTERVAL_MS);

return () => {
  if (evolutionTimerRef.current) clearInterval(evolutionTimerRef.current);
};


}, [sceneWidth, sceneHeight, yRange, speedRange]);

// ── Animation loop ──
useEffect(() => {
if (sceneWidth === 0) return;


const interval = 1000 / FRAME_RATE;

function tick() {
  const now = Date.now();
  const elapsed = (now - lastFrameRef.current) / 1000; // seconds
  lastFrameRef.current = now;

  let updated = cloudsRef.current.map((cloud: Cloud ) => {
    // Drift position
    const x = cloud.x + cloud.speed * cloud.direction * elapsed;

    // Interpolate toward targets
    const opacity = lerp(cloud.opacity, cloud.targetOpacity, cloud.opacityRate);
    const scale = lerp(cloud.scale, cloud.targetScale, cloud.scaleRate);
    const y = lerp(cloud.y, cloud.targetY, cloud.yRate);

    return { ...cloud, x, opacity, scale, y };
  });

  // Remove clouds that have fully exited the scene
  const maxSize = sizeRange[1] * 1.5;
  updated = updated.filter((cloud: Cloud ) => {
    if (cloud.direction === 1) return cloud.x < sceneWidth + maxSize;
    return cloud.x > -maxSize;
  });

  // Adjust population toward target count
  const target = targetCountRef.current;
  if (updated.length < target) {
    updated.push(spawnOne(true));
  }

  cloudsRef.current = updated;
  setClouds([...updated]);

  animFrameRef.current = window.setTimeout(tick, interval);
}

animFrameRef.current = window.setTimeout(tick, interval);

return () => {
  window.clearTimeout(animFrameRef.current);
};


}, [sceneWidth, sceneHeight, spawnOne, sizeRange]);

if (sceneWidth === 0) return null;

const [r, g, b] = cloudBaseRGB;

return (
<div
style={{
position: 'absolute',
inset: 0,
width: '100%',
height: '100%',
pointerEvents: 'none',
overflow: 'hidden',
}}
className={`clouds-layer${className ? ` ${className}` : ''}`}
aria-hidden='true'
>
<svg
width='100%'
height='100%'
xmlns="http://www.w3.org/2000/svg"
style={{ display: 'block' }}
>
<defs>
{/* Soft blur filter applied to each cloud group */}
<filter id="cloud-blur" x="-50%" y="-50%" width="200%" height="200%">
<feGaussianBlur stdDeviation="8" />
</filter>
<filter id="cloud-blur-soft" x="-50%" y="-50%" width="200%" height="200%">
<feGaussianBlur stdDeviation="14" />
</filter>
</defs>


    {clouds.map(cloud => (
      <g
        key={cloud.id}
        transform={`translate(${cloud.x.toFixed(2)}, ${cloud.y.toFixed(2)}) scale(${cloud.scale.toFixed(4)})`}
        opacity={cloud.opacity.toFixed(4)}
      >
        {/* Soft glow layer behind the cloud */}
        <g filter="url(#cloud-blur-soft)" opacity="0.4">
          {cloud.puffs.map((puff, i) => (
            <ellipse
              key={`glow-${i}`}
              cx={puff.dx}
              cy={puff.dy}
              rx={puff.rx * 1.4}
              ry={puff.ry * 1.4}
              fill={`rgba(${r},${g},${b},${(puff.opacity * 0.5).toFixed(3)})`}
            />
          ))}
        </g>
        {/* Main cloud body */}
        <g filter="url(#cloud-blur)">
          {cloud.puffs.map((puff, i) => (
            <ellipse
              key={`puff-${i}`}
              cx={puff.dx}
              cy={puff.dy}
              rx={puff.rx}
              ry={puff.ry}
              fill={`rgba(${r},${g},${b},${puff.opacity.toFixed(3)})`}
            />
          ))}
        </g>
      </g>
    ))}
  </svg>
</div>


);
}
