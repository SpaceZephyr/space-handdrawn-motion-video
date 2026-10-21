// 白板手绘组件：rough.js 线稿 + 手写字 + 贴在白板上的截图 + 手绘外壳的真实界面
// 坐标都是整张画布的像素坐标（横版 1920×1080，竖版 1080×1440 等，看 config.json 的 W/H）
import rough from "roughjs/bundled/rough.esm.js";
import { readFileSync } from "node:fs";
import { themeOf } from "./themes.mjs";

export const CFG = (() => { try { return JSON.parse(readFileSync(new URL("../config.json", import.meta.url))); } catch { return {}; } })();
export const W = CFG.W || 1920, H = CFG.H || 1080, LAND = W > H;
export const THEME = themeOf(CFG);  // config.theme：whiteboard | chalkboard | watercolor | blueprint | notebook | kraft | comic | cork | inkwash | neon
export const INK = THEME.ink, ACC = CFG.accent || THEME.accent, GRAY = THEME.gray, PAPER = THEME.paper;
export const BLUE = ACC; // 兼容旧写法
const gen = rough.generator();
let seed = 7;

// 动画属性：at 绝对秒；fx = write|draw|wipe|up|fade|pop|type|count|ripple|none；out 绝对秒（淡出）；kf 关键帧 [[t,{x,y,s,r,o}]]
// pen: false 时这一笔不出现马克笔
export function A({ at = 0, fx = "up", d, out, kf, cls = "", pen } = {}) {
  let s = `class="a ${cls}" data-at="${(+at).toFixed(3)}" data-fx="${fx}"`;
  if (d != null) s += ` data-d="${d}"`;
  if (out != null) s += ` data-out="${(+out).toFixed(3)}"`;
  if (pen === false) s += ` data-nopen="1"`;
  if (kf) s += ` data-kf='${JSON.stringify(kf.map(([t, v]) => [+(+t).toFixed(3), v]))}'`;
  return s;
}

// 马克笔质感：线条加粗、圆头，roughness/bowing 比默认更抖
const paths = (dr, color, w) => gen.toPaths(dr).map(p =>
  `<path pathLength="1" d="${p.d}" stroke="${p.stroke === "none" ? "none" : color}" stroke-width="${(w > 0 && w < 12 ? w * 1.45 : w) * THEME.sw}" stroke-linecap="round" stroke-linejoin="round" fill="${p.fill && p.fill !== "none" ? p.fill : "none"}" ${p.fill && p.fill !== "none" ? 'class="fillp"' : ""}/>`).join("");
const o = (x = {}) => { const r = { roughness: 1.3, bowing: 1.2, seed: seed++, strokeWidth: 3, ...x }; r.roughness *= 1.35 * THEME.rough; r.bowing *= 1.4 * THEME.rough; return r; };

