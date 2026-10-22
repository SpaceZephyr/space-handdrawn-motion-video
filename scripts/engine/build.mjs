// 把 lines.json + scenes.mjs + 配音时长拼成 index.html（动画时间轴 + 字幕）
// 用法：node engine/build.mjs <项目目录>
// lines.json 每句可以是：
//   "中文旁白，{Grok Bot|格罗克波特}……"        {显示|读法}：字幕和 c.at() 用前者，配音念后者
//   "English line,|second caption chunk."      竖线 | 手动切字幕块（英文必须用，中文可选）
//   { "say": "English…|…", "sub": "中文…|…" }  双语字幕：sub 的块数和 say 一样，按 say 的时间一块块出
// 有 beats.json（voice/beats.py 测的配乐节拍）时，每场的结束点往后对齐到下一拍，转场正好卡在拍点上
// config.transition = "canvas"：无限画布。每场是画布上的一块白板（scenes.mjs 可导出 LAYOUT = [[列, 行], …]，可带小数），
//   换场时镜头平移 + 缩放过去（离得远会先拉远再推近）；场里 c.look(时间, 目标, 回来的时间) 让镜头临时拉远看别的白板，
//   目标：白板序号（从 0 起）、序号数组、"all"，或 {x,y,w,h} 画布坐标。scenes.mjs 还可导出 CANVAS(cs, boards) 画在白板之间的东西
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { themeOf, penSvg, FILTERS } from "./themes.mjs";

