// 代码动效原理剖析：一句一场。演示片段来自文章里的 9 张动图（CodeMotion 网页逐帧录的），真实案例片段来自文章引用的 YouTube 视频
import { existsSync } from "node:fs";
import { A, R, ICON, W, H, ACC, INK, GRAY, sk, hand, write, box, head, pin, clip, note, tape } from "./engine/lib.mjs";

const S = (inner, at, d, out) => sk(inner, A({ at, fx: "draw", d, out }));
const ON = (x, y, inner, at, fx = "up", st = "") => `<div ${A({ at, fx, pen: false })} style="position:absolute;left:${x}px;top:${y}px;${st}">${inner}</div>`;
const T = (x, y, text, at, size, o = {}) => write(x, y, text, at, { size, ...o });
const has = f => existsSync(new URL(f, import.meta.url));

// 手绘框 + 框里的字
const flow = (x, y, w, h, label, at, o = {}) => S(R.rect(x, y, w, h, { color: o.color || INK }), at, .5) +
  `<div ${A({ at: at + .25, fx: "fade", pen: false })} style="position:absolute;left:${x}px;top:${y}px;width:${w}px;height:${h}px;display:flex;align-items:center;justify-content:center"><span class="hand" style="font-size:${o.size || 40}px;${o.color ? `color:${o.color}` : ""}">${label}</span></div>`;

// 讲一种工具：左边三条要点（念到关键词时写出来），右边演示片段循环播，左下角可选一段真实案例
const tool = (c, { n, kicker = "", title, demo, notes, yt, ytLabel, ytAt, extra = "" }) => {
  const showYt = yt && has(yt), name = title.replace(/<[^>]+>/g, "").split("：")[0];

  // 还没讲到时，这块白板上只有一个灰色的序号和名字（拉远看九宫格时能看到），镜头到了就擦掉
  return `<div ${A({ at: 0, fx: "none", out: c.start + .15, pen: false })} style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#b9b6ad"><span class="hand" style="font-size:300px;color:inherit;line-height:1">${n}</span><span class="hand" style="font-size:110px;color:inherit">${name}</span></div>` +
    head(c, kicker, title, { n }) +
    ON(860, 250, clip(demo, 940, 588, { at: c.t(.3), rate: .85 }), c.t(.3)) +
    notes.map(([text, key], i) => {
      const at = c.at(key, -.2), y = 290 + i * 92;
      return S(R.fillEll(128, y + 30, 16, 16), at - .05, .15) + T(150, y, text, at, 42);
    }).join("") +
    (showYt ? ON(130, 610, clip(yt, 480, 270, { at: ytAt ?? c.at(notes[1][1], -.3) }), ytAt ?? c.at(notes[1][1], -.3)) +
      T(130, 892, "真实案例 · " + ytLabel, (ytAt ?? c.at(notes[1][1], -.3)) + .4, 28, { color: GRAY }) : "") + extra;
};

