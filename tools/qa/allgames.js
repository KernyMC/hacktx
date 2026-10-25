// Run: node tools/qa/allgames.js   (server on :8099). Opens every species' minigame at max difficulty with random input.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 430, height: 860 } });
  let cur = ''; const issues = {}; const note = (m) => { (issues[cur] = issues[cur] || new Set()).add(m.slice(0, 140)); };
  p.on('pageerror', e => note('PAGEERROR ' + e.message)); p.on('console', m => { if (m.type() === 'warning' || m.type() === 'error') note(m.text().split('\n')[0]); });
  await p.goto('http://localhost:8099/'); await p.waitForTimeout(2500);
  const ids = await p.evaluate(() => Object.keys(Animals.A));
  const hearts = {};
  for (const id of ids) {
    cur = id;
    await p.evaluate((id) => { window.__done = false; Minigames.open({ engine: Animals.A[id].minigame, pet: { name: 'T', species: id, rarity: Animals.A[id].rarity }, difficulty: 5, title: id, subtitle: 'test' }).then(() => window.__done = true); }, id);
    await p.waitForTimeout(500);
    const stars = await p.evaluate(() => [...document.querySelectorAll('.mg-card span[style*="grayscale"], .mg-overlay span[style*="grayscale"]')].length);
    await p.getByRole('button', { name: 'Start', exact: true }).click().catch(() => note('no start button'));
    const box = await p.$eval('.mg-canvas', el => { const r = el.getBoundingClientRect(); return [r.x, r.y, r.width, r.height]; }).catch(() => null);
    if (!box) { note('no canvas'); } else {
      for (let i = 0; i < 40; i++) { await p.mouse.click(box[0] + Math.random() * box[2], box[1] + Math.random() * box[3]); if (i % 3 === 0) await p.keyboard.press(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'][i % 5]); await p.waitForTimeout(110); }
    }
    hearts[id] = await p.evaluate(() => { const h = document.querySelector('.mg-hearts'); return h ? h.querySelectorAll('svg').length + ' total/' + h.querySelectorAll('span[style*="grayscale"]').length + ' lost' : 'none'; });
    hearts[id] += ' · off-stars ' + stars;
    await p.click('.mg-x').catch(() => {}); await p.waitForTimeout(300);
    await p.evaluate(() => document.querySelectorAll('.mg-x').forEach(x => x.click())); await p.waitForTimeout(200);
  }
  const bad = Object.entries(issues).filter(([k, v]) => v.size);
  console.log('games with issues:', bad.length); bad.forEach(([k, v]) => console.log(' ', k, [...v].join(' || ')));
  console.log(Object.entries(hearts).map(([k, v]) => k + ': ' + v).join('\n'));
  await b.close();
})();
