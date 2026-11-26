#!/usr/bin/env bash
set -euo pipefail

CLI="${PLAYWRIGHT_CLI:-playwright-cli}"
SESSION="${BROWSER_SESSION:-kiro-journey}"
PROJECT_ROOT="$(pwd -P)"
ARTIFACT_ROOT="${PROJECT_ROOT}/.kiro/browser-artifacts"
ARTIFACT_DIR="${ARTIFACT_ROOT}/${SESSION}"

usage() {
  cat >&2 <<'USAGE'
Usage:
  browser-helper.sh setup
  browser-helper.sh open <url> [--headed]
  browser-helper.sh goto <url>
  browser-helper.sh snapshot [--depth=N] [--boxes] [--filename=name.yaml]
  browser-helper.sh find <text>
  browser-helper.sh find-regex <regex>
  browser-helper.sh click <element-ref>
  browser-helper.sh dblclick <element-ref>
  browser-helper.sh fill <element-ref> <text> [--submit]
  browser-helper.sh type <text>
  browser-helper.sh press <key>
  browser-helper.sh hover <element-ref>
  browser-helper.sh select <element-ref> <value>
  browser-helper.sh check <element-ref>
  browser-helper.sh uncheck <element-ref>
  browser-helper.sh go-back | go-forward | reload
  browser-helper.sh tab-list
  browser-helper.sh tab-new [url]
  browser-helper.sh tab-select <index>
  browser-helper.sh tab-close [index]
  browser-helper.sh dialog-accept [text]
  browser-helper.sh dialog-dismiss
  browser-helper.sh screenshot [name.png] [--full-page]
  browser-helper.sh status
  browser-helper.sh close
  browser-helper.sh cleanup

Optional HTTP Basic Auth (set both or neither):
  BROWSER_BASIC_AUTH_USER="username"
  BROWSER_BASIC_AUTH_PASSWORD='password'
USAGE
  exit 2
}

fail() { echo "browser-helper: $*" >&2; exit 1; }

require_runtime() {
  command -v "$CLI" >/dev/null 2>&1 || fail "$CLI is not installed. Run: $0 setup"
  command -v python3 >/dev/null 2>&1 || fail "python3 was not found"
}

setup_browser() {
  command -v node >/dev/null 2>&1 || fail "Node.js is required before setup"
  command -v npm >/dev/null 2>&1 || fail "npm is required before setup"

  if ! command -v "$CLI" >/dev/null 2>&1; then
    echo "browser-helper: installing @playwright/cli globally..."
    npm install -g @playwright/cli@latest
  else
    echo "browser-helper: $CLI is already installed"
  fi

  command -v "$CLI" >/dev/null 2>&1 || fail "$CLI was not found after installation"
  echo "browser-helper: ensuring Playwright browser is installed..."
  "$CLI" install-browser
  echo "browser-helper: setup complete"
  "$CLI" --version 2>/dev/null || true
}

if ! printf '%s' "$SESSION" | grep -Eq '^[A-Za-z0-9][A-Za-z0-9_-]*$'; then
  fail "BROWSER_SESSION may contain only letters, numbers, '_' and '-'"
fi

run_cli() { "$CLI" "-s=${SESSION}" "$@"; }
prepare_artifacts() { mkdir -p "$ARTIFACT_DIR"; chmod 700 "$ARTIFACT_ROOT" "$ARTIFACT_DIR" 2>/dev/null || true; }
validate_url() { case "$1" in http://*|https://*) ;; *) fail "URL must start with http:// or https://" ;; esac; }

safe_name() {
  local name="$1" ext="$2"
  [ -n "$name" ] || fail "artifact filename cannot be empty"
  [ "$name" = "$(basename "$name")" ] || fail "artifact filename must not contain a path"
  case "$name" in *..*) fail "artifact filename must not contain '..'" ;; esac
  printf '%s' "$name" | grep -Eq '^[A-Za-z0-9][A-Za-z0-9._-]*$' || fail "unsupported artifact filename"
  case "$name" in *"$ext") ;; *) fail "artifact filename must end with $ext" ;; esac
  printf '%s/%s\n' "$ARTIFACT_DIR" "$name"
}

