// 读 <项目>/beats.mjs → 生成 <项目>/broll/（HyperFrames 工程：index.html、字体子集、素材）和 broll/beats.json（给 compose.mjs）
// 用法: node build.mjs <项目目录>
import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync } from "node:fs";
import { resolve, basename, join, dirname } from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import { homedir } from "node:os";
import subsetFont from "subset-font";
import { createRequire } from "node:module";
import { makeKit } from "./hd.mjs";
import { THEMES, PAPER_CSS, penSvg, FILTERS } from "./themes.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const proj = resolve(process.argv[2] || ".");
const cfg = (await import(pathToFileURL(join(proj, "beats.mjs")) + "?v=" + Date.now())).default;
const out = join(proj, "broll");
mkdirSync(join(out, "fonts"), { recursive: true }); mkdirSync(join(out, "assets"), { recursive: true });

// 字体：小赖手写体。harfbuzz 量每个字的宽度（排版和笔尖位置用），最后按用到的字做子集（22MB → 几十 KB）
const fontSrc = [process.env.HD_FONT, join(HERE, "../assets/fonts/Xiaolai-Regular.ttf"), join(HERE, "../../assets/fonts/Xiaolai-Regular.ttf"), join(homedir(), ".claude/skills/space-handdrawn-motion-video/assets/fonts/Xiaolai-Regular.ttf")].find((p) => p && existsSync(p));
if (!fontSrc) throw new Error("找不到 Xiaolai-Regular.ttf：设 HD_FONT=字体路径，或放到 skill 的 assets/fonts/ 下");
const hb = await createRequire(import.meta.url)("harfbuzzjs");
const hbFont = hb.createFont(hb.createFace(hb.createBlob(readFileSync(fontSrc)), 0));
const advCache = {};
const adv = (c) => advCache[c] ??= (() => { const b = hb.createBuffer(); b.addText(c); b.guessSegmentProperties(); hb.shape(hbFont, b); const g = b.json(); b.destroy(); return g.reduce((s, x) => s + x.ax, 0) / 1000; })();

const theme = THEMES[process.env.HD_THEME || cfg.theme] ? (process.env.HD_THEME || cfg.theme) : "whiteboard", TH = THEMES[theme];
const ACC = (!process.env.HD_THEME && cfg.accent) || TH.accent;
const SW = cfg.safe.w, SH = cfg.safe.h;
// 全屏白底模式（cfg.full）：白纸盖满整个画面，只给人像窗挖一个洞；字幕之后叠在最上层。内容区按 safe 的坐标设计，整体放大 scale 倍、水平居中
const FULL = cfg.full ? { bg: "#FFFFFF", scale: 1, top: cfg.safe.y, merge: 1.5, ...cfg.full } : null;
const PAD = FULL ? 0 : 60, W = FULL ? cfg.frame.w : SW + PAD * 2, H = FULL ? cfg.frame.h : SH + PAD * 2;
const warn = []; const W_ = (m) => warn.push(m);

// 素材：复制进 broll/assets
const assets = new Map();
const asset = (src) => { const abs = resolve(proj, src); if (!existsSync(abs)) throw new Error("找不到素材 " + abs); const name = basename(abs).replace(/[^\w.-]/g, "_"); if (!assets.has(abs)) { copyFileSync(abs, join(out, "assets", name)); assets.set(abs, name); } return name; };