// 线稿形状：返回 path 串，拼好后用 sk() 包成一层
export const R = {
  rect: (x, y, w, h, opt = {}) => paths(gen.rectangle(x, y, w, h, o(opt)), opt.color || INK, opt.w || 3) + tint(x + w / 2, y + h / 2, w, h, opt),
  fillRect: (x, y, w, h, color = ACC, opt = {}) => paths(gen.rectangle(x, y, w, h, o({ fill: color, fillStyle: "solid", stroke: "none", ...opt })), color, 0),
  // 斜线涂满（手绘的「涂色」），color 默认强调色
  hatch: (x, y, w, h, color = ACC, opt = {}) => paths(gen.rectangle(x, y, w, h, o({ fill: color, fillStyle: "hachure", hachureGap: opt.gap || 14, fillWeight: opt.fw || 3, stroke: "none", ...opt })), color, opt.fw || 3),
  ell: (cx, cy, w, h, opt = {}) => paths(gen.ellipse(cx, cy, w, h, o({ roughness: 1.6, ...opt })), opt.color || INK, opt.w || 3) + tint(cx, cy, w, h, opt),
  fillEll: (cx, cy, w, h, color = ACC) => paths(gen.ellipse(cx, cy, w, h, o({ fill: color, fillStyle: "solid", stroke: "none" })), color, 0),
  line: (x1, y1, x2, y2, opt = {}) => paths(gen.line(x1, y1, x2, y2, o(opt)), opt.color || INK, opt.w || 3),
  curve: (pts, opt = {}) => paths(gen.curve(pts, o({ roughness: 0.9, ...opt })), opt.color || INK, opt.w || 3),
  poly: (pts, opt = {}) => paths(gen.linearPath(pts, o(opt)), opt.color || INK, opt.w || 3),
  // 弯箭头：pts 至少 2 个点，箭头画在最后一段
  arrow: (pts, opt = {}) => {
    const c = opt.color || INK, w = opt.w || 3;
    const body = pts.length > 2 ? gen.curve(pts, o({ roughness: 0.8, ...opt })) : gen.line(...pts[0], ...pts[1], o({ roughness: 0.8, ...opt }));
    const [a, b] = [pts[pts.length - 2], pts[pts.length - 1]];
    const ang = Math.atan2(b[1] - a[1], b[0] - a[0]), L = opt.head || 24;
    const h1 = [b[0] - L * Math.cos(ang - 0.45), b[1] - L * Math.sin(ang - 0.45)];
    const h2 = [b[0] - L * Math.cos(ang + 0.45), b[1] - L * Math.sin(ang + 0.45)];
    return paths(body, c, w) + paths(gen.linearPath([h1, b, h2], o({ roughness: 0.6 })), c, w);
  },
  check: (x, y, s = 1, opt = {}) => paths(gen.linearPath([[x, y], [x + 12 * s, y + 13 * s], [x + 34 * s, y - 16 * s]], o({ roughness: 0.6, ...opt })), opt.color || ACC, opt.w || 5),
  cross: (x, y, s = 40, opt = {}) => paths(gen.line(x - s, y - s, x + s, y + s, o(opt)), opt.color || INK, opt.w || 4) + paths(gen.line(x + s, y - s, x - s, y + s, o(opt)), opt.color || INK, opt.w || 4),
  // 标注（rough-notation 的几种）：荧光笔、双笔下划线、圈框、圈圈
  mark: (x1, y1, x2, y2, opt = {}) => paths(gen.line(x1, y1, x2, y2, o({ roughness: .8, bowing: .6, ...opt })), opt.color || hexA(ACC, .22), opt.w || 30),
  under: (x1, y, x2, opt = {}) => paths(gen.line(x1, y, x2, y + 2, o({ roughness: 1, ...opt })), opt.color || ACC, opt.w || 4) + paths(gen.line(x1 + 8, y + 9, x2 - 6, y + 7, o({ roughness: 1, ...opt })), opt.color || ACC, (opt.w || 4) * .8),
  boxAround: (x, y, w, h, opt = {}) => paths(gen.rectangle(x, y, w, h, o({ roughness: 1.8, ...opt })), opt.color || ACC, opt.w || 3.5) + paths(gen.rectangle(x - 4, y + 3, w + 6, h - 4, o({ roughness: 2, ...opt })), opt.color || ACC, (opt.w || 3.5) * .7),
  circle: (cx, cy, w, h, opt = {}) => paths(gen.ellipse(cx, cy, w, h, o({ roughness: 1.4, ...opt })), opt.color || ACC, opt.w || 4) + paths(gen.ellipse(cx + 4, cy - 3, w * 1.04, h * .96, o({ roughness: 1.8, ...opt })), opt.color || ACC, (opt.w || 4) * .7),
  // 水彩色块：一个边缘坑坑洼洼的形状叠 layers 层，每层透明度很低，中间深边缘浅（fx:"draw" 时一层层晕上去）
  wash: (cx, cy, w, h, color = ACC, { layers = 7, op = .17, seed: sd = seed++ } = {}) => {
    let st = sd * 9301 + 49297; const rnd = () => (st = (st * 9301 + 49297) % 233280) / 233280;
    const base = Array.from({ length: 10 }, (_, i) => { const a = i / 10 * Math.PI * 2; return [Math.cos(a) * w / 2, Math.sin(a) * h / 2]; });
    const deform = (pts, k, amt) => k ? deform(pts.flatMap((p, i) => { const q = pts[(i + 1) % pts.length], m = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2], d = Math.hypot(q[0] - p[0], q[1] - p[1]) * amt; return [p, [m[0] + (rnd() - .5) * d, m[1] + (rnd() - .5) * d]]; }), k - 1, amt * .8) : pts;
    const core = deform(base, 2, .5);
    return Array.from({ length: layers }, () => { const pts = deform(core, 2, .45); return `<path class="fillp" d="M${pts.map(([x, y]) => `${(cx + x).toFixed(1)} ${(cy + y).toFixed(1)}`).join("L")}Z" fill="${color}" fill-opacity="${op}" stroke="none"/>`; }).join("");
  },
  // 速度线 / 强调线：在 (cx,cy) 周围放射几笔
  burst: (cx, cy, r = 70, n = 6, opt = {}) => Array.from({ length: n }, (_, i) => { const a = -Math.PI / 2 + (i - (n - 1) / 2) * .45; return paths(gen.line(cx + r * Math.cos(a), cy + r * Math.sin(a), cx + (r + 34) * Math.cos(a), cy + (r + 34) * Math.sin(a), o({ roughness: .7, ...opt })), opt.color || ACC, opt.w || 4); }).join(""),
};
// 水彩/水墨风格：框和圈画完后自动晕一层淡彩（颜色轮换），opt.wash: false 关掉，opt.wash: "#色值" 指定颜色
// 有 tint 的风格（水彩、水墨）才晕：颜色在 THEME.tint 里轮换
let pal = 0;
function tint(cx, cy, w, h, opt) {
  if (!THEME.tint || opt.wash === false || w < 24 || h < 24) return "";
  return R.wash(cx + 4, cy + 5, w * 1.04, h * 1.08, typeof opt.wash === "string" ? opt.wash : THEME.tint[pal++ % THEME.tint.length], { layers: 6, op: THEME.tintOp || .075 });
}
function hexA(hex, a) { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; }

