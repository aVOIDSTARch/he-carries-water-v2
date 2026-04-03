#!/usr/bin/env zsh
# setup-github.sh — he-carries-water-v2 repo
# Run from anywhere: zsh ~/art/he-carries-water-v2/setup-github.sh
# Requires: gh auth status passes before running

set -e
OWNER="aVOIDSTARch"
REPO="he-carries-water-v2"

# Guard against re-running
EXISTING=$(gh issue list --repo $OWNER/$REPO --state open --limit 1 --json number --jq 'length')
if [ "$EXISTING" -gt "0" ]; then
  echo "ERROR: Issues already exist in $OWNER/$REPO."
  echo "Do not re-run this setup script against a populated repo."
  exit 1
fi

echo "=== he-carries-water-v2: deleting default labels ==="
gh label delete "bug" --repo $OWNER/$REPO --yes 2>/dev/null || true
gh label delete "documentation" --repo $OWNER/$REPO --yes 2>/dev/null || true
gh label delete "duplicate" --repo $OWNER/$REPO --yes 2>/dev/null || true
gh label delete "enhancement" --repo $OWNER/$REPO --yes 2>/dev/null || true
gh label delete "good first issue" --repo $OWNER/$REPO --yes 2>/dev/null || true
gh label delete "help wanted" --repo $OWNER/$REPO --yes 2>/dev/null || true
gh label delete "invalid" --repo $OWNER/$REPO --yes 2>/dev/null || true
gh label delete "question" --repo $OWNER/$REPO --yes 2>/dev/null || true
gh label delete "wontfix" --repo $OWNER/$REPO --yes 2>/dev/null || true

# NOTE: Phase is a custom field on the project board (single-select), not a label.
# Set it up in the web UI after running setup-project-board.sh:
#   Field name: Phase
#   Type: Single select
#   Options: Concept / Design / Foundation / Build / Content / Launch

echo "=== he-carries-water-v2: creating type labels ==="
gh label create "doc: concept"    --repo $OWNER/$REPO --color "c2e0c6" --description "concept.md updates"
gh label create "doc: aesthetics" --repo $OWNER/$REPO --color "c2e0c6" --description "aesthetics.md updates"
gh label create "doc: tech-stack" --repo $OWNER/$REPO --color "c2e0c6" --description "tech-stack.md updates"
gh label create "feature"         --repo $OWNER/$REPO --color "1d76db" --description "New site feature or section"
gh label create "content"         --repo $OWNER/$REPO --color "0e8a16" --description "Adding creative content to the site"
gh label create "open question"   --repo $OWNER/$REPO --color "e4e669" --description "Unresolved design or architectural decision"
gh label create "adhd-friendly"   --repo $OWNER/$REPO --color "d93f0b" --description "Small completable task — good for rotation"

echo "=== he-carries-water-v2: creating milestones ==="
gh api repos/$OWNER/$REPO/milestones --method POST \
  --field title="Concept Complete" \
  --field description="concept.md, aesthetics.md, dev-reqs.md settled. Identity clear. Ready to design."

gh api repos/$OWNER/$REPO/milestones --method POST \
  --field title="Design Complete" \
  --field description="Visual language defined. Color system. Typography. Layout principles. Component aesthetic."

gh api repos/$OWNER/$REPO/milestones --method POST \
  --field title="Foundation Complete" \
  --field description="Repo scaffolded. Toolchain running. CI/CD basic. Hello world deployed."

gh api repos/$OWNER/$REPO/milestones --method POST \
  --field title="Music Section Live" \
  --field description="Music section built and populated. Cosmogony page with infrasonic tone. Alien musical placeholder."

gh api repos/$OWNER/$REPO/milestones --method POST \
  --field title="All Sections Scaffolded" \
  --field description="All six content types have working sections. Minimal content in each. Site navigable end to end."

gh api repos/$OWNER/$REPO/milestones --method POST \
  --field title="Public Launch" \
  --field description="Domain configured. Accessible. Content populated enough to receive visitors."

echo "=== he-carries-water-v2: creating issues ==="

gh issue create --repo $OWNER/$REPO \
  --title "Settle color system" \
  --label "doc: aesthetics,open question,adhd-friendly" \
  --body "Define the color palette.

Reference vibe: bun.sh — warm, confident, not corporate, slightly unexpected.

