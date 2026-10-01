/* Generated from every published HTML, script, stylesheet and data file. */
const PREFIX='kalore-enem-', CACHE=PREFIX+'b32efe56121e';
const ASSETS=["./assets/index-CaK6OB93.js","./assets/index-DtykjK_3.css","./data/accessibility-audit.json","./data/glow-performance-audit.json","./data/latest.json","./data/library-audit.json","./data/performance-audit.json","./estudar.html","./favicon.svg","./hub/app.js","./hub/content.js","./hub/core.js","./hub/design.css","./hub/glow.css","./hub/library-data.js","./hub/study.css","./hub/study.js","./hub/styles.css","./index.html","./manifest.webmanifest","./materiais/index.html","./materiais/matematica.html","./materiais/materials.css","./materiais/pdfs/matematica.pdf","./materiais/pdfs/planejamento.pdf","./materiais/pdfs/redacao.pdf","./materiais/pdfs/revisao.pdf","./materiais/planejamento.html","./materiais/redacao.html","./materiais/revisao.html","./shared/fonts/OFL-Manrope.txt","./shared/fonts/manrope-latin-variable.woff2","./shared/glow.css","./shared/motion.js","./shared/recommend.js","./shared/tokens.css"];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS.map(url=>new Request(url,{cache:'reload'})))).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith(PREFIX)&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
 const request=e.request,url=new URL(request.url),scope=new URL(self.registration.scope);
 if(request.method!=='GET'||url.origin!==self.location.origin||!url.pathname.startsWith(scope.pathname))return;
 const normalized=request.mode==='navigate'?new Request(url.origin+(url.pathname.endsWith('/')?url.pathname+'index.html':url.pathname)):request;
 const range=request.headers.has('range'),fresh=request.cache==='no-store'||request.cache==='reload';
 const staticAsset=/\.(?:css|js|woff2?|ttf|svg|png|webp|jpg|ico|pdf)$/.test(url.pathname);
 const offline=async()=>{const c=await caches.open(CACHE),hit=await c.match(normalized);if(hit)return hit;if(request.mode==='navigate'){const fallback=await c.match(new URL('./estudar.html',scope));if(fallback)return fallback;}return new Response('Recurso indisponível offline',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});};
 const network=()=>fetch(request).then(async response=>{if(response.ok&&response.status!==206&&!range&&!fresh){const c=await caches.open(CACHE);await c.put(normalized,response.clone());}return response;});
 if(staticAsset&&!range&&!fresh){e.respondWith(caches.open(CACHE).then(async c=>(await c.match(normalized))||network().catch(offline)));return;}
 const pending=network();e.waitUntil(pending.then(()=>{}).catch(()=>{}));
 e.respondWith((async()=>{let timer;try{return await Promise.race([pending,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('network timeout')),1800);})]);}catch{return await offline();}finally{clearTimeout(timer);}})());
});