// 线稿图标（以 cx,cy 为中心，约 s 大小）
const ln = (c, w) => ({ color: c, w });
export const ICON = {
  bulb: (cx, cy, s = 80, c = INK) => R.ell(cx, cy - s * .12, s * .72, s * .72, { color: c }) + R.line(cx - s * .16, cy + s * .3, cx + s * .16, cy + s * .3, { color: c }) + R.line(cx - s * .12, cy + s * .42, cx + s * .12, cy + s * .42, { color: c }),
  doc: (cx, cy, s = 80, c = INK) => R.poly([[cx - s * .34, cy - s * .44], [cx + s * .14, cy - s * .44], [cx + s * .34, cy - s * .24], [cx + s * .34, cy + s * .44], [cx - s * .34, cy + s * .44], [cx - s * .34, cy - s * .44]], { color: c }) + R.line(cx - s * .2, cy - s * .08, cx + s * .2, cy - s * .08, ln(c, 2.5)) + R.line(cx - s * .2, cy + s * .08, cx + s * .2, cy + s * .08, ln(c, 2.5)) + R.line(cx - s * .2, cy + s * .24, cx + s * .08, cy + s * .24, ln(c, 2.5)),
  mail: (cx, cy, s = 80, c = INK) => R.rect(cx - s * .46, cy - s * .32, s * .92, s * .64, { color: c }) + R.poly([[cx - s * .46, cy - s * .3], [cx, cy + s * .06], [cx + s * .46, cy - s * .3]], ln(c, 2.5)),
  chat: (cx, cy, s = 80, c = INK) => R.curve([[cx - s * .3, cy + s * .34], [cx - s * .26, cy + s * .2], [cx - s * .46, cy + s * .04], [cx - s * .4, cy - s * .3], [cx, cy - s * .4], [cx + s * .42, cy - s * .28], [cx + s * .44, cy + s * .08], [cx + s * .1, cy + s * .24], [cx - s * .08, cy + s * .22], [cx - s * .3, cy + s * .34]], { color: c }),
  user: (cx, cy, s = 80, c = INK) => R.ell(cx, cy - s * .18, s * .4, s * .4, { color: c }) + R.curve([[cx - s * .4, cy + s * .44], [cx - s * .3, cy + s * .12], [cx, cy + s * .06], [cx + s * .3, cy + s * .12], [cx + s * .4, cy + s * .44]], { color: c }),
  bot: (cx, cy, s = 80, c = INK) => R.rect(cx - s * .4, cy - s * .26, s * .8, s * .62, { color: c }) + R.ell(cx - s * .16, cy + s * .02, s * .14, s * .14, { color: c, w: 3.5 }) + R.ell(cx + s * .16, cy + s * .02, s * .14, s * .14, { color: c, w: 3.5 }) + R.line(cx, cy - s * .26, cx, cy - s * .42, { color: c }) + R.ell(cx, cy - s * .46, s * .1, s * .1, { color: c }),
  laptop: (cx, cy, s = 80, c = INK) => R.rect(cx - s * .38, cy - s * .34, s * .76, s * .5, { color: c }) + R.poly([[cx - s * .5, cy + s * .3], [cx - s * .42, cy + s * .18], [cx + s * .42, cy + s * .18], [cx + s * .5, cy + s * .3], [cx - s * .5, cy + s * .3]], { color: c }),
  phone: (cx, cy, s = 80, c = INK) => R.rect(cx - s * .24, cy - s * .44, s * .48, s * .88, { color: c }) + R.line(cx - s * .06, cy + s * .34, cx + s * .06, cy + s * .34, ln(c, 3)),
  cloud: (cx, cy, s = 100, c = INK) => R.curve([[cx - s * .4, cy + s * .2], [cx - s * .5, cy], [cx - s * .32, cy - s * .16], [cx - s * .14, cy - s * .3], [cx + s * .1, cy - s * .26], [cx + s * .3, cy - s * .12], [cx + s * .5, cy + s * .02], [cx + s * .4, cy + s * .2], [cx - s * .4, cy + s * .2]], { color: c }),
  clock: (cx, cy, s = 80, c = INK) => R.ell(cx, cy, s, s, { color: c }) + R.line(cx, cy, cx, cy - s * .32, { color: c }) + R.line(cx, cy, cx + s * .22, cy + s * .08, { color: c }),
  moon: (cx, cy, s = 80, c = INK) => R.curve([[cx + s * .1, cy - s * .44], [cx - s * .34, cy - s * .3], [cx - s * .4, cy + s * .14], [cx - s * .06, cy + s * .44], [cx + s * .38, cy + s * .26], [cx + s * .02, cy + s * .14], [cx - s * .08, cy - s * .2], [cx + s * .1, cy - s * .44]], { color: c }),
  gear: (cx, cy, s = 80, c = INK) => R.ell(cx, cy, s * .62, s * .62, { color: c }) + R.ell(cx, cy, s * .22, s * .22, { color: c }) + Array.from({ length: 8 }, (_, i) => { const a = i * Math.PI / 4; return R.line(cx + s * .31 * Math.cos(a), cy + s * .31 * Math.sin(a), cx + s * .46 * Math.cos(a), cy + s * .46 * Math.sin(a), { color: c, w: 4 }); }).join(""),
  bug: (cx, cy, s = 80, c = INK) => R.ell(cx, cy + s * .06, s * .5, s * .66, { color: c }) + R.line(cx, cy - s * .26, cx, cy + s * .38, ln(c, 2.5)) + [-1, 1].map(k => R.line(cx + k * s * .24, cy - s * .04, cx + k * s * .44, cy - s * .14, { color: c }) + R.line(cx + k * s * .25, cy + s * .2, cx + k * s * .44, cy + s * .3, { color: c })).join(""),
  coin: (cx, cy, s = 80, c = INK) => R.ell(cx, cy, s * .8, s * .8, { color: c }) + R.line(cx - s * .14, cy - s * .16, cx + s * .14, cy - s * .16, ln(c, 3)) + R.line(cx, cy - s * .2, cx, cy + s * .22, ln(c, 3)) + R.line(cx - s * .14, cy + s * .02, cx + s * .14, cy + s * .02, ln(c, 3)),
  star: (cx, cy, s = 80, c = INK) => R.poly(Array.from({ length: 11 }, (_, i) => { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? s * .2 : s * .46; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; }), { color: c }),
  lock: (cx, cy, s = 60, c = INK) => R.rect(cx - s * .36, cy - s * .06, s * .72, s * .54, { color: c }) + R.curve([[cx - s * .22, cy - s * .06], [cx - s * .22, cy - s * .34], [cx, cy - s * .46], [cx + s * .22, cy - s * .34], [cx + s * .22, cy - s * .06]], { color: c }),
  globe: (cx, cy, s = 80, c = INK) => R.ell(cx, cy, s * .86, s * .86, { color: c }) + R.ell(cx, cy, s * .38, s * .86, ln(c, 2.5)) + R.line(cx - s * .43, cy, cx + s * .43, cy, ln(c, 2.5)),
  code: (cx, cy, s = 80, c = INK) => R.poly([[cx - s * .18, cy - s * .28], [cx - s * .44, cy], [cx - s * .18, cy + s * .28]], { color: c }) + R.poly([[cx + s * .18, cy - s * .28], [cx + s * .44, cy], [cx + s * .18, cy + s * .28]], { color: c }) + R.line(cx + s * .08, cy - s * .36, cx - s * .08, cy + s * .36, { color: c }),
  chart: (cx, cy, s = 80, c = INK) => R.poly([[cx - s * .44, cy - s * .44], [cx - s * .44, cy + s * .4], [cx + s * .46, cy + s * .4]], { color: c }) + R.line(cx - s * .24, cy + s * .3, cx - s * .24, cy + s * .02, { color: c, w: 6 }) + R.line(cx, cy + s * .3, cx, cy - s * .16, { color: c, w: 6 }) + R.line(cx + s * .24, cy + s * .3, cx + s * .24, cy - s * .32, { color: c, w: 6 }),
  folder: (cx, cy, s = 100, c = INK) => R.poly([[cx - s * .5, cy - s * .3], [cx - s * .14, cy - s * .3], [cx - s * .04, cy - s * .2], [cx + s * .5, cy - s * .2], [cx + s * .5, cy + s * .34], [cx - s * .5, cy + s * .34], [cx - s * .5, cy - s * .3]], { color: c }),
};