const beats = [...cfg.beats].sort((a, b) => a.at - b.at).map((b) => ({ ...b, dur0: b.dur }));
// 全屏模式：相邻两段间隔 < merge 秒时，前一段延长到下一段开始，白底连着不闪回原片
if (FULL) beats.forEach((b, i) => { const n = beats[i + 1]; b.fin = !(i && beats[i - 1].fout === false); b.fout = true; if (n && n.at - (b.at + b.dur) < FULL.merge) { b.dur = +(n.at - b.at).toFixed(3); b.fout = false; } });
let acc = 0; const ANIMS = [], CARDS = [], PENS = [], OUTB = []; let html = "";
beats.forEach((b, bi) => {
  if (!b.id || !/^[a-z][\w-]*$/i.test(b.id)) throw new Error(`beat id 要用字母开头: ${b.id}`);
  const start = +acc.toFixed(2); acc += b.dur;
  const kit = makeKit({ W: SW, H: SH, theme, accent: ACC, beatId: b.id, asset, adv });
  // 卡片头：小标签 + 手写标题 + 强调色双下划线
  const tsize = b.titleSize || 64;
  const head = [];
  if (b.kicker) head.push(kit.text(64, 44, b.kicker, { size: 30, color: kit.GRAY, fx: "fade", t: 0.25, id: "kick" }));
  if (b.title) {
    const tt = kit.text(64, 86, b.title, { size: tsize, t: 0.45, id: "title", w: SW - 128 });
    head.push(tt);
    if (b.underline !== false) head.push(kit.under(64, 86 + tsize * 1.32, Math.min(SW - 140, kit.tw(b.title, tsize) + 12), { id: "title-u" }));
  }
  const body = [].concat(...(b.draw ? [].concat(b.draw(kit)) : [])).flat(3).filter(Boolean);
  const els = [...head, ...body];
  // 时间：数字 = 相对本段开始；"@123.4" = 原片绝对时间；不写 = 接在上一个后面
  const rel = (t) => typeof t === "string" && t[0] === "@" ? +(parseFloat(t.slice(1)) - b.at).toFixed(3) : t;
  const uidMap = {}; const resolved = new Map(); let cursor = 0.3, contentEnd = 0; const enterAt = {};
  for (const el of els) {
    if (el.uid) (uidMap[el.uid] ||= []).push("#" + el.id);
    for (const a of el.anims) {
      let t = rel(a.t);
      if (t === undefined || t === null) t = el.after && resolved.has(el.after) ? resolved.get(el.after) : cursor;
      if (a.after) t += a.after;
      a.rt = +t.toFixed(3);
      if (a.rt < 0 || a.rt > b.dur - 0.5) W_(`${b.id}: 有动作落在 ${a.rt}s（本段 0–${b.dur}s 之外），检查 t / "@时间"`);
      if (!["focus", "hide", "tint"].includes(a.kind)) contentEnd = Math.max(contentEnd, a.rt + a.d);
      cursor = Math.max(cursor, a.rt + a.d * (a.kind === "draw" || a.kind === "write" ? 1 : 0.6) + 0.12);
    }
    if (el.anims[0]) resolved.set(el, el.anims[0].rt + el.anims[0].d * 0.7);
    if (el.id && el.anims[0]) enterAt["#" + el.id] = el.anims[0].rt;
  }
  const hold = b.dur0 - 0.45 - contentEnd;
  if (hold < 3) W_(`${b.id}: 内容 ${contentEnd.toFixed(1)}s 出齐，离退场只剩 ${hold.toFixed(1)}s（要求 ≥3s）。加长 dur 或把动作提前`);
  if (b.dur0 < 6) W_(`${b.id}: 只有 ${b.dur}s，观众来不及看`);
  const next = beats[bi + 1];
  if (next && next.at < b.at + b.dur0 + 0.2) W_(`${b.id}: 结束于 ${(b.at + b.dur0).toFixed(1)}s，和下一段 ${next.id}（${next.at}s）挨太近或重叠`);
  if (cfg.videoDur && b.at + b.dur0 > cfg.videoDur) W_(`${b.id}: 超出原片时长 ${cfg.videoDur}s`);

  // id 匹配：自己 + 以「id-」开头的（标签 x-l、同组 x-icon 等），所以一组元素用同一个前缀就能一起点亮
  const sel = (ids) => [...new Set(ids.flatMap((u) => { const ks = Object.keys(uidMap).filter((k) => k === u || k.startsWith(u + "-")); if (!ks.length) W_(`${b.id}: focus/hide/tint 里的 id "${u}" 不存在`); return ks.flatMap((k) => uidMap[k]); }))];
  for (const el of els) for (const a of el.anims) {
    const A = { ...a, t: +(start + a.rt).toFixed(3) }; delete A.rt; delete A.after;
    if (cfg.pen === false) A.pen = false;
    // 还没入场的元素不参与 focus/reset：否则压暗会把它从 0 提到 dim，reset 会让它提前露出来
    const shown = (s) => (enterAt[s] ?? 0) <= a.rt + 0.05;
    if (a.kind === "focus") { const on = sel(a.on).filter(shown), all = sel(a.among).filter(shown); A.onSel = on; A.offSel = all.filter((s) => !on.includes(s)); delete A.on; delete A.among; }
    if (a.kind === "hide" || a.kind === "tint") { A.onSel = sel(a.on); delete A.on; }
    if (a.kind === "wipe") A.W = SW;
    ANIMS.push(A);
  }
  // 笔出现的时间窗：相邻 0.35s 内的合并
  const wins = els.flatMap((e) => e.anims).filter((a) => a.pen && cfg.pen !== false).map((a) => [start + a.rt, start + a.rt + a.d]).sort((x, y) => x[0] - y[0]);
  const merged = []; for (const w of wins) { const l = merged[merged.length - 1]; if (l && w[0] <= l[1] + 0.35) l[1] = Math.max(l[1], w[1]); else merged.push([...w]); }
  PENS.push({ id: b.id, w: merged.map((w) => w.map((v) => +v.toFixed(3))) });
  const rot = b.rot ?? (bi % 2 ? 0.7 : -0.7);
  CARDS.push({ id: b.id, s: start, e: +(start + b.dur).toFixed(3), rot, ...(FULL ? { full: 1, fin: b.fin, fout: b.fout } : {}) });
  const grain = theme === "kraft" || theme === "inkwash" ? `<svg class="grain" width="${SW}" height="${SH}"><rect width="100%" height="100%" filter="url(#f-grain)"/></svg>` : "";
  const stage = `<div class="stage">${els.map((e) => e.html).join("")}${cfg.pen === false ? "" : penSvg(TH.pen, ACC)}</div>`;
  html += FULL
    ? `<div id="${b.id}" class="beat clip" data-start="${start}" data-duration="${b.dur}" data-track-index="1"><div class="sheet"></div><div class="holeframe"></div><div class="stagewrap">${stage}</div></div>\n`
    : `<div id="${b.id}" class="beat clip" data-start="${start}" data-duration="${b.dur}" data-track-index="1"><div class="card">${grain}<i class="tape l"></i><i class="tape r"></i>${stage}</div></div>\n`;
  const sfx = (b.sfx || []).map(([name, t, g]) => [name, +(b.at + (rel(t) ?? 0)).toFixed(3), g ?? 1]);
  OUTB.push({ id: b.id, at: b.at, dur: b.dur, start, sfxIn: b.sfxIn !== false, sfx });
});
const TOTAL = +acc.toFixed(2);

