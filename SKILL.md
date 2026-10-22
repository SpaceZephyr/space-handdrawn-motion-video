---
name: space-handdrawn-motion-video
description: "白板手绘风格的动效视频：标题和字一个个手写出来，线条像马克笔一笔笔画出，一支马克笔跟着笔尖走，真实的照片、界面、视频片段像剪贴画一样剪下来用胶带贴在白板上（手绘只做标题和标注），场与场之间镜头在白板上横移。十种风格：白板马克笔（默认）、黑板粉笔、水彩、蓝图、横线笔记本、牛皮纸蜡笔、漫画、软木板、水墨、霓虹。适合产品介绍、功能讲解、知识科普。流程：素材（可从官网抓图）→ 一句一场的旁白（中文或英文）→ 本地 TTS 配音（yovoice，内置音色，不用克隆谁的声音）→ 逐字/逐词对时 → 按旁白关键词出动画 → 逐帧渲染 → 动感配乐卡点 + 音效 → 封面。支持中英双语字幕，16:9、3:4、9:16、1:1，也能不配音只配乐。当用户说「手绘风格视频」「白板动画」「黑板风格」「粉笔字动画」「水彩风格视频」「蓝图风格」「笔记本手写风」「蜡笔风」「漫画风格视频」「软木板」「水墨风格」「国风动画」「霓虹风格」「白板手绘动效」「手绘动画介绍产品」「剪贴风格」「拼贴风格视频」「collage video」「whiteboard animation」「用手绘风格介绍 XX」时触发。"
---

# 手绘动效视频

把一段旁白做成白板手绘动画：**lines.json（一句一场）→ 配音 → scenes.mjs（每场画面）→ 逐帧渲染 → 混音 → MP4**。

画面全是 HTML + SVG，由按时间推进的运行时驱动，无头 Chrome 逐帧截图。所以字是清楚的、每一帧都能复现，改一句话只要重跑那一句。

## 这套风格长什么样

| 元素 | 做法 |
|---|---|
| 字 | 全部用手写字体「小赖」（Excalidraw 的中文字体，OFL），标题和标注按字一个个写出来（`fx: "write"`） |
| 线 | rough.js 生成抖动的线稿，加粗、圆头，像马克笔，按顺序一笔笔画出（`fx: "draw"`） |
| 笔 | 写字、画线时一支马克笔跟着笔尖走，写完停 0.3 秒淡出（`config.pen`） |
| 标注 | 荧光笔 `R.mark`、双笔下划线 `R.under`、圈框 `R.boxAround`、双圈 `R.circle`、斜线涂色 `R.hatch`、强调线 `R.burst` |
| 素材 | **剪贴画为主**：真实界面、照片、视频片段剪下来贴上去，白边 + 投影 + 胶带 + 轻微歪斜（`cut()` `photo()` `sticker()` `banner()` `notif()` `app()`，见下节）；旧的手绘细框截图 `pin()`、视频 `clip()`、局部放大 `lens()`、logo `logo(src, h, { ink: true })`、便利贴 `note()` 也都还在 |
| 界面 | 用真实界面剪贴，不用手绘线框画手机、通知、消息（看着简陋）。手绘的 `phone()` `browser()` `.card` `.bubble` 只在讲纯概念、没有任何真实界面时才用 |
| 转场 | 镜头在白板上横移到下一块（`"transition": "pan"`），或淡入淡出（`"fade"`），或无限画布（`"canvas"`，见下）；有 beats.json 时转场卡在配乐拍点上 |
| 声音 | 旁白 + 配乐（说话时自动压低）+ 音效：转场 whoosh、弹出 pop、写字画线时的马克笔声 |
| 字幕 | 单语，或中英双语（主行中文、副行英文，`capMain` 可换） |
| 颜色 | 墨色 + 一种强调色（`config.accent`，做产品时用品牌色），不用渐变、不用 emoji |
| 风格 | `config.theme` 换整套纸面、墨色、线条质感和笔（见下表），场景代码不用改 |

### 十种风格（`"theme"`）

