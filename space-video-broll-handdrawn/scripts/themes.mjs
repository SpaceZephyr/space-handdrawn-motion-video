// 纸面风格（beats.mjs 的 theme）。色值和笔沿用 space-handdrawn-motion-video，
// 针对「贴在口播画面中间的一张纸」做了收敛：只留六种，都带纸张投影和胶带。
// sw 线宽倍数，rough 抖动倍数，dark 深色底，filter 线条质感滤镜（id 见 FILTERS）
export const THEMES = {
  whiteboard: { ink: "#1f1f22", gray: "#8d8d94", accent: "#2456F5", paper: "#FDFDFB", note: "#FFE98A", sw: 1, rough: 1, pen: "marker" },
  notebook: { ink: "#1E3A8A", gray: "#7d86a6", accent: "#D7263D", paper: "#FFFDF6", note: "#FFE98A", sw: 0.8, rough: 0.85, pen: "ballpoint" },
  chalkboard: { ink: "#F1EFE6", gray: "#A9B3AC", accent: "#F7D56E", paper: "#22302B", note: "#F7D56E", sw: 1.2, rough: 1.15, pen: "chalk", dark: true, filter: "f-chalk" },
  blueprint: { ink: "#EEF5FF", gray: "#9DB8DD", accent: "#FFD166", paper: "#1D4B87", note: "#FFD166", sw: 0.8, rough: 0.45, pen: "pencil", dark: true },
  kraft: { ink: "#2B2118", gray: "#6E5A44", accent: "#C8372D", paper: "#D4B68C", note: "#F4E7C5", sw: 1.5, rough: 1.25, pen: "crayon", filter: "f-crayon" },
  inkwash: { ink: "#1A1A1A", gray: "#7a7670", accent: "#B8322A", paper: "#F3EEE2", note: "#EFE3C8", sw: 1.3, rough: 1, pen: "inkbrush", filter: "f-ink" },
};

// 每种纸面的卡片背景（CSS）
export const PAPER_CSS = {
  whiteboard: `background:#FDFDFB;border:2px solid #E4E4DF`,
  notebook: `background:repeating-linear-gradient(180deg,transparent 0 55px,#D9E3F2 55px 57px),#FFFDF6;background-position:0 30px`,
  chalkboard: `background:radial-gradient(120% 90% at 50% 40%,#2A3A34 0%,#1E2A26 100%);border:16px solid #7A5230;box-shadow:inset 0 0 40px rgba(0,0,0,.45),0 22px 50px rgba(0,0,0,.38)`,
  blueprint: `background:linear-gradient(rgba(255,255,255,.07) 2px,transparent 2px) 0 0/44px 44px,linear-gradient(90deg,rgba(255,255,255,.07) 2px,transparent 2px) 0 0/44px 44px,#1D4B87`,
  kraft: `background:#D4B68C`,
  inkwash: `background:#F3EEE2`,
};
// 纸张颗粒（kraft、inkwash 用），SVG turbulence 平铺
export const GRAIN = (op) => `<svg class="grain" width="100%" height="100%"><filter id="gn"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="5"/><feColorMatrix values="0 0 0 0 .2  0 0 0 0 .15  0 0 0 0 .1  0 0 0 ${op} 0"/></filter><rect width="100%" height="100%" filter="url(#gn)"/></svg>`;

// 跟着笔尖走的笔：笔尖在 svg 的 (4,146)
export function penSvg(kind, acc) {
  const g = {
    marker: `<path d="M0 0 L16 -7 L16 7 Z" fill="${acc}"/><rect x="15" y="-10" width="18" height="20" rx="3" fill="#2b2b30"/><rect x="32" y="-15" width="120" height="30" rx="9" fill="#f4f4f2" stroke="#2b2b30" stroke-width="3"/><rect x="40" y="-15" width="24" height="30" fill="${acc}"/><rect x="150" y="-13" width="40" height="26" rx="8" fill="${acc}" stroke="#2b2b30" stroke-width="3"/>`,
    chalk: `<path d="M2 -9 Q-4 0 2 9 L74 11 L74 -11 Z" fill="#F6F3EA"/><rect x="40" y="-11" width="34" height="22" fill="#E9E4D6"/>`,
    pencil: `<path d="M0 0 L12 -4 L12 4 Z" fill="#3a3a3a"/><path d="M10 -5 L38 -12 L38 12 L10 5 Z" fill="#E9C99A"/><rect x="38" y="-12" width="120" height="24" fill="#F2B632"/><rect x="38" y="-12" width="120" height="8" fill="#F7C95A"/><rect x="158" y="-12" width="14" height="24" fill="#b9bcc2"/><rect x="172" y="-12" width="20" height="24" rx="4" fill="#E98A9A"/>`,
    ballpoint: `<path d="M0 0 L22 -5 L22 5 Z" fill="#9aa0a8"/><rect x="22" y="-9" width="26" height="18" rx="3" fill="#2a2f3a"/><rect x="48" y="-11" width="140" height="22" rx="10" fill="#dfe6f0" stroke="#55627a" stroke-width="2.5"/><rect x="52" y="-2.5" width="132" height="5" fill="#1E3A8A"/>`,
    crayon: `<path d="M0 0 L20 -9 L20 9 Z" fill="${acc}"/><rect x="20" y="-10" width="150" height="20" rx="3" fill="${acc}"/><rect x="40" y="-10.5" width="110" height="21" fill="#F1E3C6"/>`,
    inkbrush: `<path d="M0 0 Q14 -10 36 -9 L36 9 Q14 10 0 0 Z" fill="#141414"/><rect x="35" y="-9" width="14" height="18" fill="#3b2a1a"/><rect x="49" y="-7" width="150" height="14" rx="3" fill="#C9AA6B"/>`,
  }[kind] || "";
  return `<svg class="pen" width="150" height="150" viewBox="0 0 150 150"><g transform="translate(4,146) rotate(-48)">${g}</g></svg>`;
}

export const FILTERS = `<svg width="0" height="0" style="position:absolute"><defs>
<filter id="f-chalk" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="4" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -2.4 0 0 0 1.85" result="holes"/><feComposite in="SourceGraphic" in2="holes" operator="in" result="g"/><feDisplacementMap in="g" in2="n" scale="2.2" xChannelSelector="G" yChannelSelector="B"/></filter>
<filter id="f-crayon" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".6 .9" numOctaves="3" seed="8" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -1.7 0 0 0 1.8" result="holes"/><feComposite in="SourceGraphic" in2="holes" operator="in" result="g"/><feDisplacementMap in="g" in2="n" scale="3.5" xChannelSelector="G" yChannelSelector="B"/></filter>
<filter id="f-ink" x="-3%" y="-3%" width="106%" height="106%"><feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="2" seed="3" result="t"/><feDisplacementMap in="SourceGraphic" in2="t" scale="3.5" xChannelSelector="R" yChannelSelector="G"/></filter>
</defs></svg>`;
