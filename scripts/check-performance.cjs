/* Medição de laboratório; não representa p75 de usuários reais. */
const fs = require("node:fs/promises"),
  path = require("node:path"),
  http = require("node:http"),
  zlib = require("node:zlib");
const { chromium } = require("playwright");
const root = path.resolve(__dirname, "../docs"),
  baseline = process.env.PERF_BASELINE;
const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".webmanifest": "application/manifest+json",
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
};
const cached = new Map();
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost"),
    prefix = url.pathname.startsWith("/before/") ? "/before/" : "/after/";
  const dir = prefix === "/before/" ? baseline : root;
  if (!dir) {
    res.writeHead(404).end();
    return;
  }
  const filename = path.resolve(
    dir,
    url.pathname.slice(prefix.length) || "index.html",
  );
  if (!filename.startsWith(path.resolve(dir) + path.sep)) {
    res.writeHead(403).end();
    return;
  }
  try {
    if (!cached.has(filename))
      cached.set(filename, zlib.gzipSync(await fs.readFile(filename)));
    res
      .writeHead(200, {
        "Content-Type": mime[path.extname(filename)] || "text/plain",
        "Content-Encoding": "gzip",
        "Content-Length": cached.get(filename).length,
      })
      .end(cached.get(filename));
  } catch {
    res.writeHead(404).end();
  }
});
(async () => {
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const base = "http://127.0.0.1:" + server.address().port;
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  const samples = [];
  for (const version of baseline ? ["before", "after"] : ["after"]) {
    for (const pageName of [
      "index.html",
      "estudar.html",
      ...(version === "after"
        ? [
            "estudos.html",
            "redacao.html",
            "radar.html",
            "materiais/redacao.html",
          ]
        : []),
    ]) {
      for (let run = 1; run <= 3; run++) {
        const ctx = await browser.newContext({
          viewport: { width: 390, height: 844 },
          serviceWorkers: "block",
        });
        const page = await ctx.newPage(),
          cdp = await ctx.newCDPSession(page);
        await cdp.send("Network.enable");
        await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
        let transferred = 0;
        const failures = [];
        cdp.on("Network.loadingFinished", (event) => {
          transferred += event.encodedDataLength;
        });
        page.on("response", (response) => {
          if (response.status() >= 400) failures.push(response.url());
        });
        page.on("pageerror", (error) => failures.push(error.message));
        await cdp.send("Network.emulateNetworkConditions", {
          offline: false,
          latency: 150,
          downloadThroughput: 200000,
          uploadThroughput: 70000,
        });
        await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
        await page.addInitScript(() => {
          window.__perf = { lcp: 0, cls: 0, longTasks: 0 };
          let session = 0,
            start = 0,
            last = 0;
          new PerformanceObserver((list) => {
            for (const e of list.getEntries()) window.__perf.lcp = e.startTime;
          }).observe({ type: "largest-contentful-paint", buffered: true });
          new PerformanceObserver((list) => {
            for (const e of list.getEntries()) {
              if (e.hadRecentInput) continue;
              if (e.startTime - last < 1000 && e.startTime - start < 5000)
                session += e.value;
              else {
                session = e.value;
                start = e.startTime;
              }
              last = e.startTime;
              window.__perf.cls = Math.max(window.__perf.cls, session);
            }
          }).observe({ type: "layout-shift", buffered: true });
          new PerformanceObserver((list) => {
            for (const e of list.getEntries())
              window.__perf.longTasks += Math.max(0, e.duration - 50);
          }).observe({ type: "longtask", buffered: true });
        });
        await page.goto(`${base}/${version}/${pageName}`, {
          waitUntil: "networkidle",
        });
        await page.waitForTimeout(350);
        if (failures.length)
          throw new Error(
            "Performance sample has broken resources: " + failures.join(", "),
          );
        const result = await page.evaluate(() => ({
          ...window.__perf,
          bytes:
            performance
              .getEntriesByType("resource")
              .reduce((n, e) => n + e.transferSize, 0) +
            performance.getEntriesByType("navigation")[0].transferSize,
        }));
        samples.push({
          version,
          page: pageName,
          run,
          lcpMs: Math.round(result.lcp),
          cls: Number(result.cls.toFixed(4)),
          blockingMs: Math.round(result.longTasks),
          transferBytes: transferred,
        });
        await ctx.close();
      }
    }
  }
  await browser.close();
  server.close();
  const median = (values) =>
    [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
  const summary = [];
  for (const version of ["before", "after"])
    for (const p of new Set(samples.map((s) => s.page))) {
      const matches = samples.filter(
        (s) => s.version === version && s.page === p,
      );
      if (matches.length)
        summary.push({
          version,
          page: p,
          lcpMs: median(matches.map((x) => x.lcpMs)),
          cls: median(matches.map((x) => x.cls)),
          blockingMs: median(matches.map((x) => x.blockingMs)),
          transferBytes: median(matches.map((x) => x.transferBytes)),
        });
    }
  const report = {
    checkedAt: new Date().toISOString(),
    method:
      "Chromium headless, viewport 390×844, CPU 4×, latência 150 ms, download 1,6 Mbps, gzip, cache frio, service worker bloqueado, 3 execuções por página; mediana. Servidor local. Não é medição de usuários reais nem prova de desempenho do CDN.",
    summary,
    samples,
  };
  await fs.writeFile(
    path.resolve(__dirname, "../portable/public/data/performance-audit.json"),
    JSON.stringify(report, null, 2) + "\n",
  );
  console.table(summary);
})().catch((e) => {
  console.error(e);
  server.close();
  process.exit(1);
});
