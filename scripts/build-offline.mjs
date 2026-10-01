import { readdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
const root = new URL("../docs/", import.meta.url);
async function files(dir = "") {
  const out = [];
  for (const item of await readdir(new URL(dir, root), {
    withFileTypes: true,
  })) {
    const p = dir + item.name;
    if (item.isDirectory()) out.push(...(await files(p + "/")));
    else if (p !== "sw.js" && !p.startsWith(".") && !/robots|sitemap/.test(p))
      out.push(p);
  }
  return out.sort();
}
const list = await files(),
  hash = createHash("sha256");
for (const f of list) hash.update(await readFile(new URL(f, root)));
const version = hash.digest("hex").slice(0, 12);
await writeFile(
  new URL("sw.js", root),
  `/* Generated from every published HTML, script, stylesheet and data file. */
const PREFIX='kalore-enem-', CACHE=PREFIX+'${version}';
const ASSETS=${JSON.stringify(list.map((f) => "./" + f))};
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith(PREFIX)&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
 const request=e.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==self.location.origin||!url.pathname.startsWith(new URL(self.registration.scope).pathname))return;
 const normalized=request.mode==='navigate'?new Request(url.origin+(url.pathname.endsWith('/')?url.pathname+'index.html':url.pathname)):request;
 e.respondWith(fetch(request).then(response=>{if(response.ok){const clone=response.clone();e.waitUntil(caches.open(CACHE).then(c=>c.put(normalized,clone)));}return response;}).catch(async()=>{
  const hit=await caches.match(normalized);if(hit)return hit;
  if(request.mode==='navigate'){const fallback=await caches.match(new URL('./estudar.html',self.registration.scope));if(fallback)return fallback;}
  return new Response('Recurso indisponível offline',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});
 }));
});
`,
);
console.log("Offline:", list.length, "arquivos, versão", version);
