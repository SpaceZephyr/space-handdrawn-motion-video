# 例子：Grok Bot 英文版（16:9，112 秒，13 场）

和 `examples/grokbot` 同一套画面，改动：
- 英文旁白：yovoice `Ryan`，`voice.language: "en"`；第 2 句默认种子把 Grok Bot 念成 Ruck Buck，换种子 23。
- 中英双语字幕：lines.json 每句 `{ "say": 英文, "sub": 中文 }`，竖线切块；主行中文、副行英文（`capMain: "sub"`）。
- scenes.mjs 里 `c.at()` 的关键词全换成英文（"ninety percent"、"hit send"…），画面上的手写字保留中文。
- 动感配乐 `pick-it-up.mp3`（117.8 BPM），`bgmLufs: -25`，`beats.py` 测拍后 12 个转场全部落在拍点上。
- 音效：转场 whoosh、弹出 pop、写字画线的马克笔声（mix.py 按 out/events.json 自动铺）。
- 笔速 `pace: 1.6`：写字画线整体慢 60%。调慢后第 1、3、5 场句末的字写不完，把它们挂到句子中段的词上（render.mjs 会报「xx 场：…才完」）。
