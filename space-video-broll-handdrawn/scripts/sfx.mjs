// 本地合成音效（不下载）：纸张滑入、轻 pop、叮、闷响（拦截）、马克笔沙沙
// 用法: node sfx.mjs <输出目录>   每个文件峰值 -1dB，实际音量由 compose.mjs 按人声电平压低
import { writeFileSync, mkdirSync } from "node:fs";
const SR = 44100, dir = process.argv[2] || "sfx"; mkdirSync(dir, { recursive: true });
function wav(name, data) {
  const n = data.length, buf = Buffer.alloc(44 + n * 2);
  buf.write("RIFF", 0); buf.writeUInt32LE(36 + n * 2, 4); buf.write("WAVEfmt ", 8);
  buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34);
  buf.write("data", 36); buf.writeUInt32LE(n * 2, 40);
  let peak = 0; for (const v of data) peak = Math.max(peak, Math.abs(v));
  const g = peak > 0 ? 0.89 / peak : 1;
  data.forEach((v, i) => buf.writeInt16LE(Math.round(v * g * 32767), 44 + i * 2));
  writeFileSync(`${dir}/${name}.wav`, buf);
}
let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;
function sweep(dur, f0, f1, q, envPow = 0.7) {
  const n = Math.floor(dur * SR), out = new Float32Array(n); let low = 0, band = 0;
  for (let i = 0; i < n; i++) {
    const p = i / n, f = f0 * Math.pow(f1 / f0, p), F = 2 * Math.sin(Math.PI * f / SR);
    const x = rnd(); low += F * band; const high = x - low - q * band; band += F * high;
    out[i] = band * Math.pow(Math.sin(Math.PI * Math.pow(p, envPow)), 2);
  }
  return out;
}
function tone(dur, freqs, decay, attack = 0.004, bend = 0) {
  const n = Math.floor(dur * SR), out = new Float32Array(n);
  for (let i = 0; i < n; i++) { const t = i / SR, env = Math.min(1, t / attack) * Math.exp(-t / decay); let v = 0; freqs.forEach(([f, a]) => v += a * Math.sin(2 * Math.PI * f * (1 + bend * Math.exp(-t * 40)) * t)); out[i] = v * env; }
  return out;
}
// 纸张滑入：低一点、短一点的带通噪声扫频，像一张纸被拍到桌上
{ const a = sweep(0.42, 500, 2200, 0.9, 0.5), n = a.length, out = new Float32Array(n + 2000);
  for (let i = 0; i < n; i++) out[i] = a[i];
  for (let i = 0; i < 2000; i++) { const t = i / SR; out[n - 600 + i] += rnd() * 0.5 * Math.exp(-t / 0.01); }
  wav("paper", out); }
wav("pop", tone(0.16, [[560, 1], [1120, 0.2]], 0.03, 0.002, 0.5));
wav("ding", tone(1.0, [[1046.5, 1], [2093, 0.3], [1568, 0.25]], 0.3));
{ const d = 0.45, n = Math.floor(d * SR), out = new Float32Array(n);
  for (let i = 0; i < n; i++) { const t = i / SR; out[i] = Math.sin(2 * Math.PI * (90 + 70 * Math.exp(-t * 30)) * t) * Math.exp(-t / 0.11) + (t < 0.02 ? rnd() * 0.4 * (1 - t / 0.02) : 0); }
  wav("thud", out); }
// 马克笔：高频带通噪声，按 7Hz 左右的笔画节奏起伏
{ const d = 1.2, n = Math.floor(d * SR), out = new Float32Array(n); let low = 0, band = 0; const F = 2 * Math.sin(Math.PI * 3200 / SR);
  for (let i = 0; i < n; i++) { const t = i / SR, x = rnd(); low += F * band; const high = x - low - 1.2 * band; band += F * high;
    const stroke = Math.pow(Math.max(0, Math.sin(2 * Math.PI * 6.8 * t + Math.sin(t * 3) * 1.5)), 1.6);
    out[i] = band * stroke * Math.min(1, t / 0.05) * Math.min(1, (d - t) / 0.1); }
  wav("marker", out); }
console.log("音效 →", dir, ": paper pop ding thud marker");
