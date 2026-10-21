// 画面风格（config.json 的 "theme"）：纸面、墨色、线条质感、跟着笔尖走的那支笔
// 每种风格的纸面纹理和组件配色在 style.css 的 .th-<名字> 里，线条质感靠 FILTERS 里的 SVG 滤镜
// sw：线宽倍数；rough：抖动倍数；dark：深色底（白色卡片、便利贴会自动换成描边样式）

export const THEMES = {
  // 白板 + 马克笔（默认）
  whiteboard: { ink: "#1f1f22", gray: "#8d8d94", accent: "#2456F5", paper: "#FDFDFB", soft: "#55555c", sw: 1, rough: 1, pen: "marker" },
  // 墨绿黑板 + 粉笔：线条和字有粉笔颗粒，强调色是黄粉笔
  chalkboard: { ink: "#F1EFE6", gray: "#A9B3AC", accent: "#F7D56E", paper: "#22302B", sw: 1.25, rough: 1.15, pen: "chalk", dark: true },
  // 水彩纸 + 针管笔勾线：填色是晕开的水彩，强调色像钴蓝颜料
  watercolor: { ink: "#2F2A25", gray: "#958a7d", accent: "#2E6DB4", paper: "#F7F2E7", sw: .8, rough: .9, pen: "brush", tint: ["#2E6DB4", "#E0A458", "#7BA05B", "#D9777A", "#8E7CC3"], tintOp: .075 },
  // 蓝图：深蓝底 + 网格，白色细线，几乎不抖，像工程图
  blueprint: { ink: "#EEF5FF", gray: "#9DB8DD", accent: "#FFD166", paper: "#1D4B87", sw: .75, rough: .45, pen: "pencil", dark: true },
  // 横线笔记本 + 圆珠笔：蓝色圆珠笔写字，红笔圈重点，黄色荧光笔
  notebook: { ink: "#1E3A8A", gray: "#7d86a6", accent: "#D7263D", paper: "#FFFDF6", sw: .7, rough: .8, pen: "ballpoint" },
  // 牛皮纸 + 蜡笔：粗、糙、有蜡的颗粒，红蜡笔强调
  kraft: { ink: "#2B2118", gray: "#6E5A44", accent: "#C8372D", paper: "#D4B68C", soft: "#4d3d2c", sw: 1.6, rough: 1.3, pen: "crayon" },
  // 漫画：粗黑线、几乎不抖，标题重点是黄底，场景外有一圈分格框
  comic: { ink: "#111111", gray: "#5c5c5c", accent: "#E63946", paper: "#FFFCF0", soft: "#333", sw: 1.7, rough: .55, pen: "marker" },
  // 软木板：截图和便利贴钉在板上，红线连线
  cork: { ink: "#1c140d", gray: "#4a3523", accent: "#C62828", paper: "#B9814B", soft: "#2e2216", sw: 1.3, rough: 1, pen: "marker" },
  // 水墨：宣纸 + 毛笔，墨线边缘洇开，框和圈自动晕一层淡墨，朱砂红强调
  inkwash: { ink: "#1A1A1A", gray: "#7a7670", accent: "#B8322A", paper: "#F3EEE2", sw: 1.35, rough: 1, pen: "inkbrush", tint: ["#3a3a3a", "#5a5650", "#2a2a2a"], tintOp: .05 },
  // 霓虹：近黑底，线和字发光，粉色强调
  neon: { ink: "#F4F6FF", gray: "#8f95b8", accent: "#FF3CAC", paper: "#0C0B16", sw: .9, rough: .5, pen: "neon", dark: true },
};
export const themeOf = cfg => ({ name: THEMES[cfg.theme] ? cfg.theme : "whiteboard", ...(THEMES[cfg.theme] || THEMES.whiteboard) });