| theme | 画面 | 笔 | 适合 |
|---|---|---|---|
| `whiteboard`（默认） | 白板 + 马克笔，蓝色强调 | 马克笔 | 产品介绍、功能讲解 |
| `chalkboard` | 墨绿黑板、木框、粉笔擦过的灰雾；字和线带粉笔颗粒，黄粉笔强调 | 粉笔 | 讲原理、课程、知识科普 |
| `watercolor` | 米色水彩纸 + 纸纹；墨线微抖，框和圈画完自动晕一层淡彩（`R.wash` 也能单独铺色块） | 水彩笔 | 故事、旅行、品牌片、温和的科普 |
| `blueprint` | 深蓝底 + 网格，白色细线几乎不抖，黄色标注 | 铅笔 | 架构、流程、技术方案、硬件 |
| `notebook` | 横线笔记本、红色页边线；蓝色圆珠笔写字，红笔圈重点 | 圆珠笔 | 学习笔记、复盘、清单、教程 |
| `kraft` | 牛皮纸纤维 + 粗蜡笔，线和字带蜡的颗粒，红蜡笔强调 | 蜡笔 | 亲子、生活方式、手作、轻松的科普 |
| `comic` | 粗黑线几乎不抖，每场一圈分格框，标题重点黄底黑框，便利贴变对白气泡，截图带硬投影 | 马克笔 | 讲故事的产品片、反转、梗 |
| `cork` | 软木板 + 木框，截图和便利贴像钉在板上（有投影），红色强调像红线 | 马克笔 | 案例拆解、复盘、调查、线索梳理 |
| `inkwash` | 宣纸纤维，墨线边缘洇开，框和圈自动晕淡墨，朱砂红强调 | 毛笔 | 国风、传统文化、历史、诗词 |
| `neon` | 近黑底，线和字发白光、粉色强调发粉光，截图带霓虹边 | 霓虹笔 | 科技发布、游戏、夜间感的预告片 |

- 深色底（chalkboard、blueprint、neon）会把场景里写死的白底卡片、浅色代码块变成只有描边，便利贴变成强调色框。新写场景时背景用 `var(--card)`，文字颜色用 `INK`/`GRAY`（随风格变），不要写死 `#fff`、`#1f1f22`。
- `config.accent` 可以覆盖风格自带的强调色；不写就用风格自带的。
- 水彩、水墨里不想要自动淡彩的框：`R.rect(..., { wash: false })`；指定颜色：`{ wash: "#E0A458" }`。
- 例子：`examples/styles/` 是同一段开场在十种风格下的样子。
- 新加风格：`scripts/engine/themes.mjs` 加一项（墨色、纸色、线宽倍数、抖动倍数、笔），`style.css` 加 `.th-<名字>` 的纸面纹理和组件样式，质感滤镜写在 themes.mjs 的 FILTERS 里。

## 剪贴画（产品片、案例片默认用这一套）

白板上贴的是**真东西**：发布视频里剪下来的界面、真实的手机和通知、人物照片、App 图标、产品实拍、新闻截图、视频片段。手绘只负责把它们串起来：写标题、画箭头、圈重点、打勾、下划线、写批注。观众一眼看到「这是真的产品」，又能跟着笔看懂重点。

**硬要求**

1. **每场至少一块真实素材**，全片三分之二以上的场有两块以上。只有手绘字和手绘图标的场全片不超过两场（通常是收尾或纯概念）。
2. **手机、通知、消息、按钮、聊天、看板这些界面一律用真的**：官方视频/截图剪下来；实在没有就用 `notif()` 这类按系统真实样式渲染的组件 + 真实 App 图标，**不要用手绘线框画界面**。
3. **人、地点、实物用照片**：讲到「团队」「用户」「门店」「咖啡店」「医生」就贴一张照片（拍立得 `photo()`，底部手写名字），不要画小人。
4. **能动的就用视频**：演示操作、产品动效，用 `cut("xx.mp4", …, { at })` 贴一段 3–6 秒的视频剪贴，比静帧有说服力。
5. **剪贴的样子**：白边 8–14px、柔和投影、1–2 条胶带、旋转 -4°～4°（相邻两块方向相反）；可以互相压一点边，像真的一层层贴上去；同一场里大小错开（一大一小一个图标）。
6. **贴上去不画出来**：素材用 `pop`/`up` 出场、`pen: false`，配一声 pop，动感配乐时用 `c.beat()` 吸到拍点上；手绘标注紧跟着画在素材上（圈出要讲的那一行、箭头指向按钮）。
7. **一块只讲一件事**：从 4K 原图裁出要讲的那一块（一条通知、一段对话、一张卡片），不要把整屏截图缩小贴上去，贴上后图里的字要 ≥ 16px。
8. **不编造产品界面**：产品里没有的功能不做假界面；`notif()` 里写的示例消息只用来表现「消息很多」这类场景，产品自己的界面必须是官方素材。

