#!/usr/bin/env bash
set -euo pipefail

# Contest V1 demo runner for NaijaTalk.
# It will:
# 1) login as admin
# 2) create a live contest
# 3) create a demo thread
# 4) submit that thread to the contest
# 5) open admin contest details
# 6) mark the submission as winner
#
# Usage:
#   bash scripts/contest_demo.sh
#   API_BASE="http://localhost:8000/api" ADMIN_EMAIL="harzkane@gmail.com" ADMIN_PASSWORD="123" bash scripts/contest_demo.sh
#   LIVE_SEED_COUNT=5 bash scripts/contest_demo.sh   # create 5 open/live contests and exit

API_BASE="${API_BASE:-http://localhost:8000/api}"
ADMIN_EMAIL="${ADMIN_EMAIL:-harzkane@gmail.com}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-123}"
LIVE_SEED_COUNT="${LIVE_SEED_COUNT:-5}" # create 5 open/live contests and exit
CONTEST_PRIZE_KOBO="${CONTEST_PRIZE_KOBO:-5000000}"

if ! command -v jq >/dev/null 2>&1; then
  echo "This script requires 'jq'. Install jq and rerun."
  exit 1
fi

echo "== NaijaTalk Contest Demo =="
echo "API_BASE: $API_BASE"
echo "ADMIN_EMAIL: $ADMIN_EMAIL"

json_post() {
  local url="$1"
  local payload="$2"
  local auth_header="${3:-}"

  if [[ -n "$auth_header" ]]; then
    curl -sS -X POST "$url" \
      -H "Content-Type: application/json" \
      -H "$auth_header" \
      -d "$payload"
  else
    curl -sS -X POST "$url" \
      -H "Content-Type: application/json" \
      -d "$payload"
  fi
}

json_get() {
  local url="$1"
  local auth_header="${2:-}"

  if [[ -n "$auth_header" ]]; then
    curl -sS "$url" -H "$auth_header"
  else
    curl -sS "$url"
  fi
}

json_put() {
  local url="$1"
  local payload="$2"
  local auth_header="$3"

  curl -sS -X PUT "$url" \
    -H "Content-Type: application/json" \
    -H "$auth_header" \
    -d "$payload"
}

is_json() {
  local input="$1"
  echo "$input" | jq -e . >/dev/null 2>&1
}

print_raw_failure() {
  local label="$1"
  local body="$2"
  echo "$label failed (non-JSON or unexpected response):"
  echo "$body"
}

create_live_contest() {
  local idx="$1"
  local title="Open Live Contest $(date -u +"%Y%m%d-%H%M%S") #$idx"
  local payload
  payload="$(jq -cn \
    --arg title "$title" \
    --arg description "Seeded open/live contest for dashboard testing." \
    --arg rules "Submit original content only." \
    --arg startDate "2025-01-01T00:00:00.000Z" \
    --arg endDate "2099-12-31T23:59:59.000Z" \
    --argjson prize "$CONTEST_PRIZE_KOBO" \
    '{title:$title,description:$description,rules:$rules,prize:$prize,status:"live",startDate:$startDate,endDate:$endDate,votingEnabled:true,maxSubmissionsPerUser:1}')"

  local res
  res="$(json_post "$API_BASE/contests/admin" "$payload" "$AUTH_HEADER")"
  if ! is_json "$res"; then
    res="$(json_post "$API_BASE/contests" "$payload" "$AUTH_HEADER")"
  fi
  if ! is_json "$res"; then
    print_raw_failure "Live contest seed #$idx" "$res"
    return 1
  fi
  local id
  id="$(echo "$res" | jq -r '.contest._id // empty')"
  if [[ -z "$id" ]]; then
    echo "Live contest seed #$idx failed:"
    echo "$res" | jq .
    return 1
  fi
  echo "Live contest #$idx created: $id"
}

echo
echo "[1/6] Logging in as admin..."
LOGIN_PAYLOAD="$(jq -cn --arg email "$ADMIN_EMAIL" --arg password "$ADMIN_PASSWORD" '{email:$email,password:$password}')"
LOGIN_RES="$(json_post "$API_BASE/auth/login" "$LOGIN_PAYLOAD")"
TOKEN="$(echo "$LOGIN_RES" | jq -r '.token // empty')"
if [[ -z "$TOKEN" ]]; then
  echo "Login failed:"
  echo "$LOGIN_RES" | jq .
  exit 1
fi
AUTH_HEADER="Authorization: Bearer $TOKEN"
echo "Login success."

if [[ "$LIVE_SEED_COUNT" =~ ^[0-9]+$ ]] && [[ "$LIVE_SEED_COUNT" -gt 0 ]]; then
  echo
  echo "[seed] Creating $LIVE_SEED_COUNT open/live contests..."
  i=1
  while [[ "$i" -le "$LIVE_SEED_COUNT" ]]; do
    create_live_contest "$i"
    i=$((i + 1))
  done
  echo
  echo "Live contest seeding complete."
  echo "Tip: open /admin/contests to inspect."
  exit 0
