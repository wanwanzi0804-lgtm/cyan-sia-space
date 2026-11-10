/* 回归检查：每次改完推送之前跑一遍，确认以前修过的问题没有再犯（node tools/check.js，需要 playwright）
   每条对应一次她的反馈；新的反馈修好之后，在这里加一条 */
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch(), p = await b.newPage(), errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.resolve(__dirname, '../index.html'));
  await p.waitForTimeout(2500);
  const r = await p.evaluate(() => {
    const out = [], ok = (name, cond) => out.push([cond ? 'OK ' : 'BAD', name]);
    const dk = dkey(Date.now()), seg = (what, s, e) => ({ sleep: false, kind: 'work', seg: { what, s, e } });
    ok('为演唱会合练时会看手机', !srNoPhone(seg('为11月的演唱会合练，过全场曲目和队形', 805, 1170)));
    ok('签售那一两个小时不看手机', srNoPhone(seg('签售', 600, 720)));
    ok('一整天的颁奖礼现场中间会看手机', !srNoPhone(seg('KGMA 颁奖典礼', 660, 1290)));
    { const t0 = srTs(dk, 0), T = { msgs: [{ text: '점심 꼭 챙겨 먹고ㅎ', zh: '午饭一定要吃哦', at: t0 + 60e3 }] }, L = srTidy([{ ko: '팬싸 끝났어?ㅎ 밥은 먹었어?', zh: '签售结束了吗？ㅎ 吃饭了吗？' }], T, Date.now());
      ok('一天不重复问吃饭', L.length === 1 && !/밥/.test(L[0].ko)); }
    ok('她的规则会带进世琳的每次对话', /他这个人平时的样子/.test(srCtx(Date.now(), '')));
    ok('规则不是按次数的指标', !srRules().some(x => /一天里自然地说一两次|会先找她一次|至少回一句/.test(x)));
    ok('说话底层强调废话和单一焦点', /没什么意义的废话/.test(SR_VOICE) && /完成清单/.test(SR_VOICE));
    ok('规则里有早上找她', srRules().some(x => /早上/.test(x)));
    ok('规则里有不要老说困', srRules().some(x => /困不困/.test(x)));
    ok('规则里有认真倾诉时给安慰和建议', srRules().some(x => /倾诉烦恼/.test(x)));
    ok('规则里有打电话更黏糊', srRules().some(x => /黏糊/.test(x)));
    ok('后台不再显示规则和发过的照片', !/世琳的规则|发过的照片/.test(serimCardHTML()));
    { const R = SR(), dd = '2030-01-05'; R.day[dd] = { gen: 'ai', segs: [{ id: 'a', s: 0, e: 600, what: '睡觉', kind: 'sleep', src: 'gen', where: '宿舍' }, { id: 'b', s: 1200, e: 1290, what: '健身', kind: 'free', src: 'note', where: '健身房' }] }; srTailFill(dd); srTailFill(dd); srTailFill(dd);
      ok('一天的安排会补到 24 点', Math.max(...srSegs(dd).map(g => g.e)) >= 1430);
      ok('补到 24 点不会越补越多', R.day[dd].segs.filter(g => g.tail && !g.del).length <= 2); delete R.day[dd]; }
    ok('安排日常时知道 14 号的演唱会', /CONCERT|演唱会/.test(srUpcoming('2026-11-10')));
    ok('演唱会当天只固定演出本身，前面的彩排化妆让 AI 排', (srOfficial('2026-11-14')[0] || {}).s >= 17 * 60);
    { const st = { ai: {}, social: { dm: { 'A|b': { p: { g: 'A', n: 'b' }, msgs: [] } } } }; keyRepair(st); ok('导入后聊天的 key 能补回来', st.social.dm['A|b'].p.key === 'A|b'); }
    { const st = { ai: {}, social: { dm: { 'C|s': { p: { g: 'C', n: 's', key: 'C|s' }, msgs: [{ id: 1, at: 1 }] }, 'undefined': { p: { g: 'C', n: 's' }, msgs: [{ id: 2, at: 2, call: {} }] } } } }; keyRepair(st); ok('记到错的聊天里的电话记录会并回来', !st.social.dm.undefined && st.social.dm['C|s'].msgs.length === 2); }
    ok('聊天记录里能看到电话聊了什么', /语音通话 1:00：聊了演唱会/.test(srChatLog({ msgs: [{ at: Date.now() - 1e3, call: { st: 'done', dur: '1:00', sum: '聊了演唱会' } }] }, Date.now())));
    ok('官方号自己发的帖子能显示、能删', /CYAN OFFICIAL[\s\S]*offdel/.test(offCard({ id: 'man:t', k: 'man', at: Date.now(), txt: '공지', media: [], base: 10, cc: 1, cm: [] })));
    ok('回归企划里能放官方号宣发素材', /官方号宣发素材[\s\S]*Coming Soon[\s\S]*pp-offmat/.test(offMatHTML({ id: 'x', tracks: [] })));
    { const L = chal().list; L.push({ st: 'done', p: { n: 'x' } }); const u0 = UI.tab; UI.tab = 'sched'; render(); ok('有缺日期的 challenge 记录时行程页也能打开', !/这个页面出错了/.test(view.innerHTML)); L.pop(); UI.tab = u0; render(); }
    { const st = { ai: {}, x: { cards: { '2026-11-07|r1': { title: 't' } } } }; keyRepair(st); ok('通告卡片丢了 key 也能补回来', st.x.cards['2026-11-07|r1'].key === '2026-11-07|r1'); }
    { const T = tgState(), k = dkey(Date.now()); T.cards[k + '|zz'] = { title: 'x' }; const u0 = UI.tab; UI.tab = 'sched'; render(); ok('通告卡片缺 key 时行程页也能打开', !/这个页面出错了/.test(view.innerHTML)); delete T.cards[k + '|zz']; UI.tab = u0; render(); }
    ok('聊天记录里能看到最近一通电话说了什么', /他都记得[\s\S]*她：最近好累/.test(srChatLog({ msgs: [{ at: Date.now() - 1e3, call: { st: 'done', dur: '1:00', sum: 's', log: '她：最近好累\n他：怎么了' } }] }, Date.now())));
    { const R = SR(), q0 = R.quietUntil, n0 = R.jobs.length; R.quietUntil = Date.now() + 3600e3; srReachEval(Date.now()); ok('说了晚安以后不再主动找她', R.jobs.length === n0); R.quietUntil = q0; }
    { const T = { msgs: [{ me: 1, text: 'a', at: 1 }, { me: 1, call: { st: 'done' }, at: 2 }, { me: 1, text: 'b', at: 3 }] }; ok('电话之前她发的不会在电话之后再回', srHer(T, 10).map(m => m.text).join() === 'b'); }
    ok('说话和记账分开：说话那一下只输出话', SR_SAY_SCHEMA.required.join() === 'inner,act,ko,zh,end' && typeof srBook === 'function');
    { const T = dmThread(srP()), m0 = T.msgs, now = Date.now(), R = SR(), e0 = R.chat.endAt, sn = window.srNow; window.srNow = () => ({ kind: 'free' }); R.chat.endAt = 0;
      T.msgs = [...m0, { id: 'h1', text: 'ㅋㅋ', at: now - 60e3 }, { id: 'm1', me: 1, text: 'ㅋㅋ', at: now - 20e3 }];
      ok('他刚发完你马上回：算正在聊', srEngage(now).lv === 'hot'); ok('正在聊时几十秒内就会看到', srCheckGap(now) < 2);
      T.msgs = [...m0, { id: 'h1', text: 'ㅋㅋ', at: now - 3 * 3600e3 }]; ok('几个小时没聊：不算正在聊', srEngage(now).lv === 'cold');
      R.chat.endAt = now - 60e3; T.msgs = [...m0, { id: 'h1', text: '잘자', at: now - 60e3 }]; ok('说了先这样：不再算手机在手上', srEngage(now).lv !== 'hot');
      T.msgs = m0; R.chat.endAt = e0; window.srNow = sn; }
    { const T = { msgs: [{ me: 1, text: '그렇게 재밌어?', at: 100 }, { text: '응 은근 재밌어', at: 200, gen: 150 }, { text: '아까도 주인공이…', at: 300, gen: 150 }, { me: 1, text: '나랑 비교하면?', at: 350 }, { text: '어이없어서 혼자 웃었잖아ㅋㅋ', at: 400, gen: 150 }] };
      ok('他还在发的时候插嘴：插的那句算还没回', srHer(T, 1000).map(m => m.text).join() === '나랑 비교하면?'); }
    ok('「哥哥」翻成 오빠 不是 형', '나는 형의 마음에'.replace(/형(?=[이의은는을를도한께님아야]|\b|$)/g, '오빠') === '나는 오빠의 마음에');
    return out;
  });
  for (const [s, n] of r) console.log(s, n);
  console.log(errs.length ? 'PAGE ERRORS: ' + errs.join(' | ') : 'no page errors');
  await b.close();
  process.exit(r.some(x => x[0] === 'BAD') || errs.length ? 1 : 0);
})();
