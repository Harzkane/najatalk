#!/usr/bin/env bash
set -euo pipefail

# Seed 3 sponsor-style contests for testing.
#
# Usage:
#   bash scripts/contest_sponsors_seed.sh
#   API_BASE="http://localhost:8000/api" ADMIN_EMAIL="harzkane@gmail.com" ADMIN_PASSWORD="123" bash scripts/contest_sponsors_seed.sh

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

echo "== NaijaTalk Sponsor Contest Seeder =="
echo "API_BASE: $API_BASE"
echo "ADMIN_EMAIL: $ADMIN_EMAIL"

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

SPONSOR_CONTESTS='[
  {
    "title": "MTN Data Hustle Challenge",
    "description": "Sponsored by MTN. Share the smartest way you stretch your data budget for work or school.",
    "rules": "Must be practical and original. No fake claims. Keep it useful.",
    "category": "career",
    "prize": 10000000,
    "status": "live",
    "startDate": "2025-01-01T00:00:00.000Z",
    "endDate": "2099-12-31T23:59:59.000Z",
    "votingEnabled": true,
    "maxSubmissionsPerUser": 1
  },
  {
    "title": "Flutterwave Small Biz Growth Contest",
    "description": "Sponsored by Flutterwave. Show a real playbook for growing a small business with digital payments.",
    "rules": "Include step-by-step execution and measurable outcomes.",
    "category": "business",
    "prize": 15000000,
    "status": "live",
    "startDate": "2025-01-01T00:00:00.000Z",
    "endDate": "2099-12-31T23:59:59.000Z",
    "votingEnabled": true,
    "maxSubmissionsPerUser": 1
  },
  {
    "title": "Pepsi Campus Creative Thread Battle",
    "description": "Sponsored by Pepsi. Drop the most creative campus campaign thread and rally community votes.",
    "rules": "Original work only. No harassment/hate. Community-safe content.",
    "category": "education",
    "prize": 8000000,
    "status": "live",
    "startDate": "2025-01-01T00:00:00.000Z",
    "endDate": "2099-12-31T23:59:59.000Z",
    "votingEnabled": true,
    "maxSubmissionsPerUser": 1
  }
]'

echo
echo "[2/2] Creating 3 sponsor contests..."
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
done < <(echo "$SPONSOR_CONTESTS" | jq -c '.[]')

echo
echo "Seeding complete."
echo "Created: $COUNT"
echo "Failed: $FAIL"
echo "Tip: open /admin/contests and /contests and filter Live to inspect sponsor samples."
