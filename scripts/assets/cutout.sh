#!/bin/bash
# 从视频（或图片）里剪一块做剪贴画：取某一秒的原尺寸帧 → 裁 → 可选抠掉纯色底 → 透明 PNG
# 用法：bash cutout.sh 源 输出.png 秒 [裁剪 w:h:x:y] [抠色 0xRRGGBB[:相似度:羽化]]
#   bash cutout.sh launch_4k.mp4 assets/ui/notif.png 12.4 1480:300:1180:220 0xCCCADA:0.06:0.04
#   源是图片时「秒」写 0。抠色先用 pick 看底色：bash cutout.sh 源 - 秒 pick x y
set -e
SRC="$1"; OUT="$2"; SS="${3:-0}"; CROP="${4:-}"; KEY="${5:-}"
[ -z "$OUT" ] && { echo "用法: bash cutout.sh 源 输出.png 秒 [w:h:x:y] [0xRRGGBB[:相似度:羽化]]"; exit 1; }
if [ "$CROP" = "pick" ]; then   # 取某一点的颜色：bash cutout.sh 源 - 秒 pick x y
  ffmpeg -loglevel error -ss "$SS" -i "$SRC" -frames:v 1 -vf "crop=1:1:$5:$6,format=rgb24" -f rawvideo - | xxd -p | sed 's/^/0x/' | tr a-f A-F; exit 0; fi
VF="${CROP:+crop=$CROP}"
if [ -n "$KEY" ]; then IFS=: read -r C SIM BL <<< "$KEY"; VF="${VF:+$VF,}format=rgba,colorkey=$C:${SIM:-0.06}:${BL:-0.04}"; else VF="${VF:+$VF,}format=rgba"; fi
ffmpeg -y -loglevel error -ss "$SS" -i "$SRC" -frames:v 1 -vf "$VF" -update 1 "$OUT"
echo "$OUT  $(ffprobe -v error -show_entries stream=width,height -of csv=p=0 "$OUT")"
