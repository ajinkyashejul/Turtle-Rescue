// Verifies the game fits the viewport with no page scrolling across
// mobile and desktop screen sizes, on both the title screen and in-game.
// Run: node scripts/check-responsive.mjs <screenshot-dir> [base-url]
import { chromium } from 'playwright';

const shotDir = process.argv[2] || '.';
const baseUrl = process.argv[3] || 'http://localhost:3000';

const VIEWPORTS = [
  { name: 'iphone-se', width: 320, height: 568 },
  { name: 'iphone-13', width: 390, height: 844 },
  { name: 'android', width: 360, height: 740 },
  { name: 'ipad', width: 768, height: 1024 },
  { name: 'laptop-short', width: 1280, height: 700 },
  { name: 'desktop', width: 1440, height: 900 },
];

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
let failures = 0;

for (const vp of VIEWPORTS) {
  const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
  page.on('pageerror', (e) => {
    failures++;
    console.error(`PAGE ERROR [${vp.name}]:`, e.message);
  });
  await page.goto(baseUrl);
  await page.waitForSelector('text=Start Rescue', { timeout: 15000 });

  const noScroll = async (label) => {
    const m = await page.evaluate(() => ({
      scrollW: document.documentElement.scrollWidth,
      scrollH: document.documentElement.scrollHeight,
      innerW: window.innerWidth,
      innerH: window.innerHeight,
    }));
    const ok = m.scrollH <= m.innerH + 1 && m.scrollW <= m.innerW + 1;
    if (!ok) {
      failures++;
      console.error(
        `❌ ${vp.name} ${label}: page scrolls (content ${m.scrollW}x${m.scrollH} vs viewport ${m.innerW}x${m.innerH})`
      );
    }
    return ok;
  };

  const titleOk = await noScroll('title');

  // Enter the game (dismiss tutorial if it appears)
  await page.click('text=Start Rescue');
  const tut = page.locator("text=Got it, let's save them!");
  if (await tut.isVisible().catch(() => false)) await tut.click();
  await page.waitForSelector('[data-testid="egg-0"]');
  await page.waitForTimeout(400);

  const gameOk = await noScroll('game');

  // Board and eggs must both be fully inside the viewport
  const inView = await page.evaluate(() => {
    const cell = document.querySelector('[data-testid="cell-0-0"]');
    const egg = document.querySelector('[data-testid="egg-4"]');
    if (!cell || !egg) return { ok: false, why: 'elements missing' };
    const board = cell.parentElement.getBoundingClientRect();
    const eggBox = egg.getBoundingClientRect();
    const ok =
      board.top >= 0 &&
      board.bottom <= window.innerHeight &&
      board.left >= -1 &&
      board.right <= window.innerWidth + 1 &&
      eggBox.bottom <= window.innerHeight &&
      board.width > 150 &&
      board.height > 180;
    return { ok, board: `${Math.round(board.width)}x${Math.round(board.height)}`, eggBottom: Math.round(eggBox.bottom) };
  });
  if (!inView.ok) {
    failures++;
    console.error(`❌ ${vp.name}: board/eggs out of view`, JSON.stringify(inView));
  }

  await page.screenshot({ path: `${shotDir}/resp-${vp.name}.png` });
  console.log(
    `${titleOk && gameOk && inView.ok ? '✅' : '❌'} ${vp.name} (${vp.width}x${vp.height}) — board ${inView.board}, eggs bottom ${inView.eggBottom}/${vp.height}`
  );
  await page.close();
}

await browser.close();
console.log(failures === 0 ? 'RESPONSIVE CHECK PASSED' : `RESPONSIVE CHECK FAILED (${failures})`);
process.exit(failures === 0 ? 0 : 1);
