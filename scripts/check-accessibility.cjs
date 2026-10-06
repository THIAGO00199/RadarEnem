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
    const violations=audit.violations.map((v)=>({id:v.id,impact:v.impact,description:v.description,helpUrl:v.helpUrl,targets:v.nodes.map((n)=>n.target),details:v.nodes.map((n)=>({target:n.target,summary:n.failureSummary,data:n.any.map((x)=>x.data)}))}));
    results.push({name,violations}); if(violations.length) console.log(name,JSON.stringify(violations));
  };
  for(const theme of ["dark","light"]) {
    await page.goto(base+"/estudar.html");
    await page.evaluate((theme)=>{document.documentElement.dataset.theme=theme;},theme);
    for(const tab of ["hoje","progresso","trilhas","plano","redacao","questoes","simulado","revisao","flashcards","erros","foco","biblioteca","provas-oficiais","prova"]) {
      await page.locator(`[data-tab="${tab}"]`).click(); await page.waitForTimeout(80); await inspect("Hub/"+tab+"/"+theme);
      if (tab === "flashcards") { await page.locator(".flash-front").first().click(); await page.locator(".flashcard").first().evaluate(async (card)=>{await Promise.all(card.getAnimations({subtree:true}).map((a)=>a.finished.catch(()=>{})));}); await inspect("Hub/flashcards/resposta/"+theme); }
    }
    await page.locator("#openQuickSearch").click(); await inspect("Hub/busca/"+theme); await page.locator("#closeQuickSearch").click();
    await page.locator('[data-tab="hoje"]').click();
    await page.locator("#heroNextSession").click(); await inspect("Hub/sessão/configuração/"+theme); await page.locator("#closeStudyRoom").click();
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    await page.evaluate(()=>{const s=JSON.parse(localStorage.getItem("kalore-hub-v3"));s.journey={id:"audit-session",area:"mat",minutes:10,index:0,seconds:0,createdAt:new Date().toISOString(),items:[{kind:"question",id:"m1",choice:null},{kind:"flash",id:"f0",grade:null}]};localStorage.setItem("kalore-hub-v3",JSON.stringify(s));});
    await page.reload(); await page.evaluate((t)=>document.documentElement.dataset.theme=t,theme);
    await page.locator("#heroNextSession").click(); await inspect("Hub/sessão/questão/"+theme);
    await page.locator('[data-session-choice="2"]').click(); await inspect("Hub/sessão/feedback/"+theme);
    await page.locator("#sessionNext").click(); await inspect("Hub/sessão/flashcard/"+theme);
    await page.locator("#sessionReveal").click(); await inspect("Hub/sessão/flashcard-resposta/"+theme);
    await page.locator('[data-session-grade="good"]').click(); await page.locator("#sessionNext").click(); await inspect("Hub/sessão/resultado/"+theme);
    await page.locator("#sessionDone").click(); await page.locator('[data-tab="redacao"]').click(); await page.locator("#enterWritingMode").click(); await inspect("Hub/escrita/"+theme); await page.locator("#closeWritingRoom").click();
    await page.locator('[data-tab="questoes"]').click(); await page.locator('#catalogSearch').fill('ESCOLA CADERNOS');
    await page.locator('#catalogList [data-practice-q="ctx-m1"]').click(); await inspect('Hub/assunto/questão/'+theme);
    await page.locator('.practice-hint summary').click(); await inspect('Hub/assunto/pista/'+theme);
    await page.locator('[data-practice-choice="0"]').click(); await inspect('Hub/assunto/erro/'+theme); await page.locator('#closePracticeRoom').click();
    await page.locator('#catalogList [data-practice-q="ctx-m1"]').click(); await page.locator('[data-confidence="unsure"]').click(); await page.locator('[data-practice-choice="2"]').click(); await inspect('Hub/assunto/acerto-com-dúvida/'+theme); await page.locator('#closePracticeRoom').click();
    await page.locator('[data-tab="progresso"]').click(); await inspect('Hub/progresso/com-respostas/'+theme);
    await page.evaluate(()=>localStorage.setItem('kalore-essay-brief-v1',JSON.stringify({version:1,topicId:'digital',theme:'Um tema planejado para estudo',createdAt:new Date().toISOString(),blueprint:{tese:'Uma tese planejada',agente:'Escolas'}})));
    await page.goto(base+'/estudar.html?roteiro=digital#redacao'); await page.evaluate(t=>document.documentElement.dataset.theme=t,theme); await inspect('Hub/roteiro/transferência/'+theme); await page.locator('#applyBrief').click(); await inspect('Hub/roteiro/aplicado/'+theme);

  }
  for(const theme of ["dark","light"]) {
    await page.goto(base+"/radar.html");
    await page.evaluate((theme)=>{document.documentElement.dataset.theme=theme;},theme);
    for(const tab of ["Radar","Dossiê PND","Inep","Fontes","Histórico","Meu plano","Método"]) { await page.getByRole("tab",{name:tab,exact:tab!=="Dossiê PND"}).click(); await page.waitForTimeout(80); await inspect("Radar/"+tab+"/"+theme); }
    await page.getByRole("tab",{name:"Radar",exact:true}).click();
    await page.getByRole("button",{name:"Comparar temas",exact:true}).click(); await inspect("Radar/comparação/"+theme); await page.keyboard.press("Escape");
    await page.locator(".topic-notebook summary").click(); await inspect("Radar/anotações/"+theme);
    await page.getByRole('button',{name:'Planejar este texto'}).click(); await inspect('Radar/roteiro/tese/'+theme); await page.getByRole('button',{name:'Argumentos',exact:true}).click(); await inspect('Radar/roteiro/argumentos/'+theme); await page.getByRole('button',{name:'Intervenção',exact:true}).click(); await inspect('Radar/roteiro/intervenção/'+theme); await page.keyboard.press('Escape');
  }
  await page.setViewportSize({width:390,height:844});
  for(const theme of ['dark','light']) {
    await page.goto(base+'/estudar.html?mobile='+theme+'#progresso'); await page.evaluate(t=>document.documentElement.dataset.theme=t,theme); await inspect('Hub/progresso/mobile/'+theme);
    await page.locator('#openToolMenu').click(); await inspect('Hub/ferramentas/mobile/'+theme); await page.locator('[data-menu-go="questoes"]').click();
    await page.locator('#catalogSearch').fill('ESCOLA CADERNOS'); await page.locator('#catalogList [data-practice-q="ctx-m1"]').click(); await inspect('Hub/assunto/mobile/'+theme); await page.keyboard.press('Escape');
    await page.goto(base+'/radar.html?mobileCanvas='+theme); await page.evaluate(t=>document.documentElement.dataset.theme=t,theme); await page.getByRole('button',{name:'Planejar este texto'}).click(); await inspect('Radar/roteiro/mobile/'+theme); await page.keyboard.press('Escape');
  }
  for(const name of ["index","redacao","matematica","revisao","planejamento"]) {await page.goto(base+"/materiais/"+name+".html");await inspect("Materiais/"+name+"/mobile");}
  await ctx.close();await browser.close();server.close();
  await fs.writeFile(path.resolve(__dirname,"../portable/public/data/accessibility-audit.json"),JSON.stringify({checkedAt:new Date().toISOString(),engine:"axe-core/playwright "+require("axe-core/package.json").version,scope:"14 seções do Hub nos dois temas, flashcards virados, busca, sete estados de prática guiada e escrita, exploração de questões, respostas e transferência de roteiros; sete seções do Radar, comparação, anotações e três etapas do roteiro nos dois temas; novas telas também a 390 px; cinco páginas de materiais. Regras automatizadas WCAG 2 A/AA, 2.1 A/AA e 2.2 AA. Não constitui certificação nem substitui testes com tecnologias assistivas.",results},null,2)+"\n");
  console.log("Acessibilidade:",results.length,"telas,",results.reduce((n,r)=>n+r.violations.length,0),"regras com violações.");
  if(results.some((r)=>r.violations.length))process.exitCode=1;
})().catch((error)=>{console.error(error);server.close();process.exit(1);});
