/* Auditoria manual de disponibilidade. Nunca confundir catálogo institucional com download validado. */
import { readFile, writeFile } from "node:fs/promises";
import vm from "node:vm";
const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(await readFile("portable/public/hub/library-data.js", "utf8"), sandbox);
const remaining = sandbox.KaloreLibrary.resources.filter((r) => !r.local);
const results = [];
await Promise.all(Array.from({ length: 4 }, async () => {
  while (remaining.length) {
    const r = remaining.shift(), record = { id: r.id, url: r.url, sourceUrl: r.sourceUrl, sourceConfirmed: true };
    try {
      const response = await fetch(r.url, { headers: { Range: "bytes=0-1023" }, signal: AbortSignal.timeout(15000) });
      record.status = response.status;
      record.contentType = response.headers.get("content-type");
      const reader = response.body?.getReader(), first = reader ? await reader.read() : null;
      record.pdf = response.ok && first?.value?.length >= 5 && String.fromCharCode(...first.value.slice(0, 5)) === "%PDF-";
      if (reader) await reader.cancel();
    } catch (error) { record.pdf = false; record.error = error.message; }
    results.push(record);
  }
}));
results.sort((a,b) => a.id.localeCompare(b.id));
await writeFile("portable/public/data/library-audit.json", JSON.stringify({ checkedAt: new Date().toISOString(), method: "GET parcial, timeout de 15 s; sourceConfirmed significa URL encontrada na fonte institucional. Uma resposta indisponível pode depender da origem da requisição.", results },null,2) + "\n");
console.log(`${results.filter((r)=>r.pdf).length}/${results.length} PDFs responderam com assinatura PDF. Consulte data/library-audit.json para os demais.`);
