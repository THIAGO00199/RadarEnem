const http = require("node:http"),
  fs = require("node:fs"),
  path = require("node:path"),
  assert = require("node:assert/strict");
const { chromium } = require("playwright");
const root = path.resolve(__dirname, "../docs");
const mime = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".webmanifest": "application/manifest+json",
};
const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");
  let p = path.join(root, decodeURIComponent(url.pathname));
  if (url.pathname.endsWith("/")) p = path.join(p, "index.html");
  if (!p.startsWith(root + path.sep)) {
    res.writeHead(403).end();
    return;
  }
  fs.readFile(p, (err, data) => {
    if (err) {
      res.writeHead(404).end();
      return;
    }
    res
      .writeHead(200, { "Content-Type": mime[path.extname(p)] || "text/plain" })
      .end(data);
  });
});
(async () => {
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const base = "http://127.0.0.1:" + server.address().port;
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.CHROMIUM_PATH
      ? { executablePath: process.env.CHROMIUM_PATH }
      : {}),
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  const errors = [];
  const ctx = await browser.newContext({
      viewport: { width: 1440, height: 1050 },
      serviceWorkers: "block",
    }),
    page = await ctx.newPage();
  page.on("pageerror", (e) => {
    errors.push(e.message);
    console.error("PAGEERROR", e.stack);
  });
  const tab = async (id) => {
    await page.locator('[data-tab="' + id + '"]').click();
    await page.waitForTimeout(100);
  };
  await page.goto(base + "/estudar.html");
  assert.deepEqual(errors, []);
  assert.equal(await page.locator("#greeting").textContent(), "Bora?");
  assert.equal(await page.locator("#diagnosticModal").isVisible(), false);
  await tab("trilhas");
  await page.locator("#startLesson").click();
  await page.locator('[data-lo="1"]').click();
  assert.match(await page.locator("#lessonExplain").textContent(), /255/);
  assert.match(await page.locator("#startLesson").textContent(), /Próxima/);
  assert.equal(await page.locator('[data-lesson="mat2"]').isDisabled(), false);
  await tab("flashcards");
  await page.locator(".flashcard").first().press("Enter");
  assert.equal(
    await page
      .locator(".flashcard")
      .first()
      .evaluate((x) => x.classList.contains("flip")),
    true,
  );
  await page.locator('.flashcard.flip [data-grade="good"]').click();
  assert.equal(await page.locator("#dailyPct").textContent(), "67%");
  await tab("plano");
  await page.locator("#hours").fill("3");
  await page.locator("#generatePlan").click();
  assert.equal(await page.locator("[data-task]").count(), 6);
  assert.equal(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem("kalore-hub-v3")).plan.reduce(
        (n, t) => n + t.minutes,
        0,
      ),
    ),
    180,
  );
  await tab("redacao");
  await page.locator("#theme").selectOption("3");
  await page
    .locator("#essay")
    .fill(
      "Introdução e tese.\nArgumento primeiro.\nArgumento segundo.\nConclusão e intervenção.",
    );
  await page
    .locator('[data-blueprint="tese"]')
    .evaluate((el) => (el.closest("details").open = true));
  await page
    .locator('[data-blueprint="tese"]')
    .fill("Uma tese que será preservada");
  await page.reload();
  assert.equal(await page.locator("#theme").inputValue(), "3");
  assert.match(await page.locator("#essay").inputValue(), /Introdução/);
  assert.equal(
    await page.locator('[data-blueprint="tese"]').inputValue(),
    "Uma tese que será preservada",
  );
  await page.locator("#analyzeEssay").click();
  assert.equal(await page.locator("#paraCount").textContent(), "4");
  await tab("simulado");
  await page.locator("#simQty").selectOption("5");
  await page.locator("#startSim").click();
  await page.locator('[data-sim-choice="1"]').click();
  await page.locator("#simFlag").click();
  await page.reload();
  assert.match(await page.locator(".sim-status").textContent(), /1\/5/);
  assert.equal(
    await page.locator('[data-sim-choice="1"]').getAttribute("aria-pressed"),
    "true",
  );
  await page.locator("#finishSim").click();
  assert.equal(await page.locator(".sim-review").count(), 5);
  assert.ok((await page.locator("#errorCount").textContent()) !== "0");
  await tab("foco");
  await page.locator("#focusGoal").fill("Revisar probabilidades");
  await page.locator("#timerBtn").click();
  await page.waitForTimeout(1100);
  await page.reload();
  assert.equal(await page.locator("#timerBtn").textContent(), "Pausar");
  assert.equal(
    await page.locator("#focusGoal").inputValue(),
    "Revisar probabilidades",
  );
  await page.locator("#timerReset").click();
  await page.goto(base + "/estudar.html#%22%5B");
  assert.equal(await page.locator("#hoje").isVisible(), true);
  await page.goto(base + "/");
  await page
    .getByRole("button", { name: "Salvar no meu plano", exact: true })
    .click();
  await page.getByRole("tab", { name: /Meu plano/ }).click();
  assert.equal(await page.locator(".plan-card").count(), 1);
  await page.getByRole("tab", { name: "Radar", exact: true }).click();
  await page.getByRole("link", { name: /Escrever sobre este tema/ }).click();
  assert.match(
    await page.locator("#prompt").textContent(),
    /Desafios|Caminhos|Brasil/,
  );
  const radarTheme = await page.locator("#theme").inputValue();
  await page.goto(base + "/estudar.html#redacao");
  assert.equal(await page.locator("#theme").inputValue(), radarTheme);
  for (const width of [1440, 768, 390, 360]) {
    await page.setViewportSize({ width, height: 950 });
    for (const id of [
      "hoje",
      "trilhas",
      "redacao",
      "simulado",
      "revisao",
      "flashcards",
      "plano",
      "biblioteca",
    ]) {
      await page.goto(base + "/estudar.html#" + id);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth + 1,
      );
      assert.equal(overflow, false, "Overflow " + width + " " + id);
    }
    await page.goto(base + "/");
    const radarOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth + 1,
    );
    if (radarOverflow) {
      console.log(
        await page.evaluate(() =>
          [...document.querySelectorAll("body *")]
            .map((e) => ({
              tag: e.tagName,
              cls: e.className,
              right: e.getBoundingClientRect().right,
              width: e.getBoundingClientRect().width,
            }))
            .filter((x) => x.right > innerWidth + 1 && x.width > 0)
            .slice(0, 25),
        ),
      );
      await page.screenshot({
        path: process.env.SCREENSHOT_DIR + "/radar-overflow.png",
      });
    }
    assert.equal(radarOverflow, false, "Radar overflow " + width);
  }
  await page.setViewportSize({ width: 1440, height: 1050 });
  await page.goto(base + "/estudar.html#hoje");
  await page.waitForTimeout(600);
  if (process.env.SCREENSHOT_DIR)
    await page.screenshot({
      path: path.join(process.env.SCREENSHOT_DIR, "hub-desktop.png"),
    });
  await page.locator("#themeToggle").click();
  await page.waitForTimeout(600);
  if (process.env.SCREENSHOT_DIR)
    await page.screenshot({
      path: path.join(process.env.SCREENSHOT_DIR, "hub-light.png"),
    });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(600);
  if (process.env.SCREENSHOT_DIR)
    await page.screenshot({
      path: path.join(process.env.SCREENSHOT_DIR, "hub-mobile.png"),
    });
  await page.goto(base + "/");
  await page.waitForTimeout(600);
  if (process.env.SCREENSHOT_DIR)
    await page.screenshot({
      path: path.join(process.env.SCREENSHOT_DIR, "radar-mobile.png"),
    });
  await page.setViewportSize({ width: 1440, height: 1050 });
  await page.waitForTimeout(600);
  if (process.env.SCREENSHOT_DIR)
    await page.screenshot({
      path: path.join(process.env.SCREENSHOT_DIR, "radar-desktop.png"),
    });
  assert.deepEqual(errors, []);
  console.log(
    "Browser: lessons, flashcards, plan, drafts, theme, blueprint, simulation, timer, bad hashes, Radar integration and 4 viewport widths passed.",
  );
  await ctx.close();
  const offline = await browser.newContext(),
    op = await offline.newPage();
  await op.goto(base + "/estudar.html");
  await op.evaluate(async () => {
    await navigator.serviceWorker.ready;
    const worker = navigator.serviceWorker.controller;
    if (!worker)
      await new Promise((r) =>
        navigator.serviceWorker.addEventListener("controllerchange", r, {
          once: true,
        }),
      );
  });
  await offline.setOffline(true);
  await op.reload();
  assert.match(await op.locator("#greeting").textContent(), /Bora/);
  await op.locator('[data-tab="trilhas"]').click();
  await op.locator("#startLesson").click();
  assert.equal(await op.locator("[data-lo]").count(), 4);
  const missing = await op.evaluate(async () => {
    const r = await fetch("./missing.js");
    return { status: r.status, type: r.headers.get("Content-Type") };
  });
  assert.equal(missing.status, 503);
  assert.match(missing.type, /text\/plain/);
  await op.goto(base + "/");
  assert.equal((await op.locator(".rank-row").count()) > 0, true);
  console.log(
    "Offline: complete Hub and compiled Radar load, missing scripts return 503.",
  );
  await offline.close();
  await browser.close();
  server.close();
})().catch((e) => {
  console.error(e);
  server.close();
  process.exit(1);
});
