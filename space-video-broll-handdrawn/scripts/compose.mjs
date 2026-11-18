// 原片 + 透明手绘 B-roll(MOV) + 音效 → 成片
// 用法: node compose.mjs <项目目录> <原片> <broll.mov> <输出.mp4>
// 音量：先测原片人声峰值，音效峰值压到人声峰值以下 cfg.sfx.below dB（默认 17）。beats.mjs 里 sfx: false 关掉全部音效
import { readFileSync, existsSync } from "node:fs";
import { execFileSync, spawnSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const [proj, src, broll, out] = process.argv.slice(2);
if (!out) { console.error("用法: node compose.mjs <项目目录> <原片> <broll.mov> <输出.mp4>"); process.exit(1); }
const J = JSON.parse(readFileSync(join(proj, "broll/beats.json")));
const { X, Y } = J.meta, beats = J.beats, opt = J.sfx === false ? { off: true } : (J.sfx || {});
const sfxDir = join(proj, "sfx");
if (!opt.off && !existsSync(join(sfxDir, "paper.wav"))) execFileSync("node", [join(dirname(fileURLToPath(import.meta.url)), "sfx.mjs"), sfxDir], { stdio: "inherit" });

// 人声峰值
const vd = spawnSync("ffmpeg", ["-hide_banner", "-i", src, "-vn", "-af", "volumedetect", "-f", "null", "-"], { encoding: "utf8" }).stderr;
const peak = +(vd.match(/max_volume: (-?[\d.]+) dB/) || [, -6])[1];
const below = opt.below ?? 17, target = peak - below; // 音效峰值 dB
const base = Math.pow(10, (target + 1) / 20);           // 音效文件本身峰值 -1dB
// 各音效的相对响度（≤1 更轻）
const REL = { paper: 1, pop: 0.7, ding: 0.75, thud: 1.2, marker: 0.45, ...(opt.rel || {}) };
const E = [];
if (!opt.off) {
  for (const b of beats) {
    if (b.sfxIn && opt.in !== false) E.push(["paper", b.at - 0.05, 1]);
    for (const [name, t, g] of b.sfx) E.push([name, t, g]);
  }
}
const files = [...new Set(E.map((e) => e[0]))];
const args = ["-y", "-i", src, "-i", broll, ...files.flatMap((f) => ["-i", join(sfxDir, f + ".wav")])];
const fi = Object.fromEntries(files.map((f, i) => [f, i + 2]));
const g = [];
g.push(`[1:v]split=${beats.length}${beats.map((_, i) => `[s${i}]`).join("")}`);
// trim 多留 0.1s：B-roll 30fps、原片 60fps 时，段尾最后半帧会没有画面盖着，全屏白底相邻两段之间会闪一帧原片；显示范围仍由下面的 enable 控制
beats.forEach((b, i) => g.push(`[s${i}]trim=start=${b.start}:end=${(b.start + b.dur + 0.1).toFixed(3)},setpts=PTS-STARTPTS+${b.at}/TB[b${i}]`));
let last = "0:v";
beats.forEach((b, i) => { const o = i === beats.length - 1 ? "vout" : `v${i}`; g.push(`[${last}][b${i}]overlay=x=${X}:y=${Y}:eof_action=pass:enable='between(t,${b.at},${(b.at + b.dur).toFixed(3)})'[${o}]`); last = o; });
let amap = "0:a";
if (E.length) {
  const uses = {}; E.forEach((e) => (uses[e[0]] = (uses[e[0]] || 0) + 1)); const cnt = {};
  files.forEach((f) => g.push(`[${fi[f]}:a]aformat=sample_rates=44100:channel_layouts=stereo,asplit=${uses[f]}${Array.from({ length: uses[f] }, (_, k) => `[${f}${k}]`).join("")}`));
  const labels = E.map((e, j) => { const k = (cnt[e[0]] = (cnt[e[0]] ?? -1) + 1); const ms = Math.max(0, Math.round(e[1] * 1000)); const v = Math.min(0.25, base * (REL[e[0]] ?? 0.7) * e[2]); g.push(`[${e[0]}${k}]volume=${v.toFixed(4)},adelay=${ms}|${ms}[e${j}]`); return `[e${j}]`; });
  g.push(`${labels.join("")}amix=inputs=${labels.length}:normalize=0:duration=longest[sfx]`);
  g.push(`[0:a][sfx]amix=inputs=2:normalize=0:duration=first,alimiter=limit=0.95[aout]`);
  amap = "[aout]";
}
args.push("-filter_complex", g.join(";"), "-map", "[vout]", "-map", amap,
  "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", ...(E.length ? ["-c:a", "aac", "-b:a", "192k"] : ["-c:a", "copy"]), "-movflags", "+faststart", out);
console.log(`B-roll ${beats.length} 段 · 音效 ${E.length} 个 · 人声峰值 ${peak}dB → 音效峰值约 ${target.toFixed(1)}dB`);
execFileSync("ffmpeg", args, { stdio: ["ignore", "inherit", "inherit"] });
