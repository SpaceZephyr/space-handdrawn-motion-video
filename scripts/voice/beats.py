# 测配乐的节拍：BPM + 第一拍位置 → <项目>/beats.json，build.mjs 用它把转场卡在拍点上
# 用法：python3 beats.py <项目>            （测 config.json 里的 bgm，没写就测默认曲）
#       python3 beats.py --probe a.mp3 b.mp3   只打印每首的 BPM 和节拍清晰度，挑曲子用
import sys, os, json, subprocess
import numpy as np
SR, HOP = 22050, 512
def load(f):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", f, "-ac", "1", "-ar", str(SR), "-f", "s16le", "-"], capture_output=True).stdout
    return np.frombuffer(raw, np.int16).astype(np.float32) / 32768
def analyze(f):
    x = load(f); n = 2048; win = np.hanning(n)
    frames = np.lib.stride_tricks.sliding_window_view(x, n)[::HOP] * win
    mag = np.log1p(np.abs(np.fft.rfft(frames, axis=1)) * 10)
    flux = np.maximum(0, np.diff(mag, axis=0)).sum(1); flux = (flux - flux.mean()) / (flux.std() + 1e-9)
    fps = SR / HOP; ac = np.correlate(flux, flux, "full")[len(flux) - 1:]
    lags = np.arange(int(fps * 60 / 170), int(fps * 60 / 75))
    k = lags[np.argmax(ac[lags])]; bpm = 60 * fps / k
    # 细化：在 k±1 帧内按抛物线插值
    if 1 <= k < len(ac) - 1:
        a, b, c = ac[k - 1], ac[k], ac[k + 1]; k = k + .5 * (a - c) / (a - 2 * b + c + 1e-9); bpm = 60 * fps / k
    period = k; best, off = -1e9, 0
    for o in np.arange(0, period, .5):
        idx = (o + period * np.arange(int((len(flux) - o) / period))).astype(int)
        s = flux[idx].sum()
        if s > best: best, off = s, o
    clarity = float(ac[int(round(period))] / ac[0])
    return {"bpm": round(float(bpm), 2), "offset": round(float(off / fps), 3), "clarity": round(clarity, 3), "duration": round(len(x) / SR, 2)}
if sys.argv[1] == "--probe":
    for f in sys.argv[2:]: print(os.path.basename(f), analyze(f))
    sys.exit()
P = os.path.abspath(sys.argv[1])
cfg = json.load(open(f"{P}/config.json")) if os.path.exists(f"{P}/config.json") else {}
bgm = cfg.get("bgm", "owies-ukulele.mp3")
if not bgm: sys.exit("没有配乐，不用测节拍")
ASSET = os.path.join(os.path.dirname(os.path.abspath(__file__)), "../../assets/bgm")
f = next((x for x in [bgm, os.path.join(P, bgm), os.path.join(ASSET, bgm)] if os.path.isabs(x) and os.path.exists(x)), None) or sys.exit(f"找不到配乐 {bgm}")
r = analyze(f); r["file"] = f
json.dump(r, open(f"{P}/beats.json", "w"), indent=1)
print(f"{os.path.basename(f)}：{r['bpm']} BPM，第一拍 {r['offset']}s，节拍清晰度 {r['clarity']} → beats.json")
