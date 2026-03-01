const { chromium } = require('playwright');

const BASE = 'https://handyandfriend.com/?lang=en';
const PRICING = 'https://handyandfriend.com/pricing';

const viewports = [
  { name: 'desktop-1440', width: 1440, height: 900 },
  { name: 'iphone-390', width: 390, height: 844 },
  { name: 'android-360', width: 360, height: 800 },
];

async function checkViewport(browser, vp) {
  const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
  const page = await context.newPage();
  const out = { viewport: vp.name, checks: [] };

  function ok(name, pass, info = '') { out.checks.push({ name, pass, info }); }

  page.on('pageerror', err => ok('no_page_errors', false, err.message));

  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(1200);

  const topbarPos = await page.$eval('.topbar', el => getComputedStyle(el).position).catch(() => null);
  ok('topbar_position_fixed', topbarPos === 'fixed', `position=${topbarPos}`);

  await page.evaluate(() => window.scrollTo(0, 900));
  await page.waitForTimeout(300);
  const topbarY = await page.$eval('.topbar', el => el.getBoundingClientRect().top).catch(() => null);
  ok('topbar_stays_top_on_scroll', topbarY !== null && Math.abs(topbarY) < 1.5, `top=${topbarY}`);

  const heroPricingVisible = await page.locator('#heroCtaPricing').isVisible().catch(() => false);
  ok('hero_full_pricing_visible', heroPricingVisible);
  const barPricingVisible = await page.locator('#barPricingBtn').isVisible().catch(() => false);
  ok('bottombar_full_pricing_visible', barPricingVisible);

  const comboCalcVisible = await page.locator('#comboCalc').isVisible().catch(() => false);
  ok('combo_calculator_visible', comboCalcVisible);

  const cpromoCount = await page.locator('.cpromo').count().catch(() => 0);
  ok('combo_promos_in_cards', cpromoCount > 0, `count=${cpromoCount}`);

  const before = await page.locator('[data-i18n="barCall"]').first().innerText().catch(() => '');
  await page.click('#langBtn').catch(() => {});
  await page.waitForTimeout(500);
  const after = await page.locator('[data-i18n="barCall"]').first().innerText().catch(() => '');
  ok('language_switch_updates_text', before && after && before !== after, `${before} -> ${after}`);

  await page.goto(PRICING, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(800);
  const pricingTitle = await page.locator('text=Transparent Pricing.').first().isVisible().catch(() => false);
  ok('pricing_page_loaded', pricingTitle);
  const pricingHasService = await page.locator('text=TV Mounting').first().isVisible().catch(() => false);
  ok('pricing_has_service_content', pricingHasService);

  await context.close();
  return out;
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const results = [];
  for (const vp of viewports) results.push(await checkViewport(browser, vp));
  await browser.close();

  let failed = 0;
  for (const r of results) {
    console.log(`\n[${r.viewport}]`);
    const seen = new Set();
    for (const c of r.checks) {
      const key = c.name + '|' + c.info;
      if (seen.has(key)) continue;
      seen.add(key);
      console.log(`${c.pass ? 'PASS' : 'FAIL'} - ${c.name}${c.info ? ` (${c.info})` : ''}`);
      if (!c.pass) failed++;
    }
  }

  console.log(`\nTOTAL_FAILS=${failed}`);
  process.exit(failed ? 1 : 0);
})();
