# 用 yovoice（本地开源 TTS，Qwen3-TTS CustomVoice 内置音色）给每句旁白配音，不需要参考声音
# 用法：python3 tts.py <项目> [句号...] [seeds=7,11 out=cand]   出候选：cand/sNN_种子.wav，挑好的拷回 voice_raw/sNN.wav 再跑 post
#       python3 tts.py <项目> post [句号...]                     只做后处理（voice_raw → voice），用自己的录音或 clone_index.py 时用
# 配置（config.json 的 "voice"）：language zh|en、speaker 音色、description 演绎描述、seed 种子、speed 语速、seeds {"3": 11} 单句换种子
# 后处理：去首尾静音 → 句中超过 0.32 秒的停顿压到 0.26 秒 → 按 speed 变速（音调不变）→ voice/sNN.wav
import sys, os, re, json, shutil, subprocess, tempfile, time
from pathlib import Path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from text import reading
P = Path(sys.argv[1]).resolve(); args = sys.argv[2:]
kv = dict(a.split("=", 1) for a in args if "=" in a); POST_ONLY = "post" in args
cfg = json.loads((P / "config.json").read_text()) if (P / "config.json").exists() else {}
V = {"speaker": "Serena", "description": "产品介绍视频的旁白，亲切自然，吐字清楚，语速适中，像在给朋友讲一个好用的东西", "seed": 7, "speed": 1.0, "language": "zh", "model": "qwen3-tts-customvoice-q8", **(cfg.get("voice") or {})}
L = json.loads((P / "lines.json").read_text())
idx = [int(a) for a in args if a.isdigit()] or range(1, len(L) + 1)
BIN = next((b for b in [os.environ.get("YOVOICE_BIN"), shutil.which("yovoice"), str(Path.home() / ".local/opt/yovoice/yovoice")] if b and Path(b).exists()), None)
TRIM = "silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse"
GAP = "silenceremove=stop_periods=-1:stop_duration=0.32:stop_threshold=-42dB:stop_silence=0.26"
def post(src, dst):
    sp = float(V["speed"]); af = f"{TRIM},{GAP}" + (f",atempo={sp}" if abs(sp - 1) > .01 else "")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(src), "-af", af, "-ar", "48000", "-ac", "1", str(dst)], check=True)
dur = lambda f: float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(f)], capture_output=True, text=True).stdout)
(P / "voice").mkdir(exist_ok=True)
if POST_ONLY:
    for n in idx: post(P / f"voice_raw/s{n:02d}.wav", P / f"voice/s{n:02d}.wav"); print(f"s{n:02d} {dur(P / f'voice/s{n:02d}.wav'):.1f}s")
    sys.exit()
if not BIN: sys.exit("找不到 yovoice（装法见 references/voice.md），或者用自己的录音放进 voice_raw/ 后跑 post")
out = P / kv.get("out", "voice_raw"); out.mkdir(exist_ok=True)
cand = "seeds" in kv
for n in idx:
    seeds = [int(s) for s in kv["seeds"].split(",")] if cand else [int((V.get("seeds") or {}).get(str(n), V["seed"]))]
    for sd in seeds:
        name = f"s{n:02d}_{sd}.wav" if cand else f"s{n:02d}.wav"; dst = out / name
        if dst.exists(): dst.unlink()
        with tempfile.NamedTemporaryFile("w", suffix=".txt", delete=False) as tf: tf.write(reading(L[n - 1]))
        t0 = time.time()
        cmd = [BIN, "generate", "--model", V["model"], "--language", V["language"], "--text-file", tf.name, "--output", str(dst), "--seed", str(sd), "--speaker", V["speaker"], "--json"]
        if V.get("description"): cmd += ["--voice-description", V["description"]]
        r = subprocess.run(cmd, capture_output=True, text=True); os.unlink(tf.name)
        if r.returncode or not dst.exists(): sys.exit(f"{name} 配音失败：{r.stderr[-600:]}")
        if not cand: post(dst, P / f"voice/s{n:02d}.wav")
        print(f"{name} {dur(dst):.1f}s（{time.time() - t0:.0f}s）", flush=True)
