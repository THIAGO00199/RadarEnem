/* Generated from every published HTML, script, stylesheet and data file. */
const PREFIX='kalore-enem-', CACHE=PREFIX+'16f25e5e2252';
const ASSETS=["./assets/index-Ca5tx9ol.js","./assets/index-DmKgODqY.css","./data/accessibility-audit.json","./data/latest.json","./data/library-audit.json","./data/performance-audit.json","./estudar.html","./favicon.svg","./hub/app.js","./hub/content.js","./hub/core.js","./hub/design.css","./hub/library-data.js","./hub/study.css","./hub/study.js","./hub/styles.css","./index.html","./manifest.webmanifest","./materiais/index.html","./materiais/matematica.html","./materiais/materials.css","./materiais/pdfs/matematica.pdf","./materiais/pdfs/planejamento.pdf","./materiais/pdfs/redacao.pdf","./materiais/pdfs/revisao.pdf","./materiais/planejamento.html","./materiais/redacao.html","./materiais/revisao.html","./shared/tokens.css"];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith(PREFIX)&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
 const request=e.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==self.location.origin||!url.pathname.startsWith(new URL(self.registration.scope).pathname))return;
 const normalized=request.mode==='navigate'?new Request(url.origin+(url.pathname.endsWith('/')?url.pathname+'index.html':url.pathname)):request;
 e.respondWith(fetch(request).then(response=>{if(response.ok&&response.status!==206&&!request.headers.has('range')){const clone=response.clone();e.waitUntil(caches.open(CACHE).then(c=>c.put(normalized,clone)));}return response;}).catch(async()=>{
  const hit=await caches.match(normalized);if(hit)return hit;
  if(request.mode==='navigate'){const fallback=await caches.match(new URL('./estudar.html',self.registration.scope));if(fallback)return fallback;}
  return new Response('Recurso indisponível offline',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});
 }));
});
