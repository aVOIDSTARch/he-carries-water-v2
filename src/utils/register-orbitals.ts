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
