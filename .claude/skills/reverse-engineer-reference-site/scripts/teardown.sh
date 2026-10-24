#!/usr/bin/env bash
# One-shot motion teardown of a public reference site with REA (github.com/morluto/rea, MIT).
#
#   teardown.sh <url> <out-dir> [--gesture "top+wheel:30x400@140"] [--pointer] [--steps 6]
#
# Produces in <out-dir>:
#   page.json            REA passive page capture (DOM shape, scripts with source, resources, console)
#   scripts/             exported script sources + manifest (input for rea analyze-javascript-application)
#   stack.md, shaders/   motion-stack fingerprint, every GLSL/WGSL string, easing constants, assets
#   idle.json            execution coverage with nobody touching the page (the always-on loop)
#   scroll.json          execution coverage while drive.mjs scrolls
#   hot-scroll.md        functions whose call rate rose during scroll (scroll minus idle)
#   pointer.json, hot-pointer.md   same for a pointer sweep (with --pointer)
#   listeners-*.json     handlers registered on html/body/canvas
#   frames/              screenshots per step, reduced-motion off and on; sheet.jpg contact sheet
#   motion-pref.md       per-step pixel difference reduce vs no-preference
#   README.md            index + what to read first
#
# Env: REA="npx -y rea-agents@6.7.0" (default) or a path to an installed rea;
#      CHROME=/path/to/chrome (default: Playwright's Chromium under /opt/pw-browsers, else google-chrome);
#      PORT=9333; REA_NODE_MODULES=<dir containing playwright-core> for drive.mjs.
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
URL="${1:?url}"; OUT="${2:?out dir}"; shift 2
GESTURE="top+wheel:30x400@140"; POINTER=0; STEPS=6
while [ $# -gt 0 ]; do case "$1" in
  --gesture) GESTURE="$2"; shift 2;; --pointer) POINTER=1; shift;;
  --steps) STEPS="$2"; shift 2;; *) echo "unknown arg $1" >&2; exit 64;; esac; done

REA="${REA:-npx -y rea-agents@6.7.0}"
PORT="${PORT:-9333}"; EP="http://127.0.0.1:$PORT"
CHROME="${CHROME:-$(ls /opt/pw-browsers/chromium-*/chrome-linux/chrome 2>/dev/null | head -1 || true)}"
CHROME="${CHROME:-$(command -v google-chrome || command -v chromium || true)}"
[ -x "$CHROME" ] || { echo "no Chrome-family browser found; set CHROME" >&2; exit 69; }
if [ -z "${REA_NODE_MODULES:-}" ]; then
  REA_NODE_MODULES="$(dirname "$(dirname "$(readlink -f "$(command -v rea 2>/dev/null || echo /nonexistent)")")" 2>/dev/null)/node_modules"
fi
export REA_NODE_MODULES
mkdir -p "$OUT"; OUT="$(cd "$OUT" && pwd)"; cd "$OUT"
HOST="$(python3 -c 'import sys,urllib.parse as u;print(u.urlparse(sys.argv[1]).netloc)' "$URL")"
say() { printf '\n== %s\n' "$*" >&2; }

say "browser: headless $CHROME on $EP (own temporary profile)"
PROFILE="$(mktemp -d)"
"$CHROME" --headless=new --no-sandbox --remote-debugging-port="$PORT" --user-data-dir="$PROFILE" \
  --window-size=1440,900 --password-store=basic --autoplay-policy=no-user-gesture-required "$URL" \
  >"$OUT/chrome.log" 2>&1 &
CHROME_PID=$!
trap 'kill $CHROME_PID 2>/dev/null || true; rm -rf "$PROFILE"' EXIT
for _ in $(seq 1 40); do curl -sf "$EP/json/version" >/dev/null && break; sleep 0.5; done
sleep 8  # let loaders and shader warm-up finish before capturing

$REA list-browser-targets "$EP" --json > targets.json
TARGET="$(python3 - "$HOST" <<'PY'
import json,sys
d=json.load(open('targets.json')); n=d.get('normalized_result',d)
items=n.get('targets') or n.get('items') or []
pages=[t for t in items if t.get('type','page')=='page' and sys.argv[1] in json.dumps(t.get('url'))]
print((pages or items)[0].get('target_id') or (pages or items)[0].get('id'))
PY
)"
echo "target $TARGET" >&2

