// Tempo lento nel Leggio: − fino al minimo (10 bpm), il tempo resta ricordato
// riaprendo il brano, e Ascolta va davvero a quel tempo.
import { chromium } from 'playwright-core';
const URL_APP = process.env.APP_URL ?? 'http://localhost:5199/';
const title = process.argv[2] ?? 'Valzer op. 64 n. 2';
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--autoplay-policy=no-user-gesture-required'] });
const page = await (await browser.newContext({ viewport: { width: 1180, height: 820 }, isMobile: true, hasTouch: true })).newPage();
const errs = [];
page.on('pageerror', e => errs.push(e.message));
await page.goto(URL_APP);
await page.waitForLoadState('networkidle');
await page.evaluate(() => { localStorage.setItem('piano-trainer-v2', JSON.stringify({ version: 2, onboardingDone: true, unlockedCount: 40 })); localStorage.removeItem('piano-lang'); for (const k of Object.keys(localStorage)) if (k.startsWith('leggio-bpm:')) localStorage.removeItem(k); });
await page.reload(); await page.waitForTimeout(700);
const open = async () => {
  await page.getByRole('button', { name: 'Canzoni', exact: true }).click();
  await page.locator('main button').filter({ hasText: title }).first().click();
  await page.getByText('Preparo lo spartito').waitFor({ state: 'detached', timeout: 90000 });
  await page.waitForTimeout(300);
};
const tempo = () => page.locator('span[title^="Velocità"]').first().innerText();
await open();
console.log('all\'apertura:', (await tempo()).replace(/\s+/g, ' '));
const minus = page.getByRole('button', { name: 'Più lento' });
await minus.click();
console.log('un tocco su −:', (await tempo()).replace(/\s+/g, ' '));
// tenuto premuto: scorre da solo fino al minimo
const box = await minus.boundingBox();
await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
await page.mouse.down();
await page.waitForTimeout(5000);
await page.mouse.up();
console.log('tenuto premuto 5 s:', (await tempo()).replace(/\s+/g, ' '), '· − disattivato:', await minus.isDisabled());
const plus = page.getByRole('button', { name: 'Più veloce' });
await plus.click();
await page.waitForTimeout(200);
await plus.click();
await page.waitForTimeout(200);
const chosen = (await tempo()).replace(/\s+/g, ' ');
console.log('due tocchi su +:', chosen);
// Ascolta: quanti passi in 6 secondi
await page.getByRole('button', { name: 'Ascolta' }).click();
const t0 = Date.now();
const seen = new Set();
while (Date.now() - t0 < 6000) { seen.add(await page.evaluate(() => window.__leggio?.idx)); await page.waitForTimeout(100); }
console.log('passi suonati in 6 s:', seen.size - 1);
await page.getByRole('button', { name: /Pausa/ }).click().catch(() => {});
// riapro: il tempo è ricordato
await page.getByRole('button', { name: 'Chiudi il leggio' }).click();
await page.waitForTimeout(300);
await open();
console.log('riaprendo il brano:', (await tempo()).replace(/\s+/g, ' '), '(atteso', chosen + ')');
console.log('errori:', errs.join(' | ') || 'nessuno');
await browser.close();