const used = new Set((html.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">") + "0123456789,.%+-:/×xX ").split(""));
const sub = await subsetFont(readFileSync(fontSrc), [...used].join(""), { targetFormat: "woff2" });
writeFileSync(join(out, "fonts/xiaolai.woff2"), sub);

const dark = TH.dark;
function fullCss() {
  const { x, y, w, h, r = 0 } = FULL.hole, k = FULL.scale, L = Math.round((W - SW * k) / 2);
  const rr = `M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h - r}A${r} ${r} 0 0 1 ${x + w - r} ${y + h}H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`;
  return `.sheet{position:absolute;left:0;top:0;width:${W}px;height:${H}px;background:${FULL.bg};clip-path:path(evenodd,"M0 0H${W}V${H}H0Z ${rr}")}
.holeframe{position:absolute;left:${x}px;top:${y}px;width:${w}px;height:${h}px;border-radius:${r}px;box-shadow:0 10px 30px rgba(0,0,0,.16),0 0 0 3px ${TH.gray}55}
.stagewrap{position:absolute;left:${L}px;top:${FULL.top}px;width:${SW}px;height:${SH}px;transform:scale(${k});transform-origin:0 0}`;
}
const css = `
@font-face{font-family:"Xiaolai";src:url("fonts/xiaolai.woff2") format("woff2")}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:${W}px;height:${H}px;overflow:hidden;background:transparent}
#root{position:relative;width:100%;height:100%;font-family:"Xiaolai",sans-serif;color:${TH.ink}}
.beat{position:absolute;inset:0}
.card{position:absolute;left:${PAD}px;top:${PAD}px;width:${SW}px;height:${SH}px;border-radius:14px;box-shadow:0 22px 50px rgba(0,0,0,.36),0 3px 8px rgba(0,0,0,.18);${PAPER_CSS[theme]}}
.stage{position:absolute;left:0;top:0;width:${SW}px;height:${SH}px}
.ink{position:absolute;left:0;top:0;overflow:visible;z-index:1${TH.filter ? `;filter:url(#${TH.filter})` : ""}}
.ink.mk{z-index:0;filter:none}
.hd-text{position:absolute;z-index:2;line-height:1.28${TH.filter && TH.filter !== "f-ink" ? `;filter:url(#${TH.filter})` : ""}}
.hd-text .ch{display:inline-block}
.hd-note{position:absolute;z-index:3;padding:24px 26px;line-height:1.35;box-shadow:0 10px 22px rgba(0,0,0,.2)}
.hd-img{position:absolute;z-index:3;background:#fff;padding:12px;box-shadow:0 12px 26px rgba(0,0,0,.28)}
.hd-img .cap{font-size:30px;padding-top:10px;text-align:center;color:#333}
.tp{position:absolute;width:120px;height:36px;background:rgba(236,226,196,.85);z-index:4}
.tp.a{left:-34px;top:-10px;transform:rotate(-32deg)}.tp.b{right:-34px;top:-10px;transform:rotate(30deg)}
.hd-stamp{position:absolute;z-index:4;display:flex;align-items:center;justify-content:center;font-weight:700;letter-spacing:.06em}
.hd-stamp svg{position:absolute;left:0;top:0;overflow:visible}
.hd-wipe{position:absolute;left:0;top:0;width:${SW}px;height:${SH}px;z-index:1}
.tape{position:absolute;width:180px;height:48px;background:${dark ? "rgba(230,222,200,.55)" : "rgba(236,226,196,.82)"};z-index:6;box-shadow:0 2px 4px rgba(0,0,0,.08)}
.tape.l{left:34px;top:-22px;transform:rotate(-6deg)}.tape.r{right:34px;top:-20px;transform:rotate(5deg)}
.pen{position:absolute;left:0;top:0;z-index:9;opacity:0;overflow:visible;filter:drop-shadow(4px 8px 5px rgba(0,0,0,.28))}
.grain{position:absolute;left:0;top:0;border-radius:14px;opacity:${theme === "kraft" ? 0.55 : 0.35}}
.tab{font-variant-numeric:tabular-nums}
${FULL ? fullCss() : ""}`;
const GRAINF = `<svg width="0" height="0" style="position:absolute"><filter id="f-grain"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="5"/><feColorMatrix values="0 0 0 0 .2  0 0 0 0 .15  0 0 0 0 .1  0 0 0 .5 0"/></filter></svg>`;
const runtime = readFileSync(join(HERE, "runtime.js"), "utf8");
const page = `<!doctype html>
<html lang="zh">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=${W}, height=${H}" />
<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
<style>${css}</style>
</head>
<body>
${FILTERS}${GRAINF}
<div id="root" data-composition-id="main" data-start="0" data-duration="${TOTAL}" data-width="${W}" data-height="${H}">
${html}</div>
<script>
const ANIMS = ${JSON.stringify(ANIMS)};
const CARDS = ${JSON.stringify(CARDS)};
const PENS = ${JSON.stringify(PENS)};
${runtime}
</script>
</body>
</html>`;
writeFileSync(join(out, "index.html"), page);
writeFileSync(join(out, "beats.json"), JSON.stringify({ meta: { X: FULL ? 0 : cfg.safe.x - PAD, Y: FULL ? 0 : cfg.safe.y - PAD, W, H, theme }, sfx: cfg.sfx === false ? false : (cfg.sfx || {}), beats: OUTB }, null, 1));
// HyperFrames 工程文件（没有才写）
const files = {
  "meta.json": JSON.stringify({ id: "broll", name: "broll" }, null, 2),
  "package.json": JSON.stringify({ name: "broll", private: true, type: "module" }, null, 2),
  "hyperframes.json": JSON.stringify({ $schema: "https://hyperframes.heygen.com/schema/hyperframes.json", paths: { assets: "assets" }, media: { autoProxy: true } }, null, 2),
};
for (const [f, c] of Object.entries(files)) if (!existsSync(join(out, f))) writeFileSync(join(out, f), c);

console.log(`主题 ${theme} · ${beats.length} 段 · 合成 ${W}×${H} · 总长 ${TOTAL}s · ${FULL ? `全屏白底 · 内容放大 ${FULL.scale} 倍` : `贴回原片位置 x=${cfg.safe.x - PAD} y=${cfg.safe.y - PAD}`} · 字体子集 ${(sub.length / 1024).toFixed(0)}KB`);
OUTB.forEach((b) => console.log(`  ${b.id.padEnd(10)} 原片 ${b.at.toFixed(1)}–${(b.at + b.dur).toFixed(1)}s  合成 ${b.start}s  音效 ${b.sfx.length}`));
if (warn.length) { console.log("\n要处理的问题："); warn.forEach((w) => console.log("  - " + w)); }
