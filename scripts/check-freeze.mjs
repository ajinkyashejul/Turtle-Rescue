// Verifies the Freeze power in the real UI: predators must hold position
// (and show the frozen badge) for 2 turns, then resume.
import { chromium } from 'playwright';

const shotDir = process.argv[2] || '.';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 900, height: 1100 } });
page.on('pageerror', (err) => {
  console.error('PAGE ERROR:', err.message);
  process.exitCode = 1;
});

await page.addInitScript(() =>
  localStorage.setItem('turtle-rescue-meta-v1', JSON.stringify({ coins: 0, unlockedLevel: 3 }))
);
await page.goto('http://localhost:3000');
await page.click('button:has(div:text-is("3"))'); // start level 3 (freeze unlocked)
await page.waitForSelector('[data-testid="power-freeze"]');

const crabPos = () =>
  page.evaluate(() => {
    // Ground predator containers carry data-testid and are positioned by
    // inline top/left (%); idle sprite wiggle animates transforms, not these.
    return [...document.querySelectorAll('[data-testid^="predator-"]')]
      .map((e) => `${e.getAttribute('data-testid')}:${parseFloat(e.style.top).toFixed(1)},${parseFloat(e.style.left).toFixed(1)}`)
      .sort()
      .join('|');
  });

// One normal turn: predators should move
const before = await crabPos();
await page.locator('[data-testid="wait-button"]').dispatchEvent('click');
await page.waitForTimeout(2000);
const afterMove = await crabPos();
console.log('Predators moved on a normal turn:', before !== afterMove);

// Freeze: this consumes the turn, predators must NOT move for 2 turns
await page.locator('[data-testid="power-freeze"]').dispatchEvent('click');
await page.waitForTimeout(2000);
const frozenText = await page.locator('text=/Frozen:/').innerText().catch(() => 'MISSING');
const afterFreeze = await crabPos();
await page.screenshot({ path: `${shotDir}/07-frozen.png` });
console.log('Freeze HUD:', frozenText);
console.log('Predators held still on freeze turn:', afterMove === afterFreeze);

await page.locator('[data-testid="wait-button"]').dispatchEvent('click');
await page.waitForTimeout(2000);
const afterFrozenWait = await crabPos();
console.log('Predators still frozen on 2nd turn:', afterFreeze === afterFrozenWait);

await page.locator('[data-testid="wait-button"]').dispatchEvent('click');
await page.waitForTimeout(2000);
const thawed = await crabPos();
console.log('Predators resumed after thaw:', afterFrozenWait !== thawed);

const pass =
  before !== afterMove &&
  afterMove === afterFreeze &&
  afterFreeze === afterFrozenWait &&
  afterFrozenWait !== thawed &&
  /frozen/i.test(frozenText);
console.log(pass ? 'FREEZE CHECK PASSED' : 'FREEZE CHECK FAILED');
process.exitCode = pass ? 0 : 1;
await browser.close();
