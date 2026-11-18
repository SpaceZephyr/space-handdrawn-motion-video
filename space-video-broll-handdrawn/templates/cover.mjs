// 封面模板（11月17日 APQR 那期）：1080×1440，笔记本纸 + 小赖手写大标题 + rough.js 手绘图 + 胶带照片 + 便利贴
// 用法：复制到 <项目>/cover/gen.mjs，把头像放到 <项目>/cover/comp/assets/avatar.jpg，改下面标了「改」的内容，
//      cd <项目>/cover && node gen.mjs && cd comp && bash $S/scripts/hf.sh snapshot . -o ../snap --at 0.5 --describe false --no-end
//      成图是 <项目>/cover/snap/frame-00-at-0.5s.png，复制成「MMDD-封面.png」
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { homedir } from "node:os";
const S = homedir() + "/.claude/skills/space-video-broll-handdrawn";  // skill 目录
const require = createRequire(S + "/scripts/package.json");
const rough = require("roughjs/bundled/rough.cjs.js");
const subsetFont = require("subset-font");
const gen = rough.generator();
mkdirSync("comp/fonts", { recursive: true }); mkdirSync("comp/assets", { recursive: true });
const W = 1080, H = 1440, INK = "#1E3A8A", RED = "#D7263D", GRAY = "#5B6B8C", HL = "rgba(255,214,64,.62)";
let seed = 7;
const svg = (drs, color, w = 4, extra = "") => drs.map((d) => gen.toPaths(d).map((p) => `<path d="${p.d}" fill="${p.fill || "none"}" stroke="${p.stroke === "none" ? "none" : color}" stroke-width="${p.stroke === "none" ? 0 : w}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`).join("")).join("");
const o = (x = {}) => ({ seed: seed++, roughness: 1.2, bowing: 1, stroke: "#000", strokeWidth: 4, ...x });
// 改：中间的手绘图（这里是 APQR 四个圆 + 循环箭头，重点项 Q 标红）
const N = [["A", "定领域", 300, 660], ["P", "开项目", 780, 660], ["Q", "找问题", 780, 925], ["R", "找资源", 300, 925]];
let draw = "";
N.forEach(([L, name, x, y], i) => {
  const fill = L === "Q" ? { fill: "rgba(215,38,61,.10)", fillStyle: "solid" } : {};
  draw += svg([gen.ellipse(x, y, 210, 190, o(fill))], L === "Q" ? RED : INK, 4.5);
});
const arc = (a, b, bend) => { const len = Math.hypot(b[0] - a[0], b[1] - a[1]), nx = -(b[1] - a[1]) / len, ny = (b[0] - a[0]) / len, c = [(a[0] + b[0]) / 2 + nx * bend * len, (a[1] + b[1]) / 2 + ny * bend * len];
  const ang = Math.atan2(b[1] - c[1], b[0] - c[0]), hs = 24, h1 = [b[0] - hs * Math.cos(ang - 0.45), b[1] - hs * Math.sin(ang - 0.45)], h2 = [b[0] - hs * Math.cos(ang + 0.45), b[1] - hs * Math.sin(ang + 0.45)];
  return svg([gen.curve([a, c, b], o({ roughness: 0.8 })), gen.linearPath([h1, b, h2], o({ roughness: 0.5 }))], GRAY, 4); };
