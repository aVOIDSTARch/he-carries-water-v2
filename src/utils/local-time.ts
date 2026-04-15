/**
 * local-time.ts
 * Client-side time utility for hecarrieswater.com
 *
 * - Date is captured once per visit (immutable after init)
 * - Time is updated every 60 seconds via setInterval
 * - Source: Temporal API with @js-temporal/polyfill fallback
 * - No framework dependencies — safe to import in any Astro <script>
 *
 * Usage:
 *   import { initTime, getLocalTime, getLocalDate } from '@utils/local-time';
 *   initTime(); // call once, e.g. in a top-level Astro <script>
 *   const time = getLocalTime(); // { hour, minute, second, formatted }
 *   const date = getLocalDate(); // { year, month, day, formatted }

Project Setup Items
1. make sure you install the polyfill plugin using:

```
npm install @js-temporal/polyfill
```
2. Add the following to the tsconfig.json:

```
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@utils/*": ["src/utils/*"]
    }
  }
}
```

3. Add the following to the astro.config.mjs:

```
import { defineConfig } from 'astro/config';

export default defineConfig({
  vite: {
    resolve: {
      alias: {
        '@utils': '/src/utils',
      },
    },
  },
});
```

 */

import { Temporal } from '@js-temporal/polyfill';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LocalTime {
  hour: number;        // 0–23
  minute: number;      // 0–59
  second: number;      // 0–59
  formatted: string;   // "HH:MM" — 24h, zero-padded
}

export interface LocalDate {
  year: number;
  month: number;       // 1–12
  day: number;         // 1–31
  formatted: string;   // "YYYY-MM-DD"
}

// ─── Module state ─────────────────────────────────────────────────────────────

let _time: LocalTime | null = null;
let _date: LocalDate | null = null;
let _intervalId: ReturnType<typeof setInterval> | null = null;
let _initialized = false;

// ─── Internal helpers ─────────────────────────────────────────────────────────

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function captureTime(): LocalTime {
  const now = Temporal.Now.plainTimeISO();
  return {
    hour: now.hour,
    minute: now.minute,
    second: now.second,
    formatted: `${pad(now.hour)}:${pad(now.minute)}`,
  };
}

function captureDate(): LocalDate {
  const today = Temporal.Now.plainDateISO();
  return {
    year: today.year,
    month: today.month,
    day: today.day,
    formatted: `${today.year}-${pad(today.month)}-${pad(today.day)}`,
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Initialise the time module.
 * - Captures date once (immutable for the session)
 * - Captures time immediately, then refreshes every 60 seconds
 * - Safe to call multiple times; subsequent calls are no-ops
 */
export function initTime(): void {
  if (_initialized) return;
  _initialized = true;

  _date = captureDate();
  _time = captureTime();

  _intervalId = setInterval(() => {
    _time = captureTime();
  }, 60_000);
}

/**
 * Returns the current local time snapshot.
 * Updated every 60 seconds after initTime() is called.
 * Returns null if initTime() has not been called.
 */
export function getLocalTime(): LocalTime | null {
  return _time;
}

/**
 * Returns the local date captured at session start.
 * Immutable for the lifetime of the visit.
 * Returns null if initTime() has not been called.
 */
export function getLocalDate(): LocalDate | null {
  return _date;
}

/**
 * Register a callback that fires immediately and then on every time update.
 * Useful for wiring animation/calculation logic directly to the update cycle.
 *
 * @param callback  Receives the latest LocalTime on each tick
 * @returns         Unsubscribe function — call it to stop receiving updates
 *
 * @example
 *   const unsub = onTimeUpdate((t) => {
 *     myAnimation.setHour(t.hour);
 *   });
 *   // later: unsub();
 */
export function onTimeUpdate(callback: (time: LocalTime) => void): () => void {
  if (!_initialized) {
    console.warn('[local-time] onTimeUpdate called before initTime(). Call initTime() first.');
  }

  // Fire immediately with current value if available
  if (_time) callback(_time);

  // Wrap the interval to also notify this subscriber
  const id = setInterval(() => {
    if (_time) callback(_time);
  }, 60_000);

  return () => clearInterval(id);
}

/**
 * Tear down the update loop.
 * Call if you need to clean up on page transitions (e.g. Astro View Transitions).
 */
export function destroyTime(): void {
  if (_intervalId !== null) {
    clearInterval(_intervalId);
    _intervalId = null;
  }
  _initialized = false;
  _time = null;
  // _date intentionally preserved — it does not change within a visit
}
