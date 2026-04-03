# tech-stack.md
## He Carries Water — Technology Stack

*Preferences, recommendations, and rationale.*
*Last updated: Session 1 — 2026-04-03*

---

## Settled Choices

| Layer | Choice | Notes |
|---|---|---|
| Language | TypeScript (stable) | Settled |
| Runtime | Deno → Bun → Node | Deno strongly preferred |
| CSS | TailwindCSS | Negotiable |
| Components | ShadCN | Negotiable |
| Host OS | Linux, containerized with Docker | Settled |

---

## Open Slots — Recommendations

### Documentation
**Recommendation: TypeDoc**
TypeScript-native, generates from JSDoc comments in source, industry standard,
lightweight output. Integrates cleanly with Deno via `deno doc` for quick inline
reference and TypeDoc for published docs. No serious competitor for TS-first projects.

### Testing
**Recommendation: Deno's built-in test runner (`Deno.test`)**
Native, zero-config, fast. For more complex assertion needs, add `@std/assert`
from the Deno standard library. No separate package required. If you need
browser/E2E testing later, Deno integrates with Playwright.

### Logging
**Recommendation: `@logtape/logtape`**
Free, Deno-native, simple API, structured output, supports multiple sinks
(console, file, remote). For email-to-admins: pair with a simple SMTP sink or
a free tier on Resend (resend.com) — clean API, generous free tier, works with
any runtime. Avoid Pino or Winston — Node-centric, heavier than needed here.

### Web Server
**Recommendation: Deno's built-in `Deno.serve()`**
Since Deno 1.35, the built-in HTTP server is production-grade, fast, and requires
zero dependencies. For routing on top of it: **Hono** — Deno-native, extremely
fast, lightweight, excellent TypeScript support, growing ecosystem.
Alternatives if Hono feels like too much: Oak (Deno classic) or Fresh (Deno's
full-stack framework, includes routing + JSX islands).

### Frontend Framework
**Recommendation: Fresh (Deno-native) or Astro**
- **Fresh**: Deno's own full-stack framework. Islands architecture — ships zero JS
  by default, hydrates only what needs interactivity. Perfect for a content-heavy
  portfolio with selective rich interactions. Stays entirely in the Deno ecosystem.
- **Astro**: Framework-agnostic, excellent for content sites, supports Deno via
  adapter, slightly larger ecosystem. Choose if you want more component library options.
- **Recommendation**: Fresh for Deno purity; Astro if the component ecosystem matters more.

### Datastore
**Recommendation: Deno KV (built-in) → SQLite via Deno**
- **Deno KV**: Zero-config, built into the runtime, fast, persistent, works
  locally and on Deno Deploy. Sufficient for a portfolio site's data needs
  (blog posts, musings, inspiration board entries).
- **SQLite via `@db/sqlite`**: If relational queries become necessary. Deno-native
  binding, fast, no server required.
- Avoid Postgres/MySQL for this project — operational overhead not justified by need.

---

## Stack Summary (Recommended)

```
Runtime:      Deno
Framework:    Fresh (or Astro)
CSS:          TailwindCSS (via Fresh/Astro integration)
Components:   ShadCN (adapted) or Radix primitives
Web server:   Deno.serve() + Hono router
Datastore:    Deno KV
Logging:      @logtape/logtape + Resend for email alerts
Testing:      Deno.test + @std/assert
Docs:         TypeDoc
Deploy:       Deno Deploy (zero-config for Fresh) or Docker on Linux VPS
```
