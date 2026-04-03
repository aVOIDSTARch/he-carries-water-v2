#!/usr/bin/env zsh
# cleanup-phase-labels.sh
# Strips stale phase: labels from all existing issues in he-carries-water-v2
# and removes the phase label definitions from the repo
# Run: zsh ~/art/he-carries-water-v2/cleanup-phase-labels.sh

OWNER="aVOIDSTARch"
REPO="he-carries-water-v2"

echo "=== Stripping phase: labels from he-carries-water-v2 issues ==="

gh issue edit 1 --repo $OWNER/$REPO --remove-label "phase: design"
gh issue edit 2 --repo $OWNER/$REPO --remove-label "phase: design"
gh issue edit 3 --repo $OWNER/$REPO --remove-label "phase: foundation"
gh issue edit 4 --repo $OWNER/$REPO --remove-label "phase: foundation"
gh issue edit 5 --repo $OWNER/$REPO --remove-label "phase: foundation"
gh issue edit 6 --repo $OWNER/$REPO --remove-label "phase: design"
gh issue edit 7 --repo $OWNER/$REPO --remove-label "phase: build"
gh issue edit 8 --repo $OWNER/$REPO --remove-label "phase: content"
gh issue edit 9 --repo $OWNER/$REPO --remove-label "phase: concept"

echo "=== Deleting phase: label definitions ==="
gh label delete "phase: concept"    --repo $OWNER/$REPO --yes 2>/dev/null || true
gh label delete "phase: design"     --repo $OWNER/$REPO --yes 2>/dev/null || true
gh label delete "phase: foundation" --repo $OWNER/$REPO --yes 2>/dev/null || true
gh label delete "phase: build"      --repo $OWNER/$REPO --yes 2>/dev/null || true
gh label delete "phase: content"    --repo $OWNER/$REPO --yes 2>/dev/null || true
gh label delete "phase: launch"     --repo $OWNER/$REPO --yes 2>/dev/null || true

echo "=== Done. Phase is now a project board field only. ==="
echo "Run: gh issue list --repo $OWNER/$REPO to verify"
