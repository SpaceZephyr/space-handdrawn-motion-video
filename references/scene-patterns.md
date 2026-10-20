# 画面：版面、组件、场景写法

## 版面

坐标都是整张画布的像素（`lib.mjs` 导出 `W` `H` `LAND`）。

| 区域 | 16:9（1920×1080） | 3:4（1080×1440） |
|---|---|---|
| 角标 `.tag` | left 110, top 64 | left 80, top 74 |
| 标题 `.title` | left 110, top 116，76px，单行 | left 80, top 128，66px，可折行 |
| 舞台（放画面主体） | y 250–930 | y 270–1220 |
| 字幕（自动） | 底部 40px 起，44px | top = H−172，46px |

9:16、1:1 走竖版规则（`.port`）。字幕区上面留 60px 以上，别让手写字压到字幕。

## 场景函数

```js
c => head(c, "", "每个 Bot 都有一台<em>自己的电脑</em>") +                 // 角标（可空）+ 一个字一个字写出来的标题
  ON(930, 270, pin("assets/ui-computer.png", 870, 580), c.t(.3)) +       // 0.3 秒时贴上截图
  S(ICON.cloud(420, 400, 380), c.at("云端电脑") - .5, .7) +              // 念到「云端电脑」前 0.5 秒开始画云
  T(330, 530, "云端电脑", c.at("云端电脑") + .2, 44, { color: ACC }) +    // 手写字，44px，强调色
  S(R.circle(1365, 640, 420, 90), c.at("登录工具") + .2, .6)            // 在截图的登录框上画圈
```

`c` 的方法：`c.t(秒)` 本场开头往后几秒；`c.at("词", 偏移)` 旁白念到这个词的时刻（有 align.json 时是实测时间）；`c.vs / c.ve / c.end` 旁白开始、结束、本场结束。

例子里在 scenes.mjs 顶部定义了三个简写，新项目照抄：

```js
const S = (inner, at, d, out) => sk(inner, A({ at, fx: "draw", d, out }));   // 一层线稿，按顺序画出
const ON = (x, y, inner, at, fx = "up", st = "") => `<div ${A({ at, fx, pen: false })} style="position:absolute;left:${x}px;top:${y}px;${st}">${inner}</div>`;  // 放一块东西
const T = (x, y, text, at, size, o = {}) => write(x, y, text, at, { size, ...o });  // 手写字
```

## 动画 `A({...})`

| 参数 | 含义 |
|---|---|
| `at` | 开始时间（绝对秒） |
| `fx` | `write` 按字写出（标题、标注）；`draw` 线稿一笔笔画；`wipe` 从左擦出；`up` 上浮淡入（截图、卡片）；`fade`；`pop` 弹出（气泡、按钮、便利贴）；`type` 打字（配 `data-text`）；`count` 数字滚动（配 `data-count="0,36"`）；`ripple` 点击波纹；`none` |
| `d` | 时长。write 默认每字 0.09 秒（最多 1.6）、draw 0.9、up 0.55；write/draw 都会再乘 `config.pace`（笔速） |
| `out` | 到这个时间淡出 |
| `kf` | 关键帧 `[[t, {x, y, s, r, o}], …]`：移动光标、飞入、放大 |
| `pen` | `false` 时这一笔不出马克笔（截图、气泡这类「贴上去」的东西都关掉） |
| `cls` | 额外 class：`b` 强调色手写、`s` 灰色小字、`l` 大号、`xl` 特大 |

A() 自带 class 属性，元素上不要再写 `class=`，用 `cls`。

## 组件（`engine/lib.mjs`）

**线稿 `R`**（返回 path 串，用 `sk(串, A)` 或上面的 `S()` 包起来）：
`rect` `fillRect` `hatch`（斜线涂色，进度条、强调块）`ell` `fillEll` `line` `curve` `poly` `arrow`（2–3 个点的弯箭头）`check` `cross`
标注：`mark` 荧光笔（盖在字下面）、`under` 双笔下划线、`boxAround` 圈框、`circle` 双圈（圈截图里的重点）、`burst` 强调线

**线稿图标 `ICON.xxx(cx, cy, 大小, 颜色)`**：bulb doc mail chat user bot laptop phone cloud clock moon gear bug coin star lock globe code chart folder

**字**：`write(x, y, 文字, at, { size, color, d, out })` 写出来；`hand(x, y, 文字, A, { size, color })` 不写，配别的 fx；`head(c, 角标, 标题, { n })` 场景标题，`n` 是角标里的编号圈。

