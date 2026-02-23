#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DRILL_DIR="${1:-}"
if [[ -z "${DRILL_DIR}" ]]; then
  DRILL_DIR="$(ls -1dt "${ROOT_DIR}/evidence/drills"/* 2>/dev/null | head -n1 || true)"
fi
if [[ -z "${DRILL_DIR}" || ! -d "${DRILL_DIR}" ]]; then
  echo "No drill directory found. Pass one explicitly: bash scripts/drill_capture_post_restore.sh evidence/drills/<timestamp>"
  exit 1
fi

mkdir -p "${DRILL_DIR}/artifacts"
TS="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
OUT="${DRILL_DIR}/artifacts/restore-validation-${TS}.log"

{
  echo "# Restore Validation Capture"
  echo "timestamp_utc=${TS}"
  echo "drill_dir=${DRILL_DIR}"
  echo
  echo "## 1) Synthetic"
  npm run ops:synthetic
  echo
  echo "## 2) E2E Smoke"
  npm run ops:e2e:smoke
  echo
  echo "## 3) Retention Report"
  npm run ops:retention:report
} | tee "${OUT}"

echo "Saved: ${OUT}"
