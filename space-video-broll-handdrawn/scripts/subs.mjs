// 字幕层：<项目>/subs/cues.txt（每行「起|止|文字」，文字里写「/」拆成前后两条，时间按字数分）
// → <项目>/subs/comp（HyperFrames 合成，透明底，黄字黑边）→ 用 hf.sh render --format mov 渲染，再用 finish.sh 贴到成片
// 用法: node subs.mjs <项目> [宽=940] [高=320] [字号=58]
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { homedir } from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";
const HERE = dirname(fileURLToPath(import.meta.url));
const require = createRequire(join(HERE, "package.json"));
const subsetFont = require("subset-font");
const P = resolve(process.argv[2] || "."), W = +(process.argv[3] || 940), H = +(process.argv[4] || 320), FS = +(process.argv[5] || 58);
const cfg = (await import(pathToFileURL(join(P, "beats.mjs")).href)).default;
const dur = cfg.videoDur;
const vw = (s) => [...s].reduce((n, c) => n + (/[\x00-\x7f]/.test(c) ? 0.55 : 1), 0);
const cues = readFileSync(join(P, "subs/cues.txt"), "utf8").trim().split("\n").filter((l) => l.includes("|")).flatMap((l) => {
  const [s, e, t] = l.split("|"); const parts = t.split("/"); const tot = parts.reduce((n, p) => n + vw(p), 0); let at = +s;
  return parts.map((p) => { const d = (+e - +s) * vw(p) / tot, c = { s: at, e: at + d, t: p.trim() }; at += d; return c; });
});
const maxw = (W - 40) / FS;
const long = cues.filter((c) => vw(c.t) > maxw); if (long.length) console.log(`超过一行（>${maxw.toFixed(1)} 字宽）的字幕，在 cues.txt 里用「/」拆开：`, long.map((c) => c.t));
// 字体：SUBS_FONT → ~/Library/Fonts/NotoSansSC.ttf → 小赖（找不到黑体时退回手写体）
const fontSrc = [process.env.SUBS_FONT, join(homedir(), "Library/Fonts/NotoSansSC.ttf"), "/Library/Fonts/NotoSansSC.ttf", join(HERE, "../../assets/fonts/Xiaolai-Regular.ttf"), join(homedir(), ".claude/skills/space-handdrawn-motion-video/assets/fonts/Xiaolai-Regular.ttf")].find((p) => p && existsSync(p));
if (!fontSrc) throw new Error("找不到字幕字体：设 SUBS_FONT=字体路径");
const out = join(P, "subs/comp"); mkdirSync(join(out, "fonts"), { recursive: true });
writeFileSync(join(out, "fonts/subs.woff2"), await subsetFont(readFileSync(fontSrc), [...new Set(cues.map((c) => c.t).join(""))].join(""), { targetFormat: "woff2" }));
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const clips = cues.map((c, i) => `<div id="c${i}" class="cue clip" data-start="${c.s.toFixed(3)}" data-duration="${(c.e - c.s - 0.02).toFixed(3)}" data-track-index="0"><span>${esc(c.t)}</span></div>`).join("\n");
writeFileSync(join(out, "index.html"), `<!doctype html><html lang="zh"><head><meta charset="utf-8"><meta name="viewport" content="width=${W}, height=${H}" /><style>
@font-face{font-family:"SubsCN";src:url("fonts/subs.woff2") format("woff2")}
html,body{margin:0;background:transparent}
#root{position:relative;width:${W}px;height:${H}px;overflow:hidden}
.cue{position:absolute;left:20px;right:20px;bottom:24px;text-align:center;font-family:"SubsCN",sans-serif;font-weight:800;font-size:${FS}px;line-height:1.28;color:#FFE14A;-webkit-text-stroke:${Math.round(FS * 0.19)}px #141414;paint-order:stroke fill;text-shadow:0 4px 10px rgba(0,0,0,.35)}
</style></head><body>
<div id="root" data-composition-id="subs" data-start="0" data-duration="${dur}" data-width="${W}" data-height="${H}">
${clips}
</div>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
<script>window.__timelines = window.__timelines || {}; window.__timelines["subs"] = gsap.timeline({ paused: true });</script>
</body></html>`);
writeFileSync(join(out, "hyperframes.json"), JSON.stringify({ $schema: "https://hyperframes.heygen.com/schema/hyperframes.json", paths: { assets: "assets" }, media: { autoProxy: true } }, null, 2));
writeFileSync(join(out, "meta.json"), JSON.stringify({ id: "subs", name: "subs" }));
console.log(`${cues.length} 条字幕 → ${out}（${W}×${H}，${FS}px，字体 ${fontSrc.split("/").pop()}）`);
