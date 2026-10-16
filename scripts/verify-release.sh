#!/usr/bin/env bash
set -euo pipefail
: "${GITHUB_REPOSITORY:?Missing repository}"
: "${1:?Missing deployed revision}"
PUBLISHED_URL=https://atena.dev.br/ python3 scripts/check-published.py
version=$(node -p 'require("./package.json").version')
if ! gh release view "v$version" --repo "$GITHUB_REPOSITORY" > /dev/null 2>&1; then
  gh release create "v$version" --repo "$GITHUB_REPOSITORY" --target "$1" --title "ATENA $version" --notes-file RELEASE_NOTES.md docs/estudar-offline.html
fi
