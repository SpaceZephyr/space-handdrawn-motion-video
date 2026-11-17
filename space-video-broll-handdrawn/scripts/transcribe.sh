#!/bin/bash
# 逐字稿：whisper.cpp + ggml-small（本机，约 1 分钟/4 分钟视频）
# 用法: bash transcribe.sh <视频> <输出前缀>   → <输出前缀>.srt，并打印「起止 文本」一览
set -e
V="$1"; O="$2"; [ -z "$O" ] && { echo "用法: bash transcribe.sh <视频> <输出前缀>"; exit 1; }
M="${WHISPER_MODEL:-$HOME/.cache/hyperframes/whisper/models/ggml-small.bin}"
[ -f "$M" ] || { echo "找不到模型 $M（设 WHISPER_MODEL，或先跑一次 hyperframes transcribe 让它下载）"; exit 1; }
command -v whisper-cli >/dev/null || { echo "需要 whisper-cli：brew install whisper-cpp"; exit 1; }
TMP="$(mktemp -d)"; ffmpeg -v error -y -i "$V" -ar 16000 -ac 1 "$TMP/a.wav"
whisper-cli -m "$M" -l zh -osrt -of "$O" "$TMP/a.wav" >/dev/null 2>&1
awk 'BEGIN{RS=""}{split($0,a,"\n"); sub(/,[0-9]+/,"",a[2]); sub(/,[0-9]+/,"",a[2]); print a[2]"  "a[3]a[4]}' "$O.srt"
