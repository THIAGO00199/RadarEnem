import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import vm from "node:vm";

const context = {};
vm.createContext(context);
for (const file of ["guia-mapas-01.js", "guia-mapas-02.js", "guia-mapas-03.js", "shared/essay-ideas-data.js"])
  vm.runInContext(await readFile("portable/public/" + file, "utf8"), context);
const references = [];
for (const map of context.AtenaWarMaps)
  for (const section of ["cause", "impact"])
    map[section].refs.forEach((ref, index) => references.push({
      id: `map/${map.id}/${section}/${index}`,
      theme: map.title,
      reference: ref[0],
      context: map[section].claim,
      application: ref[1],
      source: ref[2] || null,
    }));
for (const theme of context.KaloreEssayIdeasData.topics)
  theme.repertoire.forEach((ref, index) => references.push({
    id: `radar/${theme.id}/${index}`,
    theme: theme.title,
    reference: ref.work + " — " + ref.creator,
    context: ref.connection,
    application: ref.application,
    source: ["Quanta", "Pela Internet"].includes(ref.work) ? "https://gilbertogil.com.br/discografia/quanta/" : null,
  }));
const digest = value => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const old = JSON.parse(await readFile("editorial/reviews.json", "utf8").catch(() => '{"items":[]}'));
const expected = references.map(ref => ({ ...ref, digest: digest(ref) }));
if (process.argv.includes("--prepare")) {
  const items = expected.map(ref => {
    const previous = old.items.find(item => item.id === ref.id && item.digest === ref.digest);
    return previous || { id: ref.id, digest: ref.digest, status: "pending", reviewer: null, reviewedAt: null, evidence: [], notes: "" };
  });
  await writeFile("editorial/reviews.json", JSON.stringify({ version: 1, items }, null, 2) + "\n");
  const packet = ["# ATENA · Caderno de revisão pedagógica independente", "Aprovação humana pendente. Este inventário permite conferir cada aplicação no contexto, além da autoria. O hash vincula o parecer ao texto exato. Execute `npm run editorial:prepare` após alterações; pareceres de textos alterados voltam a pendente.",
    ...expected.flatMap(ref => ["## " + ref.id, "**Tema:** " + ref.theme, "**Referência:** " + ref.reference, "**Contexto:** " + ref.context, "**Aplicação sugerida:** " + ref.application, "**Fonte para consulta:** " + (ref.source || "Conferir edição, créditos ou ficha técnica da obra."), "**Parecer independente:** preencher em `editorial/reviews.json` com nome, data, evidências e observações."])
  ];
  await writeFile("editorial/review-packet.md", packet.join("\n\n") + "\n");
} else {
  assert.equal(expected.length, 123, "72 aplicações nos mapas + 51 no Radar");
  assert.equal(old.items.length, expected.length, "inventário completo de pareceres");
  assert.equal(new Set(old.items.map(item => item.id)).size, expected.length);
  let approved = 0;
  for (const ref of expected) {
    const review = old.items.find(item => item.id === ref.id);
    assert.equal(review?.digest, ref.digest, "Parecer desatualizado: " + ref.id);
    assert.ok(["pending", "approved", "changes-requested"].includes(review.status), ref.id);
    if (ref.source) assert.equal(new URL(ref.source).protocol, "https:");
    if (review.status === "approved") {
      assert.ok(typeof review.reviewer === "string" && review.reviewer.trim().length > 5, "Revisor identificado: " + ref.id);
      assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(review.reviewedAt), "Data do parecer: " + ref.id);
      assert.ok(Array.isArray(review.evidence) && review.evidence.length, "Evidência do parecer: " + ref.id);
      approved++;
    }
  }
  console.log(`Editorial: ${expected.length} aplicações rastreáveis; ${approved} aprovações independentes, ${expected.length - approved} pendentes. Integridade estrutural não comprova precisão pedagógica.`);
}
