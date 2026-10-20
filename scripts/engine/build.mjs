// 把 lines.json + scenes.mjs + 配音时长拼成 index.html（动画时间轴 + 字幕）
// 用法：node engine/build.mjs <项目目录>
// lines.json 每句可以是：
//   "中文旁白，{Grok Bot|格罗克波特}……"        {显示|读法}：字幕和 c.at() 用前者，配音念后者
//   "English line,|second caption chunk."      竖线 | 手动切字幕块（英文必须用，中文可选）
//   { "say": "English…|…", "sub": "中文…|…" }  双语字幕：sub 的块数和 say 一样，按 say 的时间一块块出
// 有 beats.json（voice/beats.py 测的配乐节拍）时，每场的结束点往后对齐到下一拍，转场正好卡在拍点上
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { pathToFileURL } from "node:url";

const P = path.resolve(process.argv[2] || ".");
const cfg = { W: 1920, H: 1080, accent: "#2456F5", lead: .15, tail: .3, outro: 2, voiceDir: "voice", captions: true, capMain: "sub", pen: true, pace: 1, transition: "pan", beatSync: true, ...(existsSync(`${P}/config.json`) ? JSON.parse(readFileSync(`${P}/config.json`)) : {}) };
const { SCENES } = await import(pathToFileURL(`${P}/scenes.mjs`));
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

let t = 0; const scenes = [], caps = [], html = [];
L.forEach(({ text, say, sub, starts, manual }, i) => {
  const start = t, vs = start + cfg.lead, ve = vs + dur[i];
  const end = i === L.length - 1 ? ve + cfg.tail + cfg.outro : onBeat(ve + cfg.tail);
  const ct = charTimes(text, dur[i], id(i));
  const c = {
    t: x => start + x, start, vs, ve, end, text,
    // c.at("关键词", 偏移秒)：旁白念到这个词的绝对时间（英文旁白就写英文词）
    at(w, off = 0) { const k = text.indexOf(w); if (k < 0) throw new Error(`${id(i)} 稿子里找不到「${w}」`); return vs + ct[k] + off; },
  };
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
const PEN = `<svg id="pen" viewBox="0 0 150 150"><g transform="translate(4,146) rotate(-48)"><path d="M0 0 L16 -7 L16 7 Z" fill="${cfg.accent}"/><rect x="15" y="-10" width="18" height="20" rx="3" fill="#2b2b30"/><rect x="32" y="-15" width="120" height="30" rx="9" fill="#f4f4f2" stroke="#2b2b30" stroke-width="3"/><rect x="40" y="-15" width="24" height="30" fill="${cfg.accent}"/><rect x="150" y="-13" width="40" height="26" rx="8" fill="${cfg.accent}" stroke="#2b2b30" stroke-width="3"/></g></svg>`;
const timeline = { duration: +t.toFixed(3), W: cfg.W, H: cfg.H, beat: BEAT && { bpm: BEAT.bpm, offset: BEAT.offset }, scenes };
writeFileSync(`${P}/timeline.json`, JSON.stringify(timeline, null, 1));
const bodyCls = [cfg.W > cfg.H ? "land" : "port", cfg.captions ? "" : "nocap", bi ? "bi" : ""].filter(Boolean).join(" ");
writeFileSync(`${P}/index.html`, `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="engine/style.css"><style>:root{--accent:${cfg.accent};--W:${cfg.W}px;--H:${cfg.H}px}html,body{width:${cfg.W}px;height:${cfg.H}px}${cfg.css || ""}</style></head><body class="${bodyCls}">
${html.join("\n")}
<div id="capline"></div><div id="cap"></div>${PEN}
<script>window.PV={W:${cfg.W},H:${cfg.H},pen:${!!cfg.pen},pace:${+cfg.pace || 1},capMain:${JSON.stringify(cfg.capMain)},trans:${JSON.stringify(cfg.transition)}};window.PV_TIMELINE=${JSON.stringify(timeline)};window.PV_CAPS=${JSON.stringify(cfg.captions ? merged : [])};</script>
<script src="engine/runtime.js"></script></body></html>`);
console.log(`总长 ${t.toFixed(1)}s（${Math.floor(t / 60)}分${Math.round(t % 60)}秒），${L.length} 场${silent ? "（无配音，按字数估时）" : ""}${BEAT ? `，转场卡 ${BEAT.bpm} BPM 拍点` : ""}${bi ? "，双语字幕" : ""}`);
