/* 整体走一遍：模拟 iPhone 主屏幕版，把常用页面和操作都点一遍，看有没有报错、卡住（node tools/smoke.js） */
const { chromium, devices } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch(), c = await b.newContext({ ...devices['iPhone 13'] }), p = await c.newPage(), errs = [], res = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.addInitScript(() => { Object.defineProperty(navigator, 'standalone', { get: () => true }); });
  await p.goto('file://' + path.resolve(__dirname, '../index.html')); await p.waitForTimeout(3000);
  const step = async (name, fn) => { const e0 = errs.length, t0 = Date.now(); try { await fn(); await p.waitForTimeout(250); const alive = await Promise.race([p.evaluate(() => 1), new Promise(r => setTimeout(() => r(0), 3000))]); res.push([errs.length === e0 && alive ? 'OK ' : 'BAD', name, Date.now() - t0 + 'ms', errs.slice(e0).join(' | ').slice(0, 160)]); } catch (e) { res.push(['BAD', name, '', String(e.message).slice(0, 160)]); } };
  const closeAll = () => p.evaluate(() => { try { closeModal(); } catch (e) { } UI.dmOpen = null; });
  await step('关掉启动弹窗', closeAll);
  for (const tab of ['feed', 'bubble', 'sched', 'kkt', 'me']) await step('切到 ' + tab, () => p.tap(`.tab[data-tab="${tab}"]`));
  await step('社区：打开发帖框、切官方号', async () => { await p.tap('.tab[data-tab="feed"]'); await p.evaluate(() => { UI.cmpOpen = true; render(); }); await p.tap('[data-act="cmpas"]'); await p.tap('[data-act="cmpas"]'); });
  await step('社区：媒体页', () => p.evaluate(() => { UI.feedSub = 'media'; render(); UI.feedSub = 'feed'; render(); }));
  await step('行程：打开后台、加一个行程、关掉', async () => { await p.tap('.tab[data-tab="sched"]'); await p.tap('[data-act="admin"]'); await p.fill('#r-title', '冒烟测试'); await p.evaluate(() => { $('#r-start').value = '15:00'; $('#r-end').value = '16:00'; const d = $('#r-date'); if (d) d.value = dkey(Date.now()); }); await p.tap('[data-act="rsave"]'); await closeAll(); });
  await step('KKT：逐个打开聊天', async () => { await p.tap('.tab[data-tab="kkt"]'); const n = await p.$$eval('[data-act="dmopen"]', a => a.length); for (let i = 0; i < Math.min(n, 12); i++) { await p.evaluate(i => document.querySelectorAll('[data-act="dmopen"]')[i].click(), i); await p.waitForTimeout(120); const on = await p.evaluate(() => $('#modal').classList.contains('on')); if (!on) throw new Error('第 ' + (i + 1) + ' 个聊天打不开'); await closeAll(); } });
  await step('KKT：在世琳的聊天里打字', async () => { await p.evaluate(() => { UI.dmOpen = SR_K; openModal(dmHTML(SR_K)); }); await p.fill('#dm-in', '测试'); await p.evaluate(() => { $('#dm-in').value = ''; }); await closeAll(); });
  await step('经纪人聊天', async () => { await p.evaluate(() => { const b = document.querySelector('[data-act="mgropen"]'); if (b) b.click(); }); await closeAll(); });
  await step('世琳后台', async () => { await p.evaluate(() => openModal(serimCardHTML())); await closeAll(); });
  await step('我的：各个分页', async () => { await p.tap('.tab[data-tab="me"]'); for (const k of ['stats', 'wallet', 'music', 'persona', 'set']) await p.evaluate(k => { const b = document.querySelector(`.me-tabs [data-k="${k}"]`) || [...document.querySelectorAll('.me-tabs button')].find(x => x.dataset.tab === k || x.dataset.p === k); if (b) b.click(); }, k); });
  await step('打电话界面打开再关', async () => { await p.evaluate(() => { const T = dmThread(srP()); UI.call = { key: SR_K, mode: 'in', by: 'them' }; callShow(); UI.call = null; callShow(); }); });
  await step('整体还在动（tick 正常）', () => p.waitForTimeout(3500));
  for (const r of res) console.log(r.filter(Boolean).join('  '));
  console.log(errs.length ? 'PAGE ERRORS: ' + [...new Set(errs)].join(' | ').slice(0, 600) : 'no page errors');
  await b.close(); process.exit(res.some(r => r[0] === 'BAD') ? 1 : 0);
})();
