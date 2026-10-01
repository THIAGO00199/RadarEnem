const http = require("node:http"), fs = require("node:fs/promises"), path = require("node:path");
const { chromium } = require("playwright");
const { default: AxeBuilder } = require("@axe-core/playwright");
const root = path.resolve(__dirname, "../docs"), mime = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml", ".json": "application/json" };
const server = http.createServer(async (req,res) => {
  const pathname = new URL(req.url,"http://localhost").pathname;
  const p = path.resolve(root, "." + (pathname.endsWith("/") ? pathname+"index.html" : pathname));
  if (!p.startsWith(root+path.sep)) { res.writeHead(403).end(); return; }
  try { res.writeHead(200,{"Content-Type":mime[path.extname(p)] || "text/plain"}).end(await fs.readFile(p)); } catch { res.writeHead(404).end(); }
});
(async () => {
  await new Promise((r)=>server.listen(0,"127.0.0.1",r));
  const base="http://127.0.0.1:"+server.address().port, browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH,headless:true,args:["--no-sandbox","--disable-dev-shm-usage"]});
  const ctx=await browser.newContext({viewport:{width:1440,height:1050},serviceWorkers:"block"}),page=await ctx.newPage(),results=[];
  const inspect=async (name) => {
    const audit=await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21a","wcag21aa","wcag22aa"]).analyze();
    const violations=audit.violations.map((v)=>({id:v.id,impact:v.impact,description:v.description,helpUrl:v.helpUrl,targets:v.nodes.map((n)=>n.target)}));
    results.push({name,violations}); if(violations.length) console.log(name,JSON.stringify(violations));
  };
  for(const theme of ["dark","light"]) {
    await page.goto(base+"/estudar.html");
    await page.evaluate((theme)=>{document.documentElement.dataset.theme=theme;},theme);
    for(const tab of ["hoje","trilhas","plano","redacao","questoes","simulado","revisao","flashcards","erros","foco","biblioteca","provas-oficiais","prova"]) {
      await page.locator(`[data-tab="${tab}"]`).click(); await page.waitForTimeout(80); await inspect("Hub/"+tab+"/"+theme);
      if (tab === "flashcards") { await page.locator(".flash-front").first().click(); await inspect("Hub/flashcards/resposta/"+theme); }
    }
    await page.locator("#openQuickSearch").click(); await inspect("Hub/busca/"+theme); await page.locator("#closeQuickSearch").click();
  }
  for(const theme of ["dark","light"]) {
    await page.goto(base+"/");
    await page.evaluate((theme)=>{document.documentElement.dataset.theme=theme;},theme);
    for(const tab of ["Radar","Dossiê PND","Inep","Fontes","Histórico","Meu plano","Método"]) { await page.getByRole("tab",{name:tab,exact:tab!=="Dossiê PND"}).click(); await page.waitForTimeout(80); await inspect("Radar/"+tab+"/"+theme); }
  }
  await page.setViewportSize({width:390,height:844});
  for(const name of ["index","redacao","matematica","revisao","planejamento"]) {await page.goto(base+"/materiais/"+name+".html");await inspect("Materiais/"+name+"/mobile");}
  await ctx.close();await browser.close();server.close();
  await fs.writeFile(path.resolve(__dirname,"../portable/public/data/accessibility-audit.json"),JSON.stringify({checkedAt:new Date().toISOString(),engine:"axe-core/playwright "+require("axe-core/package.json").version,scope:"13 seções do Hub nos dois temas, flashcards virados e busca, sete seções do Radar nos dois temas e cinco páginas de materiais. Regras automatizadas WCAG 2 A/AA, 2.1 A/AA e 2.2 AA. Não constitui certificação nem substitui testes com tecnologias assistivas.",results},null,2)+"\n");
  console.log("Acessibilidade:",results.length,"telas,",results.reduce((n,r)=>n+r.violations.length,0),"regras com violações.");
  if(results.some((r)=>r.violations.length))process.exitCode=1;
})().catch((error)=>{console.error(error);server.close();process.exit(1);});