// 一层线稿：整张画布大小的 svg，按 path 顺序画出
export const sk = (inner, a = "") => `<svg ${a} viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" style="position:absolute;left:0;top:0;overflow:visible">${inner}</svg>`;
// 手写字：size 字号（要套在内层 span 上，.hand 自带字号会盖掉外层）
export const hand = (x, y, text, a, { size, color, st = "", cls = "" } = {}) =>
  `<div ${a} style="position:absolute;left:${x}px;top:${y}px;${st}"><span class="hand ${cls}" style="${size ? `font-size:${size}px;` : ""}${color ? `color:${color};` : ""}">${text}</span></div>`;
// 写出来的手写字：等于 hand + fx write
export const write = (x, y, text, at, opt = {}) => hand(x, y, text, A({ at, fx: "write", d: opt.d, out: opt.out, cls: opt.acls }), opt);
// 绝对定位盒子
export const box = (x, y, w, h, inner, a = "", st = "") => `<div ${a} style="position:absolute;left:${x}px;top:${y}px;width:${w}px;${h ? `height:${h}px;` : ""}${st}">${inner}</div>`;

// 场景标题：角标擦出来，标题一个字一个字写出来。title 里可以用 <em>重点</em>
export const head = (c, kicker, title, { n, at = c.t(.05) } = {}) =>
  (kicker ? `<div ${A({ at, fx: "wipe", d: .6, cls: "tag", pen: false })}>${n ? `<b>${n}</b>` : ""}${kicker}</div>` : "") +
  `<div ${A({ at: at + .1, fx: "write", d: Math.min(1.6, .09 * title.replace(/<[^>]+>/g, "").length) })}><div class="title">${title}</div></div>`;

