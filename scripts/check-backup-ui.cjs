const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const http = require("node:http");
const { chromium } = require("playwright");
const root = path.resolve(__dirname, "../docs");
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".woff2": "font/woff2", ".svg": "image/svg+xml", ".png": "image/png", ".webp": "image/webp" };
const server = http.createServer(async (req, res) => {
  const pathname = new URL(req.url, "http://localhost").pathname;
  const file = path.resolve(root, "." + (pathname.endsWith("/") ? pathname + "index.html" : pathname));
  if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  try { res.writeHead(200, { "Content-Type": types[path.extname(file)] || "text/plain" }).end(await fs.readFile(file)); }
  catch { res.writeHead(404).end(); }
});
(async () => {
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const base = "http://127.0.0.1:" + server.address().port;
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
  try {
    const first = await browser.newContext({ serviceWorkers: "block" });
    const page = await first.newPage();
    await page.goto(base + "/#plano");
    await page.getByRole("button", { name: "Baixar backup completo" }).waitFor();
    const draft = "A educação exige participação. Esta é minha tese, com acentos e 日本語.";
    await page.evaluate(draft => {
      localStorage.setItem("kalore-hub-v3", JSON.stringify({ draft, draftTheme: "Educação", xp: 270, course: { track: "mat", done: { "mat-6": true } } }));
      localStorage.setItem("kalore-radar-v2", JSON.stringify({ notes: { digital: "Minha anotação" }, favorites: ["digital"] }));
      localStorage.setItem("atena-scores-v1", JSON.stringify({ version: 1, kind: "boletim", scores: { linguagens: "600", humanas: "650", natureza: "700", matematica: "750", redacao: "900" }, targets: [] }));
      localStorage.setItem("unrelated", "private");
    }, draft);
    const pending = page.waitForEvent("download");
    await page.getByRole("button", { name: "Baixar backup completo" }).click();
    const downloaded = await pending;
    const text = await fs.readFile(await downloaded.path(), "utf8");
    assert.equal(JSON.parse(text).data.unrelated, undefined);

    const second = await browser.newContext({ serviceWorkers: "block" });
    const restored = await second.newPage();
    restored.on("dialog", dialog => dialog.accept());
    await restored.goto(base + "/#plano");
    await restored.getByRole("button", { name: "Importar backup completo" }).waitFor();
    await restored.locator('input[aria-label="Arquivo de backup completo"]').setInputFiles({ name: "atena.json", mimeType: "application/json", buffer: Buffer.from(text) });
    await restored.waitForFunction(expected => JSON.parse(localStorage.getItem("kalore-hub-v3") || "{}").draft === expected, draft);
    await restored.reload();
    assert.equal(await restored.evaluate(() => JSON.parse(localStorage.getItem("kalore-radar-v2")).notes.digital), "Minha anotação");
    await restored.goto(base + "/minha-nota.html");
    await restored.getByText("720,00", { exact: true }).waitFor();
    assert.equal(await restored.getByLabel("Redação", { exact: true }).inputValue(), "900");
    await restored.goto(base + "/redacao.html");
    await restored.getByRole("textbox", { name: "Rascunho da redação" }).waitFor();
    await restored.waitForFunction(expected => document.querySelector('[aria-label="Rascunho da redação"]').value === expected, draft);
    await restored.goto(base + "/#plano");
    await restored.getByRole("button", { name: "Baixar backup completo" }).waitFor();
    const before = await restored.evaluate(() => localStorage.getItem("kalore-hub-v3"));
    await restored.locator('input[aria-label="Arquivo de backup completo"]').setInputFiles({ name: "invalid.json", mimeType: "application/json", buffer: Buffer.from('{"app":"ATENA","kind":"full-backup","version":1,"data":{"kalore-hub-v3":"[]"}}') });
    await restored.getByRole("status").filter({ hasText: "Dados inválidos" }).waitFor();
    assert.equal(await restored.evaluate(() => localStorage.getItem("kalore-hub-v3")), before);
    await restored.getByRole("button", { name: "Desfazer última importação" }).click();
    await restored.waitForFunction(() => localStorage.getItem("kalore-hub-v3") === null);
    await first.close();
    await second.close();
    console.log("Backup UI: download, restore in a fresh browser context, draft reopened in the editor, Radar notes, invalid import preservation and undo passed.");
  } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exit(1); });
