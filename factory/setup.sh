#!/usr/bin/env bash
# One-time setup for a fresh container: renderer deps and the Chatterbox voice venv. Safe to rerun.
# Takes about 5 minutes the first time (torch cpu + chatterbox); later runs return at once.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
command -v ffmpeg >/dev/null || { sudo apt-get update -qq && sudo apt-get install -y -qq ffmpeg; } || apt-get install -y -qq ffmpeg
[ -d "$ROOT/film/tools/node_modules" ] || ( cd "$ROOT/film/tools" && npm ci --silent )
VENV="${VOICE_VENV:-$HOME/.venv-cb}"
if [ ! -x "$VENV/bin/python" ] || ! "$VENV/bin/python" -c "import chatterbox, faster_whisper" 2>/dev/null; then
  PY311="$(command -v python3.11 || true)"
  [ -n "$PY311" ] || { echo "python3.11 is needed for Chatterbox (try: uv python install 3.11)"; exit 1; }
  "$PY311" -m venv "$VENV"
  "$VENV/bin/pip" install -q --upgrade pip
  "$VENV/bin/pip" install -q --extra-index-url https://download.pytorch.org/whl/cpu torch==2.6.0+cpu torchaudio==2.6.0+cpu
  "$VENV/bin/pip" install -q "numpy<2" chatterbox-tts==0.1.7 "setuptools<81" faster-whisper==1.2.1 soundfile
fi
echo "factory ready: node $(node -v), ffmpeg $(ffmpeg -version | head -1 | cut -d' ' -f3), voice venv $VENV"
