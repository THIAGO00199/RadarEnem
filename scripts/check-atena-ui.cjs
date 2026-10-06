const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const http = require("node:http");
const vm = require("node:vm");
const { chromium } = require("playwright");
const { default: AxeBuilder } = require("@axe-core/playwright");
const root = path.resolve(__dirname, "../docs");
const mime = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".pdf": "application/pdf",
  ".webmanifest": "application/manifest+json",
};
let online = true;
const server = http.createServer(async (req, res) => {
  if (!online) {
    req.socket.destroy();
    return;
  }
  const pathname = new URL(req.url, "http://localhost").pathname.replace(
    /^\/RadarEnem\//,
    "/",
  );
  const file = path.resolve(
    root,
    "." + (pathname.endsWith("/") ? pathname + "index.html" : pathname),
  );
  if (!file.startsWith(root + path.sep)) {
    res.writeHead(403).end();
    return;
  }
  try {
    res
      .writeHead(200, {
        "Content-Type": mime[path.extname(file)] || "text/plain",
      })
      .end(await fs.readFile(file));
  } catch {
    res.writeHead(404).end();
  }
});

async function overflow(page, name) {
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth + 1,
    ),
    false,
    "Overflow: " + name,
  );
}

(async () => {
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  assert.match(
    await fs.readFile(path.join(root, "redacao.html"), "utf8"),
    /Seu texto, da tese à intervenção/,
  );
  assert.match(
    await fs.readFile(path.join(root, "radar.html"), "utf8"),
    /radar-workspace/,
  );
  const base = "http://127.0.0.1:" + server.address().port;
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
    ...(process.env.CHROMIUM_PATH
      ? { executablePath: process.env.CHROMIUM_PATH }
      : {}),
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    serviceWorkers: "block",
  });
  const page = await context.newPage(),
    errors = [],
    missing = [],
    audits = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("response", (response) => {
    if (response.status() >= 400 && response.url().startsWith(base))
      missing.push(response.url());
  });
  const inspect = async (name) => {
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    const violations = result.violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => ({
        target: n.target,
        summary: n.failureSummary,
      })),
    }));
    audits.push({ name, violations });
    if (violations.length) console.log(name, JSON.stringify(violations));
  };
  const screenshot = async (name) => {
    if (!process.env.SCREENSHOT_DIR) return;
    await fs.mkdir(process.env.SCREENSHOT_DIR, { recursive: true });
    await page.evaluate(() => {
      if (document.activeElement instanceof HTMLElement)
        document.activeElement.blur();
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    });
    await page.waitForTimeout(300);
    await page.screenshot({
      path: path.join(process.env.SCREENSHOT_DIR, name + ".png"),
      fullPage: true,
      animations: "disabled",
    });
  };
  await page.goto(base + "/");
  await page.getByRole("button", { name: "Meu ritmo", exact: true }).click();
  await page.getByLabel("Como podemos te chamar?").fill("Thiago");
  await page.getByLabel("Tempo por bloco").selectOption("15");
  await page.getByRole("dialog").getByLabel("Meta semanal").selectOption("3");
  await page.getByRole("button", { name: "Salvar meu ritmo" }).click();
  await page.getByRole("heading", { level: 1, name: /Thiago/ }).waitFor();
  await page.locator(".atena-task-check").first().click();
  assert.equal(await page.locator(".atena-plan-task.completed").count(), 1);
  await page.reload();
  await page.getByRole("heading", { level: 1, name: /Thiago/ }).waitFor();
  assert.equal(await page.locator(".atena-plan-task.completed").count(), 1);
  await page.keyboard.press("Control+k");
  await page.getByLabel("Buscar ferramenta").fill("redacao");
  assert.equal(await page.locator(".atena-search-results a").count(), 1);
  await inspect("Home/busca/dark");
  await page.keyboard.press("Escape");
  await screenshot("atena-home-desktop");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Abrir navegação" }).click();
  await inspect("Home/menu/mobile/dark");
  await page.keyboard.press("Shift+Tab");
  assert.equal(
    await page.evaluate(() =>
      document.querySelector(".atena-sidebar").contains(document.activeElement),
    ),
    true,
  );
  await page.keyboard.press("Escape");
  assert.equal(
    await page
      .getByRole("button", { name: "Abrir navegação" })
      .getAttribute("aria-expanded"),
    "false",
  );
  await screenshot("atena-home-mobile");

  // An existing student's first five lessons and empty energy must remain usable.
  await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem("kalore-hub-v3") || "{}");
    state.course = {
      track: "mat",
      done: { mat1: true, mat2: true, mat3: true, mat4: true, mat5: true },
      energy: {
        date: new Intl.DateTimeFormat("en-CA", {
          timeZone: "America/Sao_Paulo",
        }).format(new Date()),
        value: 0,
      },
    };
    state.draft =
      "Um rascunho anterior que precisa permanecer no estúdio, mesmo durante a migração da plataforma.";
    localStorage.setItem("kalore-hub-v3", JSON.stringify(state));
  });
  await page.goto(base + "/estudos.html");
  await page
    .getByRole("heading", { name: "Geometria que ocupa espaço", exact: true })
    .waitFor();
  const academyContext = {};
  vm.runInNewContext(
    await fs.readFile(root + "/hub/academy-data.js", "utf8"),
    academyContext,
  );
  const academy = academyContext.AtenaAcademy;
  for (let index = 5; index < 8; index++) {
    await page
      .locator(".atena-lesson-options button")
      .nth(academy.mat.units[index].c)
      .click();
    await page
      .getByRole("button", {
        name: index < 7 ? "Próxima lição" : "Continuar meu percurso",
        exact: true,
      })
      .click();
  }
  await page
    .getByRole("heading", { name: academy.nat.units[0].title, exact: true })
    .waitFor();
  await page.reload();
  await page
    .getByRole("heading", { name: academy.nat.units[0].title, exact: true })
    .waitFor();
  const incorrect = (academy.nat.units[0].c + 1) % 4;
  await page.locator(".atena-lesson-options button").nth(incorrect).click();
  await page
    .getByRole("button", { name: "Tentar novamente", exact: true })
    .click();
  assert.equal(
    await page.locator(".atena-lesson-options button:disabled").count(),
    0,
  );
  await screenshot("atena-academy-mobile");

  await page.goto(base + "/redacao.html");
  await page.locator("#atenaEssay:enabled").waitFor();
  assert.equal(await page.locator(".radar-idea-explorer").isVisible(), false);
  await page.getByText("Explorar teses e argumentos", { exact: true }).click();
  assert.equal(await page.locator(".radar-idea-explorer").isVisible(), true);
  await overflow(page, "Essay ideas drawer");
  await page.getByText("Explorar teses e argumentos", { exact: true }).click();
  assert.match(
    await page.getByLabel("Rascunho da redação").inputValue(),
    /Um rascunho anterior/,
  );
  const essay =
    "A educação exige acesso e acompanhamento.\n\nAlém disso, as barreiras de infraestrutura afetam a aprendizagem.\n\nEntretanto, uma ação isolada não resolve a continuidade do estudo.\n\nPortanto, escolas e comunidades podem organizar apoio com atividades acessíveis e metas possíveis.";
  await page.getByLabel("Rascunho da redação").fill(essay);
  await page
    .getByLabel("Tese e posicionamento", { exact: true })
    .fill("Uma tese autoral que permanece salva.");
  await page
    .getByRole("button", { name: "Revisar estrutura", exact: true })
    .click();
  assert.match(
    await page.locator(".atena-structural-review").textContent(),
    /Conectivos encontrados/,
  );
  await page
    .getByRole("button", { name: "Salvar versão", exact: true })
    .click();
  await page
    .getByLabel("Revisei concordância e ortografia.", { exact: true })
    .check();
  await page.reload();
  await page.locator("#atenaEssay:enabled").waitFor();
  assert.equal(
    await page.getByLabel("Rascunho da redação").inputValue(),
    essay,
  );
  assert.equal(
    await page
      .getByLabel("Tese e posicionamento", { exact: true })
      .inputValue(),
    "Uma tese autoral que permanece salva.",
  );
  assert.equal(
    await page
      .getByLabel("Revisei concordância e ortografia.", { exact: true })
      .isChecked(),
    true,
  );
  assert.equal(await page.locator(".atena-studio-versions article").count(), 1);
  await page
    .getByRole("button", { name: "Salvar versão", exact: true })
    .click();
  assert.equal(
    await page.locator(".atena-studio-versions article").count(),
    1,
    "Identical essay version must not be duplicated",
  );
  const revisedEssay =
    essay + "\n\nEste trecho pertence à revisão em andamento.";
  await page.getByLabel("Rascunho da redação").fill(revisedEssay);
  await page
    .getByLabel("Tese e posicionamento", { exact: true })
    .fill("Tese da revisão em andamento.");
  const previousXP = await page.evaluate(
    () => JSON.parse(localStorage.getItem("kalore-hub-v3")).xp,
  );
  await page.getByRole("button", { name: "Retomar", exact: true }).click();
  assert.equal(
    await page.getByLabel("Rascunho da redação").inputValue(),
    essay,
  );
  assert.equal(
    await page
      .getByLabel("Tese e posicionamento", { exact: true })
      .inputValue(),
    "Uma tese autoral que permanece salva.",
  );
  assert.equal(await page.locator(".atena-studio-versions article").count(), 2);
  await page.reload();
  await page.locator("#atenaEssay:enabled").waitFor();
  await page
    .locator(".atena-studio-versions article")
    .first()
    .getByRole("button", { name: "Retomar", exact: true })
    .click();
  assert.equal(
    await page.getByLabel("Rascunho da redação").inputValue(),
    revisedEssay,
  );
  assert.equal(
    await page
      .getByLabel("Tese e posicionamento", { exact: true })
      .inputValue(),
    "Tese da revisão em andamento.",
  );
  assert.equal(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("kalore-hub-v3")).xp,
    ),
    previousXP,
    "Restoring drafts must not award XP",
  );
  await page.evaluate(() => {
    window.__originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = () => {
      throw new DOMException("Full", "QuotaExceededError");
    };
  });
  await page
    .locator(".atena-studio-versions article")
    .last()
    .getByRole("button", { name: "Retomar", exact: true })
    .click();
  assert.equal(
    await page.getByLabel("Rascunho da redação").inputValue(),
    revisedEssay,
    "Failed storage must leave current draft untouched",
  );
  await page.evaluate(() => {
    Storage.prototype.setItem = window.__originalSetItem;
  });
  await screenshot("atena-essay-mobile");

  await page.goto(base + "/estudar.html#flashcards");
  await page.locator("#atenaCardFront").fill("Qual é a minha tese?");
  await page
    .locator("#atenaCardBack")
    .fill("Uma posição acompanhada de argumentos.");
  await page.locator('#atenaCardForm button[type="submit"]').click();
  await page.locator("[data-atena-reveal]").click();
  assert.match(
    await page.locator("#atenaPersonalCards").textContent(),
    /Uma posição/,
  );
  await page.locator('[data-atena-grade="good"]').click();
  await page.reload();
  await page.locator("#atenaPersonalFilter").selectOption("all");
  assert.equal(await page.locator("[data-atena-reveal]").count(), 1);

  for (const width of [360, 390, 768, 1440])
    for (const theme of ["dark", "light"]) {
      await page.setViewportSize({ width, height: 950 });
      await page.evaluate(
        (theme) => localStorage.setItem("kalore-color-theme", theme),
        theme,
      );
      for (const route of [
        "/",
        "/#plano",
        "/#comunidade",
        "/estudos.html",
        "/redacao.html",
      ]) {
        await page.goto(base + route, { waitUntil: "networkidle" });
        await overflow(page, route + "/" + width + "/" + theme);
        if (width === 390 || width === 1440)
          await inspect(route + "/" + width + "/" + theme);
      }
    }
  // The exact same output must work beneath GitHub's project prefix and at the domain root.
  for (const route of ["", "estudos.html", "redacao.html", "radar.html"]) {
    await page.goto(base + "/RadarEnem/" + route, { waitUntil: "networkidle" });
    await page.locator("h1").first().waitFor();
    await overflow(page, "Project prefix/" + route);
  }
  assert.deepEqual(errors, [], "No uncaught browser or hydration errors");
  assert.deepEqual(
    missing,
    [],
    "No missing assets, including the bundled font",
  );
  await context.close();

  const offlineContext = await browser.newContext(),
    offlinePage = await offlineContext.newPage();
  await offlinePage.goto(base + "/");
  await offlinePage.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller)
      await new Promise((resolve) =>
        navigator.serviceWorker.addEventListener("controllerchange", resolve, {
          once: true,
        }),
      );
  });
  online = false;
  await offlineContext.setOffline(true);
  await offlinePage.reload();
  await offlinePage
    .getByRole("button", { name: "Meu ritmo", exact: true })
    .waitFor();
  await offlinePage.goto(base + "/estudos.html");
  await offlinePage.locator(".atena-lesson-options button").first().waitFor();
  await offlinePage.goto(base + "/redacao.html");
  await offlinePage.locator("#atenaEssay:enabled").waitFor();
  await offlinePage
    .getByLabel("Rascunho da redação")
    .fill("Meu estudo continua sem rede, com um texto salvo no navegador.");
  await offlinePage
    .getByRole("button", { name: "Salvar versão", exact: true })
    .click();
  await offlinePage.reload();
  await offlinePage.locator("#atenaEssay:enabled").waitFor();
  assert.match(
    await offlinePage.getByLabel("Rascunho da redação").inputValue(),
    /Meu estudo continua sem rede/,
  );
  await offlineContext.close();
  await browser.close();
  server.close();
  await fs.writeFile(
    path.resolve(__dirname, "../portable/public/data/atena-audit.json"),
    JSON.stringify(
      {
        checkedAt: new Date().toISOString(),
        scope:
          "Next static routes at root and project prefix; legacy five-lesson progression and zero energy; next-track persistence; essay draft, outline, checklist and version preservation; personal flashcards; offline React routes. Automated accessibility rules on desktop/mobile in both palettes. Not an accessibility certification.",
        results: audits,
      },
      null,
      2,
    ) + "\n",
  );
  assert.equal(
    audits.some((a) => a.violations.length),
    false,
    "Accessibility violations in ATENA",
  );
  console.log(
    "ATENA: migration, lessons beyond five, no energy block, cross-track reload, local essays/cards, four widths, both themes, project prefix, cached React offline and " +
      audits.length +
      " accessibility states passed.",
  );
})().catch((error) => {
  console.error(error);
  server.close();
  process.exit(1);
});