// ---- 贴在白板上的素材 ----
export const tape = (x, y, r = -8, w = 110) => `<div style="position:absolute;left:${x}px;top:${y}px;width:${w}px;height:32px;background:rgba(236,226,196,.85);transform:rotate(${r}deg);box-shadow:0 1px 2px rgba(0,0,0,.08);z-index:3"></div>`;
// 截图：手绘细边框 + 两条胶带。fit=cover 时按 pos 裁
export const pin = (src, w, h, { fit = "cover", pos = "top", tapes = true, bg = "var(--card)" } = {}) =>
  `<div style="position:relative;width:${w}px;${h ? `height:${h}px;` : ""}"><div class="shot" style="width:100%;${h ? "height:100%;" : ""}background:${bg}"><img src="${src}" style="width:100%;${h ? `height:100%;object-fit:${fit};object-position:${pos};` : ""}display:block"></div>${tapes ? tape(-30, -12, -24, 100) + tape(w - 70, -10, 18, 100) : ""}</div>`;
// 视频片段：贴在白板上的一段视频，at 秒开始播（rate 倍速，from 从片段第几秒起），播完停在最后一帧；loop 循环
// 片段先用 scripts/assets/clip.sh 裁好、转成全关键帧 mp4，逐帧渲染时才能精确拨到每一帧
export const clip = (src, w, h, { at = 0, rate = 1, from = 0, loop = false, fit = "cover", pos = "center", tapes = true, bg = "#111", label } = {}) =>
  `<div style="position:relative;width:${w}px;height:${h}px"><div class="shot" style="width:100%;height:100%;background:${bg}"><video class="vclip" src="${src}" muted playsinline preload="auto" data-at="${(+at).toFixed(3)}" data-rate="${rate}" data-from="${from}"${loop ? ' data-loop="1"' : ""} style="width:100%;height:100%;object-fit:${fit};object-position:${pos};display:block"></video></div>${tapes ? tape(-30, -12, -24, 100) + tape(w - 70, -10, 18, 100) : ""}${label ? `<div class="clip-src">${label}</div>` : ""}</div>`;
