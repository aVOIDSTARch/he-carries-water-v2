// JSX file to insert the Mondrian grid into the Astro page. This is where the cell content lives, and where the reveal sequence logic will be implemented.
interface MondrianProps {
  live: boolean; // whether the site is live or coming soon
}
/**
 * Mondrian grid component — purely presentational.
 * The reveal sequence and timing will be handled by the parent Astro page.
 */
export default function Mondrian(props: MondrianProps) {

  return (
    <div class="mondrian" id="mondrian">
      {/* Void border strips */}
      <div class="line" style="grid-column:1/10; grid-row:1/2;"></div>
      <div class="line" style="grid-column:1/10; grid-row:3/4;"></div>
      <div class="line" style="grid-column:1/10; grid-row:5/6;"></div>
      <div class="line" style="grid-column:1/10; grid-row:7/8;"></div>
      <div class="line" style="grid-column:1/10; grid-row:9/10;"></div>
      <div class="line" style="grid-column:1/2;  grid-row:1/10;"></div>
      <div class="line" style="grid-column:3/4;  grid-row:1/10;"></div>
      <div class="line" style="grid-column:5/6;  grid-row:1/10;"></div>
      <div class="line" style="grid-column:7/8;  grid-row:1/10;"></div>
      <div class="line" style="grid-column:9/10; grid-row:1/10;"></div>
      {/*
      ═══════════════════════════════════════════════════════════
      CELL INTEGER MAP
      Each colored cell has a data-cell-id integer (1–11).
      The reveal sequence is randomized from these IDs each load.

      ID  CLASS        COLOR       POSITION
      1  c-tl         bone        top-left
      2  c-ml         magenta     mid-left
      3  c-tr         acid        top-right tall
      4  c-center     electric    center hero
      5  c-mr         plasma      mid-right top
      6  c-bl         void        bottom-left
      7  c-cb         bone        center-bottom
      8  c-cbr        magenta     center-right
      9  c-ba         acid        bottom strip
      10  c-br         electric    bottom-right large
      11  c-trp        plasma      right accent
      ═══════════════════════════════════════════════════════════
      */}
      <div class="cell c-tl" data-cell-id="1" data-jiggle>
        <span class="cell-id">1</span>
        <span
          style="font-family:'Space Mono',
          monospace; font-size:clamp(7px,0.6vw,9px);
          letter-spacing:0.25em;
          text-transform:uppercase;
          color:rgba(8,8,8,0.3);
          position:relative; z-index:2;">
          Water = Truth
        </span>
      </div>

      <div class="cell c-ml c-magenta-flicker" data-cell-id="2" data-jiggle>
        <span class="cell-id">2</span>
      </div>

      <div class="cell c-tr" data-cell-id="3" data-jiggle>
        <span class="cell-id">3</span>
        <span class="vert-text">hecarrieswater.com</span>
      </div>

      <div class="cell c-center" data-cell-id="4" data-jiggle>
        <span class="cell-id">4</span>
        <div class="site-name">He<br/>Carries<br/>Water</div>
        <div class="site-sub">Something is being built</div>
        <span class="coming-tag">{props.live ? 'Enter' : 'Coming Soon' }</span>
      </div>

        <div class="cell c-mr" data-cell-id="5" data-jiggle>
          <span class="cell-id">5</span>
        </div>

        <div class="cell c-bl" data-cell-id="6" data-jiggle>
          <span class="cell-id" style="color:rgba(240,237,224,0.25);">6</span>
          <div class="bl-text">©2026<br/>hecarrieswater</div>
        </div>

        <div class="cell c-cb" data-cell-id="7" data-jiggle>
          <span class="cell-id">7</span>
        </div>

        <div class="cell c-cbr c-magenta-flicker" data-cell-id="8" data-jiggle>
          <span class="cell-id">8</span>
        </div>

        <div class="cell c-ba" data-cell-id="9" data-jiggle>
          <span class="cell-id">9</span>
          <div class="pulse-dot"></div>
        </div>

        <div class="cell c-br" data-cell-id="10" data-jiggle>
          <span class="cell-id">10</span>
          <div class="br-mark">HCW</div>
        </div>

        <div class="cell c-trp" data-cell-id="11" data-jiggle>
          <span class="cell-id">11</span>
        </div>
      </div>

)}
