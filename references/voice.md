# 配音

## 默认：yovoice + Qwen3-TTS 内置音色

全在本机跑，不需要账号，不克隆任何人的声音。`tts.py` 按 `$YOVOICE_BIN` → PATH 里的 `yovoice` → `~/.local/opt/yovoice/yovoice` 找 CLI。

```bash
# 安装（一次）：从 github.com/leemysw/yovoice Releases 下 cli 包解压到 ~/.local/opt/yovoice
~/.local/opt/yovoice/yovoice setup --backend metal
~/.local/opt/yovoice/yovoice models download qwen3-tts-customvoice-q8 --source modelscope   # 2.8 GB
```

`config.json` 的 `voice`：

```json
"voice": { "speaker": "Serena", "description": "产品介绍视频的旁白，亲切自然，吐字清楚，语速适中", "seed": 7, "speed": 1.08, "seeds": { "6": 42 } }
```

| 音色 | 声音 |
|---|---|
| `Serena` | 温和的年轻女声，咬字最稳（默认） |
| `Vivian` | 明亮、有个性的年轻女声 |
| `Dylan` | 清亮的年轻男声（略带京腔，description 里写「标准普通话，没有儿化音」能压一些） |
| `Uncle_Fu` | 低沉的成熟男声，偏慢 |

`Eric` 有成都口音，别用。`description` 影响语气，不换音色。`speed` 是后处理变速（音调不变），产品介绍 1.05–1.1 比较利落。每句 4–10 秒，M 系列 Mac 上一句约 5–15 秒。

## 英文旁白

`"voice": { "language": "en", "speaker": "Ryan", "description": "Upbeat product video narrator, confident and friendly, clear American English" }`

| 音色 | 声音 |
|---|---|
| `Ryan` | 有劲、节奏感强的男声，适合动感产品片 |
| `Aiden` | 阳光的美式男声，更柔和 |

英文 align.py 按单词对：数字写法（ninety percent / 90%）、大小写、连写（hand work / handwork）报出来不用管；漏词、念错产品名要重配。英文一句话 8–10 秒，比同样内容的中文长约 15%，产品介绍 13 句约 1 分 50 秒。

## 读音标注

中文模型念英文专名不稳，稿子里写 `{字幕写法|配音读法}`：`{Grok Bot|格罗克波特}`、`{SuperGrok|苏帕格罗克}`、`{Cursor|科瑟}`、`{Bot|波特}`。AI、iOS、CRM、Gmail 这类一般能念对，先不标。

## 校验和换种子

`align.py` 用 Whisper 识别每句，按拼音对稿。报出来的差异分三类：
- 不用管：儿化音被识别丢（活儿 → 活）、英文按读法念了但识别成英文（波特 → BOT）、同音字。
- 要重配：读错字（上下文 → 上项文、分派 → 分拍）、漏字、多字。出候选 `tts.py <项目> 8 seeds=11,23,42 out=cand`，挑识别对的拷回 `voice_raw/s08.wav`，`tts.py <项目> post 8`，再在 config 的 `voice.seeds` 记下 `"8": 42`，以后整片重配也用这个种子。
- 英文名念错：改读法。

校验环境（Apple Silicon）：`~/.cache/promo-tts/.venv`（mlx-audio + pypinyin）+ `~/.cache/promo-tts/whisper-turbo`（从 ModelScope 拼的 whisper-large-v3-turbo），跑时加 `HF_HUB_OFFLINE=1`。

## 用户自己的声音

只在用户提供自己的录音（或明确授权使用的录音）时才克隆。录音转成 wav 放到 `<项目>/ref.wav`（10–20 秒干净人声），然后：

```bash
uv run --project ~/.local/opt/index-tts python $S/scripts/voice/clone_index.py <项目>   # IndexTTS2，→ voice_raw/
python3 $S/scripts/voice/tts.py <项目> post                                            # → voice/
```

IndexTTS2 安装在 `~/.local/opt/index-tts`，辅助模型要 `USE_MODELSCOPE=1`。也可以直接把真人录好的逐句 wav 放进 `voice_raw/sNN.wav` 再 `post`。

## 不配音

`config.json` 写 `"voice": false`：每句按字数估时长（约每秒 4.5 字），只有字幕和配乐（配乐升到 -18 LUFS）。适合官网首屏循环、展会大屏。
