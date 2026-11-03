#!/usr/bin/env bash
# Cut a vertical Short (1080×1920) out of a finished 16:9 long-form episode.
#   tools/shorts.sh <in.mp4> <out.mp4> "<HOOK LINE 1>|<HOOK LINE 2>" <from>-<to> [<from>-<to> ...]
# Segments (seconds) are joined in order. The frame is scaled to 1440×810 and centre-cropped to 1080 wide
# (the burned-in captions sit in the middle, so they survive), with the hook (≤ 6 words) above it on frame 0
# and a small "full story" line below. Audio is the episode's own mix (voice + foley).
set -euo pipefail
in=$1; out=$2; hook=$3; shift 3
font=/usr/share/fonts/opentype/inter/Inter-ExtraBold.otf
n=0; parts=""; concat=""
for seg in "$@"; do
  a=${seg%-*}; b=${seg#*-}
  parts+="[0:v]trim=$a:$b,setpts=PTS-STARTPTS[v$n];[0:a]atrim=$a:$b,asetpts=PTS-STARTPTS,afade=t=in:d=0.04,afade=t=out:st=$(awk "BEGIN{print $b-$a-0.08}"):d=0.08[a$n];"
  concat+="[v$n][a$n]"; n=$((n+1))
done
esc() { printf '%s' "$1" | sed 's/:/\\:/g'; }   # hooks must not contain apostrophes
h1=$(esc "${hook%%|*}"); h2=""; [[ $hook == *"|"* ]] && h2=$(esc "${hook#*|}")
ffmpeg -hide_banner -loglevel error -y -i "$in" -filter_complex "\
${parts}${concat}concat=n=$n:v=1:a=1[cv][ca];\
[cv]scale=1440:810,crop=1080:810[f];\
color=c=0x16122a:s=1080x1920:r=30[bg];\
[bg][f]overlay=0:560:shortest=1,\
drawtext=fontfile=$font:text='$h1':fontsize=96:fontcolor=0xffc83d:borderw=8:bordercolor=0x1c1830:x=(w-tw)/2:y=290,\
drawtext=fontfile=$font:text='$h2':fontsize=96:fontcolor=0xffc83d:borderw=8:bordercolor=0x1c1830:x=(w-tw)/2:y=405,\
drawtext=fontfile=$font:text='Full story on the channel':fontsize=44:fontcolor=0xf4ede0:x=(w-tw)/2:y=1450[v]" \
  -map "[v]" -map "[ca]" -c:v libx264 -preset medium -crf 19 -pix_fmt yuv420p -c:a aac -b:a 192k -movflags +faststart "$out"
echo "wrote $out ($(ffprobe -v error -show_entries format=duration -of csv=p=0 "$out") s)"
