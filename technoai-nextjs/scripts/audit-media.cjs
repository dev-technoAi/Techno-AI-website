/* Browser geometry audit of every public route. Uses the existing local audit tooling. */
const fs = require('node:fs');
const path = require('node:path');
const auditCache = path.resolve('.audit-cache/_npx');
const cachedTool = fs.existsSync(auditCache) && fs.readdirSync(auditCache)
  .map(dir => path.join(auditCache, dir, 'node_modules/puppeteer-core'))
  .find(dir => fs.existsSync(dir));
const puppeteer = require(process.env.MEDIA_PUPPETEER || cachedTool || 'puppeteer-core');

(async () => {

  const browser = await puppeteer.launch({
    executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true, userDataDir: path.resolve('.audit-cache/media-browser'),
    args: ['--no-sandbox', '--disable-background-networking'],
  });
  const routes = [...new Set([...Object.keys(require('../content/routes.json')), '/old-home/', '/redesign-v1/'])];
  const selected = process.env.MEDIA_ROUTES?.split(',') || routes;
  const results = [];
  try {
    const page = await browser.newPage();
    // Keep archived analytics and unavailable third-party embeds out of local QA.
    await page.setRequestInterception(true);
    page.on('request', req => /^(http:\/\/(localhost|127\.0\.0\.1):3100|data:|blob:)/.test(req.url()) ? req.continue() : req.abort());
    for (const width of [1440, 768, 390, 320]) {
      await page.setViewport({ width, height: width > 1000 ? 900 : 844 });
      for (const route of selected) {
        const response = await page.goto('http://localhost:3100' + route, { waitUntil: 'networkidle2', timeout: 90000 });
        // Exercise image/video lazy loading and reveal clipping without waiting on scroll scenes.
        await page.evaluate(async () => {
          document.querySelectorAll('img').forEach(img => { img.loading = 'eager'; });
          for (let y = 0; y < document.body.scrollHeight; y += innerHeight) {
            window.scrollTo(0, y);
            await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
          }
          window.scrollTo(0, 0);
          await document.fonts.ready;
          await Promise.race([
            Promise.all([...document.images].map(img => img.decode().catch(() => {}))),
            new Promise(resolve => setTimeout(resolve, 4000)),
          ]);
        });
        await new Promise(r => setTimeout(r, 250));
        const media = await page.evaluate(() => [...document.querySelectorAll('img,video,iframe,canvas')].map(el => {
          const r = el.getBoundingClientRect(), s = getComputedStyle(el);
          return { tag: el.tagName, cls: el.className, src: el.getAttribute('src') || el.getAttribute('data-src'),
            width: +r.width.toFixed(2), height: +r.height.toFixed(2), fit: s.objectFit,
            naturalWidth: el.naturalWidth || el.videoWidth || 0, naturalHeight: el.naturalHeight || el.videoHeight || 0,
            complete: el.complete, layoutWidth: el.offsetWidth, layoutHeight: el.offsetHeight,
            hidden: s.display === 'none' || !r.width || !r.height,
            outside: r.left < -1 || r.right > innerWidth + 1,
            clippedContainer: !!el.closest('.marquee,.hscroll,.hero-pin,.pg-hero-pin,.hero,.ch-visual,.pg-fig,.pg-card-media,.pg-split-frame'),
          };
        }));
        results.push({ route, width, status: response.status(), media });
        console.log(`${width} ${route} ${response.status()} (${media.length} media)`);
        if (process.env.MEDIA_SCREENSHOTS && [1440,390].includes(width)) {
          const dir = 'audit/media'; fs.mkdirSync(dir, { recursive: true });
          const prefix = `${dir}/${route.replace(/[^a-z0-9]/gi, '_') || 'home'}-${width}`;
          for (const selector of ['.pg-cards', '.pg-split', '.ch-stage', '.e-link-in-bio__identity-image']) {
            const el = await page.$(selector);
            if (!el) continue;
            await el.scrollIntoView();
            await new Promise(r => setTimeout(r, 2000));
            await el.screenshot({ path: `${prefix}-${selector.slice(1)}.png` });
          }
        }
      }
    }
    fs.mkdirSync('audit/media', { recursive: true });
    fs.writeFileSync('audit/media/results.json', JSON.stringify(results, null, 2));
    const problems = results.flatMap(r => r.media.filter(m => !m.hidden && (
      (!m.clippedContainer && m.outside) ||
      (m.naturalWidth && m.fit === 'fill' && Math.abs(m.layoutWidth / m.layoutHeight / (m.naturalWidth / m.naturalHeight) - 1) > .04)
    )).map(m => ({ route: r.route, viewport: r.width, ...m })));
    fs.writeFileSync('audit/media/problems.json', JSON.stringify(problems, null, 2));
    console.log(`Checked ${results.length} route/viewport combinations; ${problems.length} media issues to review.`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
