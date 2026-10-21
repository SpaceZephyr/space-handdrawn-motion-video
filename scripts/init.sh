#!/bin/bash
# 新建一个手绘动效视频项目：bash scripts/init.sh <项目目录> [16:9|3:4|9:16|1:1]
set -e
S="$(cd "$(dirname "$0")" && pwd)"; P="$1"; F="${2:-16:9}"
[ -z "$P" ] && { echo "用法: bash init.sh <项目目录> [16:9|3:4|9:16|1:1]"; exit 1; }
case "$F" in 16:9) WH='"W": 1920, "H": 1080';; 3:4) WH='"W": 1080, "H": 1440';; 9:16) WH='"W": 1080, "H": 1920';; 1:1) WH='"W": 1080, "H": 1080';; *) echo "比例只支持 16:9 3:4 9:16 1:1"; exit 1;; esac
mkdir -p "$P"/{engine/fonts,cover,assets,voice_raw,voice,out}
cp "$S"/engine/{lib.mjs,runtime.js,style.css,themes.mjs} "$P/engine/"
ln -sfn "$S/../assets/fonts/Xiaolai-Regular.ttf" "$P/engine/fonts/Xiaolai-Regular.ttf"
ln -sfn "$S/node_modules" "$P/node_modules"
[ -f "$P/cover/cover.mjs" ] || cp "$S/cover/cover.template.mjs" "$P/cover/cover.mjs"
[ -f "$P/config.json" ] || cat > "$P/config.json" <<EOT
{ $WH, "accent": "#2456F5",
  "voice": { "speaker": "Serena", "description": "产品介绍视频的旁白，亲切自然，吐字清楚，语速适中", "seed": 7, "speed": 1.0 } }
EOT
[ -f "$P/lines.json" ] || echo '[]' > "$P/lines.json"
[ -f "$P/scenes.mjs" ] || cat > "$P/scenes.mjs" <<'EOT'
// 每一句旁白对应一场画面。写法见 references/scene-patterns.md，完整例子见 examples/grokbot/scenes.mjs
import { A, R, ICON, W, H, ACC, INK, sk, hand, write, box, head, pin, lens, logo, note, tape, phone, browser, cursor, tap } from "./engine/lib.mjs";
export const SCENES = [];
EOT
echo "项目已建好：${P}（${F}）"
