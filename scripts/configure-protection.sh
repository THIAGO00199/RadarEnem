#!/usr/bin/env bash
# Run from an administrator's authenticated gh session after reviewing the config.
set -euo pipefail
repository=THIAGO00199/RadarEnem
gh api --method PUT "repos/$repository/pages" -f build_type=workflow -F https_enforced=true
gh api --method PUT "repos/$repository/branches/main/protection" --input .github/branch-protection.json
echo 'Pages now uses validated workflow artifacts; main requires a current successful check through a pull request.'
