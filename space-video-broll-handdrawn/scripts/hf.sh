#!/bin/bash
# 调 HyperFrames CLI：优先用本机 npx 缓存里版本最高的，避免每次联网装新版
# 用法: bash hf.sh <hyperframes 子命令和参数...>
BIN=$(ls -d "$HOME"/.npm/_npx/*/node_modules/hyperframes 2>/dev/null | while read d; do v=$(node -p "require('$d/package.json').version" 2>/dev/null); echo "$v $d"; done | sort -V | tail -1 | cut -d' ' -f2)
if [ -n "$BIN" ] && [ -x "$BIN/../.bin/hyperframes" ]; then exec "$BIN/../.bin/hyperframes" "$@"; fi
exec npx --yes hyperframes@0.8.150 "$@"
