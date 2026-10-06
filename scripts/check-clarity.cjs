const http=require("node:http"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm"),assert=require("node:assert/strict");
const {chromium}=require("playwright"),root=path.resolve(__dirname,"../docs"),out=path.resolve(__dirname,"../design/previews");
const mime={".html":"text/html",".js":"text/javascript",".css":"text/css",".svg":"image/svg+xml",".woff2":"font/woff2"};
const server=http.createServer((req,res)=>{const url=new URL(req.url,"http://localhost"),file=path.resolve(root,"."+ (url.pathname.endsWith("/")?url.pathname+"index.html":url.pathname));if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}fs.readFile(file,(e,data)=>e?res.writeHead(404).end():res.writeHead(200,{"Content-Type":mime[path.extname(file)]||"text/plain"}).end(data));});
const scope={};vm.createContext(scope);for(const name of ["content.js","practice-data.js"])vm.runInContext(fs.readFileSync(path.join(root,"hub/"+name),"utf8"),scope);
const app=fs.readFileSync(path.join(root,"hub/app.js"),"utf8"),questions=vm.runInContext("("+app.match(/const questions = (\[[\s\S]*?\n  \]);/)[1]+")",scope).concat(scope.KaloreContent.questions);
const read=p=>p.evaluate(()=>JSON.parse(localStorage.getItem("kalore-hub-v3")));
(async()=>{
 await new Promise(r=>server.listen(0,"127.0.0.1",r));fs.mkdirSync(out,{recursive:true});const url="http://127.0.0.1:"+server.address().port;
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH,headless:true,args:["--no-sandbox","--disable-dev-shm-usage"]});
 const ctx=await browser.newContext({viewport:{width:1440,height:1050},serviceWorkers:"block",reducedMotion:"reduce"}),page=await ctx.newPage(),errors=[];
 page.on("pageerror",e=>errors.push(e.message));await page.goto(url+"/estudar.html");
 await page.evaluate(()=>{const s=JSON.parse(localStorage.getItem("kalore-hub-v3"));s.answers=18;s.correct=9;localStorage.setItem("kalore-hub-v3",JSON.stringify(s));});
 await page.goto(url+"/estudar.html?legacy#progresso");await page.waitForFunction(()=>document.body.dataset.view==="progresso");
 assert.match(await page.locator("#insightScope").textContent(),/18 resposta/);assert.match(await page.locator("#insightSummary").textContent(),/—/);
 await page.locator('[data-tab="questoes"]').click();assert.match(await page.locator("#catalogTotal").textContent(),/84/);
 await page.locator("#catalogStatus").selectOption("context");assert.match(await page.locator("#catalogResults").textContent(),/24 resultado/);
 await page.locator("#catalogSearch").fill("ESCOLA CADERNOS");assert.equal(await page.locator(".catalog-question").count(),1);
 await page.locator('#catalogList [data-practice-q="ctx-m1"]').click();assert.equal(await page.locator(".practice-option").count(),5);
 await page.locator('[data-confidence="unsure"]').click();await page.keyboard.press("2");
 assert.equal((await read(page)).attempts.length,1);assert.equal((await read(page)).attempts[0].source,"explore");
 assert.equal((await read(page)).attempts[0].confidence,"unsure");assert.equal(await page.locator(".practice-option.incorrect").count(),1);
 const note="Separe o frete antes do desconto. <img src=x onerror=alert(1)>";await page.locator("#questionNote").fill(note);assert.equal(await page.locator("#practiceRoom img").count(),0);
 await page.locator("#closePracticeRoom").click();await page.reload();assert.equal((await read(page)).questionNotes["ctx-m1"],note);
 await page.locator('[data-tab="progresso"]').click();assert.match(await page.locator("#insightSummary").textContent(),/0%/);
 await page.locator('#insightNext [data-practice-q="ctx-m1"]').click();assert.equal(await page.locator(".practice-feedback").count(),0);
 await page.keyboard.press("3");assert.equal((await read(page)).attempts.length,2);assert.equal((await read(page)).errors.filter(e=>!e.reviewed).length,0);
 await page.locator("#closePracticeRoom").click();assert.match(await page.locator("#insightSummary").textContent(),/50%/);
 await page.locator('[data-tab="questoes"]').click();await page.locator("#catalogSearch").fill("mistura");await page.locator("#catalogStatus").selectOption("context");
 await page.locator('#catalogList [data-practice-q="ctx-m2"]').click();await page.locator('[data-confidence="guess"]').click();await page.keyboard.press("3");
 assert.match(await page.locator(".confidence-note").textContent(),/acertou com dúvida/);await page.locator("#closePracticeRoom").click();
 await page.locator("#catalogSearch").fill("");await page.locator("#catalogStatus").selectOption("uncertain");assert.equal(await page.locator(".catalog-question").count(),1);
 await page.locator("#catalogSearch").fill("zzzz");assert.equal(await page.locator(".catalog-empty").count(),1);await page.locator("#resetCatalog").click();assert.match(await page.locator("#catalogResults").textContent(),/84 resultado/);
 await page.locator('[data-tab="simulado"]').click();await page.locator("#simQty").selectOption("5");await page.locator("#startSim").click();
 page.once("dialog",d=>d.accept());await page.locator("#finishSim").click();
 const simulated=await read(page);assert.equal(simulated.attempts.filter(x=>x.source==="sim").length,5);assert.equal(simulated.attempts.filter(x=>x.source==="sim"&&x.choice===-1).length,5);
 await page.locator('[data-tab="questoes"]').click();await page.locator("#quizQty").selectOption("5");await page.locator("#startQuiz").click();
 const firstId=await page.locator("#quiz .question").first().getAttribute("data-q"),first=questions.find(q=>q.id===firstId);
 await page.locator('#quiz [data-q="'+firstId+'"] [data-j="'+first.c+'"]').click();assert.equal((await read(page)).attempts.filter(a=>a.source==="block").length,1);
 await page.locator('[data-tab="progresso"]').click();assert.equal((await read(page)).attempts.length,9);
 const download=page.waitForEvent("download");await page.locator("#exportInsights").click();const report=fs.readFileSync(await(await download).path(),"utf8");assert.ok(report.includes(note));assert.match(report,/Dados locais de prática autoral/);assert.match(report,/Respostas anteriores sem detalhamento: 18/);
 await page.waitForFunction(()=>!document.querySelector("#toast").classList.contains("on"));
 for(const theme of ["dark","light"]){
  await page.locator("#themeToggle").evaluate((b,t)=>{if(document.documentElement.dataset.theme!==t)b.click();},theme);
  assert.equal(await page.evaluate(()=>document.documentElement.dataset.theme),theme);
  await page.screenshot({path:path.join(out,"progress-"+theme+"-desktop.jpg"),type:"jpeg",quality:82});
  await page.locator('[data-tab="questoes"]').click();await page.screenshot({path:path.join(out,"questions-"+theme+"-desktop.jpg"),type:"jpeg",quality:82});
  await page.locator('[data-tab="progresso"]').click();
 }
 // Mobile menu opens every tool without the old horizontally scrolling navigation.
 for(const width of [360,390,768])for(const theme of ["dark","light"]){
  await page.setViewportSize({width,height:844});await page.evaluate(t=>localStorage.setItem("kalore-color-theme",t),theme);await page.goto(url+"/estudar.html?mobile="+width+theme+"#progresso");
  await page.waitForFunction(()=>document.body.dataset.view==="progresso");
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  if(width<=760){
   assert.equal(await page.locator(".nav-tabs").isVisible(),false);await page.locator("#openToolMenu").click();assert.equal(await page.locator("[data-menu-go]").count(),14);
   assert.equal(await page.locator("#toolMenu").evaluate(el=>el.scrollWidth<=el.clientWidth+1),true);
   if(width===390)await page.screenshot({path:path.join(out,"tools-"+theme+"-mobile.jpg"),type:"jpeg",quality:82});
   await page.locator('[data-menu-go="progresso"]').click();assert.equal(await page.locator('.mobile-dock [data-go="progresso"]').getAttribute("aria-current"),"page");
   if(width===390)await page.screenshot({path:path.join(out,"progress-"+theme+"-mobile.jpg"),type:"jpeg",quality:82});
   await page.locator('.mobile-dock [data-go="questoes"]').click();
  }else await page.locator('[data-tab="questoes"]').click();
  await page.locator("#catalogSearch").fill("mistura");await page.locator('#catalogList [data-practice-q="ctx-m2"]').click();
  assert.equal(await page.locator("#practiceRoom").evaluate(el=>el.scrollWidth<=el.clientWidth+1),true);
  if(width===390)await page.screenshot({path:path.join(out,"question-"+theme+"-mobile.jpg"),type:"jpeg",quality:82});
  await page.keyboard.press("Escape");
 }
 await page.setViewportSize({width:1440,height:1050});await page.goto(url+"/radar.html");
 await page.getByRole("button",{name:"Planejar este texto"}).click();assert.ok(await page.locator(".writing-canvas").evaluate(el=>el.clientWidth>=1000));const thesis="É preciso conectar proteção digital e formação crítica.";
 await page.locator("#brief-tese").fill(thesis+" <em>repertório</em>"); assert.equal(await page.locator("#brief-tese").inputValue(),thesis+" <em>repertório</em>"); await page.locator("#brief-tese").fill(thesis);await page.getByRole("button",{name:"Continuar",exact:true}).click();await page.locator("#brief-argumento1").fill("Desigualdade no acesso à informação; explique a ligação com a tese.");
 await page.locator("#brief-argumento2").fill("Responsabilidade das plataformas e mediação da escola.");
 await page.getByRole("button",{name:"Continuar",exact:true}).click();await page.locator("#brief-agente").fill("Escolas");await page.locator("#brief-acao").fill("Oferecer oficinas");await page.locator("#brief-meio").fill("Com mediação e exemplos avaliados");await page.locator("#brief-finalidade").fill("Fortalecer a leitura crítica");
 assert.match(await page.locator(".canvas-progress").textContent(),/7 de 7/);
 await page.screenshot({path:path.join(out,"writing-canvas-desktop.jpg"),type:"jpeg",quality:82});
 const briefDownload=page.waitForEvent("download");await page.getByRole("button",{name:"Exportar roteiro",exact:true}).click();assert.ok(fs.readFileSync(await(await briefDownload).path(),"utf8").includes(thesis));
 await page.keyboard.press("Escape");await page.reload();await page.getByRole("button",{name:"Planejar este texto"}).click();assert.equal(await page.locator("#brief-tese").inputValue(),thesis);
 // Existing draft, theme and outline fields must survive a Radar handoff.
 await page.evaluate(()=>{const s=JSON.parse(localStorage.getItem("kalore-hub-v3"));s.draft="Meu rascunho anterior permanece inteiro.";s.draftTheme="Caminhos para ampliar o acesso à leitura no Brasil";s.blueprint.tese="Minha tese anterior";localStorage.setItem("kalore-hub-v3",JSON.stringify(s));});
 await page.getByRole("button",{name:"Intervenção",exact:true}).click();await page.getByRole("button",{name:"Levar para o Hub",exact:true}).click();
 await page.waitForURL(/roteiro=/);await page.locator("#applyBrief").click();let transferred=await read(page);assert.equal(transferred.draft,"Meu rascunho anterior permanece inteiro.");assert.equal(transferred.blueprint.tese,"Minha tese anterior");assert.equal(transferred.blueprint.agente,"Escolas");assert.equal(transferred.draftTheme,"Caminhos para ampliar o acesso à leitura no Brasil");
 assert.match(await page.locator("#briefImportStatus").textContent(),/foram preservados/);
 await page.evaluate(()=>{const s=JSON.parse(localStorage.getItem("kalore-hub-v3"));s.draft="";s.blueprint={};localStorage.setItem("kalore-hub-v3",JSON.stringify(s));});
 await page.goto(url+"/radar.html");await page.getByRole("button",{name:"Planejar este texto"}).click();await page.getByRole("button",{name:"Intervenção",exact:true}).click();await page.getByRole("button",{name:"Levar para o Hub",exact:true}).click();await page.waitForURL(/roteiro=/);await page.locator("#applyBrief").click();transferred=await read(page);assert.equal(transferred.draft,"");assert.equal(transferred.blueprint.tese,thesis);assert.match(transferred.draftTheme,/crianças/);
 // Backup v5 carries attempts/notes; Radar backup carries per-topic outlines.
 await page.locator(".data-menu summary").click();const backupDownload=page.waitForEvent("download");await page.locator("#exportData").click();const backup=JSON.parse(fs.readFileSync(await(await backupDownload).path(),"utf8"));assert.equal(backup.version,5);assert.equal(backup.state.attempts.length,9);assert.equal(backup.state.questionNotes["ctx-m1"],note);
 await page.goto(url+"/radar.html");const radarBackup=page.waitForEvent("download");await page.getByRole("button",{name:"Exportar análise",exact:true}).click();const radarJSON=JSON.parse(fs.readFileSync(await(await radarBackup).path(),"utf8"));assert.equal(radarJSON.briefs.digital.tese,thesis);
 // A valid history over 2 MB should round-trip instead of being rejected by the old cap.
 await page.goto(url+'/estudar.html#hoje'); const large=structuredClone(backup); large.state.essays=Array.from({length:20},(_,i)=>({id:'large-'+i,date:new Date().toISOString(),text:'Á'.repeat(55000),theme:'Um tema',themeIndex:0,diagnostic:0}));
 const largeBytes=Buffer.from(JSON.stringify(large)); assert.ok(largeBytes.length>2_000_000&&largeBytes.length<12_000_000);
 await Promise.all([page.waitForEvent('load'),page.locator('#importFile').setInputFiles({name:'large-valid-backup.json',mimeType:'application/json',buffer:largeBytes})]);
 assert.equal((await read(page)).essays.length,20); assert.equal((await read(page)).essays[0].text.length,55000);
 // Keep screenshot state focused on the normal study flow.
 await Promise.all([page.waitForEvent('load'),page.locator('#importFile').setInputFiles({name:'normal-backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup))})]);

 for(const width of [360,390,768])for(const theme of ["dark","light"]){
  await page.setViewportSize({width,height:844});await page.evaluate(t=>localStorage.setItem("kalore-color-theme",t),theme);await page.goto(url+"/radar.html?canvas="+width+theme);
  await page.getByRole("button",{name:"Planejar este texto"}).click();assert.equal(await page.locator(".writing-canvas").evaluate(el=>el.scrollWidth<=el.clientWidth+1),true);
  if(width===390)await page.screenshot({path:path.join(out,"canvas-"+theme+"-mobile.jpg"),type:"jpeg",quality:82});await page.keyboard.press("Escape");
 }
 assert.deepEqual(errors,[]);await ctx.close();await browser.close();server.close();
 console.log("Clarity: real/legacy progress, 84-item explorer, contextual options, keyboard/confidence, errors/retest, plain-text notes, guess filter, empty states, 5 blank simulation answers, block recording, export, 14-tool mobile menu, both themes, persistent writing canvas, protected/empty draft handoff and compatible backups passed.");
})().catch(e=>{console.error(e);server.close();process.exit(1);});
