
// ════════════════════════════════════════════════════════════════
//
//  ██████╗ ███████╗██╗   ██╗███████╗ █████╗ ██╗
//  ██╔══██╗██╔════╝██║   ██║██╔════╝██╔══██╗██║
//  ██████╔╝█████╗  ██║   ██║█████╗  ███████║██║
//  ██╔══██╗██╔══╝  ╚██╗ ██╔╝██╔══╝  ██╔══██║██║
//  ██║  ██║███████╗ ╚████╔╝ ███████╗██║  ██║███████╗
//  ╚═╝  ╚═╝╚══════╝  ╚═══╝  ╚══════╝╚═╝  ╚═╝╚══════╝
//
//  ┌─────────────────────────────────────────────────────┐
//  │  REVEAL_ENABLED                                     │
//  │                                                     │
//  │  true  → cells animate out one-by-one, revealing   │
//  │          the homepage underneath                    │
//  │                                                     │
//  │  false → coming-soon page stays, no animation,     │
//  │          only mouse jiggle active                   │
//  └─────────────────────────────────────────────────────┘

const REVEAL_ENABLED = false;

// ════════════════════════════════════════════════════════════════
//  REVEAL TUNING
// ════════════════════════════════════════════════════════════════

const REVEAL_CONFIG = {
  // ms between each cell starting its exit
  interval: 520,
  // ms before the sequence begins after page load
  startDelay: 1800,
  // show cell-id labels during development (auto-hidden when REVEAL_ENABLED=false)
  showLabels: true,
  // per-cell exit animation duration range [min, max] ms
  exitDuration: [600, 1200],
} as const;

// ════════════════════════════════════════════════════════════════
//  MOUSE JIGGLE TUNING
// ════════════════════════════════════════════════════════════════

const JIGGLE = {
  influence: 320,   // px radius
  maxPush: 18,    // max translate px
  maxRotate: 2.8,   // max degrees
  lerpIn: 0.10,
  lerpOut: 0.07,
};

// ════════════════════════════════════════════════════════════════
//  EXIT ANIMATION TYPES
//  Each is a function that returns { keyframes, options }
//  RNG picks a combo per cell: [preShake?] + [exitType]
// ════════════════════════════════════════════════════════════════

const EXIT_TYPES = [
  // 0: spin out clockwise
  () => ({ name: 'spinOut', extra: '--spin-dir: 360deg;', dur: rand(...REVEAL_CONFIG.exitDuration) }),
  // 1: spin out counter-clockwise
  () => ({ name: 'spinOut', extra: '--spin-dir: -360deg;', dur: rand(...REVEAL_CONFIG.exitDuration) }),
  // 2: shrink to nothing
  () => ({ name: 'shrinkOut', extra: '', dur: rand(...REVEAL_CONFIG.exitDuration) }),
  // 3: expand and vanish
  () => ({ name: 'expandOut', extra: '', dur: rand(...REVEAL_CONFIG.exitDuration) }),
  // 4: slide up
  () => ({ name: 'slideUp', extra: '', dur: rand(...REVEAL_CONFIG.exitDuration) }),
  // 5: slide down
  () => ({ name: 'slideDown', extra: '', dur: rand(...REVEAL_CONFIG.exitDuration) }),
  // 6: slide left
  () => ({ name: 'slideLeft', extra: '', dur: rand(...REVEAL_CONFIG.exitDuration) }),
  // 7: slide right
  () => ({ name: 'slideRight', extra: '', dur: rand(...REVEAL_CONFIG.exitDuration) }),
  // 8: flip out
  () => ({ name: 'flipOut', extra: '', dur: rand(...REVEAL_CONFIG.exitDuration) }),
  // 9: dissolve blur
  () => ({ name: 'dissolve', extra: '', dur: rand(...REVEAL_CONFIG.exitDuration) }),
];

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickExit() {
  return EXIT_TYPES[rand(0, EXIT_TYPES.length - 1)]();
}