say "1/7 passive page capture with script sources"
$REA inspect-web-page "$EP" "$TARGET" --observation-ms 3000 --include-script-sources --include-console-text --json > page.json

say "2/7 export scripts + fingerprint the motion stack"
rm -rf scripts; $REA export-web-scripts "$OUT/page.json" "$OUT/scripts" --json > export.json
python3 "$HERE/fingerprint.py" --scripts scripts/files --page page.json --out "$OUT" > /dev/null

observe() {  # observe <name> <ms> <gesture|->
  local name="$1" ms="$2" g="$3"
  $REA observe-web-execution "$EP" "$TARGET" --observation-ms "$ms" --json > "$name.json" 2> "$name.err" &
  local pid=$!
  if [ "$g" != "-" ]; then
    for _ in $(seq 1 100); do grep -q '"armed' "$name.err" 2>/dev/null && break; sleep 0.1; done
    node "$HERE/drive.mjs" "$EP" "$HOST" "$g" > "$name.drive.json"
  fi
  wait $pid
}

say "3/7 execution coverage: idle baseline, then scroll"
node "$HERE/drive.mjs" "$EP" "$HOST" "top" > /dev/null
observe idle 6000 -
observe scroll 12000 "$GESTURE"
python3 "$HERE/hotpath.py" scroll.json --baseline idle.json --md hot-scroll.md > /dev/null
if [ "$POINTER" = 1 ]; then
  say "   pointer sweep"
  observe pointer 7000 "sweep"
  python3 "$HERE/hotpath.py" pointer.json --baseline idle.json --md hot-pointer.md > /dev/null
fi

say "4/7 event listeners on html, body, canvas"
for sel in html body canvas; do
  $REA inspect-web-event-listeners "$EP" "$TARGET" "$sel" --json > "listeners-$sel.json" 2>/dev/null || true
done

say "5/7 scripted screenshots, reduced motion off and on (slow on software WebGL: ~15 s per step)"
KEY=PageDown
for pref in no-preference reduce; do
  python3 - "$URL" "$CHROME" "$pref" "$STEPS" "$KEY" > "scenario-$pref.json" <<'PY'
import json,sys
url,chrome,pref,steps,key=sys.argv[1:6]
acts=[{"step_id":"load","action":"wait_for_timeout","duration_ms":5000}]
for i in range(1,int(steps)+1):
  # "html", not "body": fixed-canvas sites often give body zero height and Playwright waits forever.
  # No timeout_ms: on heavy WebGL pages the step deadline also has to cover the screenshot.
  acts.append({"step_id":f"key-{i}","action":"press","locator":{"kind":"css","selector":"html"},"key":key})
  acts.append({"step_id":f"settle-{i}","action":"wait_for_timeout","duration_ms":1400})
print(json.dumps({"browser":{"mode":"launch","executable_path":chrome},
  "environment":{"viewport":{"width":1440,"height":900,"device_scale_factor":1},"reduced_motion":pref},
  "start_url":{"url":url},"actions":acts,
  "capture":{"after_each_step":["screenshot"],"at_end":["url"]}}))
PY
  $REA capture-browser-scenario "$OUT/scenario-$pref.json" --json > "capture-$pref.json" 2> "capture-$pref.err" || true
done

say "6/7 contact sheet + reduced-motion comparison"
python3 "$HERE/frames.py" capture-no-preference.json capture-reduce.json --out frames --rea "$REA" > motion-pref.md

say "7/7 index"
python3 - "$URL" <<'PY' > README.md
import json,os,sys
url=sys.argv[1]
def ev(p):
    try: return json.load(open(p)).get('evidence_id')
    except Exception: return None
print(f"# Teardown: {url}\n")
print("Read in this order: stack.md, hot-scroll.md (and hot-pointer.md), motion-pref.md, frames/sheet.jpg, then the cited offsets in scripts/ and shaders/.\n")
print("| artifact | evidence |\n|---|---|")
for f in ["page.json","export.json","idle.json","scroll.json","pointer.json","listeners-html.json","listeners-body.json","listeners-canvas.json","capture-no-preference.json","capture-reduce.json"]:
    if os.path.exists(f): print(f"| {f} | {ev(f) or '—'} |")
PY
say "done: $OUT/README.md"
