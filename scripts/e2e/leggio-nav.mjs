// Tocco su una nota del rigo, frecce ‹ ›, dita e note tenute sulla tastiera.
import { chromium } from 'playwright-core';
const SHOTS = process.env.SHOTS ?? '/tmp';
const title = process.argv[2] ?? 'Minuetto in Sol';
const tag = process.argv[3] ?? 'nav';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await (await browser.newContext({ viewport: { width: 1180, height: 820 }, isMobile: true, hasTouch: true })).newPage();
const errs = [];
page.on('pageerror', e => errs.push(e.message));
page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 160)); });
await page.goto('http://localhost:5199/');
await page.evaluate(() => localStorage.setItem('piano-trainer-v2', JSON.stringify({ version: 2, onboardingDone: true, unlockedCount: 40 })));
await page.reload(); await page.waitForTimeout(700);
await page.locator('nav button').nth(1).click();
await page.locator('main button').filter({ hasText: title }).first().click();
await page.getByText('Preparo lo spartito').waitFor({ state: 'detached', timeout: 90000 });
await page.waitForTimeout(500);
const state = async () => page.evaluate(() => {
  const head = document.body.innerText.match(/batt\. (\d+)\/\d+/)?.[1];
  const keys = [...document.querySelectorAll('button[data-midi]')].filter(b => b.style.background && !b.style.background.includes('gradient'));
  return {
    batt: head,
    lit: keys.map(b => `${b.getAttribute('aria-label')}${b.style.background.length > 20 ? '' : ''}${b.querySelector('span span, span.rounded-full')?.textContent?.match(/^\d/) ? '(' + [...b.querySelectorAll('span')].map(s => s.textContent).find(x => /^\d[\d-]*$/.test(x)) + ')' : ''}`).join(' '),
    faded: keys.filter(b => /rgba\(.*0\.4/.test(b.style.background)).map(b => b.getAttribute('aria-label')).join(' '),
  };
});
console.log('inizio      ', JSON.stringify(await state()));
// tocca una testa di nota nel mezzo dello spartito visibile
const heads = await page.locator('svg .vf-notehead').all();
const boxes = [];
for (const h of heads.slice(0, 120)) { const b = await h.boundingBox(); if (b && b.x > 500 && b.x < 1100) boxes.push(b); }
const target = boxes[Math.floor(boxes.length / 2)];
await page.mouse.click(target.x + target.width / 2, target.y + target.height / 2);
await page.waitForTimeout(700);
console.log('dopo tocco  ', JSON.stringify(await state()));
await page.screenshot({ path: `${SHOTS}/${tag}-tocco.png` });
await page.getByRole('button', { name: 'Nota successiva' }).click(); await page.waitForTimeout(500);
console.log('›           ', JSON.stringify(await state()));
await page.getByRole('button', { name: 'Nota successiva' }).click(); await page.waitForTimeout(500);
console.log('› ›         ', JSON.stringify(await state()));
await page.keyboard.press('ArrowLeft'); await page.waitForTimeout(500);
console.log('freccia ←   ', JSON.stringify(await state()));
await page.screenshot({ path: `${SHOTS}/${tag}-frecce.png` });
console.log('errori:', errs.join(' | ') || 'nessuno');
await browser.close();
