// Claude Duet 产品宣传片 · 水彩白板 + 真实界面剪贴 16:9，英文旁白 + 中英字幕。
// 界面、人像全部剪自官方发布视频 4K 版（youtube.com/watch?v=Fb-68zqcSVs），连接器图来自 claude.com/resources/articles/claude-duet，
// 首屏截图来自 claude.com/product/claude-duet。手绘只做标注、箭头、圈重点。关键动作用 c.beat() 吸到配乐拍点上
import { A, R, ICON, ACC, INK, GRAY, sk, write, note, cursor, tap, cut, photo, sticker, banner, notif, app } from "./engine/lib.mjs";
const S = (inner, at, d, out) => sk(inner, A({ at, fx: "draw", d, out }));
const ON = (x, y, inner, at, fx = "pop", st = "") => `<div ${A({ at, fx, pen: false })} style="position:absolute;left:${x}px;top:${y}px;${st}">${inner}</div>`;
const T = (x, y, text, at, size, o = {}) => write(x, y, text, at, { size, ...o });
const B = (c, x, w) => c.beat(x, w);
const U = f => `assets/ui/${f}.png`;
const ICO = "assets/icon.png";

const appIcon = s => app(ICO, s);
const chip = (t, on, size = 40) => `<span class="chip${on ? " on" : ""}" style="font-size:${size}px;padding:10px 30px">${t}</span>`;