export const SCENES = [
  // 1 开场：三个真实案例 = 写代码做出来的
  c => head(c, "", "用代码做视频，<em>正在流行</em>") +
    ON(110, 290, clip("assets/clips/op-blender.mp4", 540, 338, { at: c.at("3D 小岛", -.3) }), c.at("3D 小岛", -.3)) +
    ON(690, 290, clip("assets/clips/op-3b1b.mp4", 540, 338, { at: c.at("数学动画", -.3), loop: true }), c.at("数学动画", -.3)) +
    ON(1270, 290, clip("assets/clips/yt-hyperframes.mp4", 540, 338, { at: c.at("产品发布片", -.3) }), c.at("产品发布片", -.3)) +
    T(250, 660, "3D 小岛", c.at("3D 小岛"), 40) + T(830, 660, "数学动画", c.at("数学动画"), 40) + T(1400, 660, "产品发布片", c.at("产品发布片"), 40) +
    T(220, 718, "Blender MCP · Code Bear", c.at("3D 小岛", .5), 26, { color: GRAY }) + T(840, 718, "3Blue1Brown", c.at("数学动画", .5), 26, { color: GRAY }) + T(1400, 718, "HyperFrames · HeyGen", c.at("产品发布片", .5), 26, { color: GRAY }) +
    S(R.line(200, 790, 1720, 790, { color: GRAY, w: 2 }), c.at("这些画面", -.2), .5) +
    S(ICON.code(760, 870, 90, ACC), c.at("写代码", -.6), .5) + T(830, 825, "= 一段代码", c.at("写代码", -.4), 66, { color: ACC }),

  // 2 视频模型 vs 代码模型
  c => head(c, "", "视频模型 vs <em>代码模型</em>") +
    T(250, 280, "视频模型", c.at("视频模型直接"), 54) +
    S(Array.from({ length: 24 }, (_, i) => R.hatch(250 + (i % 6) * 62, 380 + Math.floor(i / 6) * 62, 52, 52, i % 3 ? GRAY : ACC, { gap: 10, fw: 2 })).join(""), c.at("每一帧的像素", -.3), .9) +
    T(250, 650, "直接生成像素", c.at("像素"), 40, { color: GRAY }) +
    S(R.line(960, 290, 960, 760, { color: GRAY, w: 2 }), c.at("代码模型一个", -.3), .4) +
    T(1080, 280, "代码模型", c.at("代码模型一个"), 54, { color: ACC }) +
    S(ICON.doc(1150, 470, 120), c.at("写程序", -.3), .5) +
    S(R.arrow([[1230, 470], [1340, 470]]), c.at("写程序", .2), .3) +
    S(ICON.laptop(1450, 470, 140), c.at("写程序", .4), .5) +
    S(R.arrow([[1540, 470], [1630, 470]]), c.at("写程序", .8), .3) +
    S(R.rect(1650, 400, 170, 130) + R.poly([[1660, 520], [1720, 450], [1770, 500], [1810, 470]], { color: ACC }), c.at("写程序", 1), .5) +
    T(1090, 580, "写程序 → 浏览器算出画面", c.at("写程序", .2), 38) +
    note(1100, 690, 600, "第几秒 · 在哪 · 长什么样", A({ at: c.at("第几秒", -.2), fx: "pop", pen: false }), { size: 36 }),

  // 3 原理就一行
  c => head(c, "", "原理<em>就一行</em>") +
    S(ICON.clock(380, 560, 170), c.at("一个时间", -.6), .6) + T(270, 700, "给它一个时间", c.at("一个时间"), 40) +
    S(R.arrow([[500, 560], [680, 560]]), c.at("一个时间", .3), .3) +
    flow(710, 470, 500, 180, "draw(t)", c.at("一个函数", -.4), { size: 72, color: ACC }) +
    S(R.arrow([[1240, 560], [1420, 560]]), c.at("一张画面", -.5), .3) +
    S(R.rect(1450, 470, 260, 180) + R.poly([[1470, 630], [1550, 540], [1610, 600], [1690, 520]], { color: ACC }) + R.ell(1650, 510, 40, 40), c.at("一张画面", -.3), .6) +
    T(1460, 700, "还你一张画面", c.at("一张画面"), 40),

  // 4 翻页书 + 渲染流程
  c => head(c, "", "一秒翻 <em>30</em> 页") +
    ON(130, 270, clip("assets/clips/yt-flipbook.mp4", 600, 338, { at: c.at("翻页动画书", -.6) }), c.at("翻页动画书", -.6)) +
    T(130, 622, "真实案例 · Fireship", c.at("翻页动画书"), 26, { color: GRAY }) +
    T(860, 330, "1 秒 = 30 帧", c.at("一秒三十帧"), 64) + T(860, 430, "= 翻 30 页", c.at("一秒翻三十页"), 48, { color: ACC }) +
    flow(110, 680, 260, 110, "第 0 帧", c.at("第零帧", -.3)) +
    S(R.arrow([[385, 735], [445, 735]]), c.at("第零帧", .3), .2) +
    flow(460, 680, 300, 110, "draw(t)", c.at("调用这个函数", -.3), { color: ACC }) +
    S(R.arrow([[775, 735], [835, 735]]), c.at("截一张图", -.3), .2) +
    flow(850, 680, 260, 110, "截图", c.at("截一张图", -.2)) +
    S(R.arrow([[1125, 735], [1185, 735]]), c.at("FFmpeg", -.4), .2) +
    flow(1200, 680, 300, 110, "FFmpeg 拼帧", c.at("FFmpeg", -.2)) +
    S(R.arrow([[1515, 735], [1575, 735]]), c.at("拼成视频", -.2), .2) +
    flow(1590, 680, 220, 110, "MP4", c.at("拼成视频"), { color: ACC }) +
    S(R.curve([[1340, 830], [900, 900], [300, 830]], { color: GRAY, w: 2 }), c.at("一帧一帧", -.2), .5) + T(700, 870, "一帧一帧，循环到最后", c.at("一帧一帧"), 32, { color: GRAY }),

  // 5 代码的好处
  c => head(c, "", "好处：<em>能复现、能精改</em>") +
    T(150, 290, "渲染 100 次", c.at("渲染一百次", -.3), 50) +
    S([0, 1, 2, 3].map(i => R.rect(150 + i * 170, 390, 140, 100) + R.poly([[160 + i * 170, 475], [200 + i * 170, 430], [230 + i * 170, 460], [280 + i * 170, 420]], { color: ACC })).join(""), c.at("渲染一百次"), .8) +
    T(150, 530, "结果一模一样", c.at("一模一样", -.3), 46, { color: ACC }) + S(R.check(470, 560, 1.2), c.at("一模一样", .2), .3) +
    S(R.line(900, 290, 900, 800, { color: GRAY, w: 2 }), c.at("想把标题", -.4), .3) +
    T(1000, 290, "标题往左挪 20px", c.at("往左挪"), 50) +
    `<div ${A({ at: c.at("改一个数字", -.3), fx: "up", pen: false })} style="position:absolute;left:1000px;top:400px;font:44px/1.4 'JetBrains Mono',Menlo,monospace;color:${INK};background:#f4f4f2;border:3px solid ${INK};border-radius:8px 4px 9px 3px;padding:18px 30px">.title { left: <s style="color:${GRAY}">120</s> <b style="color:${ACC}">100</b>px }</div>` +
    S(R.circle(1625, 448, 130, 90), c.at("改一个数字", .3), .4) +
    S(R.rect(1050, 620, 120, 120) + R.fillEll(1085, 655, 18, 18, INK) + R.fillEll(1135, 705, 18, 18, INK) + R.fillEll(1110, 680, 18, 18, INK), c.at("重新抽卡", -.6), .5) +
    T(1210, 650, "重新抽卡", c.at("重新抽卡", -.3), 46, { color: GRAY }) + S(R.cross(1110, 680, 70, { color: ACC }), c.at("重新抽卡", .2), .3),

  // 6 九种工具
  c => head(c, "", "九种工具，<em>九种画风</em>") +
    ["HyperFrames", "Remotion", "Motion Canvas", "rough.js", "分层插画", "p5.brush 水彩", "Manim", "地图路线", "three.js"].map((t, i) => {
      const x = 240 + (i % 3) * 450, y = 290 + Math.floor(i / 3) * 175, at = c.at("不同的工具", -.2) + i * .22;
      return `<div ${A({ at, fx: "pop", pen: false })} style="position:absolute;left:${x}px;top:${y}px;width:400px;height:130px;display:flex;align-items:center;justify-content:center;border:3px solid ${INK};border-radius:14px 8px 16px 6px;background:#fff"><span class="hand" style="font-size:44px">${t}</span></div>`;
    }).join("") +
    S(R.boxAround(215, 268, 1350, 176), c.at("浏览器路线", -.4), .6) + T(1600, 320, "浏览器路线", c.at("浏览器路线", -.1), 40, { color: ACC }) +
    (c.look(c.at("我挑了九种", -.2), [5, 6, 7, 8, 9, 10, 11, 12, 13, 14]), ""),  // 拉远：九块空白板就在下面

  // 7 HyperFrames
  c => tool(c, { n: 1, kicker: "浏览器路线", title: "HyperFrames：<em>视频就是网页</em>", demo: "assets/clips/demo-gsap.mp4",
    notes: [["画面 = 一个网页", "就是一个网页"], ["暂停的时间轴，拨到第 n 帧", "暂停的时间轴"], ["参考视频 → 反推代码", "参考视频"]],
    yt: "assets/clips/yt-hyperframes.mp4", ytLabel: "HeyGen 官方教程" }),
  // 8 Remotion
  c => tool(c, { n: 2, kicker: "浏览器路线", title: "Remotion：<em>帧号</em>驱动一切", demo: "assets/clips/demo-remotion.mp4",
    notes: [["每一帧是一个 React 组件", "每一帧是一个组件"], ["唯一的输入：第几帧", "现在是第几帧"], ["数字、柱子都按帧号算", "数字滚动"]],
    yt: "assets/clips/yt-fireship.mp4", ytLabel: "Fireship" }),
  // 9 Motion Canvas
  c => tool(c, { n: 3, kicker: "浏览器路线", title: "Motion Canvas：<em>按顺序写剧本</em>", demo: "assets/clips/demo-mc.mp4",
    notes: [["先移 → 再转 → 同时变", "先移过去"], ["自带代码块组件", "自带代码块"], ["编程教学视频常用", "编程教学"]],
    yt: "assets/clips/yt-motioncanvas.mp4", ytLabel: "作者 aarthificial" }),
  // 10 rough.js
  c => tool(c, { n: 4, kicker: "手感", title: "rough.js：线条<em>一抖一抖</em>", demo: "assets/clips/demo-rough.mp4",
    notes: [["端点加一点随机偏移", "随机偏移"], ["描两三遍，像铅笔", "描两三遍"], ["每几帧换种子 → 抖动", "随机种子"]],
    extra: note(150, 640, 560, "你正在看的这块白板，<br>也是这么画的", A({ at: c.at("你现在看的", -.2), fx: "pop", pen: false }), { size: 38, r: -2 }) }),
  // 11 分层插画
  c => tool(c, { n: 5, kicker: "手感", title: "分层插画：<em>一层层长出来</em>", demo: "assets/clips/demo-layers.mp4",
    notes: [["天空 · 远山 · 树 · 文字", "天空"], ["每层错开半拍出场", "错开半拍"], ["描边从头画到尾", "描边像笔"]],
    extra: S([0, 1, 2].map(i => R.poly([[200 + i * 40, 790 - i * 70], [520 + i * 40, 790 - i * 70], [600 + i * 40, 720 - i * 70], [280 + i * 40, 720 - i * 70], [200 + i * 40, 790 - i * 70]], { color: i === 2 ? ACC : INK })).join(""), c.at("错开半拍", -.2), .9) }),
  // 12 水彩
  c => tool(c, { n: 6, kicker: "手感", title: "水彩：<em>叠 40 层</em>", demo: "assets/clips/demo-water.mp4",
    notes: [["边缘坑坑洼洼的形状", "坑坑洼洼"], ["40 层 × 4.5% 不透明度", "四十多个"], ["中间深，边缘浅 → 晕开", "中间叠得多"]],
    yt: "assets/clips/yt-watercolor.mp4", ytLabel: "Steve's Makerspace" }),
  // 13 Manim
  c => tool(c, { n: 7, kicker: "讲道理", title: "Manim：<em>数学板书</em>", demo: "assets/clips/demo-manim.mp4",
    notes: [["3Blue1Brown 作者写的", "3Blue1Brown"], ["曲线 = 函数，公式 = 路径", "曲线是函数"], ["动画 = 两个状态插值", "动画就是"]],
    yt: "assets/clips/yt-3b1b.mp4", ytLabel: "3Blue1Brown" }),
  // 14 地图路线
  c => tool(c, { n: 8, kicker: "讲道理", title: "地图路线：<em>先有声音</em>", demo: "assets/clips/demo-map.mp4",
    notes: [["讲到哪座城，路线就到哪", "讲到哪座城"], ["先配音，Whisper 打出时间", "Whisper"], ["路线按时间往前走", "往前走"]],
    yt: "assets/clips/yt-travelmap.mp4", ytLabel: "Robert Baldinger", ytAt: c.at("讲到哪座城", .3) }),
  // 15 three.js
  c => tool(c, { n: 9, kicker: "3D", title: "three.js：<em>镜头沿曲线走</em>", demo: "assets/clips/demo-three.mp4",
    notes: [["镜头沿一条曲线走", "一条曲线"], ["帧号决定走到哪", "帧号"], ["第一人称视角 = 真实感", "第一人称"]],
    yt: "assets/clips/yt-threejs.mp4", ytLabel: "Class Outside" }),

  // 16 不自己画的两条路
  c => head(c, "", "不自己画的<em>两条路</em>") +
    (has("assets/clips/yt-blender.mp4") ? ON(110, 280, clip("assets/clips/yt-blender.mp4", 820, 461, { at: c.at("MCP", -.4) }), c.at("MCP", -.4)) : "") +
    (has("assets/clips/yt-autoedit.mp4") ? ON(990, 280, clip("assets/clips/yt-autoedit.mp4", 820, 461, { at: c.at("转写口播", -.6) }), c.at("转写口播", -.6)) : "") +
    T(110, 780, "① MCP 让 Claude 开 Blender", c.at("MCP"), 42) +
    T(990, 780, "② Whisper 转写，按时间戳剪", c.at("转写口播"), 42, { color: ACC }) +
    T(110, 850, "Code Bear", c.at("MCP", .8), 28, { color: GRAY }) + T(990, 850, "Christian Peverelli", c.at("转写口播", .8), 28, { color: GRAY }),

  // 17 先学哪个
  // 镜头先飞回第 1 种 HyperFrames 那块白板（画布层在那块板上圈出「先学它」），再回来讲怎么选
  c => (c.look(c.at("我选", -.4), 6, c.at("rough.js", 1)), "") + head(c, "", "先学哪个？<em>HyperFrames</em>") +
    S(R.ell(520, 570, 780, 500), c.at("塞进网页", .4), .7) + T(360, 360, "HyperFrames", c.at("塞进网页", .4), 52, { color: ACC }) +
    ["rough.js", "p5.js", "three.js"].map((t, i) => `<div ${A({ at: c.at("塞进网页", .7) + i * .2, fx: "pop", pen: false })} style="position:absolute;left:${230 + (i % 2) * 290}px;top:${480 + Math.floor(i / 2) * 140}px;padding:14px 30px;border:3px solid ${INK};border-radius:30px 18px 30px 14px;background:#fff"><span class="hand" style="font-size:42px">${t}</span></div>`).join("") +
    T(370, 850, "都能塞进网页里", c.at("塞进网页", 1.1), 36, { color: GRAY }) +
    S(R.line(1000, 300, 1000, 820, { color: GRAY, w: 2 }), c.at("排版为主", -.6), .3) +
    T(1070, 420, "排版为主 → 网页路线", c.at("排版为主"), 50) +
    T(1070, 580, "镜头为主 → Remotion", c.at("镜头为主"), 50, { color: ACC }) +
    S(R.under(1070, 500, 1560), c.at("网页路线", .2), .3),

  // 18 收尾：哪里不对，改哪里
  c => head(c, "", "代码做视频，<em>最上头</em>的一点") +
    flow(150, 300, 440, 130, "标题被挡住了", c.at("挡住了", -.4)) + S(R.cross(540, 300, 28, { color: ACC }), c.at("挡住了", .2), .3) +
    S(R.arrow([[610, 365], [720, 365]]), c.at("改两行代码", -.4), .3) +
    flow(740, 300, 440, 130, "改两行代码", c.at("改两行代码", -.2), { color: ACC }) +
    S(R.arrow([[1200, 365], [1310, 365]]), c.at("重跑一遍", -.4), .3) +
    flow(1330, 300, 440, 130, "重跑，几十秒", c.at("重跑一遍", -.2)) + S(R.check(1720, 300, 1.2), c.at("几十秒", .2), .3) +
    T(470, 560, "哪里不对，", c.at("哪里不对", -.2), 104) + T(1030, 560, "改哪里。", c.at("改哪里", -.2), 104, { color: ACC }) +
    S(R.under(1030, 700, 1440, { w: 6 }), c.at("改哪里", .5), .4) +
    (c.look(c.at("改哪里", .6), "all"), ""),  // 收尾：拉到最远，整张画布
];

