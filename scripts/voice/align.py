# 配音校验 + 逐字对时：Whisper 把 voice/sNN.wav 识别回来
#   1. 和稿子（配音读法）比对：中文按拼音逐字比，英文按单词比；列出漏字、多字、读错的句子
#   2. 记下每个字符在音频里的时间 → align.json（换算回显示文本的下标），build.mjs 用它让画面跟着词出现
# 用法（mlx-audio 环境）：HF_HUB_OFFLINE=1 ~/.cache/promo-tts/.venv/bin/python align.py <项目> [句号...]
# 语言跟 config.json 的 voice.language（默认 zh）
import sys, os, re, json, difflib
from common import *
from text import line, split
P = os.path.abspath(sys.argv[1]); L = lines(P)
cfg = json.load(open(f"{P}/config.json")) if os.path.exists(f"{P}/config.json") else {}
LANG = (cfg.get("voice") or {}).get("language", "zh")
out = json.load(open(f"{P}/align.json")) if os.path.exists(f"{P}/align.json") else {}
norm = lambda w: re.sub(r"[^a-z0-9]", "", w.lower())

def fill(arr, D):
    """没对上的位置按前后已知时间插值"""
    known = [(k, v) for k, v in enumerate(arr) if v is not None]
    for k in range(len(arr)):
        if arr[k] is None:
            lo = max([q for q in known if q[0] < k], default=(-1, 0.0)); hi = min([q for q in known if q[0] > k], default=(len(arr), D))
            arr[k] = lo[1] + (hi[1] - lo[1]) * (k - lo[0]) / max(1, hi[0] - lo[0])
    return arr

def zh_times(read, words, D):
    chars = []
    for w in words:
        cs = [c for c in w["word"] if isc(c)]
        for k, c in enumerate(cs): d = (w["end"] - w["start"]) / len(cs); chars.append((c, w["start"] + k * d))
    sidx = [i for i, ch in enumerate(read) if isc(ch)]
    a = [py(read[i]) for i in sidx]; b = [py(c[0]) for c in chars]
    ops = difflib.SequenceMatcher(None, a, b, autojunk=False).get_opcodes()
    st = [None] * len(sidx)
    for tag, i1, i2, j1, j2 in ops:
        if tag in ("equal", "replace") and j2 > j1:
            for k in range(i1, i2): st[k] = chars[j1 + min(k - i1, j2 - j1 - 1)][1]
    fill(st, D); rt = [None] * len(read)
    for k, i in enumerate(sidx): rt[i] = st[k]
    diff = ["".join(read[sidx[k]] for k in range(i1, min(i2, len(sidx)))) or "（多）" for tag, i1, i2, j1, j2 in ops if tag != "equal"]
    return rt, diff, "".join(c for c, _ in chars)

def en_times(read, words, D):
    toks = [(m.start(), m.end(), norm(m.group())) for m in re.finditer(r"[A-Za-z0-9'%+.]+", read) if norm(m.group())]
    heard = [(norm(w["word"]), w["start"], w["end"]) for w in words if norm(w["word"])]
    ops = difflib.SequenceMatcher(None, [t[2] for t in toks], [h[0] for h in heard], autojunk=False).get_opcodes()
    se = [None] * len(toks)
    for tag, i1, i2, j1, j2 in ops:
        if tag in ("equal", "replace") and j2 > j1:
            for k in range(i1, i2): h = heard[j1 + min(k - i1, j2 - j1 - 1)]; se[k] = (h[1], h[2])
    st = fill([s[0] if s else None for s in se], D); en = fill([s[1] if s else None for s in se], D)
    rt = [None] * len(read)
    for (a, b, _), t0, t1 in zip(toks, st, en):
        for i in range(a, b): rt[i] = t0 + (t1 - t0) * (i - a) / max(1, b - a)
    diff = [" ".join(t[2] for t in toks[i1:i2]) or "（多）" for tag, i1, i2, j1, j2 in ops if tag != "equal"]
    return rt, diff, " ".join(w["word"].strip() for w in words)

bad = 0
for n in ids(P, sys.argv[2:]):
    key = f"s{n:02d}"; src = f"{P}/voice/{key}.wav"; shown, read, spans = split(line(L[n - 1]))
    x, sr = rd(src); D = len(x) / sr
    r = model().generate(src, language=LANG, word_timestamps=True)
    words = [w for s in r.segments for w in s.get("words", [])]
    rt, diff, got = (en_times if LANG == "en" else zh_times)(read, words, D)
    for i in range(len(rt)):  # 标点、空格跟前一个字
        if rt[i] is None: rt[i] = rt[i - 1] if i else 0.0
    out[key] = [round(rt[r0] if r0 < len(rt) else D, 3) for r0, _ in spans]
    bad += bool(diff); print(f"{key} | {got}" + (f"  <-- 对不上：{' / '.join(diff)}" if diff else ""), flush=True)
json.dump(out, open(f"{P}/align.json", "w"), ensure_ascii=False)
print("全部对上" if not bad else f"{bad} 句有出入：同音字、儿化、数字写法不用管；漏字、多字、读错要改读法（{{显示|读法}}）或换种子重配")
