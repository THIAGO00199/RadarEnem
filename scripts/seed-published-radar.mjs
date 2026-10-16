/* Preserve the last deployed collection when Pages no longer commits builds. */
import { writeFile } from "node:fs/promises";
import { loadRadar } from "./compile-radar.mjs";
const { model } = await loadRadar();
const response = await fetch("https://atena.dev.br/data/latest.json", { signal: AbortSignal.timeout(20_000), headers: { "Cache-Control": "no-cache" } });
if (!response.ok) throw Error("A base publicada não respondeu; coleta cancelada para preservar os registros.");
let size = 0;
const chunks = [];
for await (const chunk of response.body) {
  size += chunk.length;
  if (size > 2_000_000) throw Error("A base publicada excedeu o limite.");
  chunks.push(chunk);
}
const value = JSON.parse(Buffer.concat(chunks).toString("utf8"));
if (!Array.isArray(value.articles) || value.articles.length > 500 || !value.articles.every(model.validEvidence) || typeof value.fetchedAt !== "string" || !Number.isFinite(Date.parse(value.fetchedAt))) throw Error("A base publicada não passou pela validação.");
await writeFile("portable/public/data/latest.json", JSON.stringify(value, null, 2) + "\n");
console.log("Base anterior preservada:", value.articles.length, "registros.");