write_open_config() {
  local output="$1"
  if { [ -n "${BROWSER_BASIC_AUTH_USER:-}" ] && [ -z "${BROWSER_BASIC_AUTH_PASSWORD:-}" ]; } || \
     { [ -z "${BROWSER_BASIC_AUTH_USER:-}" ] && [ -n "${BROWSER_BASIC_AUTH_PASSWORD:-}" ]; }; then
    fail "set both BROWSER_BASIC_AUTH_USER and BROWSER_BASIC_AUTH_PASSWORD, or neither"
  fi
  CONFIG_OUTPUT_DIR="$ARTIFACT_DIR" AUTH_USER="${BROWSER_BASIC_AUTH_USER:-}" AUTH_PASSWORD="${BROWSER_BASIC_AUTH_PASSWORD:-}" \
  python3 - "$output" <<'PY'
import json, os, sys
config = {"browser": {"isolated": True, "contextOptions": {}}, "outputDir": os.environ["CONFIG_OUTPUT_DIR"], "codegen": "none"}
user, password = os.environ.get("AUTH_USER", ""), os.environ.get("AUTH_PASSWORD", "")
if user:
    config["browser"]["contextOptions"]["httpCredentials"] = {"username": user, "password": password}
with open(sys.argv[1], "w", encoding="utf-8") as f:
    json.dump(config, f)
PY
  chmod 600 "$output"
}

close_and_clean() {
  set +e
  run_cli close >/dev/null 2>&1
  run_cli delete-data >/dev/null 2>&1
  set -e
  rm -rf -- "$ARTIFACT_DIR"
  rmdir "$ARTIFACT_ROOT" 2>/dev/null || true
}

[ "$#" -ge 1 ] || usage
cmd="$1"; shift

if [ "$cmd" = "setup" ]; then
  [ "$#" -eq 0 ] || usage
  setup_browser
  exit 0
fi

require_runtime

case "$cmd" in
  open)
    [ "$#" -ge 1 ] && [ "$#" -le 2 ] || usage
    url="$1"; shift; validate_url "$url"
    [ "$#" -eq 0 ] || [ "$1" = "--headed" ] || usage
    prepare_artifacts
    cfg=$(mktemp "${TMPDIR:-/tmp}/kiro-browser-config.XXXXXX.json")
    trap 'rm -f -- "$cfg"' EXIT INT TERM
    write_open_config "$cfg"
    run_cli open "$url" "--config=${cfg}" "$@"
    rm -f -- "$cfg"; trap - EXIT INT TERM
    ;;
  goto) [ "$#" -eq 1 ] || usage; validate_url "$1"; run_cli goto "$1" ;;
  snapshot)
    prepare_artifacts; args=()
    for arg in "$@"; do
      case "$arg" in
        --depth=[0-9]*|--boxes) args+=("$arg") ;;
        --filename=*) n="${arg#--filename=}"; args+=("--filename=$(safe_name "$n" ".yaml")") ;;
        *) usage ;;
      esac
    done
    run_cli snapshot "${args[@]}"
    ;;
  find) [ "$#" -eq 1 ] || usage; run_cli find "$1" ;;
  find-regex) [ "$#" -eq 1 ] || usage; run_cli find --regex "$1" ;;
  click|dblclick|hover|check|uncheck) [ "$#" -eq 1 ] || usage; run_cli "$cmd" "$1" ;;
  fill) [ "$#" -eq 2 ] || { [ "$#" -eq 3 ] && [ "$3" = "--submit" ]; } || usage; run_cli fill "$@" ;;
  type|press) [ "$#" -eq 1 ] || usage; run_cli "$cmd" "$1" ;;
  select) [ "$#" -eq 2 ] || usage; run_cli select "$1" "$2" ;;
  go-back|go-forward|reload) [ "$#" -eq 0 ] || usage; run_cli "$cmd" ;;
  tab-list) [ "$#" -eq 0 ] || usage; run_cli tab-list ;;
  tab-new) [ "$#" -le 1 ] || usage; if [ "$#" -eq 1 ]; then validate_url "$1"; run_cli tab-new "$1"; else run_cli tab-new; fi ;;
  tab-select) [ "$#" -eq 1 ] || usage; printf '%s' "$1" | grep -Eq '^[0-9]+$' || usage; run_cli tab-select "$1" ;;
  tab-close) [ "$#" -le 1 ] || usage; if [ "$#" -eq 1 ]; then printf '%s' "$1" | grep -Eq '^[0-9]+$' || usage; run_cli tab-close "$1"; else run_cli tab-close; fi ;;
  dialog-accept) [ "$#" -le 1 ] || usage; run_cli dialog-accept "$@" ;;
  dialog-dismiss) [ "$#" -eq 0 ] || usage; run_cli dialog-dismiss ;;
  screenshot)
    prepare_artifacts; name="screenshot-$(date -u +%Y%m%dT%H%M%SZ).png"; full=0
    for arg in "$@"; do case "$arg" in --full-page) full=1 ;; *) name="$arg" ;; esac; done
    dest=$(safe_name "$name" ".png"); args=("--filename=${dest}"); [ "$full" -eq 0 ] || args+=("--full-page"); run_cli screenshot "${args[@]}"
    ;;
  status) [ "$#" -eq 0 ] || usage; run_cli snapshot --depth=1 ;;
  close|cleanup) [ "$#" -eq 0 ] || usage; close_and_clean; echo "browser-helper: session '${SESSION}' closed; helper-owned data removed" ;;
  *) usage ;;
esac