// 画布布局（列, 行）：开场 6 块蛇形两行；九种工具排成 3×3，上面留一条写大标题；最后三块竖在右边
export const LAYOUT = [[0, 0], [1, 0], [2, 0], [2, 1], [1, 1], [0, 1],
  [0, 2.45], [1, 2.45], [2, 2.45], [0, 3.45], [1, 3.45], [2, 3.45], [0, 4.45], [1, 4.45], [2, 4.45],
  [3.3, 4.45], [3.3, 3.45], [3.3, 2.45]];

// 白板之间的东西：相邻两块之间的手绘箭头（镜头经过时画出来）、九宫格上面的大标题、右上角总标题
export const CANVAS = (cs, B) => {
  const arrows = B.slice(0, -1).map((b, i) => {
    const n = B[i + 1], at = cs[i].end - .35, o = { color: GRAY, w: 6, head: 46 };
    if (Math.abs(n.y - b.y) < 10 && Math.abs(Math.abs(n.x - b.x) - b.w) < 800) {
      const y = b.y + b.h / 2, [x0, x1] = n.x > b.x ? [b.x + b.w + 40, n.x - 40] : [b.x - 40, n.x + n.w + 40];
      return S(R.arrow([[x0, y], [x1, y]], o), at, .35);
    }
    if (Math.abs(n.x - b.x) < 10) { const x = b.x + b.w / 2, [y0, y1] = n.y > b.y ? [b.y + b.h + 40, n.y - 40] : [b.y - 40, n.y + n.h + 40]; return S(R.arrow([[x, y0], [x, y1]], o), at, .35); }
    return "";
  }).join("");
  const g = B[6], label = cs[5].at("我挑了九种", .6), pick = cs[16].at("最稳", -.3);
  return arrows +
    T(g.x + 1180, B[5].y + B[5].h + 140, "九种工具，<span style=\"color:" + ACC + "\">九种画风</span>", label, 300, { d: 1.1 }) +
    // 第 17 场飞回来时，在 HyperFrames 那块板上圈出来
    S(R.ell(g.x + 520, g.y + 160, 1000, 190, { color: ACC, w: 7 }), pick, .6) +
    note(g.x + 1350, g.y + 40, 420, "先学它", A({ at: pick + .5, fx: "pop", pen: false }), { size: 64, r: 4 }) +
    T(B[17].x + 60, 360, "代码做视频", cs[17].at("改哪里", 1.9), 380, { d: 1.2 }) +
    T(B[17].x + 60, 900, "的 <span style=\"color:" + ACC + "\">9</span> 种技术", cs[17].at("改哪里", 2.4), 380, { d: 1.2 });
};
