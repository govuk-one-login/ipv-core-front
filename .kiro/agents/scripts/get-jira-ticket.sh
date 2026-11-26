#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -ne 1 ]; then
  echo "Usage: $0 <JIRA-KEY>" >&2
  exit 2
fi

JIRA_KEY="$1"
: "${JIRA_USER:?Set JIRA_USER}"
: "${JIRA_API_TOKEN:?Set JIRA_API_TOKEN}"
: "${JIRA_CLOUD_ID:?Set JIRA_CLOUD_ID}"

if ! printf '%s' "$JIRA_KEY" | grep -Eq '^[A-Za-z][A-Za-z0-9_]*-[0-9]+$'; then
  echo "Invalid Jira key: $JIRA_KEY" >&2
  exit 2
fi

JIRA_URL="https://api.atlassian.com/ex/jira/${JIRA_CLOUD_ID}/rest/api/3/issue/${JIRA_KEY}?expand=names&fields=*all"

curl \
  --fail \
  --silent \
  --show-error \
  --user "${JIRA_USER}:${JIRA_API_TOKEN}" \
  --header "Accept: application/json" \
  "$JIRA_URL"