**组件**（`engine/lib.mjs`，都返回 HTML，用 `ON(x, y, 组件, 时间)` 放到位置上）

| 组件 | 用在 |
|---|---|
| `cut(src, w, { r, h, pad, tapes, at })` | 剪下来的一块界面、截图、新闻、视频（src 是 mp4 就是视频剪贴）。`tapes`: `"corners"` `"top"` `"side"` `false` |
| `photo(src, w, { r, h, caption, pos })` | 拍立得：人像、场景、实物，底部手写一行说明 |
| `sticker(src, w, { r, edge, tapes })` | 透明底的抠图（整台手机、实物、人物），一圈白边像贴纸 |
| `banner(src, w, { r })` | 抠掉底色的通知横幅、消息气泡原图，放在白色圆角卡上 |
| `notif(icon, app, 标题, 正文, { w, r, time, dark })` | iOS 样式的系统通知，配真实 App 图标 |
| `app(src, 尺寸, { r })` | 真实 App 图标（圆角 + 投影），「连接了哪些工具」用一排 |

素材怎么拿见 ①，场景写法见 `references/scene-patterns.md`「剪贴画」，完整例子 `examples/duet/`。

## 流程

`$S` 指本 skill 目录。首次使用在 `$S/scripts` 跑 `npm i`，再跑 `bash $S/scripts/assets/fetch_audio.sh` 下载配乐和音效（Mixkit 授权不允许随仓库分发）。

### ⓪ 立项（能默认就默认，缺了才问）

| 项 | 默认 |
|---|---|
| 比例 | 产品介绍 16:9（1920×1080）；发小红书/视频号 3:4；抖音 9:16 |
| 时长 | 产品介绍 60–100 秒（10–14 句）；讲解类 2–4 分钟 |
| 语言 | 中文旁白；要英文就 `voice.language: "en"`，音色 Ryan（有劲的男声）或 Aiden（阳光的美式男声） |
| 声音 | 产品宣传片默认英文旁白 Ryan + 中英双语字幕；中文旁白用 Dylan。**不用 Serena**（用户反馈很怪）。用户给了自己的录音才克隆 |
| 字幕 | 跟旁白同语言；英文旁白默认做中英双语（lines.json 写 `{"say": 英文, "sub": 中文}`） |
| 强调色 | 产品的品牌色；没有就 `#2456F5` |
| 配乐 | 轻快的尤克里里（默认，比人声低 14dB）；要动感卡点就用 `pick-it-up.mp3` / `me-and-you.mp3` / `sports-highlights.mp3`，`bgmLufs` 调到 -20 左右（配乐要听得见，-25 偏小），跑 `beats.py` |
| 音效 | 默认开（`"sfx": false` 关掉） |
| 笔速 | `"pace": 1`；觉得笔太快就调到 1.4–1.8（写字、画线整体变慢） |

```bash
bash $S/scripts/init.sh <项目目录> 16:9     # 建项目：engine/、config.json、lines.json、scenes.mjs、cover/
```

### ① 素材

