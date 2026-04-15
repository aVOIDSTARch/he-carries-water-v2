// src/pages/index.astro
import ParallaxPage from '@components/ParallaxPage';
import ParallaxLayer from '@components/ParallaxLayer';
import OrbitalObject from '@components/OrbitalObject';
import { DEFAULT_Z_CONFIG, getZ } from '@utils/z-config';

interface HomepageProps {
  // any props needed for the homepage can be defined here
}

export default function Homepage(props: HomepageProps) {


  return (
    <div class="homepage">
      <ParallaxPage client:load maxWidth={2560}>
        <ParallaxLayer zIndex={getZ(DEFAULT_Z_CONFIG, 'BACKGROUND', 0)} mode="fill" passThrough>
        {/* Background component */}
        </ParallaxLayer>

        <ParallaxLayer zIndex={getZ(DEFAULT_Z_CONFIG, 'SOLAR', 0)} mode="fill" passThrough>
          <OrbitalObject client:load id="sun" src="/images/sun.png" alt="Sun" imageSize={64} />
        </ParallaxLayer>

        <ParallaxLayer zIndex={getZ(DEFAULT_Z_CONFIG, 'ORBITING', 0)} mode="fill" passThrough>
          <OrbitalObject client:load id="moon" src="/images/moon.png" alt="Moon" imageSize={32} >
        </ParallaxLayer>

        <ParallaxLayer zIndex={getZ(DEFAULT_Z_CONFIG, 'ATMOSPHERE', 0)} mode="fill" passThrough>
            {/* Atmosphere / haze component */}
        </ParallaxLayer>

        <ParallaxLayer zIndex={getZ(DEFAULT_Z_CONFIG, 'FOREGROUND', 0)} mode="content">
            {/* UI / navigation */}
        </ParallaxLayer>
      </ParallaxPage>
      <script type="module" src="/utils/register-orbitals.js" client:load></script>
    </div>

)}
