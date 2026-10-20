// 生成 cover.html 并截图成 cover.png + 300px 宽缩略图（检查标题可读性）
// 用法：node scripts/cover/shot.mjs <项目>
import puppeteer from "puppeteer-core";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { findChrome } from "../engine/chrome.mjs";
const P = path.resolve(process.argv[2] || "."), D = P + "/cover";
const cfg = { W: 1920, H: 1080, ...JSON.parse(readFileSync(P + "/config.json")) };
execFileSync("node", [D + "/cover.mjs"], { stdio: "inherit" });
const b = await puppeteer.launch({ executablePath: findChrome(), headless: true, args: ["--allow-file-access-from-files"] });
const p = await b.newPage(); await p.setViewport({ width: cfg.W, height: cfg.H });
await p.goto("file://" + D + "/cover.html", { waitUntil: "load" }); await p.evaluate(() => document.fonts.ready);
await p.screenshot({ path: D + "/cover.png" }); await b.close();
execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", D + "/cover.png", "-vf", "scale=300:-1", D + "/thumb.png"]);
console.log("封面 →", D + "/cover.png（缩略图 thumb.png）");
