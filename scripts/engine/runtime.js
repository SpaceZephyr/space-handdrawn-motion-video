// 确定性动画：seek(t) 按 data-at / data-fx / data-kf 算出每个元素在 t 秒的状态，逐帧截图时一帧不差
// 白板特有：写字和画线时有一支马克笔跟着笔尖走；场与场之间像镜头在白板上横移
// transition = "canvas"：所有白板摆在一张无限画布上，镜头按 PV.cam 的路径平移缩放（van Wijk 平滑缩放）
(function () {
  const clamp = v => v < 0 ? 0 : v > 1 ? 1 : v;
  const eo = p => 1 - Math.pow(1 - p, 3);
  const eio = p => p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
  const back = p => { const c = 1.6; return 1 + (c + 1) * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2); };
  const D = { write: 1, draw: 0.9, fade: 0.45, up: 0.55, pop: 0.5, wipe: 0.7, type: 1.2, ripple: 0.6, none: 0, count: 1.2 };
  const PEN_FX = { write: 1, draw: 1 };
  let els, scenes, caps, capEl, pen, cfg, vids, world, cam;
  // 两个视野 [中心x, 中心y, 视野宽] 之间的最优缩放路径，和 d3.interpolateZoom 同一套公式
  function zoomPath([x0, y0, w0], [x1, y1, w1], rho = 1.4) {
    const dx = x1 - x0, dy = y1 - y0, d2 = dx * dx + dy * dy, r2 = rho * rho;
    if (d2 < 1e-6) { const S = Math.log(w1 / w0) / rho; return t => [x0 + t * dx, y0 + t * dy, w0 * Math.exp(rho * t * S)]; }
    const d1 = Math.sqrt(d2), b0 = (w1 * w1 - w0 * w0 + r2 * r2 * d2) / (2 * w0 * r2 * d1), b1 = (w1 * w1 - w0 * w0 - r2 * r2 * d2) / (2 * w1 * r2 * d1);
    const r0 = Math.log(Math.sqrt(b0 * b0 + 1) - b0), r1 = Math.log(Math.sqrt(b1 * b1 + 1) - b1), S = (r1 - r0) / rho;
    return t => { const s = t * S, u = w0 / (r2 * d1) * (Math.cosh(r0) * Math.tanh(rho * s + r0) - Math.sinh(r0)); return [x0 + u * dx, y0 + u * dy, w0 * Math.cosh(r0) / Math.cosh(rho * s + r0)]; };
  }
  function camAt(t) {
    let v = cam.length ? cam[0].p0 : [cfg.W / 2, cfg.H / 2, cfg.W];
    for (const c of cam) { if (t < c.a) break; v = t < c.b ? c.f(eio((t - c.a) / (c.b - c.a))) : c.p1; }
    return v;
  }
  function init() {
    cfg = window.PV;
    els = [...document.querySelectorAll(".a")].map(el => {
      const o = { el, at: +el.dataset.at, fx: el.dataset.fx, out: el.dataset.out ? +el.dataset.out : null, kf: el.dataset.kf ? JSON.parse(el.dataset.kf) : null, pen: !el.dataset.nopen };
      o.d = el.dataset.d ? +el.dataset.d : D[o.fx] ?? .5;
      if (o.fx === "draw") { o.paths = [...el.querySelectorAll("path")]; o.strokes = o.paths.filter(p => !p.classList.contains("fillp")); }
      if (o.fx === "type") o.full = el.dataset.text;
      if (o.fx === "count") o.c = el.dataset.count.split(",").map(Number);
      if (o.fx === "write") {  // 把文字拆成单字，按顺序写出来
        const wrap = node => { for (const n of [...node.childNodes]) { if (n.nodeType === 3) { const f = document.createDocumentFragment(); for (const ch of n.textContent) { const sp = document.createElement("span"); sp.className = "ch"; sp.textContent = ch; f.appendChild(sp); } n.replaceWith(f); } else wrap(n); } };
        wrap(el); o.chs = [...el.querySelectorAll(".ch")].filter(c => c.textContent.trim()); if (!el.dataset.d) o.d = Math.min(1.6, o.chs.length * .09);
      }
      if (PEN_FX[o.fx]) o.d *= cfg.pace || 1;  // config.pace：笔速，>1 写得更慢
      return o;
    });
    scenes = [...document.querySelectorAll(".scene")].map(el => ({ el, a: +el.dataset.start, b: +el.dataset.end }));
    vids = [...document.querySelectorAll("video.vclip")].map(v => ({ v, at: +v.dataset.at, rate: +v.dataset.rate || 1, from: +v.dataset.from || 0, loop: !!v.dataset.loop, sc: v.closest(".scene") }));
    world = document.getElementById("world"); cam = (cfg.cam || []).map(c => ({ ...c, f: zoomPath(c.p0, c.p1) }));
    scenes.forEach((s, i) => s.box = cfg.boards && cfg.boards[i]);
    caps = window.PV_CAPS; capEl = document.getElementById("cap"); pen = document.getElementById("pen");
  }
  function kfAt(kf, t) {
    if (t <= kf[0][0]) return kf[0][1];
    for (let i = 1; i < kf.length; i++) if (t < kf[i][0]) {
      const [t0, v0] = kf[i - 1], [t1, v1] = kf[i]; const p = eio((t - t0) / (t1 - t0)); const r = {};
      for (const k of new Set([...Object.keys(v0), ...Object.keys(v1)])) { const a = v0[k] ?? (k === "s" || k === "o" ? 1 : 0), b = v1[k] ?? (k === "s" || k === "o" ? 1 : 0); r[k] = a + (b - a) * p; }
      return r;
    }
    return kf[kf.length - 1][1];
  }
  // 笔尖位置（页面坐标）
  function tip(o, p) {
    if (o.fx === "write") {
      const n = o.chs.length; if (!n) return null; const k = Math.min(n - 1e-6, p * n), ch = o.chs[Math.floor(k)], r = ch.getBoundingClientRect();
      return [r.left + r.width * (k % 1), r.top + r.height * .78];
    }
    const n = o.paths.length; if (!o.strokes.length) return null;
    let i = Math.min(n - 1, Math.floor(p * n)), f = p * n - i;
    while (i >= 0 && o.paths[i].classList.contains("fillp")) { i--; f = 1; }  // 实心填充没有笔尖，停在上一笔末尾
    if (i < 0) return null;
    const pa = o.paths[i]; pa._len ??= pa.getTotalLength();
    const pt = pa.getPointAtLength(Math.min(1, f) * pa._len), m = pa.getScreenCTM(); if (!m) return null;
    const q = new DOMPoint(pt.x, pt.y).matrixTransform(m); return [q.x, q.y];
  }
  window.seek = function (t) {
    if (!els) init();
    const T = cfg.trans === "fade" ? .35 : .55;
    let k = 1;
    if (world) {  // 无限画布：算镜头，只显示视野里的白板
      const [cx, cy, w] = camAt(t); k = cfg.W / w; const h = w * cfg.H / cfg.W, x0 = cx - w / 2, y0 = cy - h / 2;
      world.style.transform = `translate(${cfg.W / 2 - cx * k}px,${cfg.H / 2 - cy * k}px) scale(${k})`;
      for (const s of scenes) { const b = s.box, on = b.x < x0 + w + 40 && b.x + b.w > x0 - 40 && b.y < y0 + h + 40 && b.y + b.h > y0 - 40; s.el.style.display = on ? "block" : "none"; }
    }
    else for (const s of scenes) {
      const vin = clamp((t - (s.a - T)) / T), vout = clamp(((s.b + T) - t) / T), v = Math.min(vin, vout);
      s.el.style.display = v <= 0 ? "none" : "block";
      if (cfg.trans === "fade") { s.el.style.opacity = v; s.el.style.transform = `translateY(${(1 - vin) * 24 - (1 - vout) * 24}px)`; }
      else { s.el.style.opacity = 1; s.el.style.transform = `translateX(${(1 - eio(vin)) * cfg.W - (1 - eio(vout)) * cfg.W}px)`; }  // 镜头在白板上横移
    }
    let active = null, recent = null;
    for (const o of els) {
      const p = o.d ? clamp((t - o.at) / o.d) : (t >= o.at ? 1 : 0);
      let op = 1, x = 0, y = 0, s = 1, r = 0;
      switch (o.fx) {
        case "fade": op = eo(p); break;
        case "up": op = eo(p); y = (1 - eo(p)) * 36; break;
        case "pop": op = clamp(p * 3); s = p >= 1 ? 1 : .6 + .4 * back(p); break;
        case "wipe": op = p > 0 ? 1 : 0; o.el.style.clipPath = `inset(-20% ${(1 - eo(p)) * 100}% -20% -5%)`; break;
        case "ripple": op = p > 0 && p < 1 ? 1 - p : 0; s = .3 + p * 1.2; break;
        case "draw": {
          op = p > 0 ? 1 : 0; const n = o.paths.length;
          o.paths.forEach((pa, i) => {
            const q = clamp(p * n - i);
            if (pa.classList.contains("fillp")) pa.style.opacity = q;
            else { pa.style.strokeDasharray = "1 1"; pa.style.strokeDashoffset = 1 - q; }
          });
          break;
        }
        case "type": { const n = Math.round(o.full.length * p); o.el.textContent = o.full.slice(0, n); break; }
        case "count": { const v = o.c[0] + (o.c[1] - o.c[0]) * eo(p); o.el.textContent = Math.round(v).toLocaleString("en-US"); break; }
        case "none": op = p >= 1 ? 1 : 0; break;
        case "write": {
          op = p > 0 ? 1 : 0; const n = o.chs.length, k = p * n;
          o.chs.forEach((ch, i) => { const q = clamp(k - i); ch.style.clipPath = q >= 1 ? "" : `inset(-30% ${(1 - q) * 100}% -30% 0)`; ch.style.opacity = q > 0 ? 1 : 0; });
          break;
        }
      }
      if (o.out != null) op *= 1 - clamp((t - o.out) / .35);
      if (o.kf) { const k = kfAt(o.kf, t); x += k.x || 0; y += k.y || 0; s *= k.s ?? 1; r += k.r || 0; op *= k.o ?? 1; }
      o.el.style.opacity = op;
      o.el.style.transform = (x || y || s !== 1 || r) ? `translate(${x}px,${y}px) scale(${s}) rotate(${r}deg)` : "";
      if (o.pen && PEN_FX[o.fx] && op > .5) {
        if (p > 0 && p < 1 && (!active || o.at >= active.o.at)) active = { o, p };
        else if (p >= 1 && t - (o.at + o.d) < .3 && (!recent || o.at >= recent.o.at)) recent = { o, p: 1, fade: 1 - (t - (o.at + o.d)) / .3 };
      }
    }
    // 马克笔：正在写/画的那一笔；刚写完的停 0.3 秒再淡出
    const cur = active || recent, pt = cfg.pen && cur ? tip(cur.o, cur.p) : null;
    if (pt) { pen.style.display = "block"; pen.style.opacity = active ? 1 : clamp(cur.fade); pen.style.transform = `translate(${pt[0] - 4 * k}px,${pt[1] - 146 * k}px) scale(${k})`; }
    else pen.style.display = "none";
    // 视频片段：按 t 拨到对应的那一帧；返回 Promise，逐帧渲染时等所有片段 seek 完再截图
    const wait = [];
    for (const o of vids) {
      if (o.sc && o.sc.style.display === "none") continue;
      const v = o.v, go = () => {
        const len = v.duration || 0, span = Math.max(.04, len - o.from - .04), x = Math.max(0, t - o.at) * o.rate;
        const want = o.from + (o.loop ? x % span : Math.min(x, span));
        if (Math.abs(v.currentTime - want) < .002) return;
        return new Promise(r => { v.addEventListener("seeked", r, { once: true }); v.currentTime = want; });
      };
      if (v.readyState >= 1) { const p = go(); if (p) wait.push(p); }
      else wait.push(new Promise(r => v.addEventListener("loadeddata", r, { once: true })).then(go));
    }
    const c = caps.find(c => t >= c.a && t < c.b);
    const key = c ? c.a + "" : "";
    if (capEl.dataset.k !== key) {  // 双语：主行默认是 sub（第二语言，如中文），副行是旁白原文
      capEl.dataset.k = key;
      const main = c && c.sub && cfg.capMain === "sub" ? c.sub : c ? c.text : "", second = c && c.sub ? (cfg.capMain === "sub" ? c.text : c.sub) : "";
      capEl.innerHTML = c ? `<div class="c1">${main}</div>${second ? `<div class="c2">${second}</div>` : ""}` : "";
    }
    if (wait.length) return Promise.all(wait).then(() => new Promise(r => requestAnimationFrame(() => r())));
  };
  // 给混音用：每个会出声的动作（pop 弹出、马克笔写/画）和场景边界
  window.PV_EVENTS = function () {
    if (!els) init();
    return { scenes: scenes.map(s => ({ a: s.a, b: s.b })), items: els.filter(o => o.fx === "pop" || (o.pen && PEN_FX[o.fx])).map(o => ({ at: +o.at.toFixed(3), fx: o.fx, d: +o.d.toFixed(3), s: scenes.findIndex(s => s.el === o.el.closest(".scene")) })) };
  };
  window.addEventListener("load", async () => {
    await document.fonts.ready;
    if (!window.__PV_RENDER__) { const q = +new URLSearchParams(location.search).get("t"); if (q) return seek(q); const t0 = performance.now(); (function f() { seek(((performance.now() - t0) / 1000) % PV_TIMELINE.duration); requestAnimationFrame(f); })(); }
    else seek(0);
  });
})();
