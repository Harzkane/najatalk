#!/usr/bin/env bash
set -euo pipefail

# Seeds realistic sample contests for NaijaTalk.
#
# Usage:
#   bash scripts/contest_real_samples.sh
#   API_BASE="http://localhost:8000/api" ADMIN_EMAIL="harzkane@gmail.com" ADMIN_PASSWORD="123" bash scripts/contest_real_samples.sh
#
# Notes:
# - Uses new admin endpoint first: POST /contests/admin
# - Falls back to legacy endpoint: POST /contests

API_BASE="${API_BASE:-http://localhost:8000/api}"
ADMIN_EMAIL="${ADMIN_EMAIL:-harzkane@gmail.com}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-123}"
TERMS_VERSION="${TERMS_VERSION:-2026-02-21}"
TERMS_URL="${TERMS_URL:-/contests/terms}"
POLICY_URL="${POLICY_URL:-/contests/policy}"
REQUIRE_TERMS_ACCEPTANCE="${REQUIRE_TERMS_ACCEPTANCE:-true}"

if ! command -v jq >/dev/null 2>&1; then
  echo "This script requires 'jq'. Install jq and rerun."
  exit 1
fi

json_post() {
  local url="$1"
  local payload="$2"
  local auth_header="${3:-}"
  if [[ -n "$auth_header" ]]; then
    curl -sS -X POST "$url" -H "Content-Type: application/json" -H "$auth_header" -d "$payload"
  else
    curl -sS -X POST "$url" -H "Content-Type: application/json" -d "$payload"
  fi
}

is_json() {
  local input="$1"
  echo "$input" | jq -e . >/dev/null 2>&1
}

echo "== NaijaTalk Real Sample Contests Seeder =="
echo "API_BASE: $API_BASE"
echo "ADMIN_EMAIL: $ADMIN_EMAIL"
echo "TERMS_VERSION: $TERMS_VERSION"

echo
echo "[1/2] Logging in as admin..."
LOGIN_PAYLOAD="$(jq -cn --arg email "$ADMIN_EMAIL" --arg password "$ADMIN_PASSWORD" '{email:$email,password:$password}')"
LOGIN_RES="$(json_post "$API_BASE/auth/login" "$LOGIN_PAYLOAD")"
TOKEN="$(echo "$LOGIN_RES" | jq -r '.token // empty')"
if [[ -z "$TOKEN" ]]; then
  echo "Login failed:"
  if is_json "$LOGIN_RES"; then
    echo "$LOGIN_RES" | jq .
  else
    echo "$LOGIN_RES"
  fi
  exit 1
fi
AUTH_HEADER="Authorization: Bearer $TOKEN"
echo "Login success."

SAMPLES_JSON='[
  {
    "title": "Lagos Hustle Story Challenge",
    "description": "Share your most practical hustle lesson from Lagos life. Real story, real detail, real lesson.",
    "rules": "Original story only. No hate speech. Must include one actionable lesson.",
    "category": "gist",
    "prize": 5000000,
    "status": "live",
    "startDate": "2025-01-01T00:00:00.000Z",
    "endDate": "2099-12-31T23:59:59.000Z",
    "votingEnabled": true,
    "maxSubmissionsPerUser": 1
  },
  {
    "title": "Best Marketplace Listing Copy",
    "description": "Write the clearest, highest-converting listing copy for a realistic product.",
    "rules": "Submission must link to your own listing. No fake prices. No prohibited items.",
    "category": "marketplace",
    "prize": 3000000,
    "status": "live",
    "startDate": "2025-01-01T00:00:00.000Z",
    "endDate": "2099-12-31T23:59:59.000Z",
    "votingEnabled": true,
    "maxSubmissionsPerUser": 1
  },
  {
    "title": "Naija Product Idea Sprint",
    "description": "Pitch a product idea that solves a local Nigerian problem with clear execution steps.",
    "rules": "Must include problem, target users, and launch plan.",
    "category": "business",
    "prize": 7500000,
    "status": "live",
    "startDate": "2025-01-01T00:00:00.000Z",
    "endDate": "2099-12-31T23:59:59.000Z",
    "votingEnabled": true,
    "maxSubmissionsPerUser": 1
  },
  {
    "title": "Campus Survival Guide (Draft)",
    "description": "Internal draft contest for student-focused content quality campaign.",
    "rules": "Draft mode. Not publicly live yet.",
    "category": "education",
    "prize": 2000000,
    "status": "draft",
    "startDate": "2026-03-01T00:00:00.000Z",
    "endDate": "2026-04-01T23:59:59.000Z",
    "votingEnabled": true,
    "maxSubmissionsPerUser": 1
  },
  {
    "title": "Best Jollof Debate Thread (Closed)",
    "description": "Completed sample contest for closed-state dashboard testing.",
    "rules": "Closed sample. No active submissions.",
    "category": "food",
    "prize": 1500000,
    "status": "closed",
    "startDate": "2025-01-01T00:00:00.000Z",
    "endDate": "2025-02-01T23:59:59.000Z",
    "votingEnabled": false,
    "maxSubmissionsPerUser": 1
  },
  {
    "title": "Tech Career Ask-Me-Anything (Archived)",
    "description": "Archived sample to validate admin status filters.",
    "rules": "Archived sample contest.",
    "category": "career",
    "prize": 1000000,
    "status": "archived",
    "startDate": "2024-01-01T00:00:00.000Z",
    "endDate": "2024-02-01T23:59:59.000Z",
    "votingEnabled": false,
    "maxSubmissionsPerUser": 1
  }
]'

echo
echo "[2/2] Seeding realistic sample contests..."
COUNT=0
FAIL=0

while IFS= read -r item; do
  item="$(
    echo "$item" | jq -c \
      --arg termsVersion "$TERMS_VERSION" \
      --arg termsUrl "$TERMS_URL" \
      --arg policyUrl "$POLICY_URL" \
      --arg requireTerms "$REQUIRE_TERMS_ACCEPTANCE" \
      '
      .termsVersion = (.termsVersion // $termsVersion) |
      .termsUrl = (.termsUrl // $termsUrl) |
      .policyUrl = (.policyUrl // $policyUrl) |
      .requireTermsAcceptance = (.requireTermsAcceptance // ($requireTerms == "true"))
      '
  )"
  TITLE="$(echo "$item" | jq -r '.title')"
  RES="$(json_post "$API_BASE/contests/admin" "$item" "$AUTH_HEADER")"
  if ! is_json "$RES"; then
    RES="$(json_post "$API_BASE/contests" "$item" "$AUTH_HEADER")"
  fi
  if ! is_json "$RES"; then
    echo "Failed (non-JSON): $TITLE"
    echo "$RES"
    FAIL=$((FAIL + 1))
    continue
  fi
  ID="$(echo "$RES" | jq -r '.contest._id // empty')"
  if [[ -z "$ID" ]]; then
    echo "Failed (no contest id): $TITLE"
    echo "$RES" | jq .
    FAIL=$((FAIL + 1))
    continue
  fi
  COUNT=$((COUNT + 1))
  echo "Created: $TITLE -> $ID"
done < <(echo "$SAMPLES_JSON" | jq -c '.[]')

echo
echo "Seeding complete."
echo "Created: $COUNT"
echo "Failed: $FAIL"
echo "Tip: open /admin/contests and /contests to inspect realistic sample data."
