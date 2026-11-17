#!/bin/bash
# 建项目：bash init.sh <项目目录> <原片>
# 写入 beats.mjs 模板（已填好原片尺寸、时长、默认安全区），之后改 beats.mjs → node build.mjs
set -e
P="$1"; V="$2"; [ -z "$V" ] && { echo "用法: bash init.sh <项目目录> <原片>"; exit 1; }
HERE="$(cd "$(dirname "$0")" && pwd)"; mkdir -p "$P"
W=$(ffprobe -v error -select_streams v:0 -show_entries stream=width -of csv=p=0 "$V")
H=$(ffprobe -v error -select_streams v:0 -show_entries stream=height -of csv=p=0 "$V")
D=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$V")
[ -f "$P/beats.mjs" ] && { echo "$P/beats.mjs 已存在，不覆盖"; exit 0; }
# 默认安全区：水平居中、宽 85%，竖直从 15% 到 70%（避开底部字幕和角落人像窗，抽帧确认后再调）
SWD=$(( W * 85 / 100 / 20 * 20 )); SX=$(( (W - SWD) / 2 )); SY=$(( H * 15 / 100 )); SHT=$(( H * 55 / 100 / 20 * 20 ))
sed -e "s#__W__#$W#; s#__H__#$H#; s#__DUR__#${D%.*}#; s#__SX__#$SX#; s#__SY__#$SY#; s#__SW__#$SWD#; s#__SH__#$SHT#; s#__SRC__#$V#" "$HERE/../templates/beats.mjs" > "$P/beats.mjs"
echo "已建 $P/beats.mjs（原片 ${W}x${H}，${D%.*}s，安全区 x=$SX y=$SY ${SWD}x${SHT}）"
