#!/usr/bin/env bash
set -euo pipefail
: "${GITHUB_SHA:?Missing validated source revision}"
: "${GITHUB_REPOSITORY:?Missing repository}"
: "${VALIDATED_SITE:?Missing validated artifact}"

git fetch origin main
if [[ "$(git rev-parse origin/main)" != "$GITHUB_SHA" ]]; then
  echo 'A newer source commit exists. This older build will not be published.'
  exit 0
fi
test -f "$VALIDATED_SITE/index.html"
test -f "$VALIDATED_SITE/data/build-info.json"
node --input-type=module -e 'import fs from "node:fs"; const info=JSON.parse(fs.readFileSync(process.env.VALIDATED_SITE+"/data/build-info.json")); if(info.sourceRevision!==process.env.GITHUB_SHA) throw Error("Artifact/source mismatch");'
rm -rf docs
mkdir docs
cp -a "$VALIDATED_SITE/." docs/
cp docs/data/latest.json portable/public/data/latest.json
cp docs/data/accessibility-audit.json portable/public/data/accessibility-audit.json
cp docs/data/performance-audit.json portable/public/data/performance-audit.json
git config user.name 'github-actions[bot]'
git config user.email '41898282+github-actions[bot]@users.noreply.github.com'
git add docs portable/public/data/latest.json portable/public/data/accessibility-audit.json portable/public/data/performance-audit.json
if ! git diff --cached --quiet; then
  git commit -m "build: publish validated source $GITHUB_SHA"
  # Rejects a concurrent update; never force-push production.
  git push origin HEAD:main
fi
published_sha=$(git rev-parse HEAD)
gh api --method POST "repos/$GITHUB_REPOSITORY/pages/builds" > /dev/null
bash scripts/verify-release.sh "$published_sha"
