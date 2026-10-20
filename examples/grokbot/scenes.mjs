// Grok Bot 产品介绍 · 白板手绘 16:9。素材全部来自 x.ai/bot 和 x.ai/news/introducing-grok-bot
import { A, R, ICON, ACC, INK, GRAY, sk, hand, write, box, head, pin, logo, note, tape, cursor, tap } from "./engine/lib.mjs";
const S = (inner, at, d, out) => sk(inner, A({ at, fx: "draw", d, out }));
const ON = (x, y, inner, at, fx = "up", st = "") => `<div ${A({ at, fx, pen: false })} style="position:absolute;left:${x}px;top:${y}px;${st}">${inner}</div>`;
const T = (x, y, text, at, size, o = {}) => write(x, y, text, at, { size, ...o });
const LOGO = "assets/logo-grokbot.png";

export const SCENES = [
  // 1 痛点：卡在九成
  c => head(c, "", "AI 的活，总卡在<em>最后一成</em>") +
    S(R.rect(170, 330, 1300, 110, { w: 4 }), c.t(.4), .7) +
    S(R.hatch(176, 336, 1158, 98, ACC), c.at("九成") - .6, .8) +
    T(1150, 258, "90%", c.at("九成"), 60, { color: ACC }) +
    S(R.boxAround(1340, 316, 150, 138, { color: INK }), c.at("九成") + .5, .5) +
    T(1530, 350, "?", c.at("九成") + .7, 72) +
    S(ICON.doc(300, 690, 120), c.at("草稿写好了") - .2, .6) + T(220, 780, "草稿写好了", c.at("草稿写好了"), 40) +
    S(R.arrow([[400, 690], [560, 660], [700, 690]], { w: 4 }), c.at("最后还得") - .3, .5) +
    S(ICON.laptop(840, 690, 150), c.at("贴进系统") - .4, .6) + T(760, 780, "贴进系统", c.at("贴进系统"), 40) +
    S(R.arrow([[960, 690], [1120, 660], [1250, 690]], { w: 4 }), c.at("点发送") - .5, .4) +
    ON(1300, 640, `<div class="btn acc" style="width:180px">发送</div>`, c.at("点发送") - .2, "pop") +
    cursor(A({ at: c.at("点发送") - .2, fx: "fade", kf: [[c.at("点发送") - .2, { x: 1560, y: 760 }], [c.at("点发送") + .3, { x: 1410, y: 670 }]] })) +
    tap(1420, 680, c.at("点发送") + .35) +
    T(1300, 780, "还得你自己来", c.at("你自己") + .2, 40, { color: ACC }),

  // 2 产品登场
  c => `<div ${A({ at: c.t(.05), fx: "wipe", d: .6, cls: "tag", pen: false })}>SpaceXAI · 2026 年 8 月 · 测试版</div>` +
    ON(618, 250, logo(LOGO, 150, { ink: true }), c.t(.2), "fade") +
    S(R.rect(460, 500, 1000, 80, { w: 4 }), c.t(.5), .5) +
    S(R.hatch(466, 506, 890, 68, GRAY, { gap: 16 }), c.t(.7), .3) +
    S(R.hatch(1356, 506, 98, 68, ACC, { gap: 10 }), c.at("补上") - .1, .5) +
    S(R.check(1500, 540, 1.8), c.at("最后这一成"), .4) +
    T(1560, 500, "100%", c.at("最后这一成") + .2, 52, { color: ACC }) +
    T(560, 650, "一支全天候在线的 AI 队友", c.at("全天候"), 64) +
    T(730, 760, "能把活儿直接做完", c.at("直接做完") - .5, 56, { color: ACC }) +
    S(R.under(720, 840, 1200, { w: 5 }), c.at("直接做完") + .4, .4),

  // 3 自己的云端电脑
  c => head(c, "", "每个 Bot 都有一台<em>自己的电脑</em>") +
    ON(930, 270, pin("assets/ui-computer.png", 870, 580), c.t(.3)) +
    S(ICON.cloud(420, 400, 380), c.at("云端电脑") - .5, .7) + S(ICON.laptop(420, 410, 120), c.at("云端电脑") - .1, .4) +
    T(330, 530, "云端电脑", c.at("云端电脑") + .2, 44, { color: ACC }) +
    S(R.check(200, 660), c.at("登录工具"), .3) + T(250, 630, "登录你在用的工具", c.at("登录工具"), 40) +
    S(R.circle(1365, 640, 420, 90), c.at("登录工具") + .2, .6) +
    S(R.check(200, 740), c.at("打开网页"), .3) + T(250, 710, "打开网页", c.at("打开网页"), 40) +
    S(R.check(200, 820), c.at("没有接口"), .3) + T(250, 790, "没有接口的系统也行", c.at("没有接口"), 40) +
    S(R.mark(250, 820, 610, 818), c.at("没有接口") + .9, .4),

  // 4 你离开电脑，它照样在干
  c => head(c, "", "你离开电脑，它<em>照样在干</em>") +
    ON(150, 300, `<div style="transform:rotate(-3deg)">${pin("assets/img-02.jpg", 620, 413)}</div>`, c.at("离开电脑") - .3) +
    T(300, 750, "你在外面", c.at("离开电脑") + .4, 44) +
    S(ICON.bot(980, 380, 120), c.at("照样在干") - .4, .5) +
    ["把通话记录写进 CRM", "处理 Gmail 里的发票", "起草跟进邮件"].map((s, i) => {
      const at = c.at("照样在干") + .3 + i * .7;
      return S(R.check(1080, 360 + i * 80 - 10), at + .4, .3) + T(1140, 330 + i * 80 - 10, s, at, 40);
    }).join("") +
    S(R.line(1060, 590, 1760, 590, { color: GRAY, w: 2 }), c.at("做完了"), .4) +
    box(1060, 640, 700, 0, `<div class="bubble" style="position:relative;font-size:32px">这封要发给客户，批准吗？<div style="margin-top:14px;display:flex;gap:14px"><span class="btn acc" style="font-size:28px;padding:8px 26px">批准</span><span class="chip">再改改</span></div></div>`, A({ at: c.at("需要你批准") - .2, fx: "pop", pen: false })),

  // 5 像给同事发消息
  c => head(c, "", "交代任务，像给<em>同事</em>发消息") +
    ON(400, 260, pin("assets/ui-app.png", 1180, 499, { pos: "top" }), c.t(.3)) +
    S(ICON.phone(200, 380, 140), c.at("手机") - .3, .4) + T(150, 470, "手机", c.at("手机"), 38) +
    S(ICON.laptop(200, 620, 150), c.at("电脑都能发") - .4, .5) + T(150, 700, "电脑", c.at("电脑都能发"), 38) +
    S(R.arrow([[270, 400], [330, 430], [420, 470]], { w: 4, color: ACC }) + R.arrow([[280, 610], [340, 590], [420, 560]], { w: 4, color: ACC }), c.at("都能发"), .5) +
    S(R.circle(1110, 600, 1180, 330), c.at("同一个对话") - .2, .7) +
    T(1240, 800, "随时接着聊", c.at("随时接着聊") - .2, 48, { color: ACC }),

  // 6 不用搭流程
  c => head(c, "", "不用先<em>搭流程</em>") +
    S(R.rect(180, 300, 240, 90) + R.arrow([[300, 392], [300, 470]]) + R.rect(180, 470, 240, 90) + R.arrow([[422, 515], [520, 515]]) + R.rect(520, 470, 240, 90) + R.arrow([[300, 562], [300, 640]]) + R.rect(180, 640, 240, 90), c.at("搭流程") - .8, 1.2) +
    T(232, 322, "触发条件", c.at("写自动化") - .5, 36) + T(232, 492, "判断分支", c.at("写自动化") - .2, 36) + T(572, 492, "调接口", c.at("写自动化") + .1, 36) + T(232, 662, "定时重跑", c.at("写自动化") + .4, 36) +
    S(R.cross(470, 520, 230, { w: 9, color: ACC }), c.at("直接说") - .3, .5) +
    box(1000, 360, 760, 0, `<div class="bubble me" style="position:relative;margin-left:auto;width:fit-content;font-size:34px">帮我把这周的报销整理好</div>`, A({ at: c.at("直接说"), fx: "pop", pen: false })) +
    box(1000, 520, 760, 0, `<div class="bubble" style="position:relative;width:fit-content;font-size:34px">好，整理完发你确认。</div>`, A({ at: c.at("就行") - .2, fx: "pop", pen: false })) +
    S(ICON.bot(940, 560, 80), c.at("就行") - .3, .4),

  // 7 一个总管，各管一摊
  c => head(c, "", "一个总管，<em>各管一摊</em>") +
    ON(110, 250, pin("assets/ui-bots.png", 400, 476, { tapes: false }), c.at("好几个") - .2, "up", "transform:rotate(-2deg)") +
    S(R.circle(1150, 330, 300, 120), c.at("总管") - .3, .5) + T(1080, 300, "总管", c.at("总管"), 52) +
    [["收件箱", "mail", 640], ["报销", "coin", 950], ["招聘", "user", 1260], ["修 bug", "bug", 1570]].map(([s, ic, x]) => {
      const at = c.at(s) - .3;
      return S(R.arrow([[1150, 395], [(1150 + x) / 2, 470], [x, 560]], { w: 3 }) + ICON[ic](x, 640, 100, ACC), at, .6) + T(x - s.length * 20, 715, s, at + .4, 40);
    }).join("") +
    T(820, 820, "其余各管一摊", c.at("其余") + .2, 44, { color: ACC }),

  // 8 它们自己协作
  c => head(c, "", "它们<em>自己协作</em>") +
    S(ICON.bot(300, 380, 110) + ICON.bot(620, 380, 110) + ICON.bot(460, 640, 110), c.t(.3), .9) +
    S(R.arrow([[370, 360], [460, 330], [550, 360]], { w: 3, color: ACC }) + R.arrow([[580, 450], [560, 530], [510, 580]], { w: 3, color: ACC }) + R.arrow([[400, 590], [330, 530], [310, 450]], { w: 3, color: ACC }), c.at("互相发消息") - .2, .8) +
    ON(860, 290, pin("assets/ui-thread.png", 940, 262), c.at("共享上下文") - .4) +
    S(R.mark(910, 330, 1180, 330), c.at("分派任务") - .3, .4) + S(R.mark(1440, 330, 1560, 330), c.at("分派任务"), .3) +
    S(ICON.user(1180, 720, 110), c.at("拍板") - .5, .5) +
    box(1280, 670, 520, 0, `<div class="bubble" style="position:relative;width:fit-content;font-size:32px">这两个客户先跟哪个？</div>`, A({ at: c.at("拍板") - .1, fx: "pop", pen: false })) +
    T(1240, 800, "只把要拍板的事交给你", c.at("交给你") - .4, 40, { color: ACC }),

  // 9 演示一遍
  c => head(c, "", "演示一遍，<em>下次它来</em>") +
    ON(1000, 270, pin("assets/ui-teach.png", 800, 533), c.t(.3)) +
    S(R.circle(1688, 497, 230, 80), c.at("看你做一遍") - .3, .5) +
    [["你做一遍", "user", 250, "看你做一遍"], ["存成流程", "doc", 520, "存成"], ["下次自己跑", "bot", 790, "下次自己跑"]].map(([s, ic, x, w], i) =>
      S(ICON[ic](x, 470, 110, i === 2 ? ACC : INK) + (i ? R.arrow([[x - 205, 470], [x - 85, 470]], { w: 4 }) : ""), c.at(w) - .4, .6) + T(x - s.length * 21, 560, s, c.at(w), 42, i === 2 ? { color: ACC } : {})).join(""),

  // 10 越用越懂你
  c => head(c, "", "合作越久，<em>越懂你</em>") +
    note(200, 300, 560, "· 邮件写短一点<br>· 周一先发周报<br>· 涉及价格先问我", A({ at: c.at("习惯") - .5, fx: "pop", pen: false }), { size: 40 }) +
    S(R.poly([[1000, 300], [1000, 780], [1760, 780]], { w: 3 }), c.at("合作久了") - .2, .5) +
    S(R.curve([[1020, 740], [1200, 700], [1380, 600], [1560, 450], [1730, 330]], { w: 5, color: ACC }), c.at("合作久了") + .3, .9) +
    T(1500, 800, "合作时间", c.at("合作久了") + .4, 34, { color: GRAY }) + T(1030, 270, "越顺手", c.at("合作久了") + .6, 40) +
    ON(260, 680, `<span class="chip">拿不准 → 先问你</span>`, c.at("该问"), "pop") +
    ON(260, 770, `<span class="chip on">有把握 → 直接做</span>`, c.at("直接做") - .2, "pop"),

  // 11 销售：一夜之间
  c => head(c, "", "比如<em>销售</em>，一夜之间") +
    S(R.line(200, 420, 1720, 420, { w: 3, color: GRAY }), c.t(.3), .7) +
    [["连夜", "moon", 260, "连夜"], ["研究客户", "globe", 620, "研究客户"], ["给联系人打分", "star", 980, "打分"], ["写好邮件草稿", "mail", 1340, "邮件草稿"], ["第二天批准", "clock", 1680, "批准"]].map(([s, ic, x, w], i) =>
      S(ICON[ic](x, 420, 100, i === 4 ? ACC : INK), c.at(w) - .5, .5) + T(x - s.length * 20, 490, s, c.at(w) - .1, 40, i === 4 ? { color: ACC } : {})).join("") +
    ON(560, 600, pin("assets/ui-steps.png", 720, 190, { tapes: true }), c.at("邮件草稿") + .2) +
    S(R.mark(600, 750, 1060, 750), c.at("批准") - .4, .4),

  // 12 现在能用
  c => head(c, "", "现在就能<em>上手</em>") +
    S(R.boxAround(1580, 90, 220, 90), c.at("测试版") - .1, .4) + T(1610, 108, "测试版", c.at("测试版"), 44, { color: ACC }) +
    S(ICON.laptop(330, 430, 190), c.at("桌面端") - .4, .5) + T(250, 540, "桌面端", c.at("桌面端"), 40) +
    S(ICON.phone(580, 430, 150), c.at("iOS") - .4, .4) + T(545, 540, "iOS", c.at("iOS"), 40) +
    ON(900, 330, `<div style="display:flex;gap:16px;flex-wrap:wrap;width:860px"><span class="chip">SuperGrok</span><span class="chip">SuperGrok Plus</span><span class="chip">SuperGrok Heavy</span></div>`, c.at("SuperGrok") - .2, "pop") +
    ON(900, 450, `<div style="display:flex;gap:16px;flex-wrap:wrap;width:860px"><span class="chip">Cursor Pro</span><span class="chip">Pro+</span><span class="chip">Ultra</span><span class="chip">Teams</span></div>`, c.at("Cursor") - .2, "pop") +
    T(900, 270, "订阅用户先试", c.at("订阅用户"), 36, { color: GRAY }) +
    note(900, 610, 620, "用量单独计算，不占原来的额度", A({ at: c.at("用量单独") - .2, fx: "pop", pen: false }), { r: 2 }),

  // 13 收尾
  c => ON(618, 330, logo(LOGO, 150, { ink: true }), c.t(.2), "fade") +
    T(620, 560, "能把活儿干完的 AI 队友", c.at("能把活儿") - .2, 64) +
    S(R.under(610, 650, 1300, { w: 6 }), c.at("AI 队友"), .4) +
    S(ICON.star(520, 600, 70, ACC) + R.burst(1380, 590, 40, 5), c.at("AI 队友") + .3, .5) +
    ON(830, 730, `<span class="chip" style="font-size:36px;padding:8px 28px">x.ai/bot</span>`, c.at("AI 队友") + .6, "pop"),
];