draw += arc([420, 620], [660, 620], -0.18) + arc([880, 748], [880, 838], -0.35) + arc([660, 970], [420, 970], -0.18) + arc([200, 838], [200, 748], -0.35);
// 标题下的强调：APQR 荧光笔 + 红色双下划线
const marker = svg([gen.line(64, 425, 560, 428, o({ roughness: 0.6, bowing: 0.4 }))], HL, 64);
const under = svg([gen.line(70, 506, 1000, 509, o({ roughness: 1 })), gen.line(84, 519, 990, 517, o({ roughness: 1.2 }))], RED, 4.5);
const tapeStyle = (x, y, r, w = 150) => `left:${x}px;top:${y}px;width:${w}px;transform:rotate(${r}deg)`;
// 改：标题（第一行 / 红色大字 / 右侧两行）
const title1 = "AI 时代的知识管理", title2a = "APQR", title2b = "让知识流动起来";
// 改：页面上其它所有文字都要写进来（字体按这些字做子集）
const others = "空格的键盘每天按我的问题推送一手好内容不追热点定领域开项目找问题找资源每月一个核心问题知识流动";
const chars = [...new Set((title1 + title2a + title2b + others + N.map((n) => n[0] + n[1]).join("") + "·").split(""))].join("");
const font = readFileSync([S + "/assets/fonts/Xiaolai-Regular.ttf", S + "/../assets/fonts/Xiaolai-Regular.ttf", homedir() + "/.claude/skills/space-handdrawn-motion-video/assets/fonts/Xiaolai-Regular.ttf"].find((p) => { try { return readFileSync(p).length > 0; } catch { return false; } }));
writeFileSync("comp/fonts/xiaolai.woff2", await subsetFont(font, chars, { targetFormat: "woff2" }));
const html = `<!doctype html><html lang="zh"><head><meta charset="utf-8"><meta name="viewport" content="width=${W}, height=${H}" />
<style>
@font-face{font-family:"Xiaolai";src:url("fonts/xiaolai.woff2") format("woff2")}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:${W}px;height:${H}px;overflow:hidden;background:#FBF8EF}
#root{position:relative;width:${W}px;height:${H}px;font-family:"Xiaolai",sans-serif;color:${INK};
 background:#FBF8EF repeating-linear-gradient(180deg,transparent 0 47px,rgba(70,110,190,.13) 47px 49px);}
.margin{position:absolute;left:46px;top:0;bottom:0;width:3px;background:rgba(215,38,61,.28)}
.abs{position:absolute}
.kick{left:70px;top:58px;font-size:34px;color:${GRAY};display:flex;align-items:center;gap:14px}
.kick i{width:16px;height:16px;border-radius:50%;background:${RED};display:inline-block}
.t1{left:66px;top:138px;font-size:100px;line-height:1;-webkit-text-stroke:2.5px ${INK};letter-spacing:.01em}
.t2{left:62px;top:268px;display:flex;align-items:center;gap:34px;white-space:nowrap}
.t2 b{font-weight:400;color:${RED};-webkit-text-stroke:4px ${RED};font-size:200px;line-height:1}
.t2 span{font-size:84px;line-height:1.12;-webkit-text-stroke:2.5px ${INK}}
.node{width:210px;text-align:center}
.node .L{font-size:84px;line-height:1;-webkit-text-stroke:2px currentColor}
.node .n{font-size:38px;margin-top:6px}
.center{left:400px;top:752px;width:280px;text-align:center;font-size:34px;color:${GRAY};line-height:1.35}
.photo{left:622px;top:1046px;width:378px;padding:14px 14px 18px;background:#fff;box-shadow:0 14px 34px rgba(30,40,70,.22);transform:rotate(3deg)}
.photo img{display:block;width:100%;height:350px;object-fit:cover;object-position:50% 50%}
.tape{position:absolute;height:44px;background:rgba(232,220,180,.82);box-shadow:0 1px 2px rgba(0,0,0,.08)}
.note{left:96px;top:1120px;width:390px;padding:30px 30px 34px;background:#FFE680;box-shadow:0 12px 26px rgba(30,40,70,.18);transform:rotate(-4deg);font-size:42px;line-height:1.4;color:#3a2f12}
.note u{text-decoration:none;color:${RED}}
.sign{left:96px;top:1362px;font-size:30px;color:${GRAY}}
</style></head><body>
<div id="root" data-composition-id="cover" data-start="0" data-duration="1" data-width="${W}" data-height="${H}">
<div class="margin"></div>
<div class="abs kick"><i></i>空格的键盘 · 知识管理</div>
<svg class="abs" style="left:0;top:0" width="${W}" height="${H}">${marker}${under}${draw}</svg>
<div class="abs t1">${title1}</div>
<div class="abs t2"><b>${title2a}</b><span>让知识<br>流动起来</span></div>
${N.map(([L, name, x, y]) => `<div class="abs node" style="left:${x - 105}px;top:${y - 70}px;color:${L === "Q" ? RED : INK}"><div class="L">${L}</div><div class="n" style="color:${INK}">${name}</div></div>`).join("")}
<div class="abs center">每月<br>一个核心问题</div>
<div class="abs note">每天按我的问题<br>推送<u>一手</u>好内容<br>不追热点</div><!-- 改：便利贴 -->
<div class="abs photo"><img src="assets/avatar.jpg"/><i class="tape" style="${tapeStyle(104, -24, -4, 170)}"></i></div>
</div>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
<script>window.__timelines=window.__timelines||{};window.__timelines["cover"]=gsap.timeline({paused:true});</script>
</body></html>`;
writeFileSync("comp/index.html", html);
writeFileSync("comp/hyperframes.json", JSON.stringify({ paths: { assets: "assets" } }, null, 2));
writeFileSync("comp/meta.json", JSON.stringify({ id: "cover", name: "cover" }));
console.log("ok");