// 跟着笔尖走的笔：笔尖在 svg 的 (4,146)，笔身沿 -48° 方向往右上伸出去
export function penSvg(kind, acc) {
  const g = {
    marker: `<path d="M0 0 L16 -7 L16 7 Z" fill="${acc}"/><rect x="15" y="-10" width="18" height="20" rx="3" fill="#2b2b30"/><rect x="32" y="-15" width="120" height="30" rx="9" fill="#f4f4f2" stroke="#2b2b30" stroke-width="3"/><rect x="40" y="-15" width="24" height="30" fill="${acc}"/><rect x="150" y="-13" width="40" height="26" rx="8" fill="${acc}" stroke="#2b2b30" stroke-width="3"/>`,
    // 一截用过的粉笔：笔头磨圆，身上有指印灰
    chalk: `<path d="M2 -9 Q-4 0 2 9 L74 11 L74 -11 Z" fill="#F6F3EA"/><rect x="40" y="-11" width="34" height="22" fill="#E9E4D6"/><path d="M8 -6 L60 -7" stroke="#ddd8ca" stroke-width="2"/>`,
    // 水彩笔：笔头沾着颜料，银色金属箍，木杆
    brush: `<path d="M0 0 Q10 -9 30 -8 L30 8 Q10 9 0 0 Z" fill="${acc}"/><path d="M14 -6 Q22 -8 30 -8 L30 8 Q22 8 14 6 Z" fill="#3a2f28" opacity=".55"/><rect x="29" y="-9" width="34" height="18" rx="2" fill="#c9ccd2" stroke="#8e939c" stroke-width="2"/><path d="M62 -8 L190 -5 L190 5 L62 8 Z" fill="#B5763F"/><path d="M62 -8 L190 -5 L190 -1 L62 -2 Z" fill="#c98a52"/>`,
    // 铅笔：石墨尖、木头削口、黄色笔杆、粉色橡皮
    pencil: `<path d="M0 0 L12 -4 L12 4 Z" fill="#3a3a3a"/><path d="M10 -5 L38 -12 L38 12 L10 5 Z" fill="#E9C99A"/><rect x="38" y="-12" width="120" height="24" fill="#F2B632"/><rect x="38" y="-12" width="120" height="8" fill="#F7C95A"/><rect x="158" y="-12" width="14" height="24" fill="#b9bcc2"/><rect x="172" y="-12" width="20" height="24" rx="4" fill="#E98A9A"/>`,
    // 圆珠笔：细金属尖，透明笔杆里一根蓝芯
    ballpoint: `<path d="M0 0 L22 -5 L22 5 Z" fill="#9aa0a8"/><rect x="22" y="-9" width="26" height="18" rx="3" fill="#2a2f3a"/><rect x="48" y="-11" width="140" height="22" rx="10" fill="#dfe6f0" stroke="#55627a" stroke-width="2.5"/><rect x="52" y="-2.5" width="132" height="5" fill="#1E3A8A"/><rect x="150" y="-16" width="40" height="7" rx="3" fill="#2a2f3a"/>`,
    // 蜡笔：削尖的蜡头 + 包装纸
    crayon: `<path d="M0 0 L20 -9 L20 9 Z" fill="${acc}"/><rect x="20" y="-10" width="150" height="20" rx="3" fill="${acc}"/><rect x="40" y="-10.5" width="110" height="21" fill="#F1E3C6"/><path d="M48 -10 L48 10 M142 -10 L142 10" stroke="${acc}" stroke-width="3"/><text x="70" y="5" font-size="12" fill="${acc}" font-family="sans-serif">CRAYON</text>`,
    // 毛笔：尖锋墨头 + 竹杆
    inkbrush: `<path d="M0 0 Q14 -10 36 -9 L36 9 Q14 10 0 0 Z" fill="#141414"/><rect x="35" y="-9" width="14" height="18" fill="#3b2a1a"/><rect x="49" y="-7" width="150" height="14" rx="3" fill="#C9AA6B"/><path d="M95 -7 L95 7 M150 -7 L150 7" stroke="#9b7d45" stroke-width="3"/><circle cx="205" cy="0" r="5" fill="none" stroke="#7a2a20" stroke-width="2.5"/>`,
    // 霓虹笔：发光的笔尖
    neon: `<circle cx="2" cy="0" r="9" fill="${acc}" opacity=".35"/><path d="M0 0 L16 -6 L16 6 Z" fill="${acc}"/><rect x="16" y="-9" width="150" height="18" rx="9" fill="#23223a" stroke="${acc}" stroke-width="2"/><rect x="30" y="-2" width="110" height="4" rx="2" fill="${acc}"/>`,
  }[kind] || "";
  return `<svg id="pen" viewBox="0 0 150 150"><g transform="translate(4,146) rotate(-48)">${g}</g></svg>`;
}

