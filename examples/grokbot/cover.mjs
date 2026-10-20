// 封面：手写大标题 + 产品 logo + 贴在白板上的一张截图 + 几笔手绘装饰。改顶部 C，然后 node <skill>/scripts/cover/shot.mjs <项目>
// 规矩：标题用用户给的原话；缩到 300px 宽还要能读清；只用一种强调色；截图用真实界面
import { writeFileSync, readFileSync } from "node:fs";
import { R, ICON, W, H, LAND, ACC, INK, pin, logo } from "../engine/lib.mjs";
const C = {
  kicker: "产品介绍",                        // 手写小标签（可空）
  title: ["能把活儿干完的", "<em>AI 队友</em>"], // 两行标题，<em> 里是强调色
  logo: "../assets/logo-grokbot.png",                                 // logo 原件路径（相对 cover/，如 "../assets/logo.png"），可空
  logoInk: true,                            // logo 压成墨色
  shot: "../assets/ui-app.png",                                 // 一张真实截图（相对 cover/），可空
  note: "交代一句，它做完",                                 // 截图旁的手写批注（≤8 字），可空
  shotCrop: false,                          // true 时截图按固定框裁（顶部对齐），默认保持原比例
};
const svg = inner => `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" style="position:absolute;left:0;top:0">${inner}</svg>`;
// 横版：左字右图；竖版：上字下图
const L = LAND ? { x: 110, k: 120, t1: 210, fs: 132, sx: 1010, sy: 250, sw: 800, sh: 560 } : { x: 80, k: 110, t1: 200, fs: 120, sx: 120, sy: 760, sw: 840, sh: 520 };
// 标题按最长一行的字数缩到不压住截图（英文按半个字算）
const len = Math.max(...C.title.map(t => [...t.replace(/<[^>]+>/g, "")].reduce((a, ch) => a + (/[\x00-\x7f]/.test(ch) ? .6 : 1), 0)));
L.fs = Math.min(L.fs, Math.floor((LAND ? L.sx - L.x - 80 : W - 2 * L.x) / len));
const t2 = L.t1 + L.fs * 1.25;
// 截图按原比例时，读 PNG 头拿到真实高度，箭头和批注跟着截图走
if (C.shot && !C.shotCrop) { try { const b = readFileSync(new URL(C.shot, import.meta.url)); if (b.readUInt32BE(12) === 0x49484452) L.sh = Math.round(L.sw * b.readUInt32BE(20) / b.readUInt32BE(16)); } catch {} }
if (LAND) L.sy = Math.max(220, Math.round((H - L.sh) / 2) - 60);
const html = `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="../engine/style.css"><style>:root{--accent:${ACC}}html,body{width:${W}px;height:${H}px}
.t{position:absolute;left:${L.x}px;font-size:${L.fs}px;line-height:1;white-space:nowrap;-webkit-text-stroke:5px currentColor;letter-spacing:2px}</style></head><body>
${svg((C.kicker ? R.ell(L.x + 150, L.k + 30, 380, 110, { color: ACC, w: 5 }) : "") +
  R.under(L.x, t2 + L.fs + 34, L.x + L.fs * len, { w: 9 }) +
  ICON.star(L.x + 40, H - 150, 70, ACC) + R.burst(L.x + 160, H - 120, 40, 5) +
  (C.shot ? R.arrow(LAND ? [[L.sx - 160, L.sy + L.sh + 150], [L.sx - 60, L.sy + L.sh + 160], [L.sx + 20, L.sy + L.sh + 60]] : [[L.sx + 700, L.sy - 140], [L.sx + 760, L.sy - 80], [L.sx + 720, L.sy - 10]], { w: 5, color: INK }) : ""))}
${C.kicker ? `<div class="hand" style="position:absolute;left:${L.x + 40}px;top:${L.k}px;font-size:52px;color:${ACC}">${C.kicker}</div>` : ""}
<div class="t" style="top:${L.t1}px">${C.title[0]}</div>
<div class="t" style="top:${t2}px">${C.title[1].replace(/<em>/g, `<em style="color:${ACC}">`)}</div>
${C.logo ? `<div style="position:absolute;left:${L.x}px;top:${t2 + L.fs + 90}px">${logo(C.logo, LAND ? 96 : 84, { ink: C.logoInk })}</div>` : ""}
${C.shot ? `<div style="position:absolute;left:${L.sx}px;top:${L.sy}px;transform:rotate(${LAND ? 2.5 : -2}deg)">${pin(C.shot, L.sw, C.shotCrop ? L.sh : null)}</div>` : ""}
${C.note ? `<div class="hand" style="position:absolute;left:${LAND ? L.sx + 60 : L.sx + 560}px;top:${LAND ? L.sy + L.sh + 100 : L.sy - 120}px;font-size:54px;color:${ACC};transform:rotate(-4deg)">${C.note}</div>` : ""}
</body></html>`;
writeFileSync(new URL("./cover.html", import.meta.url), html);
