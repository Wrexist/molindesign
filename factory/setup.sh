#!/usr/bin/env bash
# One-time setup for a fresh container: renderer deps, the Ming voice (the factory voice) and the Chatterbox venv. Safe to rerun.
# Takes about 10 minutes the first time (two torch cpu venvs + a 3 GB voice model); later runs return at once.
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
# Ming-3.0-tts-0.5B (inclusionAI, MIT): the factory voice since 2026-10-23 (US_James). Own venv: it pins transformers 4.46.
MING_VENV="$HOME/.venv-ming"; MING_SRC="$HOME/ming-src"; MING_MODEL="$HOME/ming-0.5b"
MING_REV=028c1eace193e7acdb256453da89b6e9207e052b
if [ ! -d "$MING_SRC/.git" ]; then
  git clone -q https://github.com/inclusionAI/Ming-3.0-tts.git "$MING_SRC"
  git -C "$MING_SRC" checkout -q "$MING_REV"
  # upstream casts the prompt audio to bf16; we run the model in fp32 on CPU
  sed -i 's/prompt_waveform.to(device=self.device, dtype=torch.bfloat16)/prompt_waveform.to(device=self.device, dtype=next(self.audio.parameters()).dtype)/' "$MING_SRC/modeling_bailingmm.py"
fi
if [ ! -x "$MING_VENV/bin/python" ] || ! "$MING_VENV/bin/python" -c "import transformers, x_transformers, faster_whisper" 2>/dev/null; then
  PY311="$(command -v python3.11 || true)"
  [ -n "$PY311" ] || { echo "python3.11 is needed for Ming (try: uv python install 3.11)"; exit 1; }
  "$PY311" -m venv "$MING_VENV"
  "$MING_VENV/bin/pip" install -q --upgrade pip
  "$MING_VENV/bin/pip" install -q --extra-index-url https://download.pytorch.org/whl/cpu torch==2.6.0+cpu torchaudio==2.6.0+cpu
  "$MING_VENV/bin/pip" install -q transformers==4.46.3 tokenizers==0.20.3 accelerate==1.3.0 diffusers==0.33.0 x-transformers==2.9.2 \
    einops==0.8.2 einx==0.4.3 onnxruntime==1.31.0 inflect==7.6.0 loguru==0.7.3 safetensors==0.8.0 pyyaml regex \
    "huggingface_hub[cli]==0.36.2" faster-whisper==1.2.1 soundfile==0.12.1 numpy
fi
[ -f "$MING_MODEL/model.safetensors" ] || "$MING_VENV/bin/hf" download inclusionAI/Ming-3.0-tts-0.5b --local-dir "$MING_MODEL" \
  || "$MING_VENV/bin/huggingface-cli" download inclusionAI/Ming-3.0-tts-0.5b --local-dir "$MING_MODEL"
echo "factory ready: node $(node -v), ffmpeg $(ffmpeg -version | head -1 | cut -d' ' -f3), voice venv $VENV"
