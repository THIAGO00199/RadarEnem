const assert = require("node:assert/strict");
require("../portable/public/shared/backup.js");
const backup = globalThis.AtenaBackup;
function storage(seed = {}) {
  const data = new Map(Object.entries(seed));
  return { data, getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, String(value)), removeItem: key => data.delete(key) };
}
const original = {
  "kalore-hub-v3": JSON.stringify({ draft: "Minha tese com ação, Ω e 日本語", xp: 125, essays: [{ text: "Versão antiga" }], course: { done: { mat6: true } } }),
  "atena-workspace-v1": JSON.stringify({ version: 1, cards: [{ front: "Frente", back: "Verso" }], weeks: { "2026-10-12": [] } }),
  "kalore-radar-v2": JSON.stringify({ notes: { digital: "Anotação pessoal" }, briefs: { digital: { tese: "Meu roteiro" } }, favorites: ["digital"] }),
  "kalore-color-theme": "light",
  "kalore-motion": "false",
  "another-app": "never touch",
};
const source = storage(original), file = JSON.parse(JSON.stringify(backup.create(source)));
const target = storage({ "another-app": "keep", "kalore-essay-brief-v1": "{}" });
backup.restore(file, target);
for (const key of backup.keys) assert.equal(target.getItem(key), source.getItem(key), key);
assert.equal(target.getItem("another-app"), "keep");
backup.undo(target);
assert.equal(target.getItem("kalore-essay-brief-v1"), "{}");
assert.equal(target.getItem("kalore-hub-v3"), null);
const before = JSON.stringify([...source.data]);
for (const bad of [null, [], {}, { ...file, version: 99 }, { ...file, data: { "another-app": "stolen" } }, { ...file, data: { "kalore-hub-v3": "[]" } }, { ...file, data: { "kalore-color-theme": "no" } }, { ...file, data: { "kalore-hub-v3": "{bad" } }]) {
  assert.throws(() => backup.restore(bad, source));
  assert.equal(JSON.stringify([...source.data]), before, "invalid import must not write");
}
// Simulate a quota failure after one key has already been replaced.
const fragile = storage(original), set = fragile.setItem;
let failed = false;
fragile.setItem = (key, value) => {
  if (key === "atena-workspace-v1" && !failed) { failed = true; throw Error("QuotaExceededError"); }
  set(key, value);
};
assert.throws(() => backup.restore(file, fragile), /preservados/);
for (const [key, raw] of Object.entries(original)) assert.equal(fragile.getItem(key), raw, "rollback: " + key);
const denied = storage(original);
denied.setItem = () => { throw Error("SecurityError"); };
// A denied checkpoint must not cause the original data to be removed.
assert.throws(() => backup.restore(file, denied));
for (const [key, raw] of Object.entries(original)) assert.equal(denied.getItem(key), raw);
console.log("Backup: exact cross-device round trip, Unicode drafts, Radar notes, plans/cards, invalid files, unrelated keys, undo and quota rollback passed.");
