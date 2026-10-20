#!/bin/bash
# 下载配乐和音效到 assets/bgm、assets/sfx（Mixkit 免费授权，可商用、不用署名，但不允许把原文件再分发，所以不放进仓库）
# 用法：bash scripts/assets/fetch_audio.sh
set -e
A="$(cd "$(dirname "$0")/../../assets" && pwd)"; mkdir -p "$A/bgm" "$A/sfx"
get() { [ -s "$2" ] && { echo "已有 $(basename "$2")"; return; }; curl -fsSL "$1" -o "$2" && echo "下载 $(basename "$2")"; }
m() { get "https://assets.mixkit.co/music/$1/$1.mp3" "$A/bgm/$2.mp3"; }
s() { get "https://assets.mixkit.co/active_storage/sfx/$1/$1-preview.mp3" "$A/sfx/$2.mp3"; }
m 621 owies-ukulele; m 5 smile; m 791 cupcakes; m 813 its-april
m 1116 pick-it-up; m 851 me-and-you; m 51 sports-highlights
s 1490 whoosh; s 3005 pop; s 2357 bubble; s 2998 marker
