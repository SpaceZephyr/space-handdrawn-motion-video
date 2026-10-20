---
name: space-handdrawn-motion-video
description: "白板手绘风格的动效视频：标题和字一个个手写出来，线条像马克笔一笔笔画出，一支马克笔跟着笔尖走，截图用胶带贴在白板上，场与场之间镜头在白板上横移。适合产品介绍、功能讲解、知识科普。流程：素材（可从官网抓图）→ 一句一场的旁白（中文或英文）→ 本地 TTS 配音（yovoice，内置音色，不用克隆谁的声音）→ 逐字/逐词对时 → 按旁白关键词出动画 → 逐帧渲染 → 动感配乐卡点 + 音效 → 封面。支持中英双语字幕，16:9、3:4、9:16、1:1，也能不配音只配乐。当用户说「手绘风格视频」「白板动画」「白板手绘动效」「手绘动画介绍产品」「whiteboard animation」「用手绘风格介绍 XX」时触发。"
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
| 素材 | 真实截图用 `pin()` 贴胶带，视频片段用 `clip()`（文章里的演示动图、引用的案例视频）；局部放大 `lens()`；logo 原件可压成墨色 `logo(src, h, { ink: true })`；便利贴 `note()` |
| 界面 | 手机、浏览器、卡片、按钮、聊天气泡都是不规则圆角的粗边框，不用阴影 |
| 转场 | 镜头在白板上横移到下一块（`"transition": "pan"`），或淡入淡出（`"fade"`）；有 beats.json 时转场卡在配乐拍点上 |
| 声音 | 旁白 + 配乐（说话时自动压低）+ 音效：转场 whoosh、弹出 pop、写字画线时的马克笔声 |
| 字幕 | 单语，或中英双语（主行中文、副行英文，`capMain` 可换） |
| 颜色 | 墨色 + 一种强调色（`config.accent`，做产品时用品牌色），不用渐变、不用 emoji |

## 流程

`$S` 指本 skill 目录。首次使用在 `$S/scripts` 跑 `npm i`，再跑 `bash $S/scripts/assets/fetch_audio.sh` 下载配乐和音效（Mixkit 授权不允许随仓库分发）。

### ⓪ 立项（能默认就默认，缺了才问）

| 项 | 默认 |
|---|---|
| 比例 | 产品介绍 16:9（1920×1080）；发小红书/视频号 3:4；抖音 9:16 |
| 时长 | 产品介绍 60–100 秒（10–14 句）；讲解类 2–4 分钟 |
| 语言 | 中文旁白；要英文就 `voice.language: "en"`，音色 Ryan（有劲的男声）或 Aiden（阳光的美式男声） |
| 声音 | 中文用 yovoice 内置音色 Serena（温和女声），男声 Dylan。用户给了自己的录音才克隆 |
| 字幕 | 跟旁白同语言；英文旁白默认做中英双语（lines.json 写 `{"say": 英文, "sub": 中文}`） |
| 强调色 | 产品的品牌色；没有就 `#2456F5` |
| 配乐 | 轻快的尤克里里（默认，比人声低 14dB）；要动感卡点就用 `pick-it-up.mp3` / `me-and-you.mp3` / `sports-highlights.mp3`，`bgmLufs` 调到 -25 左右，跑 `beats.py` |
| 音效 | 默认开（`"sfx": false` 关掉） |
| 笔速 | `"pace": 1`；觉得笔太快就调到 1.4–1.8（写字、画线整体变慢） |

```bash
bash $S/scripts/init.sh <项目目录> 16:9     # 建项目：engine/、config.json、lines.json、scenes.mjs、cover/
```

### ① 素材

- **介绍产品**：先确认产品真实存在、发布时间和可用范围（官网 + 官方公告），事实只用官方说过的。官网图抓下来挑：
  ```bash
  node $S/scripts/assets/fetch_site.mjs https://产品官网 <项目>/assets/site   # 截图 + 正文配图 img-* + logo 候选
  ```
  产品首页常只有一句口号，**真正的界面图多在发布文章里**，两个页面都抓。logo 要透明底原件；只在宣传图里有时用 `python3 $S/scripts/assets/extract_logo.py` 抠。界面图太大时用 PIL 裁出要讲的那一块（聊天记录、任务清单、侧边栏），一张图只讲一件事。
- **讲解类**：用户给的文章/文件夹，抄事实和例子，标出哪句用哪张图。
- 把要用的图放进 `<项目>/assets/`，scenes 里用相对路径 `assets/xxx.png`。

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

一句一个函数，`c.at("关键词")` 拿到旁白念到这个词的时刻。组件、版面坐标、各种场景写法见 **`references/scene-patterns.md`**，完整例子 `examples/grokbot/scenes.mjs`。

```bash
node $S/scripts/engine/build.mjs <项目>                 # 生成 index.html，打印总时长
node $S/scripts/engine/render.mjs <项目> --stills ends  # 每场结尾一张 → contact.jpg
node $S/scripts/engine/render.mjs <项目> --stills mid   # 每场 35%/70% 各一张
```

用 Read 看 contact.jpg 逐场查：字和图有没有重叠、出界；结尾帧东西都出完了没（没出完就把时间提前，最后一个动作挂在句子中段的词上）；画面和旁白说的是一回事；有没有超过 2 秒什么都不动。改完再截，直到干净。浏览器打开 `index.html?t=12.5` 能停在任意一秒看。

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
- `examples/grokbot-en/`：同一个片子的英文旁白 + 中英双语字幕 + 动感配乐卡点 + 音效 + 慢笔速版本