const P = path.resolve(process.argv[2] || ".");
const cfg0 = existsSync(`${P}/config.json`) ? JSON.parse(readFileSync(`${P}/config.json`)) : {}, TH = themeOf(cfg0);
const cfg = { W: 1920, H: 1080, accent: TH.accent, lead: .15, tail: .3, outro: 2, voiceDir: "voice", captions: true, capMain: "sub", pen: true, pace: 1, transition: "pan", beatSync: true, ...(existsSync(`${P}/config.json`) ? JSON.parse(readFileSync(`${P}/config.json`)) : {}) };
const { SCENES, LAYOUT, CANVAS } = await import(pathToFileURL(`${P}/scenes.mjs`));
const canvas = cfg.transition === "canvas";
const raw = JSON.parse(readFileSync(`${P}/lines.json`));
const shown = s => s.replace(/\{([^|}]*)\|[^}]*\}/g, "$1");
const chunks = s => s.split(/\|(?![^{]*\})/).map(x => x.trim());
// 和 voice/text.py 的 join 一样：前一块以英文、数字或英文标点结尾时补一个空格
const join = parts => parts.reduce((o, p) => o + (o && /[A-Za-z0-9,.!?;:'")%]$/.test(o) ? " " : "") + p, "");
const L = raw.map((e, i) => {
  const sayC = chunks(typeof e === "string" ? e : e.say), subC = typeof e === "object" && e.sub ? chunks(e.sub) : null;
  if (subC && subC.length !== sayC.length) throw new Error(`s${i + 1} 的 say 有 ${sayC.length} 块、sub 有 ${subC.length} 块，要一样多`);
  const rawLine = join(sayC);
  const starts = sayC.map((c, j) => shown(join(sayC.slice(0, j + 1))).length - shown(c).length);  // 每块在显示文本里的起点
  return { text: shown(rawLine), say: sayC.map(shown), sub: subC, starts, manual: sayC.length > 1 || !!subC };
});
if (SCENES.length !== L.length) throw new Error(`scenes.mjs 有 ${SCENES.length} 场，lines.json 有 ${L.length} 句，要一一对应`);
const id = i => `s${String(i + 1).padStart(2, "0")}`;
const silent = cfg.voice === false;  // 不配音：按字数估时长（中文每秒约 4.5 字），只有字幕和配乐
const wt = ch => /[，、,]/.test(ch) ? 2 : /[。？！：；.?!;:]/.test(ch) ? 3 : /\s/.test(ch) ? .3 : /[A-Za-z0-9]/.test(ch) ? .3 : 1;
const dur = L.map(({ text }, i) => silent ? [...text].map(wt).reduce((a, b) => a + b, 0) / 4.5
  : +execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", `${P}/${cfg.voiceDir}/${id(i)}.wav`]).toString());
const ALIGN = existsSync(`${P}/align.json`) && !silent ? JSON.parse(readFileSync(`${P}/align.json`)) : {};
const BEAT = cfg.beatSync && cfg.bgm !== false && existsSync(`${P}/beats.json`) ? JSON.parse(readFileSync(`${P}/beats.json`)) : null;
const onBeat = x => { if (!BEAT) return x; const p = 60 / BEAT.bpm; return BEAT.offset + Math.ceil((x - BEAT.offset) / p - 1e-6) * p; };

// 有 align.json（align.py 用 Whisper 测的逐字时间，已是成品音频里的秒数）就用它；没有就按字数估
function charTimes(text, d, key) {
  if (ALIGN[key] && ALIGN[key].length === text.length) return ALIGN[key].map(t => Math.min(t, d));
  const w = [...text].map(wt), tot = w.reduce((a, b) => a + b, 0); let acc = 0;
  return w.map(x => { const t = acc / tot * d; acc += x; return t; });
}
const trimEnd = s => s.replace(/[，。、；：,.;:]$/, "").trim();

let t = 0; const scenes = [], caps = [], html = [], looks = [], cs = [];
L.forEach(({ text, say, sub, starts, manual }, i) => {
  const start = t, vs = start + cfg.lead, ve = vs + dur[i];
  const end = i === L.length - 1 ? ve + cfg.tail + cfg.outro : onBeat(ve + cfg.tail);
  const ct = charTimes(text, dur[i], id(i));
  const c = {
    t: x => start + x, start, vs, ve, end, text,
    // c.at("关键词", 偏移秒)：旁白念到这个词的绝对时间（英文旁白就写英文词）
    at(w, off = 0) { const k = text.indexOf(w); if (k < 0) throw new Error(`${id(i)} 稿子里找不到「${w}」`); return vs + ct[k] + off; },
    look(at, target, until) { looks.push({ i, at, target, until }); },
    // c.beat(时间, 窗口)：把动作吸到最近的配乐拍点上（离拍点超过窗口就不动），c.beat(时间, 窗口, 2) 只吸到每两拍
    beat(x, w = .35, every = 1) { if (!BEAT) return x; const p = 60 / BEAT.bpm * every, b = BEAT.offset + Math.round((x - BEAT.offset) / p) * p; return Math.abs(b - x) <= w ? b : x; },
  };
  cs.push(c);
  html.push(`<section class="scene" data-start="${start.toFixed(3)}" data-end="${end.toFixed(3)}">${SCENES[i](c)}</section>`);
  if (manual) say.forEach((s, j) => {
    const a = vs + ct[starts[j]], b = j + 1 < say.length ? vs + ct[starts[j + 1]] : ve + .3;
    caps.push({ a: +a.toFixed(3), b: +b.toFixed(3), text: trimEnd(s), sub: sub ? trimEnd(sub[j]) : undefined, keep: true });
  });
  else { const re = /[^，。？！：；、]+[，。？！：；、]?/g; let m;
    while ((m = re.exec(text))) {
      const a = vs + ct[m.index], j = m.index + m[0].length, b = j < text.length ? vs + ct[j] : ve + .3;
      caps.push({ a: +a.toFixed(3), b: +b.toFixed(3), text: trimEnd(m[0]) });
    } }
  scenes.push({ id: id(i), start, end, voiceAt: vs, dur: end - start });
  t = end;
});
// 自动切的中文短句并成一行（横版 ≤22 字，竖版 ≤15 字）；手动切的块原样保留
const maxc = cfg.W > cfg.H ? 22 : 15, merged = [];
for (const c of caps) {
  const p = merged[merged.length - 1];
  if (!c.keep && p && !p.keep && p.text.length + c.text.length <= maxc && Math.abs(p.b - c.a) < .01 && !/[？！]$/.test(p.text)) { p.text += "，" + c.text; p.b = c.b; }
  else merged.push({ ...c });
}
const bi = merged.some(c => c.sub);
// 马克笔：笔尖在 svg 左下角 (4,146)
const PEN = penSvg(TH.pen, cfg.accent);
// ---- 无限画布：白板位置 + 镜头路径（van Wijk 平滑缩放，和 d3.interpolateZoom 同一套公式，runtime.js 里有同样的实现）----
let cam = null, boards = null, worldHtml = "", camMoves = [];
if (canvas) {
  const [gx, gy] = cfg.gap || [220, 200], U = cfg.W + gx, V = cfg.H + gy, cols = cfg.cols || 4;
  boards = L.map((_, i) => { const [c0, r0] = LAYOUT?.[i] ?? [Math.floor(i / cols) % 2 ? cols - 1 - i % cols : i % cols, Math.floor(i / cols)]; return { x: Math.round(c0 * U), y: Math.round(r0 * V), w: cfg.W, h: cfg.H }; });
  const union = rs => { const x0 = Math.min(...rs.map(r => r.x)), y0 = Math.min(...rs.map(r => r.y)), x1 = Math.max(...rs.map(r => r.x + r.w)), y1 = Math.max(...rs.map(r => r.y + r.h)); return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }; };
  const view = tg => {
    const r = typeof tg === "number" ? boards[tg] : tg === "all" ? union(boards) : Array.isArray(tg) ? union(tg.map(k => boards[k])) : tg;
    const single = typeof tg === "number", w = Math.max(r.w, r.h * cfg.W / cfg.H) * (single ? 1 : 1.06);
    return [r.x + r.w / 2, r.y + r.h / 2, w];
  };
  const RHO = 1.4, pathLen = ([x0, y0, w0], [x1, y1, w1]) => {
    const d2 = (x1 - x0) ** 2 + (y1 - y0) ** 2;
    if (d2 < 1e-6) return Math.abs(Math.log(w1 / w0)) / RHO;
    const d1 = Math.sqrt(d2), r2 = RHO * RHO, b = (w, s) => (w1 * w1 - w0 * w0 + s * r2 * r2 * d2) / (2 * w * r2 * d1);
    const r = x => Math.log(Math.sqrt(x * x + 1) - x); return (r(b(w1, -1)) - r(b(w0, 1))) / RHO;
  };
  const moveDur = S => Math.min(2.8, Math.max(1.1, .75 + .5 * S));
  const moves = looks.flatMap(l => [{ a: l.at, to: view(l.target), i: l.i }, ...(l.until != null ? [{ a: l.until, to: view(l.i), i: l.i }] : [])]);
  scenes.slice(0, -1).forEach((s, i) => moves.push({ a: s.end, to: view(i + 1), i, center: true }));
  moves.sort((a, b) => a.a - b.a);
  let cur = view(0), prevB = -1; cam = [];
  for (const m of moves) {
    const S = pathLen(cur, m.to), d = moveDur(S); let a = m.center ? m.a - d / 2 : m.a;
    if (a < prevB - 1e-3) { console.warn(`⚠ 镜头 ${id(m.i)} 在 ${a.toFixed(2)}s 的移动和上一段重叠，顺延到 ${prevB.toFixed(2)}s`); a = prevB; }
    cam.push({ a: +a.toFixed(3), b: +(a + d).toFixed(3), p0: cur.map(v => +v.toFixed(1)), p1: m.to.map(v => +v.toFixed(1)) });
    if (m.center) scenes[m.i].still = +(a - .05).toFixed(3);  // 截结尾帧：镜头离开之前
    else camMoves.push(+(a + d / 2).toFixed(3));
    cur = m.to; prevB = a + d;
  }
  const all = union(boards), M = 6000;
  worldHtml = `<div id="dots" style="left:${all.x - M}px;top:${all.y - M}px;width:${all.w + 2 * M}px;height:${all.h + 2 * M}px"></div>`;
  html.forEach((h, i) => { const b = boards[i]; html[i] = h.replace('<section class="scene"', `<section class="scene board" style="left:${b.x}px;top:${b.y}px"`); });
}
const timeline = { duration: +t.toFixed(3), W: cfg.W, H: cfg.H, beat: BEAT && { bpm: BEAT.bpm, offset: BEAT.offset }, scenes, ...(canvas ? { camMoves } : {}) };
writeFileSync(`${P}/timeline.json`, JSON.stringify(timeline, null, 1));
const bodyCls = [cfg.W > cfg.H ? "land" : "port", cfg.captions ? "" : "nocap", bi ? "bi" : "", canvas ? "canvas" : "", "th-" + TH.name, TH.dark ? "dark" : ""].filter(Boolean).join(" ");
writeFileSync(`${P}/index.html`, `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="engine/style.css"><style>:root{--accent:${cfg.accent};--ink:${TH.ink};--paper:${TH.paper};--soft:${TH.soft || TH.gray};--W:${cfg.W}px;--H:${cfg.H}px}html,body{width:${cfg.W}px;height:${cfg.H}px}${cfg.css || ""}</style></head><body class="${bodyCls}">${FILTERS}
${canvas ? `<div id="world">${worldHtml}\n${html.join("\n")}\n${CANVAS ? CANVAS(cs, boards) : ""}</div>` : html.join("\n")}
<div id="capline"></div><div id="cap"></div>${PEN}
<script>window.PV={W:${cfg.W},H:${cfg.H},pen:${!!cfg.pen},pace:${+cfg.pace || 1},capMain:${JSON.stringify(cfg.capMain)},trans:${JSON.stringify(cfg.transition)},cam:${JSON.stringify(cam)},boards:${JSON.stringify(boards)}};window.PV_TIMELINE=${JSON.stringify(timeline)};window.PV_CAPS=${JSON.stringify(cfg.captions ? merged : [])};</script>
<script src="engine/runtime.js"></script></body></html>`);
console.log(`总长 ${t.toFixed(1)}s（${Math.floor(t / 60)}分${Math.round(t % 60)}秒），${L.length} 场${silent ? "（无配音，按字数估时）" : ""}${BEAT ? `，转场卡 ${BEAT.bpm} BPM 拍点` : ""}${bi ? "，双语字幕" : ""}${canvas ? `，无限画布 ${cam.length} 段镜头` : ""}`);
