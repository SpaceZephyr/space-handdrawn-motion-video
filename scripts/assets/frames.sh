#!/bin/bash
# 把一段视频拼成带时间码的缩略图总览，挑剪贴素材用（产品发布视频、演示视频）
# 用法：bash frames.sh 源视频 输出.jpg [每几秒一张，默认 3] [开始秒] [时长秒]
set -e
SRC="$1"; OUT="$2"; EV="${3:-3}"; SS="${4:-0}"; T="${5:-}"
[ -z "$OUT" ] && { echo "用法: bash frames.sh 源视频 输出.jpg [每几秒一张] [开始秒] [时长秒]"; exit 1; }
D="${T:-$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$SRC" | awk -v s="$SS" '{print $1-s}')}"
N=$(awk -v d="$D" -v e="$EV" 'BEGIN{n=int(d/e); if(n<1)n=1; print n}'); ROWS=$(( (N + 5) / 6 ))
ffmpeg -y -loglevel error -ss "$SS" ${T:+-t "$T"} -i "$SRC" -vf "fps=1/$EV,scale=360:-2,tile=6x${ROWS}:padding=4" -frames:v 1 -q:v 3 "$OUT"
echo "${OUT}：${N} 张，从 ${SS}s 起每 ${EV}s 一张，6 列，第 k 张（从 0 数）= ${SS} + k×${EV} 秒"
