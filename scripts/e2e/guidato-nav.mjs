// Studio guidato: un tocco su una nota del rigo porta il cursore lì e mostra i tasti.
import { chromium } from 'playwright-core';
const SHOTS = process.env.SHOTS ?? '/tmp';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await (await browser.newContext({ viewport: { width: 820, height: 1180 }, isMobile: true, hasTouch: true })).newPage();
const errs = [];
page.on('pageerror', e => errs.push(e.message));
await page.goto(process.env.APP_URL ?? 'http://localhost:5199/');
await page.waitForLoadState('networkidle');
await page.evaluate(() => { localStorage.setItem('piano-trainer-v2', JSON.stringify({ version: 2, onboardingDone: true, unlockedCount: 40 })); localStorage.removeItem('piano-lang'); });
await page.reload(); await page.waitForTimeout(700);
await page.getByRole('button', { name: 'Canzoni', exact: true }).click();
await page.getByRole('button', { name: 'Studio guidato' }).first().click();
await page.waitForTimeout(1500);
const cursor = () => page.evaluate(() => { const c = [...document.querySelectorAll('div.pointer-events-none.absolute.rounded-lg')].find(d => d.className.includes('border-brand')); return c ? `${c.style.left} ${c.style.top}` : '?'; });
console.log('cursore all\'inizio:', await cursor());
const heads = await page.locator('svg .vf-notehead').all();
const boxes = [];
for (const h of heads.slice(0, 80)) { const b = await h.boundingBox(); if (b && b.y > 0 && b.y < 900) boxes.push(b); }
const target = boxes[Math.min(boxes.length - 1, 14)];
await page.mouse.click(target.x + target.width / 2, target.y + target.height / 2);
await page.waitForTimeout(800);
console.log('cursore dopo il tocco:', await cursor(), '· tasti mostrati:', await page.getByRole('button', { name: /nascondi/ }).count() > 0);
await page.screenshot({ path: `${SHOTS}/guidato-tocco.png` });
console.log('errori:', errs.join(' | ') || 'nessuno');
await browser.close();
