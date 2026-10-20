# 旁白文本的三种写法，tts.py / align.py / build.mjs 用同一套规则：
#   {显示|读法}：字幕显示前者，配音念后者（英文专名、多音字）
#   竖线 |：手动切字幕块（英文和双语字幕用），配音时去掉，块之间英文补一个空格
#   对象 {"say": "...", "sub": "..."}：sub 是第二语言字幕，竖线块数要和 say 一样
import re
TOK = re.compile(r"\{([^|}]*)\|([^}]*)\}")
def say(e): return e if isinstance(e, str) else e["say"]
def chunks(s): return [c.strip() for c in re.split(r"\|(?![^{]*\})", s)]
def join(parts):
    out = ""
    for p in parts:
        if out and re.search(r"[A-Za-z0-9,.!?;:'\")%]$", out): out += " "
        out += p
    return out
def line(e): return join(chunks(say(e)))          # 带 {显示|读法} 的整句
def reading(e): return TOK.sub(r"\2", line(e))     # 配音念的
def split(s):
    """整句 → (显示文本, 读法文本, 显示下标 → 读法区间)"""
    shown, read, spans, k = "", "", [], 0
    for m in TOK.finditer(s):
        for ch in s[k:m.start()]: spans.append((len(read), len(read) + 1)); shown += ch; read += ch
        a, b = m.group(1), m.group(2); r0 = len(read); read += b
        for j in range(len(a)): spans.append((r0 + len(b) * j // len(a), max(r0 + 1, r0 + len(b) * (j + 1) // len(a)))); shown += a[j]
        k = m.end()
    for ch in s[k:]: spans.append((len(read), len(read) + 1)); shown += ch; read += ch
    return shown, read, spans
