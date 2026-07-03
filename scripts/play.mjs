// Plays the game in a real browser: starts from the title screen, plays the
// bot's winning Level 1 action sequence click-by-click, and asserts the
// "Level Clear!" overlay. Screenshots along the way.
// Run: node scripts/play.mjs <path-to-actions.json> <screenshot-dir>

import { chromium } from 'playwright';
import { readFileSync } from 'fs';

const actionsFile = process.argv[2];
const shotDir = process.argv[3] || '.';
const { actions, levelId } = JSON.parse(readFileSync(actionsFile, 'utf8'));

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 900, height: 1100 } });
page.on('pageerror', (err) => {
  console.error('PAGE ERROR:', err.message);
  process.exitCode = 1;
});

if (levelId > 1) {
  // Pre-unlock the target level so we can select it from the title screen
  await page.addInitScript(
    ([lvl]) =>
      localStorage.setItem(
        'turtle-rescue-meta-v1',
        JSON.stringify({ coins: 20, unlockedLevel: lvl })
      ),
    [levelId]
  );
}

await page.goto('http://localhost:3000');
await page.waitForSelector('text=Turtle Rescue');
await page.screenshot({ path: `${shotDir}/01-title.png` });
console.log('Title screen OK');

if (levelId === 1) {
  await page.click('text=Start Rescue');
  // First-run tutorial appears — read it and dismiss
  await page.waitForSelector('text=How to Play');
  await page.screenshot({ path: `${shotDir}/02-tutorial.png` });
  await page.click("text=Got it, let's save them!");
} else {
  await page.click(`button:has(div:text-is("${levelId}"))`);
}
console.log('Playing level', levelId, '—', actions.length, 'turns');

const clickByTestId = async (id) => {
  await page.locator(`[data-testid="${id}"]`).dispatchEvent('click');
};

let eggIndex = 0;
let midShotTaken = false;
for (let i = 0; i < actions.length; i++) {
  const a = actions[i];
  switch (a.type) {
    case 'hatch':
      await clickByTestId(`egg-${eggIndex++}`);
      break;
    case 'move':
      await clickByTestId(`turtle-${a.turtleId}`);
      break;
    case 'sprint':
      await clickByTestId('power-sprint');
      await clickByTestId(`turtle-${a.turtleId}`);
      break;
    case 'shell':
      await clickByTestId('power-shell');
      await clickByTestId(`turtle-${a.turtleId}`);
      break;
    case 'leaf':
      await clickByTestId('power-leaf');
      await clickByTestId(`cell-${a.row}-${a.col}`);
      break;
    case 'decoy':
      await clickByTestId('power-decoy');
      await clickByTestId(`cell-${a.row}-${a.col}`);
      break;
    case 'freeze':
      await clickByTestId('power-freeze');
      break;
    case 'wait':
      await clickByTestId('wait-button');
      break;
  }
  await page.waitForTimeout(120);
  if (!midShotTaken && i >= Math.floor(actions.length / 2)) {
    midShotTaken = true;
    await page.screenshot({ path: `${shotDir}/03-midgame.png` });
    console.log('Mid-game screenshot at turn', i + 1, '· HUD:', await page.locator('[data-testid="saved-count"]').innerText());
  }
}

await page.waitForSelector('[data-testid="level-result"]', { timeout: 5000 });
const result = await page.locator('[data-testid="level-result"]').innerText();
await page.waitForTimeout(800);
await page.screenshot({ path: `${shotDir}/04-level-end.png` });
console.log('Level result overlay:', JSON.stringify(result));

if (!/LEVEL CLEAR/i.test(result)) {
  console.error('FAIL: expected Level Clear');
  process.exitCode = 1;
} else {
  // Continue: bank coins, go to next level, verify carry-over + shop
  await page.click('[data-testid="next-level"]');
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${shotDir}/05-level2.png` });
  console.log('Level 2 started. Powers visible:',
    await page.locator('[data-testid^="power-"]').count());

  // Open shop, buy a leaf if affordable
  await page.click('[data-testid="shop-button"]');
  await page.waitForSelector('text=Beach Shop');
  await page.screenshot({ path: `${shotDir}/06-shop.png` });
  const leafBefore = await page.locator('[data-testid="power-leaf"] span').innerText();
  await page.click('[data-testid="buy-leaf"]');
  await page.waitForTimeout(300);
  await page.click('[data-testid="shop-close"]');
  await page.waitForTimeout(300);
  const leafAfter = await page.locator('[data-testid="power-leaf"] span').innerText();
  console.log(`Shop purchase: leaf count ${leafBefore} -> ${leafAfter}`);
  if (Number(leafAfter) !== Number(leafBefore) + 1) {
    console.error('FAIL: shop purchase did not add a leaf');
    process.exitCode = 1;
  }
}

await browser.close();
console.log(process.exitCode ? 'UI PLAYTHROUGH FAILED' : 'UI PLAYTHROUGH PASSED');