export const SCENES = [
  // 1 痛点：一早上的通知堆成山
  c => T(110, 90, "Every morning…", c.t(.1), 76) +
    [["gmail", "Gmail", "Re: Q3 numbers", "Can you send the final deck by noon?", 160, 250, -4],
     ["slack", "Slack", "#ops · 14 new messages", "Delivery issue in Valencia again", 300, 400, 3],
     ["cal", "Calendar", "Interview · 2:00 PM", "Head of Wholesale, round 3", 130, 550, -2],
     ["notion", "Notion", "6 tasks due today", "Health permit, renewal, payroll…", 280, 700, 2.5],
     ["shopify", "Shopify", "27 orders need attention", "Wrong delivery address", 170, 840, -3]].map(([a, n, t1, t2, x, y, r], i) => {
      const k = ["Messages", "emails", "to-dos", "pile up", "pile up"][i];
      return ON(x, y - 20, notif(U("app-" + a), n, t1, t2, { w: 680, r }), B(c, c.at(k) + (i === 4 ? .45 : 0)));
    }).join("") +
    S(R.arrow([[1130, 640], [1260, 560], [1360, 620]], { w: 5 }), c.at("dig through") - .2, .4) +
    T(1240, 650, "what matters?", c.at("find what"), 72, { color: ACC }) +
    S(R.under(1240, 755, 1730, { w: 6 }), c.at("matters") - .1, .4),

  // 2 登场
  c => `<div ${A({ at: c.t(.05), fx: "wipe", d: .6, cls: "tag", pen: false })}>Anthropic · Research preview · Oct 2026</div>` +
    ON(830, 200, appIcon(260), B(c, c.at("Claude Duet") - .2)) +
    T(600, 500, "Claude Duet", c.at("Claude Duet") + .2, 130) +
    S(R.under(610, 670, 1330, { w: 7 }), c.at("research preview") + .2, .4) +
    T(380, 730, "a proactive agent that", c.at("proactive") - .2, 62) + T(1160, 730, "comes to you", c.at("agent"), 62, { color: ACC }) +
    S(R.boxAround(1140, 718, 420, 100), B(c, c.at("to you") + .25), .5),

  // 3 晨报
  c => T(110, 80, "A brief, before coffee", c.t(.1), 72) +
    ON(110, 250, banner(U("notif"), 760, { r: -2 }), B(c, c.at("sends you a brief") - .1)) +
    ON(1060, 160, sticker(U("phone"), 620, { tapes: "top" }), c.at("Every morning") + .2, "up") +
    [["health permit", "Health permit", 520], ["hiring", "Hiring decisions", 640], ["renewal", "Renewal redlined", 760]].map(([k, s, y], i) =>
      S(R.check(170, y + 30, 1.4), B(c, c.at(k) - .1), .3) + T(240, y, s, c.at(k), 56, i === 2 ? { color: ACC } : {})).join("") +
    S(R.circle(1340, 300, 560, 150), c.at("redlined") - .3, .5) +
    S(R.arrow([[760, 790], [900, 700], [1080, 420]], { w: 4, color: GRAY }), c.at("redlined"), .4),

  // 4 销售看板
  c => T(110, 80, "Ask once.", c.t(.1), 72) + T(440, 80, "Get a dashboard.", c.at("sales dashboard") - .2, 72, { color: ACC }) +
    ON(110, 230, cut(U("chat-ask"), 620, { r: -2.5 }), B(c, c.at("Ask for") - .1)) +
    ["shopify", "salesforce", "gmail", "slack"].map((a, i) =>
      ON(840 + i * 105, 300 + (i % 2) * 40, app(U("app-" + a), 92), B(c, c.at(["point of sale", "online store", "CRM", "payroll"][i]) - .05))).join("") +
    S(R.arrow([[860, 520], [1000, 600], [1130, 560]], { w: 5 }), c.at("pulls") - .1, .4) +
    ON(1170, 420, cut(U("dashboard"), 640, { r: 2 }), B(c, c.at("CRM and payroll") + .2)) +
    S(ICON.clock(180, 890, 80, ACC), c.at("refreshes") - .3, .4) + T(240, 860, "5:30 every morning", c.at("refreshes"), 52, { color: ACC }),

  // 5 不等你开口
  c => T(110, 80, "It reaches out", c.t(.1), 76) + T(720, 80, "before you ask", c.at("before you ask") - .2, 76, { color: ACC }) +
    ON(1050, 210, cut(U("chicago"), 520, { r: 2.5 }), B(c, c.at("new location") - .2)) +
    T(200, 380, "26", c.at("twenty six") - .1, 220, { color: ACC }) + T(530, 500, "days to opening", c.at("days"), 60) +
    S(R.circle(330, 500, 360, 230), B(c, c.at("days") + .3), .5) +
    S(R.arrow([[700, 640], [850, 720], [1080, 760]], { w: 5 }), c.at("already drafted") - .3, .4) +
    T(330, 730, "permit already drafted", c.at("already drafted") + .1, 54) +
    S(R.circle(1110, 790, 220, 170), c.at("health permit") - .1, .5),

  // 6 什么可以等
  c => T(110, 80, "…and tells you", c.t(.1), 76) + T(760, 80, "what can wait", c.at("what can wait") - .2, 76, { color: ACC }) +
    ON(380, 380, banner(U("canwait"), 860, { r: -2 }), B(c, c.at("renewal") - .2)) +
    ON(1380, 300, app(U("app-cal"), 170, { r: 6 }), B(c, c.at("Monday") - .2)) +
    T(1350, 520, "Monday", c.at("Monday"), 64, { color: ACC }) +
    S(R.arrow([[1260, 470], [1310, 420], [1360, 400]], { w: 4 }), c.at("Monday") + .1, .3) +
    S(R.under(1350, 605, 1590, { w: 5 }), c.at("Monday") + .4, .3),

  // 7 走开也不落下
  c => T(110, 80, "Step away", c.t(.1), 76) + T(500, 80, "without falling behind", c.at("without falling") - .2, 76, { color: ACC }) +
    S(ICON.user(260, 420, 150), c.at("panel interviews") - .4, .5) + T(150, 520, "in interviews", c.at("interviews"), 50) +
    S(R.arrow([[420, 460], [560, 400], [700, 440]], { w: 4, color: GRAY }), c.at("gathers") - .4, .4) +
    ON(740, 220, cut(U("panel"), 640, { r: -2 }), B(c, c.at("While the panel") - .1)) +
    S(R.circle(1060, 704, 560, 72), c.at("one summary") - .2, .5) +
    T(1460, 760, "one summary", c.at("one summary"), 54, { color: ACC }),

  // 8 起草录用邮件
  c => T(110, 80, "Your top choice?", c.t(.1), 76) +
    ON(110, 220, cut(U("topchoice"), 640, { r: -2 }), B(c, c.at("top choice") - .3)) +
    S(R.circle(543, 629, 480, 270), c.at("HR folder") - .3, .5) +
    S(R.arrow([[830, 520], [950, 450], [1080, 500]], { w: 5 }), c.at("drafts") - .3, .4) +
    ON(1110, 200, cut(U("email"), 600, { r: 2.5 }), B(c, c.at("offer email") - .4)) +
    T(140, 860, "offer email, drafted", c.at("package") - .2, 48, { color: ACC }),

  // 9 你说了算
  c => T(110, 80, "You keep", c.t(.1), 80) + T(470, 80, "the final say", c.at("final say") - .2, 80, { color: ACC }) +
    ON(640, 210, cut(U("email-big"), 760, { r: -1.5 }), c.at("Nothing") - .4) +
    cursor(A({ at: c.at("until") - .4, fx: "fade", kf: [[c.at("until") - .4, { x: 1550, y: 900 }], [B(c, c.at("tap send")), { x: 1190, y: 668 }]] })) +
    tap(1200, 678, B(c, c.at("tap send")) + .05) +
    S(R.circle(1200, 678, 340, 110), B(c, c.at("tap send")) + .15, .4) +
    T(120, 420, "nothing goes out", c.at("Nothing goes out"), 54) + T(120, 500, "without you", c.at("until"), 54, { color: ACC }),

  // 10 Jenn 签了
  c => T(760, 220, "Two days later…", c.t(.1), 64, { color: GRAY }) +
    ON(320, 440, banner(U("signed"), 1180, { r: -1 }), B(c, c.at("Jenn signed") - .05)) +
    S(R.burst(300, 470, 90, 7), B(c, c.at("signed")), .35) + S(R.burst(1620, 470, 90, 7), B(c, c.at("signed")) + .05, .35) +
    S(R.under(530, 630, 790, { w: 6 }), c.at("signed") + .2, .3),

  // 11 Anthropic 内部在用（真实人像，像拍立得一样贴上去）
  c => T(110, 80, "Tested inside Anthropic", c.t(.1), 76) +
    [["mike", 150, 230, -4], ["murtaza", 590, 200, 2.5], ["chelsea", 1030, 240, -2], ["boris", 1450, 210, 3.5]].map(([p, x, y, r], i) =>
      ON(x, y, photo(U("p-" + p), 340, { r, h: 420, pos: "top", caption: p[0].toUpperCase() + p.slice(1) }), B(c, c.t(.4) + i * .5, .25))).join("") +
    T(700, 900, "for weeks", c.at("for weeks") - .1, 56, { color: ACC }),

  // 12 连接 + 安全
  c => T(110, 80, "6,000+", c.at("six thousand") - .1, 84, { color: ACC }) + T(450, 96, "connectors", c.at("connectors"), 66) +
    ON(110, 230, cut(U("connectors-grid"), 920, { r: -1.5, pad: 0 }), B(c, c.at("works with") - .1)) +
    S(ICON.cloud(1450, 330, 380), c.at("cloud computer") - .6, .6) + S(ICON.lock(1450, 345, 90, ACC), c.at("Logins"), .4) +
    T(1250, 470, "your own cloud computer", c.at("cloud computer"), 44) +
    S(R.ell(1450, 700, 220, 120, { w: 5, wash: false }), c.at("always see") - .4, .4) + S(R.fillEll(1450, 700, 52, 52, INK), c.at("always see"), .3) +
    T(1290, 790, "always see it", c.at("what it's doing") - .4, 52, { color: ACC }),

  // 13 怎么用上
  c => T(110, 80, "Join the waitlist", c.t(.1), 76) +
    ON(1120, 200, cut("assets/hero.png", 600, { r: 1.5 }), c.t(.3), "up") +
    ON(130, 280, chip("Opus 5.5", true, 48), B(c, c.at("Opus"))) +
    ON(130, 440, chip("Pro", false), B(c, c.at("Pro"))) + ON(320, 440, chip("Max", false), B(c, c.at("Max"))) + ON(510, 440, chip("US", false), B(c, c.at("US"))) +
    note(150, 620, 620, "Waitlist open today<br>claude.com/claude-duet", A({ at: B(c, c.at("waitlist") - .3), fx: "pop", pen: false }), { size: 40 }) +
    S(R.under(1135, 832, 1600, { w: 4 }), c.at("Opus") + .3, .4),

  // 14 收尾
  c => ON(830, 200, appIcon(260), B(c, c.t(.1))) +
    T(600, 500, "Claude Duet", c.at("Claude Duet") + .1, 130) +
    T(560, 700, "Get back to what needs you.", c.at("Get back") - .1, 72, { color: ACC }) +
    S(R.under(560, 800, 1470, { w: 6 }), c.at("needs you") - .1, .4),
];