function shuffle(arr: number[]): number[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ════════════════════════════════════════════════════════════════
//  BOOT
// ════════════════════════════════════════════════════════════════

const mondrian = document.getElementById('mondrian');
if (!mondrian) throw new Error('mondrian element not found');

const cells = [...document.querySelectorAll<HTMLElement>('[data-cell-id]')];
const jiggleCells = [...document.querySelectorAll<HTMLElement>('[data-jiggle]')];


// Label visibility
if (REVEAL_ENABLED || REVEAL_CONFIG.showLabels) {
  // labels visible by default — hide only when both flags say so
} else {
  mondrian.classList.add('hide-labels');
}
if (!REVEAL_CONFIG.showLabels) {
  mondrian.classList.add('hide-labels');
}

// ── MOUSE JIGGLE ─────────────────────────────────────────────

const jState = jiggleCells.map(() => ({
  tx: 0, ty: 0, rot: 0,
  txT: 0, tyT: 0, rotT: 0,
}));

let mx = -9999, my = -9999;

window.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
window.addEventListener('mouseleave', () => { mx = -9999; my = -9999; });

function lerp(a: number, b: number, t: number): number { return a + (b - a) * t; }

function jiggleTick() {
  jiggleCells.forEach((cell, i) => {
    // Skip cells that are gone
    if (cell.classList.contains('cell-gone')) return;

    const rect = cell.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = cx - mx;
    const dy = cy - my;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < JIGGLE.influence && mx > 0) {
      const strength = 1 - dist / JIGGLE.influence;
      const s2 = strength * strength;
      const nx = dx / dist;
      const ny = dy / dist;
      jState[i].txT = nx * JIGGLE.maxPush * s2;
      jState[i].tyT = ny * JIGGLE.maxPush * s2;
      jState[i].rotT = (dx / rect.width) * JIGGLE.maxRotate * s2 * -1;
      const sp = JIGGLE.lerpIn + strength * 0.08;
      jState[i].tx = lerp(jState[i].tx, jState[i].txT, sp);
      jState[i].ty = lerp(jState[i].ty, jState[i].tyT, sp);
      jState[i].rot = lerp(jState[i].rot, jState[i].rotT, sp);
    } else {
      jState[i].tx = lerp(jState[i].tx, 0, JIGGLE.lerpOut);
      jState[i].ty = lerp(jState[i].ty, 0, JIGGLE.lerpOut);
      jState[i].rot = lerp(jState[i].rot, 0, JIGGLE.lerpOut);
    }

    cell.style.transform = `translate(${jState[i].tx.toFixed(2)}px,${jState[i].ty.toFixed(2)}px) rotate(${jState[i].rot.toFixed(3)}deg)`;
  });

  requestAnimationFrame(jiggleTick);
}

requestAnimationFrame(jiggleTick);

// ── REVEAL SEQUENCE ───────────────────────────────────────────

function exitCell(cell: HTMLElement): Promise<void> {
  return new Promise(resolve => {
    const doShake = Math.random() > 0.45; // ~55% chance of pre-shake
    const exit = pickExit();

    // Apply CSS custom property for spin direction if needed
    if (exit.extra) {
      exit.extra.split(';').forEach(rule => {
        const [prop, val] = rule.split(':');
        if (prop && val) cell.style.setProperty(prop.trim(), val.trim());
      });
    }

    if (doShake) {
      // Phase 1: shake
      const shakeDur = rand(280, 480);
      cell.style.animation = `shake ${shakeDur}ms ease-in-out`;
      setTimeout(() => {
        // Phase 2: exit animation
        cell.style.animation = `${exit.name} ${exit.dur}ms cubic-bezier(0.4,0,0.6,1) forwards`;
        setTimeout(() => {
          cell.classList.add('cell-gone');
          cell.style.animation = '';
          cell.style.transform = '';
          resolve();
        }, exit.dur);
      }, shakeDur);
    } else {
      // Straight to exit
      cell.style.animation = `${exit.name} ${exit.dur}ms cubic-bezier(0.4,0,0.6,1) forwards`;
      setTimeout(() => {
        cell.classList.add('cell-gone');
        cell.style.animation = '';
        cell.style.transform = '';
        resolve();
      }, exit.dur);
    }
  });
}

// ── REVEAL TRIGGER ───────────────────────────────────────────
// Cell 4 click fires the sequence — only when REVEAL_ENABLED = true.
// Set REVEAL_ENABLED = false to disable entirely (coming soon mode).

let revealFired = false;

function runRevealSequence() {
  if (revealFired) return;
  revealFired = true;

  // Remove pointer cursor once fired
  const trigger = document.querySelector<HTMLElement>('[data-cell-id="4"]');
  if (trigger) trigger.style.cursor = 'default';

  const order = shuffle(cells.map(c => parseInt(c.dataset.cellId!)));


  console.log(
    '%c[HCW] Reveal sequence: ' + order.join(' → '),
    'color: #FF0080; font-family: monospace; font-size: 11px;'
  );

  order.reduce((promise, id, i) => {
    return promise.then(() => {
      return new Promise(resolve => {
        setTimeout(() => {
          const cell = document.querySelector<HTMLElement>('[data-cell-id="' + id + '"]');
          if (cell) {
            exitCell(cell).then(resolve);
          } else {
            resolve();
          }
        }, i === 0 ? 0 : REVEAL_CONFIG.interval);
      });
    });
  }, Promise.resolve());
}

if (REVEAL_ENABLED) {
  const cell4 = document.querySelector<HTMLElement>('[data-cell-id="4"]');
  if (cell4) {
    cell4.addEventListener('click', runRevealSequence);
  }
}
