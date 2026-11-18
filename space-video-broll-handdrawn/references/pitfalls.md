# 踩过的坑
## 时间和节奏（用户反馈过）
- **B-roll 停留太短，没看完就没了**：每段持续到这段话讲完，内容出齐后至少停 3 秒。build 会报「离退场只剩 Xs」，看到就加长 `dur` 或把动作提前
- 讲解拉得长时用 `focus` 逐项点亮，不要让纸早早退场；也不要为了填时间堆元素
- 动作挂在逐字稿的词上（`"@时间"`），不要按「每个 0.5 秒」平均排
## 音效（用户反馈过）
- **音效太大声，盖住人声**：口播原片人声常常只有 -11dB 峰值，音效按 0.3 的音量混进去就和人声一样响。compose.mjs 先测人声峰值再压 17dB，不要手写固定音量
- 音效要少：每段入场一个，加 0–2 个重点。不要每个元素都 pop、不要出场 whoosh、不要连续 tick
## HyperFrames
- 用本机缓存的 CLI（`hf.sh` 会找），不要每次 `npx hyperframes` 联网装新版
- `snapshot` 必须带 `--describe false`，否则有 GEMINI_API_KEY 时会把截图发给外部服务
- `render --format mov` 出 ProRes 4444 透明片，很大（2 分钟 ≈ 3–4GB），放临时目录
- 时间轴回调里不要量 DOM（getBoundingClientRect / offsetWidth）：渲染是多 worker 乱序 seek，量到的值不可靠。本 skill 的笔尖轨迹和字的位置都在 build 时用 harfbuzz 和 rough.js 算好
- lint 的 sub-composition 系列 warning（timeline_track_too_dense、nested_structure_needs_subcomposition）可以忽略，error 必须为 0
- 不要给元素加 `immediateRender: false`：入场前会先露出来
## 线条
- 圆头线帽在 dash 起点会漏出小点，runtime 已经让没轮到的线整条隐藏；自己加 SVG 时也要这样
- 同一时刻两个元素都在 `write`/`draw`，笔会在两处来回跳：错开时间，或给其中一个 `pen: false`
- 一排图标快速出现时统一 `pen: false`
## 字体
- 小赖（Xiaolai）22MB，build 时按用到的字做子集（约 30KB）。找字体顺序：`HD_FONT` 环境变量 → 本 skill `assets/fonts/` → 仓库根目录 `assets/fonts/` → `~/.claude/skills/space-handdrawn-motion-video/assets/fonts/`
- 本 skill 放在 space-handdrawn-motion-video 仓库的子目录里，直接用仓库根目录那份字体，不再存第二份
## 事实
- 只画口播里说过的事，数字照原话；口播说错的（例：GitHub 单文件上限实际 100MB，口播说 500MB）画面上不写那个数，交付时告诉用户
- 示意性的内容（日志行、示例消息）交付时说明是示意
## focus（11月17日 实测）
- `focus` / `reset` 只作用于已经入场的元素（build 按入场时间过滤）。以前压暗会把还没出现的说明文字从 0 提到 0.28，提前露出淡影
- 一排逐项点亮的格子，说明文字用「讲到才 fade」：`t` 和这一项的 `focus` 同一时刻
## 版式
- 窄栏（宽 250–300）里的多行说明手动 `\n` 断句，自动换行容易剩一个字单独一行
- `circle` 只圈一行字（高 100–120），圈两行会压到上面的字
- 屏幕录制类口播（没有烧录字幕、人像窗在右下角）安全区底边要比人像窗顶边高 60px 以上

## 全屏白底版式
- 人像窗是圆角方框（接近 squircle），洞的圆角 r 要比看上去大（11/17 用 128），每边再缩进 6–10px，否则四角外漏出原画面。检查方法：snapshot 叠回原片同一时刻放大看四角
- 相邻两段白底接缝会闪一帧原片：B-roll 渲 30fps、原片 60fps 时，段尾最后半帧没有画面盖住。compose.mjs 已把 trim 多留 0.1s；查接缝要逐帧看（`-frames:v 7` 从接缝前 0.06s 起），隔 0.05s 抽一帧会漏掉
- 用 signalstats 判断“有没有盖住”时，别量原片本来就是白色的区域（文档页），量顶部浏览器栏这种原片有深色的地方
