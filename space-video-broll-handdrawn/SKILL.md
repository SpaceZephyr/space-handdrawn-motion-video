---
name: space-video-broll-handdrawn
description: 给已剪好字幕和音频的口播视频加「手绘风」B-roll：每段 B-roll 是一张用胶带贴在画面中间的纸（白板、笔记本、黑板、蓝图、牛皮纸、宣纸六种纸面），标题和标签一个字一个字手写出来，框、箭头、图标像马克笔一笔笔画出，一支笔跟着笔尖走，讲到哪一项就点亮哪一项；避开底部字幕和人像窗，音效少而轻（自动压到人声以下 17dB），每段停到讲完才退。流程：逐字稿 → 按讲话时间排 beat → beats.mjs 写画面 → HyperFrames 渲染透明 MOV → ffmpeg 贴回原片混音。当用户说「手绘 B-roll」「手绘风格的 broll」「白板风 B-roll」「给口播加手绘动画」「笔记本风/黑板风 B-roll」「用手绘风给这条视频配画面」时触发。整条手绘动画短片（自己配音、没有口播原片）用 space-handdrawn-motion-video。
---

# 手绘风口播 B-roll

把口播视频里讲到的概念，做成一张张贴在画面中间的手绘纸卡：**逐字稿 → beat 表 → beats.mjs → build → HyperFrames 渲透明 MOV → compose 贴回原片**。

画面全是 HTML + SVG：rough.js 在 Node 里按固定 seed 生成抖动线稿，字体是 Excalidraw 的手写体「小赖」，GSAP 时间轴由 HyperFrames 逐帧 seek。同样的输入每次渲染结果一样，改一段只要改 beats.mjs 重跑。

