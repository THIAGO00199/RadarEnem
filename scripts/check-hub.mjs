import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
const sandbox = { structuredClone, console };
vm.createContext(sandbox);
vm.runInContext(await readFile("portable/public/hub/core.js", "utf8"), sandbox);
vm.runInContext(
  await readFile("portable/public/hub/content.js", "utf8"),
  sandbox,
);
vm.runInContext(await readFile("portable/public/hub/practice-data.js", "utf8"), sandbox);
vm.runInContext(await readFile("portable/public/hub/library-data.js", "utf8"), sandbox);
vm.runInContext(await readFile("portable/public/hub/study.js", "utf8"), sandbox);
const c = sandbox.KaloreCore,
  content = sandbox.KaloreContent;
const s = c.mergeState(
  { xp: 0, answers: 0, correct: 0, focus: 0 },
  {
    xp: "bad",
    answers: 10,
    correct: 50,
    course: { done: null },
    profile: null,
    plan: [{ id: '"><img onerror=alert(1)>', a: "mat" }],
    essays: null,
    flash: { f1: { stage: Infinity, due: "2026-02-30" } },
    errors: [{ id: "error-1", qid: "extra1", selected: -1 }],
    library: { favorites: { "kalore-redacao": true, 'bad<id': true }, read: null },
    officialHistory: [{ id: "official-1", examId: "enem-2025-d1", first: 80, second: -2, minutes: 20000, note: "Treino" }, { id: "official-2", examId: "unknown" }],
  },
);
assert.equal(s.xp, 0);
assert.equal(s.correct, 10);
assert.equal(s.plan.length, 0);
assert.equal(s.course.track, "mat");
assert.equal(s.flash.f1.stage, 0);
assert.equal(s.flash.f1.due, "1970-01-01");
assert.equal(s.errors[0].selected, -1);
assert.equal(s.library.favorites["kalore-redacao"], true);
assert.equal(Object.keys(s.library.favorites).length, 1);
assert.equal(Object.keys(s.library.read).length, 0);
assert.equal(s.officialHistory.length, 1);
assert.equal(s.officialHistory[0].first, 45);
assert.equal(s.officialHistory[0].second, 0);
assert.equal(s.officialHistory[0].minutes, 360);
assert.equal(c.addDays("2026-12-31", 1), "2027-01-01");
assert.equal(c.addDays("2028-02-28", 1), "2028-02-29");
for (const hours of [3, 12, 35]) {
  const out = c.planAreas(hours, { ling: 1, hum: 1, nat: 1, mat: 3, red: 2 });
  assert.equal(out.length, hours * 2);
  assert.ok(["ling", "hum", "nat", "mat", "red"].every((a) => out.includes(a)));
  if (hours > 3)
    assert.ok(
      out.filter((a) => a === "mat").length >
        out.filter((a) => a === "hum").length,
    );
}
const shuffled = c.shuffle([1, 2, 3, 4], () => 0);
assert.deepEqual(Array.from(shuffled).sort(), [1, 2, 3, 4]);
assert.equal(content.questions.length, 64);
assert.equal(content.formulas.length, 22);
for (const q of content.questions) {
  assert.equal(q.o.length, q.contextual ? 5 : 4);
  assert.ok(Number.isInteger(q.c) && q.c >= 0 && q.c < q.o.length);
  assert.ok(q.e.length > 20);
}
const html = await readFile("docs/estudar.html", "utf8"),
  sw = await readFile("docs/sw.js", "utf8");
for (const f of [
  "core.js",
  "insights-model.js",
  "insights.js",
  "insights.css",
  "practice-data.js",
  "content.js",
  "library-data.js",
  "study.js",
  "app.js",
  "styles.css",
  "design.css",
  "study.css",
]) {
  assert.ok(html.includes(f));
  assert.ok(sw.includes("./hub/" + f));
  await readFile("docs/hub/" + f);
}
assert.ok(!sw.includes("hit||caches.match('./estudar.html')"));
assert.ok(sw.includes("status:503"));
const library = sandbox.KaloreLibrary;
assert.equal(library.resources.length, 68);
assert.equal(library.exams.length, 18);
assert.equal(new Set(library.resources.map((r) => r.id)).size, 68);
assert.equal(new Set(library.resources.map((r) => r.url)).size, 68);
for (const r of library.resources) {
  assert.ok(r.id && r.title && r.source && r.sourceUrl && r.desc && r.tags.length);
  if (r.local) {
    const pdf = await readFile("docs/" + r.url.slice(2));
    assert.equal(pdf.subarray(0, 5).toString(), "%PDF-");
    assert.ok(sw.includes(r.url));
    await readFile("docs/" + r.sourceUrl.slice(2));
  } else assert.equal(new URL(r.url).protocol, "https:");
}
for (const e of library.exams) {
  assert.equal(e.color, "Azul");
  assert.ok(library.resources.some((r) => r.examId === e.id && r.kind === "prova" && r.url === e.url));
  assert.ok(library.resources.some((r) => r.examId === e.id && r.kind === "gabarito" && r.url === e.answerUrl));
}
assert.ok(sandbox.KaloreStudy.matchResource(library.resources.find((r) => r.id === "inep-cartilha-2026"), "redacao 2026"));
assert.ok(!sandbox.KaloreStudy.matchResource(library.resources.find((r) => r.id === "kalore-matematica"), "biologia"));
for (const page of ["index", "redacao", "matematica", "revisao", "planejamento"]) {
  const source = await readFile("docs/materiais/" + page + ".html", "utf8");
  assert.ok(source.includes('<link rel="canonical"'));
  assert.ok(source.includes('application/ld+json'));
  assert.ok(source.includes("<h1>"));
}
console.log(
  "Hub: backups inválidos, compatibilidade, datas, plano exato, conteúdo e arquivos offline verificados.",
);
