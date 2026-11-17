// 手绘组件库：rough.js 在 Node 里生成抖动线稿（seed 固定，每次构建结果一样），
// 每个组件返回 { id, html, anims }，build.mjs 把它们拼进卡片并编进 GSAP 时间轴。
// 坐标系：卡片内部，左上角 (0,0)，宽高 = beats.mjs 里 safe.w × safe.h。
import rough from "roughjs/bundled/rough.esm.js";
import { THEMES } from "./themes.mjs";

const gen = rough.generator();
export const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
export const hexA = (hex, a) => { const h = hex.replace("#", ""); const n = parseInt(h.length === 3 ? h.replace(/./g, "$&$&") : h, 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
// 估算一行字宽（CJK 1em，ASCII 0.56em），用来给标题下划线、居中定位
export const textW = (s, size) => [...String(s)].reduce((w, c) => w + (c.charCodeAt(0) > 0x2e80 ? 1 : c === " " ? 0.32 : 0.56), 0) * size;

// ---- 采样 rough 的 ops，得到每条 path 的长度和笔尖经过的点（pen 跟随用，不依赖浏览器排版） ----
function sampleSet(set) {
  // 点的第三位 1 表示这是一次提笔（move），runtime 里这段距离记 0，笔直接跳过去
  const pts = []; let cur = [0, 0], L = 0;
  const go = (p, jump) => { if (!jump) L += Math.hypot(p[0] - cur[0], p[1] - cur[1]); cur = p; pts.push(jump ? [+p[0].toFixed(1), +p[1].toFixed(1), 1] : [+p[0].toFixed(1), +p[1].toFixed(1)]); };
  for (const { op, data } of set.ops) {
    if (op === "move") go(data, true);
    else if (op === "lineTo") go(data);
    else if (op === "bcurveTo") {
      const [x1, y1, x2, y2, x, y] = data, [x0, y0] = cur;
      for (let k = 1; k <= 8; k++) { const t = k / 8, u = 1 - t; go([u * u * u * x0 + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x, u * u * u * y0 + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y]); }
    }
  }
  return { pts, L: Math.max(1, +L.toFixed(1)) };
}
// 稀疏化：笔尖轨迹每段最多 48 个点，提笔点全部保留
const thin = (pts, max = 48) => { if (pts.length <= max) return pts; const k = Math.ceil(pts.length / max); return pts.filter((p, i) => p[2] || i % k === 0 || i === pts.length - 1); };

export function makeKit(ctx) {
  // ctx: { W, H, theme, accent, beatId, assets: Map }
  const T = { ...THEMES[ctx.theme] || THEMES.whiteboard };
  const INK = T.ink, GRAY = T.gray, ACC = ctx.accent || T.accent;
  // 字宽：build.mjs 用 harfbuzz 量好每个字的真实宽度（em）传进来；没有就按估算
  const adv = (c) => ctx.adv ? ctx.adv(c) : (c.charCodeAt(0) > 0x2e80 ? 1 : c === " " ? 0.32 : 0.56);
  const tw = (str, size) => [...String(str)].reduce((w, c) => w + adv(c), 0) * size;
  let seed = 1 + [...ctx.beatId].reduce((a, c) => a * 31 + c.charCodeAt(0), 7) % 9000, auto = 0;
  const nid = (id) => `${ctx.beatId}-${id || "e" + ++auto}`;
  const ro = (o = {}) => ({ roughness: (o.roughness ?? 1.2) * T.rough, bowing: (o.bowing ?? 1) * T.rough, seed: seed++, strokeWidth: (o.w ?? 4) * T.sw, ...(o.fill ? { fill: o.fill, fillStyle: o.fillStyle || "hachure", hachureGap: o.gap ?? 14 * T.sw, fillWeight: o.fillWeight ?? 2.6 * T.sw, hachureAngle: o.angle ?? -41 } : {}) });

  // drawable → <path>（轮廓先画，填充排线后画），同时记下长度和笔尖轨迹
  function ink(drawables, color, opt = {}) {
    let html = ""; const segs = [];
    const all = [].concat(drawables);
    const outline = [], fills = [];
    for (const dr of all) for (const set of dr.sets) (set.type === "path" ? outline : fills).push([dr, set]);
    for (const [dr, set] of [...outline, ...fills]) {
      const d = gen.opsToPath(set, 2);
      if (set.type === "fillPath") { html += `<path class="fillp" d="${d}" fill="${dr.options.fill}" stroke="none"/>`; continue; }
      const isFill = set.type === "fillSketch";
      const sw = isFill ? dr.options.fillWeight : dr.options.strokeWidth;
      const col = isFill ? dr.options.fill : color;
      const s = sampleSet(set);
      segs.push({ L: s.L, p: thin(s.pts) });
      html += `<path d="${d}" fill="none" stroke="${col}" stroke-width="${(+sw).toFixed(2)}" stroke-linecap="round" stroke-linejoin="round"${opt.op ? ` opacity="${opt.op}"` : ""}/>`;
    }
    return { html, segs };
  }
  const svg = (id, inner, cls = "ink") => `<svg id="${id}" class="${cls}" width="${ctx.W}" height="${ctx.H}" viewBox="0 0 ${ctx.W} ${ctx.H}">${inner}</svg>`;
  const drawEl = (o, drawables, color, defD, cls) => { const id = nid(o.id); const r = ink(drawables, color, o); return { id, uid: o.id, html: svg(id, r.html, cls), anims: [{ kind: "draw", sel: "#" + id, t: o.t, d: o.d ?? defD, pen: o.pen !== false, segs: r.segs }] }; };

  // ---- 文字 ----
  function text(x, y, str, o = {}) {
    const id = nid(o.id), size = o.size || 40, fx = o.fx || "write";
    const align = o.align || "left", lh = size * (o.lh || 1.28);
    const boxW = o.w || (align === "left" ? null : tw(str, size) + 20);
    let left = x; if (align === "center") left = x - boxW / 2; if (align === "right") left = x - boxW;
    // 按真实字宽排行，算出每个字的位置：笔尖从字左边走到右边（不在浏览器里量，seek 到哪一帧都一样）
    const lines = [[]]; let lw = 0;
    for (const c of String(str)) {
      if (c === "\n") { lines.push([]); lw = 0; continue; }
      const a = adv(c) * size;
      if (boxW && lw + a > boxW + 0.5 && lines[lines.length - 1].length) { lines.push([]); lw = 0; }
      lines[lines.length - 1].push([c, lw, a]); lw += a;
    }
    const cp = [];
    lines.forEach((ln, li) => {
      const w = ln.reduce((s, q) => s + q[2], 0);
      const ox = left + (align === "center" ? (boxW - w) / 2 : align === "right" ? boxW - w : 0);
      ln.forEach(([, x0, a]) => cp.push([+(ox + x0).toFixed(1), +(ox + x0 + a).toFixed(1), +(y + li * lh + lh * 0.8).toFixed(1)]));
    });
    const chars = [...String(str)].map((c) => c === "\n" ? "<br>" : `<span class="ch">${c === " " ? "&nbsp;" : esc(c)}</span>`).join("");
    const style = `left:${left.toFixed(0)}px;top:${y}px;font-size:${size}px;line-height:${(o.lh || 1.28)};color:${o.color || INK};${boxW ? `width:${boxW.toFixed(0)}px;` : "white-space:nowrap;"}text-align:${align};${o.weight ? `font-weight:${o.weight};` : ""}`;
    const n = cp.length;
    const d = o.d ?? Math.min(2.6, Math.max(0.45, n * 0.085));
    return { id, uid: o.id, html: `<div id="${id}" class="hd-text" style="${style}">${fx === "write" ? chars : esc(str).replace(/\n/g, "<br>")}</div>`, anims: [{ kind: fx, sel: "#" + id, t: o.t, d: fx === "write" ? d : (o.d ?? 0.5), pen: fx === "write" && o.pen !== false, ...(fx === "write" ? { cp } : {}) }] };
  }

  // ---- 线框类 ----
  function box(x, y, w, h, o = {}) {
    const c = o.color || INK;
    const dr = gen.rectangle(x, y, w, h, ro({ roughness: 1.3, ...o, fill: o.fill === "hatch" ? hexA(o.fillColor || ACC, 0.55) : o.fill === "solid" ? (o.fillColor || hexA(ACC, 0.16)) : undefined, fillStyle: o.fill === "solid" ? "solid" : "hachure" }));
    const el = drawEl(o, dr, c, o.d ?? 0.8);
    if (!o.label) return el;
    const ls = o.labelSize || 40;
    const lab = text(x + w / 2, y + h / 2 - ls * 0.62, o.label, { size: ls, align: "center", w: w - 20, color: o.labelColor || INK, t: o.labelT, d: o.labelD, id: o.id ? o.id + "-l" : undefined, pen: o.pen });
    lab.after = el; return [el, lab];
  }
  function ellipse(cx, cy, w, h, o = {}) {
    const dr = gen.ellipse(cx, cy, w, h, ro({ roughness: 1.4, ...o, fill: o.fill === "hatch" ? hexA(o.fillColor || ACC, 0.55) : o.fill === "solid" ? (o.fillColor || hexA(ACC, 0.16)) : undefined, fillStyle: o.fill === "solid" ? "solid" : "hachure" }));
    const el = drawEl(o, dr, o.color || INK, o.d ?? 0.8);
    if (!o.label) return el;
    const ls = o.labelSize || 40;
    const lab = text(cx, cy - ls * 0.62, o.label, { size: ls, align: "center", w: w - 24, color: o.labelColor || INK, id: o.id ? o.id + "-l" : undefined, pen: o.pen });
    lab.after = el; return [el, lab];
  }
  function line(pts, o = {}) {
    const dr = pts.length > 2 ? gen.curve(pts, ro({ roughness: 0.8, ...o })) : gen.line(...pts[0], ...pts[1], ro({ roughness: 0.8, ...o }));
    return drawEl(o, dr, o.color || INK, o.d ?? 0.5);
  }
  // 手绘弧形箭头：bend>0 往左弯，<0 往右弯，0 是直线
  function arrow(a, b, o = {}) {
    const bend = o.bend ?? 0.12, len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const nx = -(b[1] - a[1]) / len, ny = (b[0] - a[0]) / len;
    const c = [(a[0] + b[0]) / 2 + nx * bend * len, (a[1] + b[1]) / 2 + ny * bend * len];
    const body = bend ? gen.curve([a, c, b], ro({ roughness: 0.7, ...o })) : gen.line(...a, ...b, ro({ roughness: 0.7, ...o }));
    const ang = Math.atan2(b[1] - c[1], b[0] - c[0]), hs = o.head || 26;
    const h1 = [b[0] - hs * Math.cos(ang - 0.45), b[1] - hs * Math.sin(ang - 0.45)], h2 = [b[0] - hs * Math.cos(ang + 0.45), b[1] - hs * Math.sin(ang + 0.45)];
    const head = gen.linearPath([h1, b, h2], ro({ roughness: 0.5, ...o }));
    return drawEl(o, [body, head], o.color || INK, o.d ?? 0.6);
  }

  // ---- 标注（强调色） ----
  const circle = (cx, cy, w, h, o = {}) => drawEl(o, [gen.ellipse(cx, cy, w, h, ro({ roughness: 1.5, w: 4.5, ...o })), gen.ellipse(cx + 5, cy - 3, w * 1.04, h * 0.95, ro({ roughness: 1.9, w: 3, ...o }))], o.color || ACC, o.d ?? 0.7);
  const under = (x, y, w, o = {}) => drawEl(o, [gen.line(x, y, x + w, y + 2, ro({ roughness: 1, w: 4.5, ...o })), gen.line(x + 10, y + 11, x + w - 8, y + 9, ro({ roughness: 1, w: 3.4, ...o }))], o.color || ACC, o.d ?? 0.45);
  // 荧光笔：放在文字下层，宽 30px 的半透明强调色
  const mark = (x, y, w, o = {}) => drawEl({ pen: false, ...o }, gen.line(x, y, x + w, y + 1, ro({ roughness: 0.7, bowing: 0.5, w: o.h || 34, ...o })), o.color || hexA(ACC, 0.3), o.d ?? 0.45, "ink mk");
  const check = (x, y, o = {}) => { const s = o.s || 1; return drawEl(o, gen.linearPath([[x, y], [x + 14 * s, y + 16 * s], [x + 42 * s, y - 20 * s]], ro({ roughness: 0.6, w: 6, ...o })), o.color || ACC, o.d ?? 0.35); };
  const cross = (x, y, o = {}) => { const s = (o.s || 1) * 18; return drawEl(o, [gen.line(x - s, y - s, x + s, y + s, ro({ roughness: 0.6, w: 6, ...o })), gen.line(x + s, y - s, x - s, y + s, ro({ roughness: 0.6, w: 6, ...o }))], o.color || "#D7263D", o.d ?? 0.35); };
  const hatch = (x, y, w, h, o = {}) => drawEl({ pen: false, ...o }, gen.rectangle(x, y, w, h, ro({ ...o, stroke: "none", fill: o.color || hexA(ACC, 0.45), gap: o.gap ?? 12 })), "none", o.d ?? 0.6);

  // ---- 手绘图标：100×100 网格里的路径，按 size 缩放 ----
  function icon(name, cx, cy, o = {}) {
    const def = ICONS[name]; if (!def) throw new Error(`没有这个图标: ${name}，可用：${Object.keys(ICONS).join(" ")}`);
    const s = (o.size || 120) / 100, ox = cx - 50 * s, oy = cy - 50 * s, c = o.color || INK;
    const drs = def.map(([k, ...a]) => k === "p" ? gen.path(scalePath(a[0], s, ox, oy), ro({ roughness: 0.9, w: o.w ?? 4, ...(a[1] && o.fill !== false ? { fill: hexA(o.fillColor || ACC, 0.5) } : {}) })) : gen.ellipse(ox + a[0] * s, oy + a[1] * s, a[2] * s, a[3] * s, ro({ roughness: 1, w: o.w ?? 4, ...(a[4] && o.fill !== false ? { fill: hexA(o.fillColor || ACC, 0.5) } : {}) })));
    const el = drawEl(o, drs, c, o.d ?? 0.9);
    if (!o.label) return el;
    const ls = o.labelSize || 34;
    const lab = text(cx, cy + 50 * s + 14, o.label, { size: ls, align: "center", w: Math.max(240, tw(o.label, ls) + 30), color: o.labelColor || INK, id: o.id ? o.id + "-l" : undefined, pen: o.pen });
    lab.after = el; return [el, lab];
  }

  // ---- 贴上去的东西 ----
  function note(x, y, str, o = {}) {
    const id = nid(o.id), w = o.w || 300, rot = o.rot ?? -3;
    const bg = o.bg || T.note;
    return { id, uid: o.id, html: `<div id="${id}" class="hd-note" style="left:${x}px;top:${y}px;width:${w}px;background:${bg};font-size:${o.size || 36}px;color:${o.color || "#2b2620"}">${esc(str).replace(/\n/g, "<br>")}</div>`, anims: [{ kind: "paste", sel: "#" + id, t: o.t, d: o.d ?? 0.45, rot }] };
  }
  function img(src, x, y, w, o = {}) {
    const id = nid(o.id), rot = o.rot ?? 2, name = ctx.asset(src);
    const tapes = o.tape === false ? "" : `<i class="tp a"></i><i class="tp b"></i>`;
    return { id, uid: o.id, html: `<div id="${id}" class="hd-img" style="left:${x}px;top:${y}px;width:${w}px">${tapes}<img src="assets/${name}" style="width:100%;display:block"/>${o.caption ? `<div class="cap">${esc(o.caption)}</div>` : ""}</div>`, anims: [{ kind: "paste", sel: "#" + id, t: o.t, d: o.d ?? 0.45, rot }] };
  }
  function stamp(x, y, str, o = {}) {
    const id = nid(o.id), c = o.color || "#D7263D", size = o.size || 52, w = tw(str, size) + 70, h = size + 50;
    const r = ink([gen.rectangle(4, 4, w - 8, h - 8, ro({ roughness: 1.6, w: 5 })), gen.rectangle(12, 11, w - 24, h - 22, ro({ roughness: 1.9, w: 3 }))], c);
    return { id, uid: o.id, html: `<div id="${id}" class="hd-stamp" style="left:${x}px;top:${y}px;width:${w.toFixed(0)}px;height:${h}px;color:${c};font-size:${size}px"><svg width="${w.toFixed(0)}" height="${h}">${r.html}</svg><span>${esc(str)}</span></div>`, anims: [{ kind: "stamp", sel: "#" + id, t: o.t, d: 0.35, rot: o.rot ?? -7 }] };
  }
  // 数字从 from 数到 to
  function count(x, y, from, to, o = {}) {
    const id = nid(o.id), size = o.size || 96;
    const el = text(x, y, `${o.prefix || ""}${to.toLocaleString("en-US")}${o.suffix || ""}`, { ...o, id: undefined, size, fx: "fade" });
    el.id = id; el.uid = o.id;
    el.html = el.html.replace(/id="[^"]+"/, `id="${id}"`).replace(/>[^<]*<\/div>$/, `>${o.prefix || ""}${from.toLocaleString("en-US")}${o.suffix || ""}</div>`).replace('class="hd-text"', 'class="hd-text tab"');
    el.anims = [{ kind: "fade", sel: "#" + id, t: o.t, d: 0.3 }, { kind: "count", sel: "#" + id, t: o.t, d: o.d ?? 1.6, from, to, pre: o.prefix || "", suf: o.suffix || "" }];
    return el;
  }
  // 手绘进度条：外框画出来，里面的排线按 pct 从左往右刷满
  function bar(x, y, w, h, o = {}) {
    const pct = o.pct ?? 1, id = nid(o.id);
    const frame = ink(gen.rectangle(x, y, w, h, ro({ roughness: 1.1, w: 4 })), o.color || INK);
    const fill = ink(gen.rectangle(x + 6, y + 6, w - 12, h - 12, ro({ roughness: 0.9, stroke: "none", fill: o.fillColor ? o.fillColor : hexA(ACC, 0.75), gap: 9, fillWeight: 3.4 })), "none");
    const t = o.t;
    return { id, uid: o.id, html: svg(id, frame.html) + `<div id="${id}-f" class="hd-wipe">${svg(id + "-fs", fill.html, "ink")}</div>`, anims: [{ kind: "draw", sel: "#" + id, t, d: 0.6, pen: o.pen !== false, segs: frame.segs }, { kind: "wipe", sel: "#" + id + "-f", t, after: 0.6, d: o.fillD ?? 1.6, x0: x, x1: x + w, pct }] };
  }

  // ---- 讲到哪点亮哪 ----
  const focus = (on, among, o = {}) => ({ id: null, html: "", anims: [{ kind: "focus", t: o.t, d: 0.4, on: [].concat(on), among: [].concat(among), dim: o.dim ?? 0.28 }] });
  const reset = (among, o = {}) => ({ id: null, html: "", anims: [{ kind: "focus", t: o.t, d: 0.4, on: [].concat(among), among: [].concat(among), dim: 1 }] });
  const hide = (ids, o = {}) => ({ id: null, html: "", anims: [{ kind: "hide", t: o.t, d: o.d ?? 0.35, on: [].concat(ids) }] });
  // 原地变色（强调色描边），比如「这一项现在被选中」
  const tint = (ids, o = {}) => ({ id: null, html: "", anims: [{ kind: "tint", t: o.t, d: 0.35, on: [].concat(ids), color: o.color || ACC }] });

  return { T: { ...T, accent: ACC }, INK, GRAY, ACC, tw, text, box, ellipse, line, arrow, circle, under, mark, check, cross, hatch, icon, note, img, stamp, count, bar, focus, reset, hide, tint };
}

// 路径缩放：只支持 M L H V C Q Z（图标库里不用 A）
function scalePath(d, s, ox, oy) {
  const tok = d.match(/[MLHVCQZmlhvcqz]|-?\d*\.?\d+/g); let cmd = "", k = 0, out = [];
  for (const t of tok) {
    if (/[A-Za-z]/.test(t)) { cmd = t.toUpperCase(); k = 0; out.push(cmd); continue; }
    const v = +t; let r;
    if (cmd === "H") r = ox + v * s; else if (cmd === "V") r = oy + v * s; else r = k % 2 === 0 ? ox + v * s : oy + v * s;
    k++; out.push(r.toFixed(1));
  }
  return out.join(" ");
}

// 图标：["p", 路径, 是否排线填充] 或 ["e", cx, cy, w, h, 是否填充]，100×100 网格
export const ICONS = {
  folder: [["p", "M10 26 L40 26 L48 36 L90 36 L90 82 L10 82 Z", true]],
  doc: [["p", "M24 10 L62 10 L80 28 L80 90 L24 90 Z"], ["p", "M62 10 L62 28 L80 28"], ["p", "M34 46 L70 46 M34 60 L70 60 M34 74 L58 74"]],
  user: [["e", 50, 30, 34, 34], ["p", "M16 90 C16 66 32 56 50 56 C68 56 84 66 84 90 Z", true]],
  users: [["e", 36, 32, 28, 28], ["e", 68, 36, 24, 24], ["p", "M8 86 C8 66 20 56 36 56 C52 56 64 66 64 86 Z", true], ["p", "M60 60 C76 58 92 66 92 84 L68 84"]],
  cloud: [["p", "M28 76 C10 76 8 52 28 50 C28 28 58 22 66 42 C80 34 96 48 88 62 C98 66 94 78 80 76 Z", true]],
  gear: [["e", 50, 50, 44, 44, true], ["e", 50, 50, 16, 16], ["p", "M50 8 L50 22 M50 78 L50 92 M8 50 L22 50 M78 50 L92 50 M20 20 L30 30 M70 70 L80 80 M80 20 L70 30 M30 70 L20 80"]],
  bolt: [["p", "M58 6 L22 56 L48 56 L40 94 L78 40 L52 40 Z", true]],
  chat: [["p", "M10 16 L90 16 L90 66 L44 66 L24 86 L24 66 L10 66 Z", true], ["p", "M26 34 L74 34 M26 48 L60 48"]],
  laptop: [["p", "M20 20 L80 20 L80 64 L20 64 Z", true], ["p", "M6 64 L94 64 L86 78 L14 78 Z"]],
  phone: [["p", "M32 8 L68 8 Q74 8 74 14 L74 86 Q74 92 68 92 L32 92 Q26 92 26 86 L26 14 Q26 8 32 8 Z"], ["p", "M44 82 L56 82"]],
  db: [["e", 50, 22, 64, 22, true], ["p", "M18 22 L18 78 C18 92 82 92 82 78 L82 22"], ["p", "M18 50 C18 64 82 64 82 50"]],
  lock: [["p", "M22 44 L78 44 L78 90 L22 90 Z", true], ["p", "M34 44 L34 30 C34 8 66 8 66 30 L66 44"], ["p", "M50 60 L50 74"]],
  star: [["p", "M50 6 L61 38 L94 38 L67 57 L77 90 L50 70 L23 90 L33 57 L6 38 L39 38 Z", true]],
  clock: [["e", 50, 50, 80, 80], ["p", "M50 24 L50 50 L68 62"]],
  branch: [["e", 30, 18, 16, 16, true], ["e", 30, 84, 16, 16, true], ["e", 72, 32, 16, 16, true], ["p", "M30 26 L30 76 M72 40 C72 62 30 54 30 76"]],
  bulb: [["p", "M50 8 C26 8 18 30 26 46 C30 56 38 60 38 70 L62 70 C62 60 70 56 74 46 C82 30 74 8 50 8 Z", true], ["p", "M40 80 L60 80 M43 90 L57 90"]],
  bot: [["p", "M22 30 L78 30 L78 82 L22 82 Z", true], ["p", "M50 30 L50 14"], ["e", 50, 11, 8, 8], ["e", 38, 50, 10, 10], ["e", 62, 50, 10, 10], ["p", "M38 66 L62 66"]],
  globe: [["e", 50, 50, 80, 80], ["p", "M10 50 L90 50 M50 10 C30 30 30 70 50 90 C70 70 70 30 50 10"]],
  search: [["e", 42, 42, 52, 52], ["p", "M62 62 L88 88"]],
  video: [["p", "M8 26 L66 26 L66 74 L8 74 Z", true], ["p", "M66 42 L92 28 L92 72 L66 58 Z"]],
  chart: [["p", "M10 90 L92 90"], ["p", "M18 90 L18 62 L30 62 L30 90 M40 90 L40 42 L52 42 L52 90 M62 90 L62 54 L74 54 L74 90", true], ["p", "M80 90 L80 20 L90 20 L90 90"]],
  link: [["p", "M44 58 L56 42"], ["p", "M40 46 L28 58 C20 66 32 80 42 72 L52 62"], ["p", "M60 54 L72 42 C80 34 68 20 58 28 L48 38"]],
  box: [["p", "M14 32 L50 14 L86 32 L86 72 L50 90 L14 72 Z", true], ["p", "M14 32 L50 50 L86 32 M50 50 L50 90"]],
  code: [["p", "M34 28 L12 50 L34 72 M66 28 L88 50 L66 72 M56 18 L44 82"]],
  mail: [["p", "M10 22 L90 22 L90 78 L10 78 Z", true], ["p", "M10 22 L50 54 L90 22"]],
  heart: [["p", "M50 86 C20 64 8 48 12 32 C16 14 40 12 50 30 C60 12 84 14 88 32 C92 48 80 64 50 86 Z", true]],
  flag: [["p", "M22 92 L22 10"], ["p", "M22 12 L78 12 L66 30 L78 48 L22 48 Z", true]],
  terminal: [["p", "M8 16 L92 16 L92 84 L8 84 Z", true], ["p", "M22 38 L36 50 L22 62 M44 64 L66 64"]],
};
