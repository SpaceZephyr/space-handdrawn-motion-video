# 按 timeline.json 把每句人声放到对应时间 → 响度标准化 → 垫背景音乐 → 铺音效 → 和画面合成 → 嵌入封面
# 用法：python3 mix.py <项目> "<成片文件名>"
# config.json：
#   "bgm": "pick-it-up.mp3" 换曲（skill 的 assets/bgm/ 里的文件名，或项目里的相对路径、绝对路径；默认 owies-ukulele.mp3），
#          "bgm": false 不要配乐；"bgmLufs": -25 配乐响度（默认 -30，动感卡点建议 -25）
#   "voice": false 时只有配乐
#   "sfx": false 不要音效；或 {"whoosh": .5, "pop": .5, "marker": .2} 调各类音量（0–1）
# 音效按 render.mjs 写的 out/events.json 铺：场与场之间 whoosh（峰值对准转场中点，也就是拍点），pop 弹出，写字画线时马克笔声
import json, subprocess, sys, os
import numpy as np
P = os.path.abspath(sys.argv[1]); name = sys.argv[2] if len(sys.argv) > 2 else "成片"
HERE = os.path.dirname(os.path.abspath(__file__)); ASSET = os.path.join(HERE, "../../assets")
cfg = json.load(open(f"{P}/config.json")) if os.path.exists(f"{P}/config.json") else {}
vd = cfg.get("voiceDir", "voice"); silent = cfg.get("voice") is False
tl = json.load(open(f"{P}/timeline.json")); D = tl["duration"]; inp, flt = [], []
bgm = cfg.get("bgm", "owies-ukulele.mp3")
if bgm:  # 绝对路径 → 项目里的相对路径 → skill 自带的 assets/bgm/ 里的文件名
    bgm = next((f for f in [bgm, os.path.join(P, bgm), f"{ASSET}/bgm/{bgm}"] if os.path.isabs(f) and os.path.exists(f)), None) or sys.exit(f"找不到配乐 {cfg.get('bgm')}")
SR = 48000

def dec(f):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", f, "-ac", "1", "-ar", str(SR), "-f", "s16le", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.int16).astype(np.float32) / 32768

# ---- 音效轨 ----
sfx_cfg = cfg.get("sfx", {})
ev_path = f"{P}/out/events.json"
has_sfx = sfx_cfg is not False and os.path.exists(ev_path)
if has_sfx:
    G = {"whoosh": .5, "pop": .5, "marker": .2, **(sfx_cfg if isinstance(sfx_cfg, dict) else {})}
    ev = json.load(open(ev_path)); buf = np.zeros(int((D + 2) * SR), np.float32)
    def put(x, t, g):
        i = int(t * SR)
        if i < 0: x, i = x[-i:], 0
        n = min(len(x), len(buf) - i)
        if n > 0: buf[i:i + n] += x[:n] * g
    wh = dec(f"{ASSET}/sfx/whoosh.mp3"); env = np.convolve(np.abs(wh), np.ones(2400) / 2400, "same"); wpk = int(np.argmax(env)) / SR
    pop = dec(f"{ASSET}/sfx/pop.mp3"); mk = dec(f"{ASSET}/sfx/marker.mp3")
    for s in ev["scenes"][:-1]: put(wh, s["b"] - wpk, G["whoosh"])
    for m in tl.get("camMoves", []): put(wh, m - wpk, G["whoosh"] * .8)  # 无限画布：场内的拉远、飞去别的白板
    for it in ev["items"]:
        if it["fx"] == "pop": put(pop, it["at"], G["pop"])
        elif it["d"] >= .25:  # 马克笔：循环到笔画时长，尾部 80ms 淡出
            n = int(it["d"] * SR); x = np.tile(mk, n // len(mk) + 1)[:n].copy(); f = min(n, int(.08 * SR)); x[-f:] *= np.linspace(1, 0, f)
            put(x, it["at"], G["marker"])
    peak = np.abs(buf).max()
    if peak > .95: buf *= .95 / peak
    import wave
    with wave.open(f"{P}/out/sfx.wav", "wb") as w: w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((buf * 32767).astype(np.int16).tobytes())

# ---- 人声 + 配乐 + 音效 ----
if not silent:
    for i, s in enumerate(tl["scenes"]):
        inp += ["-i", f"{P}/{vd}/{s['id']}.wav"]; ms = int(s["voiceAt"] * 1000); flt.append(f"[{i}:a]adelay={ms}|{ms},apad[v{i}]")
    n = len(tl["scenes"])
    flt.append("".join(f"[v{i}]" for i in range(n)) + f"amix=inputs={n}:normalize=0,atrim=0:{D},loudnorm=I=-16:TP=-1.5:LRA=11[vo]")
else: n = 0
parts = [] if silent else ["[vo]"]
if bgm:  # 有人声时配乐默认 -30 LUFS（低 14dB），说话时再轻压；没有人声时 -18
    inp += ["-stream_loop", "-1", "-i", bgm]
    lufs = cfg.get("bgmLufs", -18 if silent else -30)
    flt.append(f"[{n}:a]atrim=0:{D},asetpts=PTS-STARTPTS,loudnorm=I={lufs}:TP=-2,aresample={SR},afade=t=in:d=1.5,afade=t=out:st={max(0, D - 3)}:d=3[m]")
    if not silent: flt.append("[vo]asplit[vo1][vo2];[m][vo2]sidechaincompress=threshold=0.03:ratio=3:attack=20:release=400[md]"); parts = ["[vo1]", "[md]"]
    else: parts = ["[m]"]
    n += 1
if has_sfx: inp += ["-i", f"{P}/out/sfx.wav"]; flt.append(f"[{n}:a]atrim=0:{D},aresample={SR}[sx]"); parts.append("[sx]")
if not parts: sys.exit("既没有配音也没有配乐")
flt.append("".join(parts) + f"amix=inputs={len(parts)}:normalize=0,alimiter=limit=0.95[out]")
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", *inp, "-filter_complex", ";".join(flt), "-map", "[out]", "-ar", str(SR), "-ac", "2", f"{P}/out/mix.wav"], check=True)
dst = f"{P}/out/{name}.mp4"; cover = f"{P}/cover/cover.png"; tmp = f"{P}/out/_av.mp4"
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", f"{P}/out/video.mp4", "-i", f"{P}/out/mix.wav", "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", tmp], check=True)
if os.path.exists(cover):  # 封面单独一遍嵌进去；和 -shortest 放在同一条命令里会把视频截短
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", tmp, "-i", cover, "-map", "0", "-map", "1", "-c", "copy", "-c:v:1", "png", "-disposition:v:1", "attached_pic", dst], check=True); os.remove(tmp)
else: os.replace(tmp, dst)
print("成片 →", dst + ("（含音效）" if has_sfx else ""))
