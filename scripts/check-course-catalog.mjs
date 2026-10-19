import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import ts from "typescript";
const compile = async (file, dependencies = {}) => {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(await readFile(file, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { exports, URL, require: name => dependencies[name] });
  return exports;
};
const scores = await compile("lib/scores.ts");
const model = await compile("lib/course-catalog.ts", { "./scores": scores });
const data = model.parseCatalog(JSON.parse(await readFile("portable/public/data/sisu-catalog-2026.json", "utf8")));
assert.equal(data.institutions.length, 136);
assert.equal(data.offers.length, 7390);
assert.equal(new Set(data.offers.map(item => item.id)).size, 7390);
const institutions = new Set(data.institutions.map(item => item.id));
let references = 0, missing = 0, positive = 0;
for (const offer of data.offers) {
  assert.ok(institutions.has(offer.institution));
  assert.equal(offer.weights.length, 5); assert.ok(offer.weights.reduce((a, b) => a + b, 0) > 0);
  assert.equal(offer.minimums.length, 5);
  for (const reference of offer.references) {
    references++;
    assert.ok(data.modalities[reference[0]]?.description);
    assert.ok(reference[1] === null || reference[1] > 0, "Zero cutoffs are absent references, never a real cutoff");
    if (reference[1] === null) missing++; else positive++;
    assert.ok(reference[2] >= 0 && reference[3] >= 0);
  }
}
assert.equal(references, 62567); assert.equal(missing, 15571); assert.equal(positive, 46996);
// Audited directly against both MEC XLSX reports, independent of the UI import.
const medicine = data.offers.find(offer => offer.id === "b615b5d0977bdd60");
assert.equal(medicine.institution, 571); assert.equal(medicine.city, "Curitiba");
const ac = medicine.references.find(ref => data.modalities[ref[0]].code === "AC");
assert.equal(ac[1], 817.16); assert.equal(ac[2], 20);
const target = model.targetFromOffer(data, medicine, ac);
assert.equal(scores.weightedAverage(scores.values("800"), target.weights), 800);
assert.equal(target.official.minimums.redacao, "0.01");
assert.equal(target.cutoff, "817.16"); assert.equal(target.year, "2026");
assert.equal(JSON.stringify(scores.sanitizeScores({ version: 1, targets: [{ ...target, id: "ufpr-med" }] }).targets[0]), JSON.stringify({ ...target, id: "ufpr-med" }));
assert.equal(scores.minimumStatus(scores.values("800"), target.official).unmet.length, 0);
assert.ok(scores.minimumStatus({ ...scores.values("800"), redacao: "0" }, target.official).unmet.includes("Redação"));
const weightedMinimum = { ...target.official, minimums: scores.values("0"), minimumAverage: "700" };
assert.ok(scores.minimumStatus({ ...scores.values("600"), redacao: "900" }, weightedMinimum).unmet.includes("média simples mínima"), "Minimum average uses simple mean, not the ranking weights");
assert.equal(scores.minimumStatus(scores.values(), target.official).complete, false);
assert.equal(model.targetFromOffer(data, medicine, medicine.references.find(ref => ref[1] === null)).cutoff, "");
assert.throws(() => model.parseCatalog({ version: 2 }));
assert.equal(model.normalizeCourse("Ciências da Saúde / UFPR"), "ciencias da saude / ufpr");
console.log("SiSU: all 62,567 modality records, official UFPR Medicine example, missing cutoffs, weighted averages, simple minimums and saved-target round trip passed.");