- **介绍产品**：先确认产品真实存在、发布时间和可用范围（官网 + 官方公告），事实只用官方说过的。然后**尽量多收真实素材**，按这个顺序找：
  1. **官方发布视频**（X/YouTube/官网），这是界面素材最多的地方。下最高清的版本：X 上的视频常只有 720p，同一条多半在 YouTube 有 4K：
     ```bash
     yt-dlp --cookies-from-browser chrome -F <YouTube链接>                       # 看格式，挑最高的视频流（如 313 = 4K webm）
     yt-dlp --cookies-from-browser chrome -f 313 -o src/launch.webm <链接>
     bash $S/scripts/assets/frames.sh src/launch.webm src/sheet.jpg 2            # 每 2 秒一张拼成总览，用 Read 看着挑
     bash $S/scripts/assets/cutout.sh src/launch.webm - 20 pick 30 30            # 取底色
     bash $S/scripts/assets/cutout.sh src/launch.webm assets/ui/notif.png 12.4 1480:300:1180:220 0xCCCADA   # 某一秒、裁一块、抠底色
     bash $S/scripts/assets/clip.sh src/launch.webm assets/ui/demo.mp4 31 4 1280 crop=1600:1200:1100:500     # 剪一段视频贴
     ```
     要剪的：通知、聊天对话、看板/卡片、关键按钮、整台手机（抠成透明底给 `sticker()`）、出镜的真人（给 `photo()`）、操作演示片段。
  2. **发布文章和产品页**：`node $S/scripts/assets/fetch_site.mjs https://产品官网 <项目>/assets/site`（截图 + 配图 img-* + logo 候选）。产品首页常只有一句口号，**真正的界面图多在发布文章里**，两个页面都抓。集成/连接器配图里能裁出真实 App 图标。
  3. **logo 和 App 图标**：透明底原件；只在宣传图里有时用 `python3 $S/scripts/assets/extract_logo.py` 抠。旁白提到的第三方工具（Gmail、Slack、Shopify…）用它们真实的图标。
  4. **照片**：人物优先用发布视频里出镜的人；地点、行业场景、实物用 Wikimedia Commons、Unsplash、Pexels 这类可商用图库，在 scenes.mjs 顶部注释写出处。
  5. **新闻、推文、评论截图**：讲「大家怎么说」「数据」时贴原文截图比手写强。
  - 收完列一张表：每场用哪几块素材（scenes.mjs 顶部注释里写清每块的出处）。哪场找不到真实素材，先回去再找一轮，最后才用 `notif()` 或手绘。
- **讲解类**：用户给的文章/文件夹，抄事实和例子，标出哪句用哪张图。
- 把要用的图放进 `<项目>/assets/`，scenes 里用相对路径 `assets/xxx.png`。第三方截图、视频、照片只放在项目目录，不进 skill 仓库。

### ② 旁白 → lines.json

一句一场，每句 20–50 字，一共 10–14 句（产品介绍）。结构：**一个具体的痛点 → 产品登场（一句话说清是什么）→ 3–6 个能力，每个带一个具体例子 → 一个完整的使用场景 → 怎么用上 → 收尾一句**。

- 口语，短句，不喊口号，不用「赋能」「颠覆」「一站式」。
- 英文产品名写 `{字幕写法|配音读法}`：`{Grok Bot|格罗克波特}`、`{Cursor|科瑟}`。字幕和 `c.at()` 用前者，配音念后者。常见词（AI、iOS、CRM）先不标，校验出错再标。
- **英文旁白 / 双语字幕**：每句写成对象，竖线 `|` 切字幕块，sub 的块数和 say 一样，每块一屏字幕（英文 ≤ 8 个词）：
  ```json
  { "say": "Grok Bot closes that last ten percent.|It's a team of always-on AI teammates|that actually finish the job.",
    "sub": "Grok Bot 想补上最后这一成|它是一支全天候在线的 AI 队友|能把活儿直接做完" }
  ```
  英文稿的 `c.at()` 关键词写英文（`c.at("ninety percent")`）。画面上的手写字可以保留中文（双语字幕已经覆盖），也可以写英文。
- 每句里留出画面要「接」的关键词：说到「收件箱」时收件箱图标出来，所以这几个字要原样出现在稿子里。

### ③ 配音 + 对时

```bash
python3 $S/scripts/voice/tts.py <项目>                       # yovoice 逐句配音 → voice_raw/ → 去静音、压长停顿、变速 → voice/
HF_HUB_OFFLINE=1 ~/.cache/promo-tts/.venv/bin/python $S/scripts/voice/align.py <项目>   # 识别回来对稿 + 逐字时间 → align.json
```

