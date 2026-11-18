#!/bin/bash
# 收尾：把字幕层贴到 compose 出来的成片上，并整体变速（画面和声音一起，声音保持原音调）
# 用法: bash finish.sh <compose成片.mp4> <字幕层.mov|none> <输出.mp4> [倍速=1.2] [字幕x=20] [字幕y=1640]
set -e
IN="$1"; SUB="$2"; OUT="$3"; SP="${4:-1.2}"; X="${5:-20}"; Y="${6:-1640}"
[ -z "$OUT" ] && { echo "用法: bash finish.sh <成片.mp4> <字幕.mov|none> <输出.mp4> [倍速] [x] [y]"; exit 1; }
FPS=$(ffprobe -v error -select_streams v:0 -show_entries stream=r_frame_rate -of csv=p=0 "$IN" | awk -F/ '{printf "%d", $1/($2?$2:1)}')
if [ "$SUB" != "none" ]; then
  ffmpeg -hide_banner -v error -y -i "$IN" -i "$SUB" -filter_complex "[0:v][1:v]overlay=$X:$Y:eof_action=pass,setpts=PTS/$SP,fps=$FPS[v];[0:a]atempo=$SP[a]" -map "[v]" -map "[a]" -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p -c:a aac -b:a 192k -movflags +faststart "$OUT"
else
  ffmpeg -hide_banner -v error -y -i "$IN" -filter_complex "[0:v]setpts=PTS/$SP,fps=$FPS[v];[0:a]atempo=$SP[a]" -map "[v]" -map "[a]" -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p -c:a aac -b:a 192k -movflags +faststart "$OUT"
fi
echo "完成 $OUT（$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT" | cut -c1-6)s，${SP}x）"
