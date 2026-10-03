const http = require("node:http"), fs = require("node:fs"), path = require("node:path"), assert = require("node:assert/strict"), vm = require("node:vm");
const { chromium } = require("playwright");
const root = path.resolve(__dirname, "../docs"), out = path.resolve(__dirname, "../design/previews");
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".woff2": "font/woff2", ".svg": "image/svg+xml" };
const server = http.createServer((req, res) => {
  const u = new URL(req.url, "http://localhost"), file = path.resolve(root, "." + (u.pathname.endsWith("/") ? u.pathname + "index.html" : u.pathname));
  if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  fs.readFile(file, (e, data) => e ? res.writeHead(404).end() : res.writeHead(200, { "Content-Type": types[path.extname(file)] || "text/plain" }).end(data));
});
const sandbox = {}; vm.createContext(sandbox); vm.runInContext(fs.readFileSync(path.join(root, "hub/content.js"), "utf8"), sandbox); vm.runInContext(fs.readFileSync(path.join(root, "hub/practice-data.js"), "utf8"), sandbox);
const app = fs.readFileSync(path.join(root, "hub/app.js"), "utf8");
const questions = vm.runInContext("(" + app.match(/const questions = (\[[\s\S]*?\n  \]);/)[1] + ")", sandbox).concat(sandbox.KaloreContent.questions);
const read = (p) => p.evaluate(() => JSON.parse(localStorage.getItem("kalore-hub-v3")));
(async () => {
  await new Promise((r) => server.listen(0, "127.0.0.1", r)); fs.mkdirSync(out, { recursive: true });
  const url = "http://127.0.0.1:" + server.address().port;
  const browser = await chromium.launch({ headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"], ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}) });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1050 }, reducedMotion: "reduce", serviceWorkers: "block" }), page = await ctx.newPage(), errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(url + "/estudar.html");
  await page.locator("#heroNextSession").click();
  assert.equal(await page.locator("#studyRoom").isVisible(), true);
  await page.locator('[data-duration="20"]').click(); await page.locator("#sessionArea").selectOption("mat");
  assert.match(await page.locator(".session-preview").textContent(), /6 questões autorais \+ 3 cartões/);
  await page.screenshot({ path: path.join(out, "session-setup-desktop.jpg"), type: "jpeg", quality: 80 });
  await page.locator("#beginSession").click();
  const initial = await read(page), first = questions.find((q) => q.id === initial.journey.items[0].id);
  await page.keyboard.press(String((first.c + 1) % 4 + 1));
  assert.equal((await read(page)).answers, 1);
  assert.equal(await page.locator(".session-option.is-incorrect").count(), 1);
  assert.equal(await page.locator(".feedback-particle").count(), 0);
  await page.locator("#closeStudyRoom").click(); await page.reload();
  const before = await read(page); await page.locator("#heroNextSession").click();
  assert.equal(await page.locator(".session-option:disabled").count(), first.o.length);
  assert.equal((await read(page)).answers, before.answers, "Resuming an answered question must not award progress twice");
  await page.locator("#sessionNext").click();
  for (let i = 0; i < 20 && !(await page.locator("#sessionDone").count()); i++) {
    const s = await read(page), item = s.journey.items[s.journey.index];
    if (item.kind === "question") {
      const q = questions.find((q) => q.id === item.id); await page.locator(`[data-session-choice="${q.c}"]`).click();
    } else { await page.locator("#sessionReveal").click(); await page.locator('[data-session-grade="good"]').click(); }
    await page.locator("#sessionNext").click();
  }
  const finished = await read(page);
  assert.equal(finished.answers, 6); assert.equal(finished.attempts.length, 6); assert.equal(finished.attempts.filter(a => a.source === "guided").length, 6); assert.equal(finished.correct, 5);
  assert.equal(finished.journeyHistory.length, 1); assert.equal(finished.journeyHistory[0].cards, 3);
  assert.equal(finished.errors.filter((e) => !e.reviewed).length, 1);
  await page.screenshot({ path: path.join(out, "session-summary-desktop.jpg"), type: "jpeg", quality: 80 });
  await page.locator("#sessionDone").click(); await page.locator("#weekGoal").selectOption("3");
  assert.equal(await page.locator("#weekDays").textContent(), "1");
  await page.locator("#heroNextSession").click(); assert.equal(await page.locator("#beginSession").isVisible(), true); await page.keyboard.press("Escape");
  await page.reload(); assert.equal((await read(page)).journeyHistory.length, 1); assert.equal(await page.locator("#weekGoal").inputValue(), "3");
  await page.locator('[data-tab="redacao"]').click();
  const draft = "Uma ideia precisa de contexto.\n\nArgumentos conectam causas e consequências.\n\nA proposta de intervenção deve responder ao problema.";
  await page.locator("#essay").fill(draft); await page.locator("#enterWritingMode").click();
  assert.equal(await page.locator("#writingRoom #essay").count(), 1); assert.equal(await page.locator("#essay").count(), 1);
  assert.equal(await page.locator("#writingRoom #essay").inputValue(), draft);
  await page.locator('[data-writing-font="22"]').click(); await page.keyboard.press("Control+s");
  assert.equal((await read(page)).essays.length, 1); assert.equal((await read(page)).preferences.writingFont, 22);
  await page.screenshot({ path: path.join(out, "writing-desktop.jpg"), type: "jpeg", quality: 80 });
  await page.keyboard.press("Escape"); assert.equal(await page.locator(".essay-layout #essay").inputValue(), draft);
  await page.locator("#enterWritingMode").click(); await page.locator("#analyzeEssay").click();
  assert.equal(await page.locator("#writingRoom").isVisible(), false); assert.match(await page.locator("#coachScore").textContent(), /sinais/);
  await page.reload(); assert.equal(await page.locator("#essay").inputValue(), draft);
  // Storage failure must be visible, while an export can still preserve the in-memory draft.
  await page.evaluate(() => { const original = Storage.prototype.setItem; window.restoreStorage = () => Storage.prototype.setItem = original; Storage.prototype.setItem = function (k, v) { if (k === "kalore-hub-v3") throw new Error("quota"); return original.call(this, k, v); }; });
  await page.locator("#essay").fill(draft + "\nTeste de salvamento.");
  assert.equal(await page.locator("#draftStatus").getAttribute("data-saved"), "false"); await page.evaluate(() => window.restoreStorage());
  await page.locator("#essay").fill(draft);
  await page.locator(".data-menu summary").click(); await page.locator("#motionPreference").uncheck();
  assert.equal(await page.evaluate(() => document.documentElement.classList.contains("motion-off")), true);
  await page.goto(url + "/");
  assert.equal(await page.evaluate(() => document.querySelector(".app-shell").classList.contains("motion-off")), true);
  await page.locator(".topic-notebook summary").click();
  const note = "Bibliotecas públicas: conecte o acesso ao repertório e às desigualdades. <img src=x>";
  await page.locator("#topic-note").fill(note); await page.reload(); await page.locator(".topic-notebook summary").click();
  assert.equal(await page.locator("#topic-note").inputValue(), note);
  await page.getByRole("button", { name: "Comparar temas", exact: true }).click();
  assert.equal(await page.locator(".compare-card").count(), 2);
  const download = page.waitForEvent("download"); await page.getByRole("button", { name: "Exportar comparação", exact: true }).click();
  const bytes = fs.readFileSync(await (await download).path(), "utf8"); assert.ok(bytes.includes(note)); assert.match(bytes, /Índices relativos/);
  await page.screenshot({ path: path.join(out, "comparison-desktop.jpg"), type: "jpeg", quality: 80 });
  await page.keyboard.press("Escape"); await page.getByRole("tab", { name: "Método", exact: true }).click(); await page.reload();
  assert.equal(await page.locator(".app-shell").getAttribute("data-view"), "metodo");
  // Exercise the new rooms on narrow screens in both palettes.
  for (const theme of ["dark", "light"]) for (const width of [360, 390, 768]) {
    await page.setViewportSize({ width, height: 844 });
    await page.evaluate((t) => localStorage.setItem("kalore-color-theme", t), theme);
    await page.goto(url + "/estudar.html?themeTest=" + theme + width + "#hoje");
    assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), theme);
    await page.locator("#heroNextSession").click();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    assert.equal(await page.locator("#studyRoom").evaluate((el) => el.scrollWidth <= el.clientWidth + 1), true);
    if (width === 390) await page.screenshot({ path: path.join(out, `session-${theme}-mobile.jpg`), type: "jpeg", quality: 80 });
    await page.keyboard.press("Escape"); if (width <= 760) { await page.locator('#openToolMenu').click(); await page.locator('[data-menu-go="redacao"]').click(); } else await page.locator('[data-tab="redacao"]').click(); await page.locator("#enterWritingMode").click();
    assert.equal(await page.locator("#writingRoom").evaluate((el) => el.scrollWidth <= el.clientWidth + 1), true);
    if (width === 390) await page.screenshot({ path: path.join(out, `writing-${theme}-mobile.jpg`), type: "jpeg", quality: 80 });
    await page.keyboard.press("Escape");
  }
  assert.deepEqual(errors, []);
  await ctx.close(); await browser.close(); server.close();
  console.log("Orbit: guided practice, keyboard answers, resume without duplicate XP, spaced reviews, summary/history, weekly goals, single draft, writing shortcuts, quota error, shared motion, topic notes, comparison export, deep links and new mobile rooms passed.");
})().catch((e) => { console.error(e); server.close(); process.exit(1); });