align.py 列出对不上的句子：漏字、英文名读错的，改读法或换种子：
```bash
python3 $S/scripts/voice/tts.py <项目> 3 seeds=7,11,23 out=cand   # 第 3 句出三个候选，听完把好的拷成 voice_raw/s03.wav
python3 $S/scripts/voice/tts.py <项目> post 3                     # 再后处理成 voice/s03.wav
```
不配音：`config.json` 写 `"voice": false`，时长按字数估，只有字幕和配乐。用户自己的声音：见 `references/voice.md`。

动感卡点：换配乐后测一下节拍，build 会把每场结尾往后对齐到下一拍（最多多出一拍），转场的 whoosh 就落在拍点上：
```bash
python3 $S/scripts/voice/beats.py <项目>                    # → beats.json（BPM、第一拍）
python3 $S/scripts/voice/beats.py --probe a.mp3 b.mp3       # 挑曲子：clarity > 0.6 的拍子清楚
```

### ④ 画面 → scenes.mjs

一句一个函数，`c.at("关键词")` 拿到旁白念到这个词的时刻。配了动感配乐时，素材弹出、打勾这类短动作用 `c.beat(时间)` 吸到最近的拍点（默认窗口 0.35 秒，离拍点远就不动）。组件、版面坐标、各种场景写法见 **`references/scene-patterns.md`**，完整例子 `examples/grokbot/scenes.mjs`。

```bash
node $S/scripts/engine/build.mjs <项目>                 # 生成 index.html，打印总时长
node $S/scripts/engine/render.mjs <项目> --stills ends  # 每场结尾一张 → contact.jpg
node $S/scripts/engine/render.mjs <项目> --stills mid   # 每场 35%/70% 各一张
```

用 Read 看 contact.jpg 逐场查：每场有没有真实素材、剪贴有没有歪斜和胶带、手绘标注是不是落在素材上要讲的那块；字和图有没有重叠、出界；结尾帧东西都出完了没（没出完就把时间提前，最后一个动作挂在句子中段的词上）；画面和旁白说的是一回事；有没有超过 2 秒什么都不动。改完再截，直到干净。浏览器打开 `index.html?t=12.5` 能停在任意一秒看。

### ⑤ 渲染、混音、封面

```bash
node $S/scripts/engine/render.mjs <项目>          # 30fps 逐帧，1 分半约 3 分钟
# 封面：改 <项目>/cover/cover.mjs 顶部的 C（标签、两行标题、logo、一张截图、批注）
node $S/scripts/cover/shot.mjs <项目>             # → cover/cover.png + thumb.png（300px 宽也要读得清）
python3 $S/scripts/voice/mix.py <项目> "<标题>"    # 人声 -16 LUFS + 配乐 + 音效 + 嵌封面 → out/<标题>.mp4
```

抽 5 帧看一眼，ffprobe 确认分辨率、时长、有音轨。

### ⑥ 交付

给用户：成片路径、封面路径、时长、比例；用了哪个音色、对时校验结果（哪几句改过读法或换过种子）；素材出处（哪张图来自哪个页面）；需要用户亲耳确认的地方。做别人家的产品只用于演示、内部提案或个人分享，不冒充官方发布。推到任何外部平台都要用户明确说了才做。

## 参考

- `references/scene-patterns.md`：版面坐标、组件清单、动画参数、10 种场景写法、自检
- `references/voice.md`：音色、读音标注、换种子、用自己的声音、校验环境
- `references/pitfalls.md`：踩过的坑
- `examples/grokbot/`：SpaceXAI Grok Bot 产品介绍，中文旁白（16:9，13 场，素材来自 x.ai/bot 和发布文章）
- `examples/codemotion/`：讲解类例子，把一篇文章做成 3 分半的讲解视频，每种工具配一段演示动图 + 一段 YouTube 案例片段（`clip()`）
- `examples/duet/`：**剪贴画例子**，Claude Duet 宣传片：界面、手机、人像全部从官方 4K 发布视频剪下来贴上，英文旁白 + 双语字幕，转场和弹出都卡拍
- `examples/grokbot-en/`：同一个片子的英文旁白 + 中英双语字幕 + 动感配乐卡点 + 音效 + 慢笔速版本