// 截图局部放大：从 src 里取 [x0,y0,x1,y1]（0–1 比例）这块，画在 w×h 的圆框里（像放大镜）
export const lens = (src, [x0, y0, x1, y1], d) => { const sw = d / (x1 - x0), sh = d / (y1 - y0); return `<div style="width:${d}px;height:${d}px;border-radius:50%;overflow:hidden;border:4px solid ${INK};background:var(--card);position:relative"><img src="${src}" style="position:absolute;width:${sw}px;height:${sh}px;left:${-x0 * sw}px;top:${-y0 * sh}px;max-width:none"></div>`; };
// logo 原件（透明底 PNG/SVG），ink=true 时压成墨色单色，和手绘线条统一
export const logo = (src, h, { ink = false } = {}) => `<img src="${src}" style="height:${h}px;display:block;${ink ? "filter:brightness(0) saturate(100%);opacity:.92;" : ""}">`;
// 便利贴
export const note = (x, y, w, text, a, { r = -3, color = "#FFF3A8", size = 32 } = {}) => `<div ${a} style="position:absolute;left:${x}px;top:${y}px;width:${w}px;"><div class="note" style="position:relative;background:${color};transform:rotate(${r}deg);font-size:${size}px">${text}</div></div>`;

// ---- 手绘外壳的真实界面 ----
export const phone = (inner, st = "") => `<div class="phone" style="${st}"><div class="ph-sb"><span>9:41</span><i></i></div><div class="ph-in">${inner}</div></div>`;
export const browser = (url, inner, st = "") => `<div class="win" style="${st}"><div class="win-bar"><i></i><i></i><i></i><div class="win-url">${url}</div></div><div class="win-in">${inner}</div></div>`;
export const cursor = (a) => `<svg ${a} width="44" height="44" viewBox="0 0 24 24" style="position:absolute;left:0;top:0;z-index:30"><path d="M4 2 L4 19 L8.5 15 L11.5 21.5 L14 20.5 L11 14 L17 14 Z" fill="#fff" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/></svg>`;
export const tap = (x, y, at) => `<div ${A({ at, fx: "ripple", d: 0.6 })} style="position:absolute;left:${x - 40}px;top:${y - 40}px;width:80px;height:80px;border-radius:50%;border:4px solid ${ACC}"></div>`;
