# GITHUB_PROJECT_SETUP_HCW.md
## Project Board Setup — he-carries-water-v2
## https://github.com/aVOIDSTARch/he-carries-water-v2
## Linked to: Cosmogony — Production project board

*Generated: Session 1 — 2026-04-03*

---

## Overview

This repo is linked to the same GitHub Project board as `cosmogony`.
Labels and milestones are repo-specific. Issues from both repos appear
in the shared `Cosmogony — Production` board, distinguished by repo label.

---

## PART 1 — Link to Existing Project Board

```bash
# Use the project number from when you created "Cosmogony — Production"
export PROJECT_NUM=<your project number>
gh project link $PROJECT_NUM --owner aVOIDSTARch --repo he-carries-water-v2
```

---

## PART 2 — Repository Labels

```bash
# Phase labels
gh label create "phase: concept" --repo aVOIDSTARc/he-carries-water-v2 \
  --color "0075ca" --description "Concept, identity, content architecture planning"

gh label create "phase: design" --repo aVOIDSTARch/he-carries-water-v2 \
  --color "5319e7" --description "Visual design, aesthetic decisions, prototyping"

gh label create "phase: foundation" --repo aVOIDSTARch/he-carries-water-v2 \
  --color "b4a8ff" --description "Repo setup, toolchain, scaffolding, CI"

gh label create "phase: build" --repo aVOIDSTARch/he-carries-water-v2 \
  --color "e4e669" --description "Active feature development"

gh label create "phase: content" --repo aVOIDSTARch/he-carries-water-v2 \
  --color "0e8a16" --description "Adding and formatting actual content"

gh label create "phase: launch" --repo aVOIDSTARch/he-carries-water-v2 \
  --color "f9d0c4" --description "Deploy, domain, public launch preparation"

# Type labels
gh label create "doc: concept" --repo aVOIDSTARch/he-carries-water-v2 \
  --color "c2e0c6" --description "concept.md updates"

gh label create "doc: aesthetics" --repo aVOIDSTARch/he-carries-water-v2 \
  --color "c2e0c6" --description "aesthetics.md updates"

gh label create "doc: tech-stack" --repo aVOIDSTARch/he-carries-water-v2 \
  --color "c2e0c6" --description "tech-stack.md updates"

gh label create "feature" --repo aVOIDSTARch/he-carries-water-v2 \
  --color "1d76db" --description "New site feature or section"

gh label create "content" --repo aVOIDSTARch/he-carries-water-v2 \
  --color "0e8a16" --description "Adding creative content to the site"

gh label create "open question" --repo aVOIDSTARch/he-carries-water-v2 \
  --color "e4e669" --description "Unresolved design or architectural decision"

gh label create "adhd-friendly" --repo aVOIDSTARch/he-carries-water-v2 \
  --color "d93f0b" --description "Small, completable task — good for rotation"
```

---

## PART 3 — Milestones

```bash
gh api repos/aVOIDSTARch/he-carries-water-v2/milestones \
  --method POST \
  --field title="Concept Complete" \
  --field description="concept.md, aesthetics.md, dev-reqs.md settled. Identity clear. Ready to design."

gh api repos/aVOIDSTARch/he-carries-water-v2/milestones \
  --method POST \
  --field title="Design Complete" \
  --field description="Visual language defined. Color system. Type. Layout principles. Component aesthetic."

gh api repos/aVOIDSTARch/he-carries-water-v2/milestones \
  --method POST \
  --field title="Foundation Complete" \
  --field description="Repo scaffolded. Toolchain running. CI/CD basic. Hello world deployed."

gh api repos/aVOIDSTARch/he-carries-water-v2/milestones \
  --method POST \
  --field title="Music Section Live" \
  --field description="Music section built and populated. Cosmogony page with infrasonic tone. Alien musical placeholder."

gh api repos/aVOIDSTARch/he-carries-water-v2/milestones \
  --method POST \
  --field title="All Sections Scaffolded" \
  --field description="All six content types have working sections. Minimal content in each. Site is navigable end to end."

gh api repos/aVOIDSTARch/he-carries-water-v2/milestones \
  --method POST \
  --field title="Public Launch" \
  --field description="Domain configured. Accessible. Content populated enough to receive visitors."
```

---

## PART 4 — Seed Issues