`$S` = 本 skill 目录（`~/.claude/skills/space-video-broll-handdrawn`）。首次使用在 `$S/scripts` 跑 `npm i`（rough.js、subset-font）。本 skill 是 [space-handdrawn-motion-video](https://github.com/SpaceZephyr/space-handdrawn-motion-video) 仓库的子目录，字体用仓库根目录 `assets/fonts/` 那份。

## 长什么样

| 元素 | 做法 |
|---|---|
| 纸 | 一张圆角纸卡，胶带贴两角，带投影，轻微歪斜（相邻两段方向相反）；入场像被拍到屏幕上，退场往上抽走 |
| 字 | 小赖手写体，标题和标签逐字写出（`write`），小字可以淡入（`fade`） |
| 线 | rough.js 线稿，框、圈、箭头、图标一笔笔画出（`draw`），填充用斜排线 |
| 版式 | 两种：① 纸卡（只盖 `safe` 区域，卡片滑入滑出）；② 全屏白底（`full`，白纸盖满整个画面，只给人像窗挖洞，字幕叠在最上层；用户 11/17 改用这种）|
| 笔 | 默认关（用户 11/17 要求去掉，beats.mjs 顶部 `pen: false`）；打开时写字、画线有一支笔跟着笔尖走 |
| 强调 | 一种强调色：双下划线、荧光笔、双圈、打勾、印章；讲到哪项就把其它项压暗（`focus`） |
| 位置 | 卡片落在原片的安全区里：水平居中，避开底部烧录字幕和角落人像窗 |
| 声音 | 每段入场一声纸张声，加 0–2 个重点提示（叮、闷响）；音量按原片人声峰值自动压低 17dB，不加出场音效 |

### 六种纸面（`theme`）

| theme | 画面 | 适合 |
|---|---|---|
| `whiteboard`（默认） | 白纸 + 黑色马克笔，蓝色强调 | 产品、方法论、大多数口播 |
| `notebook` | 横线笔记本，蓝色圆珠笔，红笔强调 | 学习笔记、复盘、清单 |
| `chalkboard` | 墨绿黑板 + 木框，粉笔颗粒，黄粉笔强调 | 讲原理、课程 |
| `blueprint` | 蓝图网格，白色细线，黄色标注 | 架构、流程、技术方案 |
| `kraft` | 牛皮纸 + 蜡笔颗粒，红色强调 | 生活方式、轻松话题 |
| `inkwash` | 宣纸 + 毛笔，墨线微洇，朱砂红强调 | 国风、历史、文化 |

预览别的纸面不用改文件：`HD_THEME=chalkboard node $S/scripts/build.mjs <项目>`（强调色跟着换成纸面自带的）。

## 流程

### ① 看原片，定安全区

```bash
bash $S/scripts/init.sh <项目目录> <原片>        # 读尺寸和时长，写 beats.mjs 模板（含默认安全区）
ffmpeg -ss 30 -i <原片> -frames:v 1 <项目>/frame.jpg   # 抽几帧，用 Read 看字幕在哪、人像窗在哪
```

改 `beats.mjs` 顶部的 `safe: { x, y, w, h }`（原片像素）：卡片要完整落在字幕上方、不碰人像窗，左右留 100px 以上。竖屏 1640×2160 的口播通常是 `{ x: 120, y: 326, w: 1400, h: 1180 }`。
全屏白底版式再加一行 `full: { hole: { x, y, w, h, r }, scale: 1.15, top: 150 }`：`hole` 是人像窗的洞（原片像素，比人像窗每边缩进 6–10px，圆角 r 取大一点，否则人像窗的圆角外会漏出原画面），内容仍按 safe.w × safe.h 的坐标写，整体放大 `scale` 倍、水平居中、顶边在 `top`。相邻两段间隔不到 1.5 秒时白底连着不断，只有内容换。抽帧检查时把 snapshot 叠回原片同一时刻看洞的四个角。

### ② 逐字稿

```bash
bash $S/scripts/transcribe.sh <原片> <项目>/transcript   # whisper.cpp + ggml-small，打印「起止 文本」
```

识别出的同音错字（「拥种」=臃肿、「文件甲」=文件夹）对着画面自己纠正，画面上写正确的词。

### ③ 排 beat 表（先在对话里列给用户看一眼，再写代码）

| 字段 | 说明 |
|---|---|
| 时间 | 从讲到这个概念开始，**到这段话讲完为止**。宁长勿短：一段通常 12–27 秒 |
| 讲什么 | 一句话 |
| 画面 | 一个能画出来的结构：放射（中心+四周）、流程（左→右）、对比（左右两栏）、清单（逐项点亮）、计数（大数字）、拦截（印章）、前后对比 |
| 点亮 | 讲解里依次提到的几项，各自的原片时间（`focus` 用） |

规则：

- **一张纸只讲一件事**，内容区 3–7 个元素。整条视频 6–12 段，不是每句话都配。
- **画面跟着嘴走**：元素出现的时刻 = 讲到它的时刻（直接写逐字稿时间 `t: "@39.2"`）。
- **出齐后至少停 3 秒**再退场（build 会检查并报出来）。讲解拉得长，就用 `focus` 逐项点亮维持画面，别让纸早早退场。
- 相邻两段间隔 ≥ 0.2 秒，不重叠。
- 只画口播里说过的事实；数字、产品名照原话写。口播本身说错的（比如把 GitHub 单文件上限说成 500MB，实际是 100MB），画面上不写那个数，并在交付时告诉用户。

### ④ 写 beats.mjs

每段一个对象，`draw(d)` 返回这一张纸上的元素。坐标是卡片内部的像素（左上 0,0，宽高 = safe.w × safe.h），标题区占顶部约 220px。

```js
{ id: "skills", at: 34.2, dur: 27, kicker: "02 · 之前的方法", title: "三个 Skill，搭起 Harness",
  sfx: [["ding", "@39.2"]],
  draw: (d) => [
    d.box(60, 260, 390, 600, { id: "s0", t: 1.4 }),
    d.icon("star", 255, 400, { id: "s0-i", size: 130 }),          // 不写 t：接在上一个后面
    d.text(255, 520, "从零搭建", { id: "s0-r", size: 52, align: "center", w: 360 }),
    // ... s1、s2 同理
    d.focus("s0", ["s0", "s1", "s2"], { t: "@39.2" }),            // id 前缀匹配：s0 会带上 s0-i、s0-r
    d.reset(["s0", "s1", "s2"], { t: "@60.0" }),
  ] }
```

全部组件、参数和版式配方见 **`references/dsl.md`**；完整例子 `examples/harness/beats.mjs`（4 段，含放射、三栏逐个点亮、计数+目录、同步+拦截）。

### ⑤ 构建 → 检查 → 截图

```bash
node $S/scripts/build.mjs <项目>                         # → <项目>/broll/index.html、beats.json、字体子集；打印每段时间和问题清单
cd <项目>/broll && bash $S/scripts/hf.sh lint             # 0 error 才往下走（sub-composition 那几条 warning 可以忽略）
bash $S/scripts/hf.sh snapshot . -o ../snap --at 3,15,40 --describe false --no-end   # 合成时间（beats.json 里的 start + 段内秒数）
```

`--describe false` 必须带上：不带的话有 GEMINI_API_KEY 时会把截图发给外部服务。用 Read 看 `snap/contact-sheet.jpg`，逐段查：

- 字和线有没有压在一起、出纸边；标签有没有被箭头穿过
- 每段结尾帧东西出齐了没；`focus` 压暗的是不是对的那几项
- 笔有没有停在奇怪的地方（同一时刻两个元素都在画，笔会来回跳：把其中一个设 `pen: false` 或错开时间）
- build 打印的「要处理的问题」清零

### ⑥ 渲染、合成

```bash
cd <项目>/broll && bash $S/scripts/hf.sh render --format mov -o <临时目录>/broll.mov --quiet   # ProRes 4444 带透明通道，后台跑；2 分钟 B-roll ≈ 3–4 分钟、3–4GB
node $S/scripts/compose.mjs <项目> <原片> <临时目录>/broll.mov <项目>/<名字>-broll.mp4      # 首次会自动合成音效到 <项目>/sfx/
bash $S/scripts/qc.sh <成片> <项目>/qc.jpg 12 40 90 150 190 215                                # 抽帧拼图
```

透明 MOV 很大，放 scratchpad 或临时目录，不进 Obsidian 仓库。成片 mp4 放项目目录。

### ⑦ 交付

给用户：成片路径、时长、每段 B-roll 的时间点和内容（表格）、用了哪种纸面和多少个音效；没完整看过/听过的部分照实说；口播里的事实问题单独列出。改动方式：改 `beats.mjs` → build → render → compose。

### ⑧ 可选：字幕 + 变速（用户要求时做）

这台机器的 ffmpeg 没有 drawtext / subtitles 滤镜，字幕用 HyperFrames 渲成透明条再叠上去：

```bash
# 1. 写 <项目>/subs/cues.txt：每行「起|止|文字」，时间抄逐字稿 srt；同音错字全部改对，句末不加标点，句中停顿用空格；
#    一行超过约 15 个字就在中间写「/」拆成两条（时间按字数自动分）
node $S/scripts/subs.mjs <项目>                 # → <项目>/subs/comp，打印还超长的行
cd <项目>/subs/comp && bash $S/scripts/hf.sh lint && bash $S/scripts/hf.sh snapshot . -o ../snap --at 5,30 --describe false --no-end
bash $S/scripts/hf.sh render --format mov -o <临时目录>/subs.mov --quiet
# 2. 叠字幕并整体变速（声音保持原音调）；字幕条 940×320，左上角贴在 (20,1640)
bash $S/scripts/finish.sh <compose成片.mp4> <临时目录>/subs.mov <项目>/<名字>-1.2x.mp4 1.2 20 1640
```

字幕样式：黄字 #FFE14A + 黑色粗描边，58px（和 11月16日 口播同款）。人像窗小、不挡中间时字幕条放画面水平居中；人像窗大（宽过画面三分之一）时放左下、避开人像窗。不加字幕只变速：字幕参数写 `none`。

### ⑨ 可选：封面

模板 `templates/cover.mjs`：1080×1440 笔记本纸，小赖手写大标题（第一行 + 红色大字 + 右侧两行），中间用 rough.js 画本期的核心结构，右下胶带照片（用户的卡通头像），左下便利贴一句话。复制到 `<项目>/cover/gen.mjs`，头像放 `<项目>/cover/comp/assets/avatar.jpg`，改标了「改」的几处，`node gen.mjs` 后用 `hf.sh snapshot --at 0.5` 出图，再缩到 200px 宽看标题还能不能读清。

## 音效（compose.mjs 自动处理）

- 先测原片人声峰值，音效峰值压到它下面 17dB（`sfx: { below: 17 }` 可调，数值越大越轻）
- 每段入场一声 `paper`；`sfx: false` 全关，`sfx: { in: false }` 只关入场声
- 段内重点：`sfx: [["ding", "@20.9"], ["thud", "@193.6"]]`，可选 `pop` `ding` `thud` `marker`；一段最多 1–2 个
- 不加出场音效，不给每个元素配声音

## 参考

- `references/dsl.md`：全部组件和参数、时间写法、版式配方、字号
- `references/pitfalls.md`：做过的坑（时间、音量、HyperFrames、字体、事实核对）
- `examples/harness/beats.mjs`：完整例子（竖屏口播，4 段）
- 上游：口播原片（字幕、音频已剪好）。整条手绘动画短片走 `space-handdrawn-motion-video`；深色卡片风的 B-roll 用 HyperFrames 直接写（见共享记忆 feedback_broll_use_hyperframes）
