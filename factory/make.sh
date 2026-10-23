#!/usr/bin/env bash
# Render one factory film end to end: voice, picture, sound effects, mixes and checks.
#   factory/make.sh <slug> [voice|picture|mix|all]      (default all)
# voice   : synth + Whisper listen check (film/<slug>/vo/script.json → vo/vo.js, vo/<SLUG>-vo.mp3)
# picture : render.mjs all (score/sfx, readcheck, contact sheet, poster, frames, master → out/<SLUG>.mp4)
# mix     : voice + sfx (out/<SLUG>-vo.mp4) and voice only (out/<SLUG>-voice-only.mp4), both at −14 LUFS
# Needs factory/setup.sh to have run once in this container.
set -euo pipefail
SLUG_DIR="${1:?usage: make.sh <slug> [voice|picture|mix|all]}"
STEP="${2:-all}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FILM="$ROOT/film/$SLUG_DIR"
TOOLS="$ROOT/film/tools"
PY="${VOICE_PY:-$HOME/.venv-cb/bin/python}"
[ -f "$FILM/film.js" ] || { echo "no film at $FILM"; exit 1; }
# The page's FILM.SLUG names the output files (e.g. next-word); fall back to the folder name.
SLUG="$(grep -o "SLUG: *'[^']*'" "$FILM/film.js" | head -1 | sed "s/.*'\(.*\)'/\1/")"
SLUG="${SLUG:-$SLUG_DIR}"

voice() {
  ( cd "$TOOLS" && "$PY" voiceover.py synth "$FILM/vo/script.json" )
  # The solo check is advisory: Whisper sometimes invents words in a dry line's fade-out ("Thank you.").
  # Fix lines it flags for pace or a real misread; the in-context check in `mix` is the gate.
  ( cd "$TOOLS" && "$PY" voiceover.py check "$FILM/vo/script.json" ) || echo "WARN  solo listen check flagged lines: fix real misreads or pace (say/take/split); tail hallucinations can be ignored"
  ffmpeg -v error -y -i "$FILM/out/vo/vo.wav" -ac 1 -b:a 96k "$FILM/vo/$SLUG-vo.mp3"
}

picture() {
  ( cd "$TOOLS" && node render.mjs all --film "$SLUG_DIR" --workers "${WORKERS:-4}" )
}

mix() {
  ( cd "$TOOLS" && "$PY" voiceover.py mix "$FILM/vo/script.json" --score "$FILM/out/mix.wav" \
      --video "$FILM/out/$SLUG.mp4" --out "$FILM/out/$SLUG-vo.mp4" ) | tee "$FILM/out/mix.log"
  if grep -q "^FIX " "$FILM/out/mix.log"; then echo "in-context listen check failed (see out/mix.log): fix those lines before posting"; exit 2; fi
  # Voice only, for when Isac lays a TikTok sound under it: the narration alone, loudness-normalised.
  ffmpeg -v error -y -i "$FILM/out/vo/vo.wav" -af "loudnorm=I=-14:TP=-1.5:LRA=11" -ar 48000 "$FILM/out/vo/voice-only.wav"
  ffmpeg -v error -y -i "$FILM/out/$SLUG.mp4" -i "$FILM/out/vo/voice-only.wav" -map 0:v -map 1:a -c:v copy \
      -c:a aac -b:a 192k -shortest -movflags +faststart "$FILM/out/$SLUG-voice-only.mp4"
  for f in "$SLUG-vo" "$SLUG-voice-only"; do
    printf '%s: ' "$f"
    ffmpeg -hide_banner -nostats -i "$FILM/out/$f.mp4" -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+I:|Peak:" | tr -s ' ' | tr '\n' ' '
    echo
  done
  ffmpeg -hide_banner -nostats -i "$FILM/out/$SLUG-vo.mp4" -vf blackdetect=d=0.3:pix_th=0.05 -an -f null - 2>&1 | grep blackdetect || echo "no black stretches"
  # Copy the deliverables where every thread can reach them, when the project folder exists.
  if [ -d /mnt/project-files ]; then
    mkdir -p "/mnt/project-files/factory/$SLUG_DIR/"
    cp "$FILM/out/$SLUG-vo.mp4" "$FILM/out/$SLUG-voice-only.mp4" "$FILM/out/poster.jpg" "$FILM/out/check/sheet.jpg" "/mnt/project-files/factory/$SLUG_DIR/"
  fi
}

case "$STEP" in
  voice) voice ;;
  picture) picture ;;
  mix) mix ;;
  all) voice; picture; mix ;;
  *) echo "unknown step $STEP"; exit 1 ;;
esac
