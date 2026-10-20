// 逐帧渲染：seek(t) → 截图 → ffmpeg。
// 用法：node engine/render.mjs [项目目录] [--fps 30] [--stills ends|mid|1.5,8,20]
//   --stills ends = 每场结尾前 0.3s 一张；mid = 每场 35%/70% 各一张；输出 stills/ + contact.jpg 拼图
import puppeteer from "puppeteer-core";
import { spawn, execFileSync } from "node:child_process";
import { mkdirSync, rmSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { findChrome } from "./chrome.mjs";
const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf("--" + k); return i >= 0 ? argv[i + 1] : d; };
const P = path.resolve(argv[0] && !argv[0].startsWith("--") ? argv[0] : ".");
const fps = +opt("fps", 30);
const browser = await puppeteer.launch({ executablePath: findChrome(), headless: true, args: ["--no-sandbox", "--hide-scrollbars", "--force-color-profile=srgb", "--allow-file-access-from-files", "--font-render-hinting=none"] });
const page = await browser.newPage();
page.on("pageerror", e => console.error("页面报错:", e.message));
await page.evaluateOnNewDocument(() => { window.__PV_RENDER__ = true; });
await page.goto("file://" + P + "/index.html", { waitUntil: "load" });
const { W, H } = await page.evaluate(() => window.PV);
await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
await page.evaluate(async () => { await document.fonts.ready; });
const tl = await page.evaluate(() => window.PV_TIMELINE);
// 出声的动作清单（mix.py 按它铺音效）
mkdirSync(P + "/out", { recursive: true });
const EV = await page.evaluate(() => window.PV_EVENTS());
writeFileSync(P + "/out/events.json", JSON.stringify(EV));
// 写字/画线到场景结束还没完成的，提前报出来（多半是挂在句末的词上，或 pace 调大了）
for (const it of EV.items) { const k = it.s; if (k >= 0 && it.at + it.d > EV.scenes[k].b - .15) console.warn(`  第 ${k + 1} 场：${it.fx} 从 ${it.at.toFixed(2)}s 开始、${(it.at + it.d).toFixed(2)}s 才完，场景 ${EV.scenes[k].b.toFixed(2)}s 就结束了，提前一点`); }
const stills = opt("stills");
if (stills) {
  const dir = P + "/stills"; rmSync(dir, { recursive: true, force: true }); mkdirSync(dir);
  const list = stills === "ends" ? tl.scenes.map(s => s.end - .3) : stills === "mid" ? tl.scenes.flatMap(s => [s.start + s.dur * .35, s.start + s.dur * .7]) : stills.split(",").map(Number);
  for (const [k, s] of list.entries()) { await page.evaluate(t => window.seek(t), s); await page.screenshot({ path: `${dir}/s${String(k + 1).padStart(3, "0")}.jpg`, type: "jpeg", quality: 85 }); }
  await browser.close();
  const n = readdirSync(dir).length, cols = Math.min(6, n), rows = Math.ceil(n / cols);
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-pattern_type", "glob", "-i", `${dir}/s*.jpg`, "-vf", `scale=360:-1,tile=${cols}x${rows}:padding=6:color=gray`, "-frames:v", "1", `${P}/contact.jpg`]);
  console.log(`静帧 ${n} 张 → ${P}/contact.jpg`); process.exit(0);
}
mkdirSync(P + "/out", { recursive: true });
const total = Math.round(tl.duration * fps);
console.log(`渲染 ${W}×${H} ${tl.duration.toFixed(1)}s @${fps}fps = ${total} 帧`);
const ff = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(fps), "-c:v", "mjpeg", "-i", "-", "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", "-movflags", "+faststart", P + "/out/video.mp4"], { stdio: ["pipe", "inherit", "inherit"] });
const cdp = await page.createCDPSession(); const t0 = Date.now();
for (let i = 0; i < total; i++) {
  await page.evaluate(t => window.seek(t), i / fps);
  const { data } = await cdp.send("Page.captureScreenshot", { format: "jpeg", quality: 94, optimizeForSpeed: true });
  if (!ff.stdin.write(Buffer.from(data, "base64"))) await new Promise(r => ff.stdin.once("drain", r));
  if (i % 150 === 0) process.stdout.write(`  ${i}/${total}  ${((Date.now() - t0) / 1000).toFixed(0)}s\r`);
}
ff.stdin.end(); await new Promise(r => ff.on("close", r)); await browser.close();
console.log(`\n画面完成 → ${P}/out/video.mp4`);
