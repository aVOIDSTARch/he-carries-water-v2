// src/pages/index.astro
import ParallaxPage from '@components/ParallaxPage';
import ParallaxLayer from '@components/ParallaxLayer';
import OrbitalObject from '@components/OrbitalObject';
import  Sky from '@components/Sky';
import { DEFAULT_Z_CONFIG, getZ } from '@utils/z-config';
import Clouds from '@components/Clouds';

interface HomepageProps {
  // any props needed for the homepage can be defined here
}

export default function Homepage(props: HomepageProps) {

  return (
    <div class="homepage">
      <ParallaxPage maxWidth={2560} letterboxColor="rgb(10, 15, 45)">
        <ParallaxLayer zIndex={getZ(DEFAULT_Z_CONFIG, 'BACKGROUND', 0)} mode="fill" >
          {/* Background component */}
          <Sky />
        </ParallaxLayer>

        <ParallaxLayer zIndex={getZ(DEFAULT_Z_CONFIG, 'SOLAR', 0)} mode="fill" passThrough>
          <OrbitalObject id="sun" src="/images/sun.png" alt="Sun" imageSize={64} />
        </ParallaxLayer>

        <ParallaxLayer zIndex={getZ(DEFAULT_Z_CONFIG, 'ORBITING', 0)} mode="fill" passThrough>
          <OrbitalObject id="moon" src="/images/moon.png" alt="Moon" imageSize={32} />
        </ParallaxLayer>

        <ParallaxLayer zIndex={getZ(DEFAULT_Z_CONFIG, 'ATMOSPHERE', 0)} mode="fill" passThrough>
          <Clouds />
        </ParallaxLayer>

        <ParallaxLayer zIndex={getZ(DEFAULT_Z_CONFIG, 'FOREGROUND', 0)} mode="content">
          {/* UI / navigation */}
          <div class="TODO">.</div>
        </ParallaxLayer>
      </ParallaxPage>
    </div>
  );
}