fi

echo
echo "[2/6] Creating a live contest..."
CONTEST_TITLE="Demo Contest $(date -u +"%Y%m%d-%H%M%S")"
CONTEST_PAYLOAD="$(jq -cn \
  --arg title "$CONTEST_TITLE" \
  --arg description "Automated demo contest for admin workflow." \
  --arg rules "Submit original content only." \
  --arg startDate "2025-01-01T00:00:00.000Z" \
  --arg endDate "2099-12-31T23:59:59.000Z" \
  '{title:$title,description:$description,rules:$rules,prize:5000000,status:"live",startDate:$startDate,endDate:$endDate,votingEnabled:true,maxSubmissionsPerUser:1}')"
CONTEST_RES="$(json_post "$API_BASE/contests/admin" "$CONTEST_PAYLOAD" "$AUTH_HEADER")"
if ! is_json "$CONTEST_RES"; then
  echo "Primary admin create endpoint returned non-JSON. Trying legacy create endpoint..."
  CONTEST_RES="$(json_post "$API_BASE/contests" "$CONTEST_PAYLOAD" "$AUTH_HEADER")"
fi
if ! is_json "$CONTEST_RES"; then
  print_raw_failure "Contest creation" "$CONTEST_RES"
  exit 1
fi
CONTEST_ID="$(echo "$CONTEST_RES" | jq -r '.contest._id // empty')"
if [[ -z "$CONTEST_ID" ]]; then
  echo "Contest creation failed:"
  echo "$CONTEST_RES" | jq .
  exit 1
fi
echo "Contest created: $CONTEST_ID"

echo
echo "[3/6] Creating a demo thread..."
THREAD_TITLE="Contest Demo Thread $(date -u +"%H:%M:%S")"
THREAD_PAYLOAD="$(jq -cn --arg title "$THREAD_TITLE" --arg body "This is a contest demo submission thread." '{title:$title,body:$body,category:"General"}')"
THREAD_RES="$(json_post "$API_BASE/threads" "$THREAD_PAYLOAD" "$AUTH_HEADER")"
THREAD_ID="$(echo "$THREAD_RES" | jq -r '.thread._id // empty')"
if [[ -z "$THREAD_ID" ]]; then
  echo "Thread creation failed:"
  echo "$THREAD_RES" | jq .
  exit 1
fi
echo "Thread created: $THREAD_ID"

echo
echo "[4/6] Submitting thread to contest..."
SUB_PAYLOAD="$(jq -cn --arg threadId "$THREAD_ID" --arg title "Demo Submission" --arg summary "Automated admin demo submission." '{threadId:$threadId,title:$title,summary:$summary}')"
SUB_RES="$(json_post "$API_BASE/contests/$CONTEST_ID/submissions" "$SUB_PAYLOAD" "$AUTH_HEADER")"
if ! is_json "$SUB_RES"; then
  print_raw_failure "Contest submission" "$SUB_RES"
  echo "Your deployed backend likely does not have Contest V1 submission endpoints yet."
  echo "Deploy latest backend, then rerun this script."
  exit 1
fi
SUBMISSION_ID="$(echo "$SUB_RES" | jq -r '.submission._id // empty')"
if [[ -z "$SUBMISSION_ID" ]]; then
  echo "Contest submission failed:"
  echo "$SUB_RES" | jq .
  exit 1
fi
echo "Submission created: $SUBMISSION_ID"

echo
echo "[5/6] Loading admin contest details..."
DETAILS_RES="$(json_get "$API_BASE/contests/admin/$CONTEST_ID" "$AUTH_HEADER")"
if ! is_json "$DETAILS_RES"; then
  print_raw_failure "Contest details load" "$DETAILS_RES"
  exit 1
fi
DETAILS_COUNT="$(echo "$DETAILS_RES" | jq -r '.submissions | length')"
echo "Admin details loaded. Submissions: $DETAILS_COUNT"

echo
echo "[6/6] Marking submission as winner..."
REVIEW_PAYLOAD="$(jq -cn '{status:"winner",reviewNote:"Winner selected by automated demo script.",score:95}')"
REVIEW_RES="$(json_put "$API_BASE/contests/admin/$CONTEST_ID/submissions/$SUBMISSION_ID/review" "$REVIEW_PAYLOAD" "$AUTH_HEADER")"
if ! is_json "$REVIEW_RES"; then
  print_raw_failure "Submission review" "$REVIEW_RES"
  exit 1
fi
REVIEW_OK="$(echo "$REVIEW_RES" | jq -r '.submission._id // empty')"
if [[ -z "$REVIEW_OK" ]]; then
  echo "Review update failed:"
  echo "$REVIEW_RES" | jq .
  exit 1
fi
echo "Submission marked as winner."

echo
echo "Demo complete."
echo "Contest ID: $CONTEST_ID"
echo "Thread ID: $THREAD_ID"
echo "Submission ID: $SUBMISSION_ID"
echo
echo "Tip: open /admin/contests in the dashboard to inspect the result."
