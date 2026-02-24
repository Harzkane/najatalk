#!/usr/bin/env bash
set -euo pipefail

WITH_SMOKE=0
WITH_UI=0

for arg in "$@"; do
  case "$arg" in
    --with-smoke)
      WITH_SMOKE=1
      ;;
    --with-ui)
      WITH_UI=1
      ;;
    *)
      echo "Unknown option: $arg"
      echo "Usage: bash scripts/thread_readiness_check.sh [--with-smoke] [--with-ui]"
      exit 1
      ;;
  esac
done

if ! command -v npm >/dev/null 2>&1; then
  echo "npm is required but not found in PATH."
  exit 1
fi

echo "==> Thread readiness: backend tests"
npm run ci:backend

echo "==> Thread readiness: frontend lint/typecheck/build"
npm run ci:frontend

if [[ "$WITH_SMOKE" -eq 1 ]]; then
  echo "==> Thread readiness: synthetic smoke checks"
  npm run ops:e2e:smoke
fi

if [[ "$WITH_UI" -eq 1 ]]; then
  echo "==> Thread readiness: UI E2E"
  npm run ops:e2e:ui
fi

echo "==> Thread readiness checks passed."
