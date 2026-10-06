import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import ts from "typescript";

const context = vm.createContext({ Intl, Date, console, exports: {} });
vm.runInContext(
  await readFile("portable/public/shared/atena-model.js", "utf8"),
  context,
);
const model = context.AtenaModel;
const now = new Date("2026-10-06T01:00:00Z");
assert.equal(model.day(now), "2026-10-05");
assert.equal(model.monday(now), "2026-10-05");
assert.equal(model.addDays("2028-02-28", 1), "2028-02-29");
assert.equal(model.day(new Date("2026-10-06T04:00:00Z")), "2026-10-06");

const clean = model.sanitize({
  profile: {
    minutes: Infinity,
    weeklyGoal: 99,
    name: "T".repeat(80),
    priority: "unknown",
  },
  weeks: { "2026-02-30": [{ id: "bad" }] },
  cards: [
    {
      id: "a",
      front: "Pergunta",
      back: "Resposta",
      stage: Infinity,
      due: "2026-02-30",
    },
    { id: "a", front: "Duplicado", back: "Duplicado" },
    { id: "<bad>", front: "X", back: "Y" },
  ],
  checklist: { "c1-0": true, injected: true },
});
assert.equal(clean.profile.minutes, 25);
assert.equal(clean.profile.weeklyGoal, 5);
assert.equal(clean.profile.name.length, 40);
assert.equal(clean.cards.length, 1);
assert.equal(clean.cards[0].stage, 0);
assert.equal(clean.cards[0].due, "1970-01-01");
assert.equal(Object.keys(clean.weeks).length, 0);
assert.equal(Object.keys(clean.checklist).length, 1);
for (const goal of [3, 5, 7]) {
  const plan = model.plan(
    model.sanitize({
      profile: { weeklyGoal: goal, minutes: 45, priority: "nat" },
    }),
    now,
  );
  assert.equal(plan.length, goal);
  assert.equal(plan[0].area, "nat");
  assert.equal(
    plan.reduce((n, task) => n + task.minutes, 0),
    goal * 45,
  );
  assert.equal(plan[0].date, "2026-10-05");
}
const plan = model.plan(model.sanitize(null), now);
plan[4].done = true;
plan[4].completedAt = "2026-10-05";
const workspace = model.sanitize({ weeks: { "2026-10-05": plan } });
assert.equal(model.plan(workspace, now)[4].done, true);
const overview = model.overview(
  { answers: 2, correct: 80, activity: { "2026-10-04": 1 } },
  workspace,
  now,
);
assert.equal(overview.correct, 2);
assert.equal(overview.streak, 2);
assert.equal(overview.activeDays, 1);
assert.equal(overview.days[4].active, false);
assert.equal(model.overview({}, model.sanitize(null), now).accuracy, null);
assert.equal(model.review(clean.cards[0], "good", now).due, "2026-10-06");
assert.equal(
  model.review({ ...clean.cards[0], stage: 6 }, "good", now).due,
  "2026-12-04",
);
assert.equal(model.review(clean.cards[0], "again", now).due, "2026-10-05");
assert.equal(model.essaySignals("").words, 0);
assert.equal(
  model.essaySignals(
    "Uma tese.\n\nAlém disso, um argumento.\nPortanto, uma conclusão.",
  ).paragraphs,
  3,
);
assert.equal(model.essaySignals("Além disso, portanto.").connectors.length, 2);

vm.runInContext(
  ts.transpileModule(await readFile("lib/academy-data.ts", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText,
  context,
);
const ids = new Set();
for (const track of Object.values(context.exports.academy)) {
  assert.equal(track.units.length, 8);
  for (const lesson of track.units) {
    assert.ok(!ids.has(lesson.id));
    ids.add(lesson.id);
    assert.ok(lesson.title && lesson.concept && lesson.q && lesson.e);
    assert.ok(
      lesson.o.length >= 4 && lesson.c >= 0 && lesson.c < lesson.o.length,
    );
  }
}
assert.equal(ids.size, 40);
const generated = vm.createContext({});
vm.runInContext(
  await readFile("portable/public/hub/academy-data.js", "utf8"),
  generated,
);
assert.equal(
  JSON.stringify(generated.AtenaAcademy),
  JSON.stringify(context.exports.academy),
);
console.log(
  "ATENA: São Paulo calendar, saved plans, real activity dates, invalid backups, spaced review, writing signals and 40 unique lessons passed.",
);
