#!/bin/bash
# 成片抽帧拼图：bash qc.sh <视频> <输出.jpg> <秒1> <秒2> ...（每行 6 张，按给的顺序排；时间点会打印出来对照）
V="$1"; O="$2"; shift 2; T="$(mktemp -d)"; i=0
for t in "$@"; do ffmpeg -v error -y -ss "$t" -i "$V" -frames:v 1 -vf "scale=400:-1" "$T/$(printf %03d $i).jpg"; i=$((i+1)); done
ffmpeg -v error -y -i "$T/%03d.jpg" -vf "tile=6x$(( (i+5)/6 ))" "$O" && echo "$O  ← 依次是 $* 秒"
