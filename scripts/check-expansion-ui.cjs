const assert = require('node:assert/strict'), fs = require('node:fs/promises'), path = require('node:path'), http = require('node:http');
const { chromium } = require('playwright');
const { default: AxeBuilder } = require('@axe-core/playwright');
const root = path.resolve(__dirname, '../docs');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.pdf': 'application/pdf' };
const server = http.createServer(async (req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname.replace(/^\/RadarEnem\//, '/');
  const file = path.resolve(root, '.' + (pathname.endsWith('/') ? pathname + 'index.html' : pathname));
  if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
  try { res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' }).end(await fs.readFile(file)); }
  catch { res.writeHead(404).end(); }
});
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + server.address().port;
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, serviceWorkers: 'block', reducedMotion: 'reduce' });
    const page = await context.newPage(), errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const inspect = async name => {
      await page.evaluate(async () => { await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))); await Promise.allSettled(document.getAnimations().filter(a => Number.isFinite(a.effect?.getComputedTiming().endTime)).map(a => a.finished)); });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Overflow: ' + name);
      const audit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
      assert.deepEqual(audit.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) })), [], name);
      if (process.env.SCREENSHOT_DIR) { await fs.mkdir(process.env.SCREENSHOT_DIR, { recursive: true }); await page.screenshot({ path: path.join(process.env.SCREENSHOT_DIR, name + '.png'), fullPage: true }); }
    };
    await page.goto(base + '/minha-nota.html');
    await page.getByLabel('Linguagens', { exact: true }).fill('800');
    for (const label of ['Ciências Humanas', 'Ciências da Natureza', 'Matemática', 'Redação']) await page.getByLabel(label, { exact: true }).fill('800');
    await page.getByRole('button', { name: 'Explorar faculdades' }).click();
    await page.getByRole('heading', { name: 'Encontre um curso e compare' }).waitFor();
    await page.locator('.atena-course-card').first().waitFor();
    assert.equal(await page.locator('.atena-course-card').count(), 9, 'Paginate without rendering thousands of cards');
    await page.getByRole('button', { name: 'Próxima página de cursos' }).click();
    assert.match(await page.locator('.atena-course-pagination').innerText(), /Página 2 de/);
    await page.getByLabel('Estado', { exact: true }).selectOption('PR');
    await page.getByLabel('Instituição', { exact: true }).selectOption('571');
    await page.getByLabel('Curso, faculdade ou cidade', { exact: true }).fill('medicina');
    const medicine = page.locator('.atena-course-card').filter({ hasText: 'Curitiba' }).filter({ has: page.getByRole('heading', { name: 'MEDICINA', exact: true }) }).first();
    await medicine.waitFor();
    assert.match(await medicine.innerText(), /817,16/); assert.match(await medicine.innerText(), /17,16 pontos abaixo/);
    await page.getByLabel('Redação', { exact: true }).fill('0');
    assert.match(await medicine.innerText(), /Abaixo dos mínimos: Redação/);
    await page.getByLabel('Redação', { exact: true }).fill('800');
    await medicine.getByRole('button', { name: 'Adicionar aos meus objetivos' }).click();
    await page.getByRole('button', { name: 'Salvar objetivo' }).click();
    await page.getByRole('button', { name: 'Fechar catálogo de cursos' }).click();
    await page.reload();
    await page.getByRole('heading', { name: 'MEDICINA', exact: true }).waitFor();
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('atena-scores-v1')).targets[0].official.catalogId), 'b615b5d0977bdd60');
    await page.getByRole('button', { name: 'Explorar faculdades' }).click();
    await page.getByLabel('Curso, faculdade ou cidade').fill('medicina ufpr');
    await page.locator('.atena-course-card').first().waitFor();
    for (const theme of ['dark', 'light']) {
      await page.evaluate(theme => document.documentElement.dataset.theme = theme, theme);
      for (const width of [360, 768, 1440]) { await page.setViewportSize({ width, height: 1000 }); await inspect('atena-courses-' + theme + '-' + width); }
    }
    await page.getByLabel('Curso, faculdade ou cidade').fill('zzznuncaencontra');
    assert.equal(await page.locator('.atena-course-card').count(), 0);
    await page.goto(base + '/guia-estrategico.html#deepfakes');
    await page.locator('.guide-tabs').waitFor();
    for (const theme of ['dark', 'light']) {
      await page.evaluate(theme => document.documentElement.dataset.theme = theme, theme);
      for (const tab of ['Argumentar', 'Repertórios', 'Intervenção', 'Meu roteiro']) {
        await page.getByRole('tab', { name: tab, exact: true }).click();
        await page.setViewportSize({ width: 390, height: 844 }); await inspect('atena-arguments-' + theme + '-' + tab.normalize('NFD').replace(/[^a-zA-Z]/g, ''));
      }
    }
    await page.locator('#openNav').click();
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.waitForFunction(() => document.querySelector('.atena-stage').inert === false);
    assert.equal(await page.locator('.atena-stage').evaluate(el => el.inert), false, 'Resizing an open mobile menu must release the page');
    assert.equal(await page.locator('#globalSidebar').evaluate(el => el.classList.contains('open')), false);
    await page.goto(base + '/instalar.html');
    await page.getByRole('radio', { name: 'iPhone e iPad', exact: true }).check();
    assert.match(await page.locator('.atena-install-guide').innerText(), /Safari/);
    assert.match(await page.locator('.atena-install-guide').innerText(), /Adicionar à Tela de Início/);
    const offerInstall = async outcome => page.evaluate(outcome => {
      const event = new Event('beforeinstallprompt', { cancelable: true });
      event.prompt = async () => { window.__installPromptCount = (window.__installPromptCount || 0) + 1; };
      event.userChoice = Promise.resolve({ outcome }); window.dispatchEvent(event);
    }, outcome);
    await offerInstall('dismissed'); await page.getByRole('button', { name: 'Instalar ATENA', exact: true }).click();
    await page.getByText(/Instalação cancelada/).waitFor();
    await offerInstall('accepted'); await page.getByRole('button', { name: 'Instalar ATENA', exact: true }).click();
    assert.equal(await page.evaluate(() => window.__installPromptCount), 2);
    await page.evaluate(() => window.dispatchEvent(new Event('appinstalled')));
    await page.getByText('A ATENA está instalada neste aparelho.', { exact: true }).waitFor();
    for (const theme of ['dark', 'light']) { await page.evaluate(theme => document.documentElement.dataset.theme = theme, theme); await inspect('atena-install-' + theme); }
    await page.goto(base + '/RadarEnem/minha-nota.html'); await page.getByRole('button', { name: 'Explorar faculdades' }).click(); await page.locator('.atena-course-card').first().waitFor();
    assert.deepEqual(errors, []);
    await context.close();
    const offlineContext = await browser.newContext({ reducedMotion: 'reduce' }), offline = await offlineContext.newPage();
    await offline.goto(base + '/instalar.html');
    await offline.getByText('Recursos principais salvos neste navegador para uso offline.', { exact: true }).waitFor({ timeout: 60000 });
    await offlineContext.setOffline(true);
    await offline.reload(); await offline.getByRole('heading', { name: 'Leve a ATENA para o seu aparelho.' }).waitFor();
    await offline.goto(base + '/minha-nota.html'); await offline.getByRole('button', { name: 'Explorar faculdades' }).click(); await offline.locator('.atena-course-card').first().waitFor();
    await offline.goto(base + '/guia-estrategico.html'); await offline.getByRole('tab', { name: 'Meu roteiro', exact: true }).click();
    await offline.getByLabel('Minha tese', { exact: true }).fill('Meu roteiro funciona offline.');
    await offline.reload(); assert.equal(await offline.getByLabel('Minha tese', { exact: true }).inputValue(), 'Meu roteiro funciona offline.');
    await offlineContext.close();
    console.log('Expansion UI: official course filters/pagination, cutoff and minimums, saved official metadata, all argument tabs/palettes/mobile, platform guidance, native prompt states, project prefix and full offline reload passed.');
  } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exit(1); });
