#!/usr/bin/env bash
# Scaffold a new static site from templates/site/ (skill: site-kickoff).
#   tools/new-site.sh <slug> "<Site name>" "<one sentence: what the site is for>"
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
slug="${1:-}"; name="${2:-}"; line="${3:-}"
if [[ -z "$slug" || -z "$name" ]]; then
  echo 'usage: tools/new-site.sh <slug> "<Site name>" "<one sentence>"' >&2; exit 2
fi
if [[ ! "$slug" =~ ^[a-z0-9]+(-[a-z0-9]+)*$ ]]; then
  echo "slug must be lowercase words joined by hyphens, e.g. nordic-bakery" >&2; exit 2
fi
dest="$ROOT/$slug"
if [[ -e "$dest" ]]; then echo "$slug/ already exists; pick another slug or edit it directly" >&2; exit 1; fi
[[ -n "$line" ]] || line="$name"

cp -R "$ROOT/templates/site" "$dest"
date="$(date +%Y-%m-%d)"
# Escape for sed replacement: backslash, ampersand and the | delimiter.
esc() { printf '%s' "$1" | sed -e 's/[\\&|]/\\&/g'; }
# HTML-escape the values that land in markup.
html() { printf '%s' "$1" | sed -e 's/&/\&amp;/g' -e 's/</\&lt;/g' -e 's/>/\&gt;/g' -e 's/"/\&quot;/g'; }
for f in "$dest"/*; do
  if [[ "$f" == *.html ]]; then n="$(html "$name")"; l="$(html "$line")"; else n="$name"; l="$line"; fi
  sed -i.bak -e "s|{{NAME}}|$(esc "$n")|g" -e "s|{{ONE_LINE}}|$(esc "$l")|g" -e "s|{{SLUG}}|$slug|g" -e "s|{{DATE}}|$date|g" "$f"
  rm -f "$f.bak"
done

cat <<EOF
Created $slug/ from templates/site/:
  BRIEF.md    fill it in and get it approved before building (site-kickoff)
  CLAUDE.md   per-site working notes
  index.html  site.css  site.js   starter page (tokens, reveals, reduced motion)

Next:
  1. Fill $slug/BRIEF.md and get the plan approved.
  2. Build only what the brief lists.
  3. node tools/check-site.mjs $slug   then the site-reviewer agent (site-verification-loop)
  4. Add the site to README.md when it ships.
EOF
