/* Real browser snapshots for review; JSON companions allow retrieval over the GitHub connector. */
const http=require("node:http"),fs=require("node:fs/promises"),path=require("node:path");
const {chromium}=require("playwright");
const root=path.resolve(__dirname,"../docs"),out=path.resolve(__dirname,"../design/previews"),types={".html":"text/html",".js":"text/javascript",".css":"text/css",".svg":"image/svg+xml",".woff2":"font/woff2",".json":"application/json"};
const server=http.createServer(async(req,res)=>{const u=new URL(req.url,"http://localhost"),file=path.resolve(root,"."+(u.pathname.endsWith("/")?u.pathname+"index.html":u.pathname));if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}try{res.writeHead(200,{"Content-Type":types[path.extname(file)]||"text/plain"}).end(await fs.readFile(file));}catch{res.writeHead(404).end();}});
(async()=>{
 await fs.mkdir(out,{recursive:true});await new Promise(r=>server.listen(0,"127.0.0.1",r));
 const base="http://127.0.0.1:"+server.address().port,browser=await chromium.launch({headless:true,args:["--no-sandbox","--disable-dev-shm-usage"],...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
 for(const theme of["dark","light"])for(const size of["desktop","mobile"]){
  const ctx=await browser.newContext({viewport:size==="desktop"?{width:1440,height:1050}:{width:390,height:844},reducedMotion:"reduce",serviceWorkers:"block"});
  await ctx.addInitScript(t=>localStorage.setItem("kalore-color-theme",t),theme);const p=await ctx.newPage();
  for(const [name,route]of[["hub","/estudar.html"],["radar","/"],...(size==="desktop"?[["library","/estudar.html#biblioteca"]]:[])]){
   await p.goto(base+route,{waitUntil:"networkidle"});await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(350);
   const nameFull=name+"-"+theme+"-"+size,bytes=await p.screenshot({type:"jpeg",quality:78,path:path.join(out,nameFull+".jpg")});
   await fs.writeFile(path.join(out,nameFull+".json"),JSON.stringify({name:nameFull,mimeType:"image/jpeg",imageBase64:bytes.toString("base64")})+"\n");
   console.log("Preview",nameFull,bytes.length,"bytes");
  }await ctx.close();
 }
 await browser.close();server.close();
})().catch(e=>{console.error(e);server.close();process.exit(1);});
