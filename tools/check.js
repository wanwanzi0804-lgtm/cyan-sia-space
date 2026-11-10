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
    ok('她的规则会带进世琳的每次对话', /她定下的规则/.test(srCtx(Date.now(), '')));
    ok('规则里有早上找她', srRules().some(x => /早上/.test(x)));
    ok('规则里有不要老说困', srRules().some(x => /困不困/.test(x)));
    ok('规则里有认真倾诉时给安慰和建议', srRules().some(x => /倾诉烦恼/.test(x)));
    ok('规则里有打电话更黏糊', srRules().some(x => /黏糊/.test(x)));
    ok('后台能看到规则', /世琳的规则/.test(serimCardHTML()));
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
    ok('「哥哥」翻成 오빠 不是 형', '나는 형의 마음에'.replace(/형(?=[이의은는을를도한께님아야]|\b|$)/g, '오빠') === '나는 오빠의 마음에');
    return out;
  });
  for (const [s, n] of r) console.log(s, n);
  console.log(errs.length ? 'PAGE ERRORS: ' + errs.join(' | ') : 'no page errors');
  await b.close();
  process.exit(r.some(x => x[0] === 'BAD') || errs.length ? 1 : 0);
})();
