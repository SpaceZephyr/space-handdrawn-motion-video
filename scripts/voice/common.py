import os, re, json, wave, tempfile
import numpy as np
WHISPER = os.environ.get("WHISPER_MODEL", os.path.expanduser("~/.cache/promo-tts/whisper-turbo"))
isc = lambda c: bool(re.match(r"[一-鿿A-Za-z0-9]", c))
TMP = tempfile.mkdtemp()
_m = None
def model():
    global _m
    if _m is None:
        from mlx_audio.stt.utils import load_model
        _m = load_model(WHISPER)
    return _m
def py(c):
    from pypinyin import lazy_pinyin
    if c.isdigit(): c = "零一二三四五六七八九"[int(c)]   # Whisper 常把「三点一」写成 3.1
    return c.upper() if re.match("[A-Za-z]", c) else lazy_pinyin(c)[0]
def rd(p):
    with wave.open(p) as w: sr = w.getframerate(); x = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32)
    return x, sr
def wr(p, x, sr):
    with wave.open(p, "wb") as w: w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes(np.clip(x, -32768, 32767).astype(np.int16).tobytes())
def asr(x, sr, pad=.25):
    """识别一段音频（前后补静音，避免句首字被识别错）"""
    p = f"{TMP}/a.wav"; z = np.zeros(int(sr * pad), np.float32); wr(p, np.concatenate([z, x, z]), sr)
    return model().generate(p, language="zh").text
def db_env(x, sr):
    hop = sr // 100
    return np.array([20 * np.log10(np.sqrt(np.mean(x[i:i + hop] ** 2)) / 32768 + 1e-9) for i in range(0, len(x), hop)]), hop
def lines(P): return json.load(open(f"{P}/lines.json"))
def ids(P, argv):
    L = lines(P); return [int(a) for a in argv if a.isdigit()] or list(range(1, len(L) + 1))