**素材**：
- `pin(src, w, h, { fit, pos, tapes })`：截图 + 手绘细框 + 两条胶带。`h` 不给按原比例；给了按 `pos` 裁（默认顶部）
- `lens(src, [x0, y0, x1, y1], 直径)`：截图某一块（0–1 比例）放进圆形放大镜
- `clip(src, w, h, { at, rate, from, loop, fit, pos, label })`：视频片段，和 pin 一样贴胶带。at 秒开始播，播完停在最后一帧（`loop: true` 循环）。片段先用 `bash $S/scripts/assets/clip.sh 源 输出.mp4 开始秒 时长 宽` 裁成全关键帧 mp4（GIF 也行），逐帧渲染时 runtime 会等每段 seek 完再截图
  - 选段：先 `ffmpeg -i 源 -vf "fps=1/8,scale=240:-1,tile=8x8"` 拼缩略图挑位置，裁完再抽首尾帧看一眼。**最后一帧要停在有用的画面上**（别停在口播人脸、转场卡），演示动画从空白开始的不要 loop
  - YouTube 下载：`yt-dlp --cookies-from-browser chrome --extractor-args "youtube:player_client=mweb" -f "bv*[height<=720]" --download-sections "*0-600"`；别人的视频只裁几秒做评论引用，画面下写「真实案例 · 作者」
- `logo(src, 高, { ink: true })`：logo 原件，`ink` 压成墨色（白色 logo 必须开）
- `note(x, y, 宽, 文字, A, { r, color, size })`：便利贴
- `tape(x, y, 角度, 宽)`：单独一条胶带

**手绘外壳的界面**：`phone(内部HTML, 样式)`、`browser(网址, 内部HTML, 样式)`，以及 class：`.card` `.chip`（`.on` 填强调色）`.btn`（`.acc`）`.bubble`（`.me` 是自己发的）`.note`。`cursor(A)` 光标配 kf 移动，`tap(x, y, at)` 点击波纹。

## 产品介绍的场景写法（`examples/grokbot/scenes.mjs`）

| 场 | 讲什么 | 画面 |
|---|---|---|
| 痛点 | 现在的做法卡在哪 | 手绘进度条涂到 90%，最后一格框起来打问号；下面「草稿 → 系统 → 发送按钮」三步，光标点发送 |
| 登场 | 一句话说清是什么 | 角标写来源和发布时间；logo 淡入；进度条补满打勾；一句定位写出来、画下划线 |
| 能力 + 截图 | 一个能力配一张真实界面 | 截图贴右边；左边画概念图（云里一台电脑）；三条能力逐条打勾；念到哪条就在截图上圈哪 |
| 对比画面 | 你不在时它在干活 | 左贴一张户外图「你在外面」；右边机器人 + 任务清单逐条打勾；最后弹出「批准吗？」气泡 |
| 消息式交互 | 怎么用 | 大截图居中；左边手机、电脑图标，箭头指向截图里的对话，圈出来 |
| 划掉旧做法 | 不用做什么 | 左边流程图画出来再整个打叉；右边一问一答两个气泡 |
| 结构图 | 多个角色怎么分工 | 左贴产品里的角色列表截图；右边总管画圈，箭头逐个分到四个图标 |
| 协作 | 角色之间怎么配合 | 三个机器人互相画箭头；右贴对话截图，用荧光笔标出角色名；最后「人」只拍板 |
| 三步流程 | 怎么教会它 | 截图里圈出按钮；左边三个图标「你做一遍 → 存成流程 → 下次自己跑」，箭头连起来 |
| 曲线 | 越用越好 | 便利贴写习惯；手绘坐标轴，曲线往上画；两个标签「先问你 / 直接做」 |
| 时间线 | 一个完整场景 | 横线上五个图标从「连夜」到「第二天批准」依次画出，下面贴真实结果截图 |
| 可用范围 | 怎么用上 | 设备图标 + 订阅档位标签 + 「测试版」圈框 + 便利贴写用量规则 |
| 收尾 | 再说一遍是什么 | logo + 定位句 + 下划线 + 网址标签 |

## 自检

- `render.mjs --stills ends` 看每场结尾：元素出完了吗？最后一个动作在场景结束前 0.5 秒完成。
- `--stills mid` 或 `--stills 5.2,9,40` 看中间：马克笔在不在笔尖；同一时刻有没有空场超过 2 秒。
- 重叠：手写字一个中文约等于字号宽，英文约 0.55 倍；手写字别压在截图和字幕上。
- 截图里要讲的那块够不够大：1920 宽的画面里截图文字小于 14px 就看不清，裁出局部再贴。
- 一场只有一种强调色；不出现 emoji；界面都是真实截图，不画产品里没有的功能。