```bash
gh issue create --repo aVOIDSTARch/he-carries-water-v2 \
  --title "Settle color system" \
  --label "phase: design,doc: aesthetics,open question,adhd-friendly" \
  --body "Define the color palette.

Reference: bun.sh for vibe and shade gradation quality.
Requirements: warm, confident, not corporate, slightly unexpected.

Decisions needed:
- Primary palette (3-5 colors)
- Background tone
- Accent/highlight color
- Dark mode approach (yes/no/both)

Reference: aesthetics.md"

gh issue create --repo aVOIDSTARch/he-carries-water-v2 \
  --title "Define typography system" \
  --label "phase: design,doc: aesthetics,open question,adhd-friendly" \
  --body "Choose typefaces and scale.

Must feel: bespoke, not default, legible, slightly strange.
Must not feel: corporate, generic, over-designed.

Decisions needed:
- Display / heading face
- Body face
- Mono face (for any code or technical content)
- Type scale

Reference: aesthetics.md"

gh issue create --repo aVOIDSTARch/he-carries-water-v2 \
  --title "Scaffold Deno + Fresh project" \
  --label "phase: foundation,adhd-friendly" \
  --body "Initialize the technical foundation.

\`\`\`bash
deno run -A -r https://fresh.deno.dev he-carries-water-v2
\`\`\`

Then:
- [ ] Add TailwindCSS
- [ ] Verify ShadCN or Radix primitives integrate
- [ ] Hello world running locally
- [ ] Confirm Deno KV works

Reference: tech-stack.md"

gh issue create --repo aVOIDSTARch/he-carries-water-v2 \
  --title "Add TypeDoc configuration" \
  --label "phase: foundation,adhd-friendly" \
  --body "Set up TypeDoc for project documentation.

Install and configure typedoc.json. Verify it generates from source.
Output to /docs or equivalent.

Reference: tech-stack.md — Documentation section"

gh issue create --repo aVOIDSTARch/he-carries-water-v2 \
  --title "Set up @logtape/logtape + Resend" \
  --label "phase: foundation" \
  --body "Logging and admin email alerts.

- Install @logtape/logtape
- Configure console sink for dev
- Configure Resend for email alerts (free tier)
- Test admin notification on error threshold

Reference: tech-stack.md — Logging section"

gh issue create --repo aVOIDSTARch/he-carries-water-v2 \
  --title "Design horizontal scroll navigation concept" \
  --label "phase: design,open question" \
  --body "Evaluate horizontal scroll as structural navigation.

The wild idea: rooms you move through rather than pages you click to.
Each content section is a room with its own sensory tuning.

Questions to answer:
- Does horizontal scroll serve the museum metaphor or fight it?
- How does it work on mobile?
- What is the fallback for accessibility?
- Prototype before committing.

Reference: aesthetics.md — Wild Ideas"

gh issue create --repo aVOIDSTARch/he-carries-water-v2 \
  --title "Build Cosmogony music page with infrasonic tone" \
  --label "phase: build,feature,content" \
  --body "The Cosmogony page within the Music section.

The inaudible low frequency tone is decided — not a wild idea.
This page is a physical experience before the music plays.

Requirements:
- [ ] Sub-bass tone loaded on page entry (Web Audio API)
- [ ] Frequency: below 20Hz or at threshold — felt, not heard
- [ ] Graceful handling if browser blocks autoplay
- [ ] Page aesthetic tied to the suite's visual identity
- [ ] Link to Cosmogony project/release when available

Blocked by: Music section scaffold"

gh issue create --repo aVOIDSTARch/he-carries-water-v2 \
  --title "Create placeholder for Alien Musical project" \
  --label "phase: content,content,adhd-friendly" \
  --body "The Suno alien musical deserves a page before it is fully realized.

Context: A musical about an alien who leaves his family to determine if humans
are safe before they notice the existence of his kind — allegory for the autistic
experience. Created with Suno. Caused significant emotional release. Most people
missed it. It will be properly realized in a future project.

For now: a placeholder page within Music that names the project and holds space.
Full realization is a separate future project.

Reference: concept.md — Future Projects"
```

---

## PART 5 — Cosmogony Issues: Add Phase Labels

The following commands add phase context to existing cosmogony issues.
Run after identifying the issue numbers GitHub assigned.

```bash
# After creating cosmogony issues, list them:
gh issue list --repo aVOIDSTARch/cosmogony

# Then add phase label to each — example:
gh issue edit <NUMBER> --repo aVOIDSTARch/cosmogony \
  --add-label "phase: pre-composition"

# All character interview issues → phase: pre-composition
# All OQ issues → phase: pre-composition (hold open)
# Install Sonic Pi → phase: pre-composition
# First sketch → phase: sketching
# NAME.md integrity → phase: pre-composition
```

---

## Notes

- The `adhd-friendly` label marks issues that are small, self-contained, and
  completable in a single session — good rotation targets when the main project
  needs a break.
- Issues from both repos appear in the shared project board. Use the repo label
  colors to distinguish cosmogony work from he-carries-water work at a glance.
- No due dates on any milestone. Both projects run on their own time.
