// 运行时：把 build.mjs 算好的 ANIMS / CARDS / PENS 编成一条暂停的 GSAP 时间轴（HyperFrames 逐帧 seek）
// 全部同步执行、不依赖时钟和随机数，也不在回调里量 DOM：笔尖轨迹和每个字的位置都是 build 时算好的
const tl = gsap.timeline({ paused: true });
const penOf = (el) => el.closest(".stage").querySelector(".pen");
const place = (pen, x, y) => { pen.style.transform = "translate(" + (x - 4).toFixed(1) + "px," + (y - 146).toFixed(1) + "px)"; };
function cum(seg) { if (seg.c) return seg.c; let a = 0; seg.c = seg.p.map((p, i) => { if (i && !p[2]) a += Math.hypot(p[0] - seg.p[i - 1][0], p[1] - seg.p[i - 1][1]); return a; }); return seg.c; }
function along(segs, q) {
  const tot = segs.reduce((s, x) => s + x.L, 0); let r = q * tot;
  for (const s of segs) {
    if (r <= s.L || s === segs[segs.length - 1]) {
      const c = cum(s), T = c[c.length - 1] || 1, want = Math.min(1, r / s.L) * T;
      let i = 1; while (i < c.length - 1 && c[i] < want) i++;
      const a = s.p[i - 1], b = s.p[i] || a, span = c[i] - c[i - 1];
      const f = span > 0 ? (want - c[i - 1]) / span : 1;
      return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
    }
    r -= s.L;
  }
  return [0, 0];
}
const fmt = (v) => Math.round(v).toLocaleString("en-US");

CARDS.forEach((c) => {
  const card = "#" + c.id + " .card";
  tl.fromTo(card, { opacity: 0, y: 90, rotation: c.rot - 3.5, scale: 0.93 }, { opacity: 1, y: 0, rotation: c.rot, scale: 1, duration: 0.62, ease: "back.out(1.5)" }, c.s);
  tl.to(card, { opacity: 0, y: -46, rotation: c.rot + 2, scale: 0.96, duration: 0.4, ease: "power2.in" }, c.e - 0.45);
});

ANIMS.forEach((a) => {
  const el = a.sel ? document.querySelector(a.sel) : null;
  if (a.sel && !el) return;
  switch (a.kind) {
    case "draw": {
      const ps = [...el.querySelectorAll("path")];
      const st = ps.filter((p) => !p.classList.contains("fillp")), fl = ps.filter((p) => p.classList.contains("fillp"));
      const L = a.segs.map((s) => s.L), tot = L.reduce((x, y) => x + y, 0) || 1; let acc = 0;
      st.forEach((p, i) => {
        const l = (L[i] || 200) * 1.06 + 4; p.style.strokeDasharray = l + " " + l;
        const t0 = a.t + a.d * acc / tot;
        // 圆头线帽在 dash 起点会漏出一个小点：没轮到的线先整条隐藏
        tl.fromTo(p, { opacity: 0 }, { opacity: 1, duration: 0.01 }, t0);
        tl.fromTo(p, { strokeDashoffset: l }, { strokeDashoffset: 0, duration: Math.max(0.04, a.d * (L[i] || 0) / tot), ease: "none" }, t0);
        acc += L[i] || 0;
      });
      fl.forEach((p) => tl.fromTo(p, { opacity: 0 }, { opacity: 1, duration: 0.3 }, a.t + a.d * 0.6));
      if (a.pen && a.segs.length) { const pen = penOf(el), o = { q: 0 }; tl.fromTo(o, { q: 0 }, { q: 1, duration: a.d, ease: "none", onUpdate: () => { const p = along(a.segs, o.q); place(pen, p[0], p[1]); } }, a.t); }
      break;
    }
    case "write": {
      const ch = [...el.querySelectorAll(".ch")], n = ch.length || 1, per = a.d / n;
      ch.forEach((c, i) => tl.fromTo(c, { opacity: 0, clipPath: "inset(-30% 100% -30% 0)" }, { opacity: 1, clipPath: "inset(-30% 0% -30% 0)", duration: per * 1.25, ease: "none" }, a.t + i * per));
      if (a.pen && a.cp && a.cp.length) {
        const pen = penOf(el), o = { q: 0 }, cp = a.cp, m = cp.length;
        tl.fromTo(o, { q: 0 }, { q: 1, duration: a.d, ease: "none", onUpdate: () => {
          const f = o.q * m, i = Math.min(m - 1, Math.floor(f)), c = cp[i];
          place(pen, c[0] + (c[1] - c[0]) * Math.min(1, f - i), c[2]);
        } }, a.t);
      }
      break;
    }
    case "fade": tl.fromTo(el, { opacity: 0 }, { opacity: 1, duration: a.d, ease: "power1.out" }, a.t); break;
    case "up": tl.fromTo(el, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: a.d, ease: "power3.out" }, a.t); break;
    case "pop": tl.fromTo(el, { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: a.d, ease: "back.out(2)" }, a.t); break;
    case "paste": tl.fromTo(el, { opacity: 0, scale: 1.2, rotation: (a.rot || 0) + 7, y: -20 }, { opacity: 1, scale: 1, rotation: a.rot || 0, y: 0, duration: a.d, ease: "power3.out" }, a.t); break;
    case "stamp": tl.fromTo(el, { opacity: 0, scale: 1.9, rotation: (a.rot || 0) - 10 }, { opacity: 1, scale: 1, rotation: a.rot || 0, duration: a.d, ease: "power4.in" }, a.t); break;
    case "count": { const o = { v: a.from }; tl.fromTo(o, { v: a.from }, { v: a.to, duration: a.d, ease: "power2.out", onUpdate: () => { el.textContent = a.pre + fmt(o.v) + a.suf; } }, a.t); break; }
    case "wipe": tl.fromTo(el, { clipPath: "inset(0px " + (a.W - a.x0) + "px 0px 0px)" }, { clipPath: "inset(0px " + (a.W - (a.x0 + (a.x1 - a.x0) * a.pct)) + "px 0px 0px)", duration: a.d, ease: "power2.inOut" }, a.t); break;
    case "focus":
      if (a.onSel.length) tl.to(a.onSel.join(","), { opacity: 1, duration: a.d, ease: "power2.out" }, a.t);
      if (a.offSel.length) tl.to(a.offSel.join(","), { opacity: a.dim, duration: a.d, ease: "power2.out" }, a.t);
      break;
    case "hide": if (a.onSel.length) tl.to(a.onSel.join(","), { opacity: 0, duration: a.d, ease: "power2.in" }, a.t); break;
    case "tint":
      a.onSel.forEach((s) => { const e = document.querySelector(s); if (!e) return; if (e.tagName.toLowerCase() === "svg") tl.to(s + " path:not(.fillp)", { stroke: a.color, duration: a.d }, a.t); else tl.to(s, { color: a.color, duration: a.d }, a.t); });
      break;
  }
});

PENS.forEach((p) => {
  const pen = document.querySelector("#" + p.id + " .pen");
  p.w.forEach(([a, b]) => { tl.to(pen, { opacity: 1, duration: 0.12 }, a); tl.to(pen, { opacity: 0, duration: 0.25 }, b + 0.3); });
});

window.__timelines = window.__timelines || {};
window.__timelines["main"] = tl;
tl.seek(0);