// SVG 滤镜：粉笔颗粒、水彩晕染、墨线微抖
export const FILTERS = `<svg width="0" height="0" style="position:absolute"><defs>
<filter id="f-chalk" x="-5%" y="-5%" width="110%" height="110%">
  <feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="4" result="n"/>
  <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -2.4 0 0 0 1.85" result="holes"/>
  <feComposite in="SourceGraphic" in2="holes" operator="in" result="g"/>
  <feDisplacementMap in="g" in2="n" scale="2.2" xChannelSelector="G" yChannelSelector="B"/>
</filter>
<filter id="f-wash" x="-15%" y="-15%" width="130%" height="130%">
  <feTurbulence type="fractalNoise" baseFrequency=".018" numOctaves="3" seed="7" result="t"/>
  <feDisplacementMap in="SourceGraphic" in2="t" scale="26" xChannelSelector="R" yChannelSelector="G" result="d"/>
  <feGaussianBlur in="d" stdDeviation="1.6" result="b"/>
  <feMorphology in="b" operator="erode" radius="5" result="er"/>
  <feComposite in="b" in2="er" operator="out" result="edge"/>
  <feColorMatrix in="edge" type="matrix" values=".72 0 0 0 0  0 .72 0 0 0  0 0 .72 0 0  0 0 0 .55 0" result="edge2"/>
  <feTurbulence type="fractalNoise" baseFrequency=".55" numOctaves="2" seed="11" result="g"/>
  <feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -1.1 0 0 0 1.32" result="grain"/>
  <feComposite in="b" in2="grain" operator="in" result="body"/>
  <feMerge><feMergeNode in="body"/><feMergeNode in="edge2"/></feMerge>
</filter>
<filter id="f-ink" x="-3%" y="-3%" width="106%" height="106%">
  <feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="2" seed="3" result="t"/>
  <feDisplacementMap in="SourceGraphic" in2="t" scale="3.5" xChannelSelector="R" yChannelSelector="G"/>
</filter>
<filter id="f-crayon" x="-5%" y="-5%" width="110%" height="110%">
  <feTurbulence type="fractalNoise" baseFrequency=".6 .9" numOctaves="3" seed="8" result="n"/>
  <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -1.7 0 0 0 1.8" result="holes"/>
  <feComposite in="SourceGraphic" in2="holes" operator="in" result="g"/>
  <feDisplacementMap in="g" in2="n" scale="3.5" xChannelSelector="G" yChannelSelector="B"/>
</filter>
<filter id="f-bleed" x="-5%" y="-5%" width="110%" height="110%">
  <feTurbulence type="fractalNoise" baseFrequency=".05" numOctaves="2" seed="6" result="t"/>
  <feDisplacementMap in="SourceGraphic" in2="t" scale="4" xChannelSelector="R" yChannelSelector="G" result="d"/>
  <feGaussianBlur in="d" stdDeviation="1.8" result="b"/>
  <feMerge><feMergeNode in="b"/><feMergeNode in="d"/></feMerge>
</filter>
<filter id="f-pen" x="-3%" y="-3%" width="106%" height="106%">
  <feTurbulence type="fractalNoise" baseFrequency="1.2" numOctaves="1" seed="2" result="n"/>
  <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -1 0 0 0 1.45" result="a"/>
  <feComposite in="SourceGraphic" in2="a" operator="in"/>
</filter>
</defs></svg>`;
