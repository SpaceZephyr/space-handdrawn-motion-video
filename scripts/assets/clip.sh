#!/bin/bash
# 裁一段视频片段给 clip() 用：去声音、30fps、全关键帧（逐帧 seek 才准）
# 用法：bash clip.sh 源文件 输出.mp4 [开始秒] [时长秒] [宽，默认 960] [额外滤镜，如 crop=iw:ih*0.8:0:0]
# 源文件也可以是 GIF
set -e
SRC="$1"; OUT="$2"; SS="${3:-0}"; T="${4:-}"; WID="${5:-960}"; VF="${6:-}"
[ -z "$OUT" ] && { echo "用法: bash clip.sh 源文件 输出.mp4 [开始秒] [时长秒] [宽] [额外滤镜]"; exit 1; }
F="${VF:+$VF,}fps=30,scale=${WID}:-2:flags=lanczos,format=yuv420p"
ffmpeg -y -loglevel error -ss "$SS" ${T:+-t "$T"} -i "$SRC" -an -vf "$F" -c:v libx264 -preset fast -crf 20 -g 1 -keyint_min 1 -movflags +faststart "$OUT"
echo "$OUT  $(ffprobe -v error -show_entries stream=width,height -show_entries format=duration -of csv=p=0 "$OUT" | tr '\n' ' ')"
