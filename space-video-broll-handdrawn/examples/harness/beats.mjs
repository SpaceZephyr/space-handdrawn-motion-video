// 例子：11月16日 口播（1640×2160 竖屏，底部烧录字幕、右下角人像窗）挑 4 段做手绘 B-roll
// 时间写法：数字 = 相对本段开始；"@39.2" = 原片绝对时间（直接抄逐字稿时间）；不写 = 接在上一个动作后面
export default {
  source: "11月16日.MOV",
  videoDur: 222.6,
  frame: { w: 1640, h: 2160 },
  safe: { x: 120, y: 326, w: 1400, h: 1180 },   // 卡片在原片里的位置（避开字幕和人像）
  theme: "whiteboard",                          // whiteboard notebook chalkboard blueprint kraft inkwash
  accent: null,                                 // null = 用纸面自带的强调色；做品牌内容时填品牌色
  sfx: { below: 17 },                           // 音效峰值比人声峰值低 17dB；sfx: false 全关
  beats: [
    {
      id: "harness", at: 9.3, dur: 15.8, kicker: "01 · 先解释", title: "Harness：模型之外的整套架构",
      sfx: [["ding", "@20.9"]],
      draw: (d) => [
        d.ellipse(700, 440, 300, 190, { id: "core", label: "模型", fill: "hatch", t: "@11.2" }),
        d.ellipse(700, 440, 640, 330, { id: "ring", t: "@11.9", d: 1.1, color: d.GRAY }),
        d.text(700, 625, "让模型能干活的一切", { size: 40, align: "center", w: 600, color: d.GRAY, t: "@13.0" }),
        d.box(110, 720, 540, 150, { id: "left", label: "Agent 定义好的工程环境", labelSize: 38, t: "@15.0" }),
        d.box(750, 720, 540, 150, { id: "right", label: "使用的人自己决定", labelSize: 38, t: "@17.0" }),
        d.focus("right", ["left", "right"], { t: "@19.0", dim: 0.35 }),
        d.icon("doc", 850, 980, { size: 84, label: "文件", t: "@19.3", d: 0.5 }),
        d.icon("gear", 1020, 980, { size: 84, label: "工具", t: "@19.9", d: 0.5 }),
        d.icon("bulb", 1190, 980, { size: 84, label: "记忆", t: "@20.5", d: 0.5 }),
        d.note(150, 930, "= 你选的项目文件夹", { w: 420, t: "@20.9", rot: -4 }),
      ],
    },
    {
      id: "skills", at: 34.2, dur: 27, kicker: "02 · 之前的方法", title: "三个 Skill，搭起 Harness",
      draw: (d) => [
        ...[["star", "star", "从零搭建", "按职业提问，搭好骨架"], ["better", "search", "体检修复", "查混乱和隐私问题"], ["view", "chart", "个人工作台", "文件和 Skill 一屏看"]].flatMap(([k, ic, role, desc], i) => {
          const x = 60 + i * 445, T = 1.4 + i * 1.2, cx = x + 195;
          return [
            d.box(x, 260, 390, 600, { id: `s${i}`, t: T, d: 0.5 }),
            d.icon(ic, cx, 400, { id: `s${i}-i`, size: 130, t: T + 0.4, d: 0.5 }),
            d.text(cx, 520, role, { id: `s${i}-r`, size: 52, align: "center", w: 360, t: T + 0.8, d: 0.45 }),
            d.text(cx, 610, `${k}-your-harness`, { id: `s${i}-n`, size: 30, align: "center", w: 370, color: d.ACC, fx: "fade", t: T + 1.0 }),
            d.text(cx, 680, desc, { id: `s${i}-d`, size: 32, align: "center", w: 330, color: d.GRAY, fx: "fade", t: T + 1.1, lh: 1.4 }),
          ];
        }),
        // 讲到哪个点亮哪个（逐字稿：star 39s、better 46s、view 55s）
        d.focus("s0", ["s0", "s1", "s2"], { t: "@39.2" }),
        d.focus("s1", ["s0", "s1", "s2"], { t: "@46.0" }),
        d.focus("s2", ["s0", "s1", "s2"], { t: "@55.0" }),
        d.reset(["s0", "s1", "s2"], { t: "@60.0" }),
      ],
    },
    {
      id: "files", at: 84.4, dur: 22, kicker: "06 · 第一件事", title: "先给所有文件做一次体检",
      draw: (d) => {
        const names = ["0 inbox", "1 me", "2 input", "3 content", "4 build", "5 review", "9 archive"];
        const pos = [[250, 640], [550, 640], [850, 640], [1150, 640], [400, 860], [700, 860], [1000, 860]];
        return [
          d.count(700, 250, 0, 5000, { id: "n", suffix: "+", size: 150, align: "center", w: 800, t: 0.6, d: 1.8 }),
          d.text(700, 430, "个文件 → 7 个目录", { size: 44, align: "center", w: 700, t: 2.4 }),
          ...names.map((n, i) => d.icon("folder", pos[i][0], pos[i][1], { id: `d${i}`, size: 110, label: n, labelSize: 34, t: 3.6 + i * 0.35, d: 0.45, pen: false })),
          d.mark(330, 1080, 740, { t: "@92.6" }),
          d.text(700, 1052, "换 Agent、换电脑，都能直接用", { size: 48, align: "center", w: 900, t: "@92.4" }),
          // 讲到哪个目录亮哪个（97s 起）
          ...[12.6, 14.0, 15.6, 17.2, 18.6, 19.6].map((t, i) => d.focus(`d${i}`, names.map((_, k) => `d${k}`), { t, dim: 0.3 })),
          d.reset(names.map((_, k) => `d${k}`), { t: 20.6 }),
        ];
      },
    },
    {
      id: "sync", at: 183.5, dur: 21.5, kicker: "09 · 同步", title: "推到 GitHub，一个链接全设备同步",
      sfx: [["thud", "@193.6"]],
      draw: (d) => [
        d.icon("folder", 230, 400, { size: 150, label: "本地文件夹", t: 0.9 }),
        d.icon("cloud", 1170, 400, { size: 170, label: "GitHub 仓库", t: 1.7 }),
        d.arrow([340, 390], [1050, 390], { bend: 0.1, t: 2.6, d: 0.7 }),
        d.text(695, 268, "git push", { size: 40, align: "center", w: 300, color: d.ACC, t: 3.2 }),
        d.arrow([1170, 560], [1010, 700], { bend: 0.15, t: "@188.0", d: 0.35, pen: false }),
        d.arrow([1170, 560], [1170, 700], { bend: 0, t: "@188.2", d: 0.35, pen: false }),
        d.arrow([1170, 560], [1330, 700], { bend: -0.15, t: "@188.4", d: 0.35, pen: false }),
        d.icon("laptop", 1010, 775, { size: 100, t: "@188.6", d: 0.4, pen: false }),
        d.icon("phone", 1170, 775, { size: 100, t: "@188.8", d: 0.4, pen: false }),
        d.icon("laptop", 1330, 775, { size: 100, t: "@189.0", d: 0.4, pen: false }),
        d.text(1170, 850, "发一个链接就同步", { size: 36, align: "center", w: 420, t: "@189.4" }),
        d.box(110, 640, 380, 170, { id: "big", label: "1.2 GB 视频", t: "@192.0" }),
        d.arrow([500, 725], [700, 725], { id: "big-a", bend: 0, t: "@192.8", d: 0.4, color: "#D7263D" }),
        d.cross(745, 725, { id: "big-x", t: "@193.2" }),
        d.stamp(170, 880, "超限文件，拦截", { id: "big-s", t: "@193.6" }),
        d.hide(["big"], { t: "@197.2" }),
        d.icon("clock", 300, 760, { size: 130, label: "按习惯定时推送", t: "@197.8" }),
        d.bar(120, 960, 560, 64, { t: "@198.8", pct: 1, fillD: 1.4 }),
      ],
    },
  ],
};
