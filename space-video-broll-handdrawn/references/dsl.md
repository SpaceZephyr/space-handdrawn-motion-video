# beats.mjs 写法
## 顶层
```js
export default {
  source: "原片.MOV", videoDur: 222.6,
  frame: { w: 1640, h: 2160 },                   // 原片尺寸
  safe: { x: 120, y: 326, w: 1400, h: 1180 },    // 卡片在原片里的位置
  theme: "whiteboard",                           // whiteboard notebook chalkboard blueprint kraft inkwash
  accent: null,                                  // null 用纸面自带强调色；品牌内容填品牌色
  sfx: { below: 17 },                            // false 全关；in:false 关入场声；rel:{ding:.5} 调单个音效
  beats: [ ... ],
};
```
## 每一段
| 字段 | 说明 |
|---|---|
| `id` | 字母开头，唯一 |
| `at` | 原片里出现的秒数 |
| `dur` | 停留秒数（到这段话讲完） |
| `kicker` | 左上角小标签，如 `"03 · 之前的方法"`（可省） |
| `title` | 手写标题，一句完整观点，≤ 18 字；`titleSize` 默认 64；`underline: false` 去掉双下划线 |
| `rot` | 纸的歪斜角度，默认 ±0.7° 交替 |
| `sfx` | `[["ding", "@20.9"], ...]`，段内重点音效 |
| `sfxIn` | `false` 关掉这一段的入场纸张声 |
| `draw` | `(d) => [元素...]`，可以返回嵌套数组 |
## 时间
每个元素的 `t`：
- 数字：相对本段开始的秒数（`t: 1.4`）
- `"@39.2"`：原片绝对时间，直接抄逐字稿
- 不写：接在上一个元素后面（画完再画下一个）。带 `label` 的框/图标，标签自动接在线框后面
`d`：动作时长。写字默认按字数（每字 0.085s，0.45–2.6s），线框 0.8s，箭头 0.6s，图标 0.9s。
`pen: false`：这个元素不显示跟随的笔（一排图标快速出现、或同一时刻有别的东西在写时用）。
## 组件（`d.xxx`）
坐标都是卡片内部像素。`id` 可选，要 `focus` / `hide` / `tint` 的元素必须给。
| 组件 | 说明 |
|---|---|
| `text(x, y, 字, { size, align, w, color, fx, lh })` | 手写字。`align: "center"` 时 x 是中心、`w` 是宽度（超出自动换行）。`fx`: `write`（默认，逐字写）`fade` `up` `pop`。`\n` 换行 |
| `box(x, y, w, h, { label, labelSize, fill, color })` | 手绘方框。`fill: "hatch"` 斜排线、`"solid"` 淡色块 |
| `ellipse(cx, cy, w, h, { label, fill })` | 手绘椭圆 |
| `line([[x,y], [x,y], ...], { color, w })` | 线，3 个点以上是曲线 |
| `arrow([x1,y1], [x2,y2], { bend, head, color })` | 弧形箭头，`bend` 正数往左弯、负数往右弯、0 直线 |
| `icon(名字, cx, cy, { size, label, labelSize, fill })` | 手绘图标，见下表 |
| `circle(cx, cy, w, h)` | 强调色双圈，圈住要讲的东西 |
| `under(x, y, w)` | 强调色双下划线 |
| `mark(x, y, w, { h })` | 荧光笔（在文字下层），y 取文字中线偏下 |
| `check(x, y, { s })` / `cross(x, y, { s })` | 打勾 / 打叉 |
| `hatch(x, y, w, h)` | 一块斜排线色块 |
| `note(x, y, 字, { w, rot, bg })` | 便利贴，贴上去（不画） |
| `img(路径, x, y, w, { rot, tape, caption })` | 截图/照片剪贴：白边 + 胶带 + 投影，路径相对项目目录 |
| `stamp(x, y, 字, { color, rot, size })` | 红色印章，砸下来（配 `thud`） |
| `count(x, y, from, to, { size, prefix, suffix, align, w, d })` | 数字滚动 |
| `bar(x, y, w, h, { pct, fillD })` | 手绘进度条：画外框，再按 pct 刷满排线 |
| `focus(要亮的 id, 一组 id, { t, dim })` | 点亮一项、压暗同组其它项（dim 默认 0.28） |
| `reset(一组 id, { t })` | 全部恢复 |
| `hide(id 们, { t })` | 淡出（比如印章演完、让位给下一个画面） |
| `tint(id 们, { t, color })` | 线和字变成强调色 |
**id 前缀匹配**：`focus("s0", ...)` 会同时作用于 `s0`、`s0-l`（标签）、`s0-i`、`s0-r`……一组元素用同一个前缀起名，就能一起点亮/隐藏。
图标（100×100 网格，`size` 是像素）：`folder` `doc` `user` `users` `cloud` `gear` `bolt` `chat` `laptop` `phone` `db` `lock` `star` `clock` `branch` `bulb` `bot` `globe` `search` `video` `chart` `link` `box` `code` `mail` `heart` `flag` `terminal`。要新图标就在 `scripts/hd.mjs` 的 `ICONS` 里加一项（只用 M L H V C Q Z，不用 A）。
## 字号（卡片 1400 宽时）
| 用途 | 字号 |
|---|---|
| 标题 | 60–68 |
| 大数字 | 120–160 |
| 框内标签、主文字 | 38–52 |
| 图标标签、说明 | 32–36 |
| 最小（英文名、注释） | 30 |
卡片宽度不是 1400 时按比例换算。
## 版式配方（1400×1180 卡片，内容区 y 240–1120）
**放射**：中心 `ellipse(700, 460, 300, 190, { fill: "hatch", label })`，外圈 `ellipse(700, 460, 640, 330)`，下方两个 `box` 并排（x 110 / 750，宽 540），讲到哪个 `focus` 哪个。
**三栏逐个点亮**：三个 `box(60 + i*445, 260, 390, 600)`，每栏 icon（y 400）→ 角色名（y 520，52px）→ 英文名（y 610，30px 强调色 fade）→ 说明（y 680，32px 灰 fade）；讲到哪栏 `focus` 哪栏。
**计数 + 网格**：`count(700, 250, 0, 5000, { suffix: "+", size: 150, align: "center", w: 800 })`，下一行说明，再两行图标网格（y 640 / 860，间距 300），底部 `mark` + `text` 写结论。
**流程**：左右两个大图标（x 230 / 1170），中间 `arrow`，箭头上方写动作；下游再分叉 3 个小箭头到 3 个设备图标。
**拦截**：`box` 写被拦的东西 → 红色 `arrow` → `cross` → `stamp("超限文件，拦截")` 配 `thud` → 讲完 `hide` 掉，原位置换成下一个画面。
**清单**：左对齐 `text` 每行一项（y 每行 +110），讲到一项就在行首 `check`，当前项 `mark` 荧光笔。
**前后对比**：左右两个 `box`（「以前」灰色、「现在」强调色），中间竖线 `line`，先画左边再画右边，最后 `circle` 圈住右边的关键词。