Decisions needed:
- [ ] Primary palette (3-5 colors)
- [ ] Background tone
- [ ] Accent / highlight color
- [ ] Dark mode approach (yes / no / both)

Reference: aesthetics.md"

gh issue create --repo $OWNER/$REPO \
  --title "Define typography system" \
  --label "doc: aesthetics,open question,adhd-friendly" \
  --body "Choose typefaces and scale.

Must feel: bespoke, not default, legible, slightly strange.
Must not feel: corporate, generic, over-designed.

Decisions needed:
- [ ] Display / heading face
- [ ] Body face
- [ ] Mono face
- [ ] Type scale

Reference: aesthetics.md"

gh issue create --repo $OWNER/$REPO \
  --title "Scaffold Deno + Fresh project" \
  --label "adhd-friendly" \
  --body "Initialize the technical foundation.

\`\`\`bash
deno run -A -r https://fresh.deno.dev he-carries-water-v2
\`\`\`

Then:
- [ ] Add TailwindCSS
- [ ] Verify Radix primitives integrate
- [ ] Hello world running locally
- [ ] Confirm Deno KV works

Reference: tech-stack.md"

gh issue create --repo $OWNER/$REPO \
  --title "Add TypeDoc configuration" \
  --label "adhd-friendly" \
  --body "Set up TypeDoc for project documentation.

Install and configure typedoc.json. Verify it generates from source.
Output to /docs or equivalent.

Reference: tech-stack.md — Documentation"

gh issue create --repo $OWNER/$REPO \
  --title "Set up @logtape/logtape + Resend email alerts" \
  --label "adhd-friendly" \
  --body "Logging and admin email alerts.

- [ ] Install @logtape/logtape
- [ ] Configure console sink for dev
- [ ] Configure Resend for email alerts (free tier)
- [ ] Test admin notification on error threshold

Reference: tech-stack.md — Logging"

gh issue create --repo $OWNER/$REPO \
  --title "Design horizontal scroll navigation concept" \
  --label "open question" \
  --body "Evaluate horizontal scroll as primary navigation structure.

The concept: rooms you move through rather than pages you click to.
Each content section is a room with its own sensory tuning.

Questions to answer before committing:
- [ ] Does horizontal scroll serve the museum metaphor or fight it?
- [ ] How does it work on mobile?
- [ ] What is the accessibility fallback?
- [ ] Prototype before committing — do not build, evaluate first.

Reference: aesthetics.md — Wild Ideas"

gh issue create --repo $OWNER/$REPO \
  --title "Build Cosmogony music page with infrasonic tone" \
  --label "feature,content" \
  --body "The Cosmogony page within the Music section.

The inaudible low frequency tone is decided — not a wild idea.
This page is a physical experience before the music plays.

Requirements:
- [ ] Sub-bass tone loaded on page entry via Web Audio API
- [ ] Frequency at or below 20Hz — felt, not heard
- [ ] Graceful handling if browser blocks autoplay
- [ ] Page aesthetic tied to the suite's visual identity
- [ ] Link to Cosmogony project/release when available

Blocked by: Music section scaffold"

gh issue create --repo $OWNER/$REPO \
  --title "Create placeholder page for the Alien Musical" \
  --label "content,adhd-friendly" \
  --body "The Suno alien musical needs a page before it is fully realized.

Context: A musical about an alien who leaves his family to determine if humans are safe
before they notice his kind's existence — allegory for the autistic experience. Created
with Suno. Caused significant emotional release on creation. Most listeners missed it.
Will be properly realized as a future project.

For now: a placeholder page within Music that names the project and holds space.
Full realization is a separate future milestone.

Reference: concept.md — Future Projects"

gh issue create --repo $OWNER/$REPO \
  --title "Audit dev-reqs.md axioms against current design decisions" \
  --label "doc: concept,adhd-friendly" \
  --body "Five axioms in dev-reqs.md need to be reviewed against what has been decided.

Current axioms:
1. No work/code repos
2. Visually memorable without overbearing
3. Feedback private except maybe blog
4. Bespoke and functional — no boring shapes
5. Accessibility comprehensive

Check each against the current aesthetic direction and flag any conflicts.

Reference: dev-reqs.md"

echo ""
echo "=== he-carries-water-v2 setup complete ==="
echo "Run: gh issue list --repo $OWNER/$REPO to verify"
