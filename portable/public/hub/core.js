/* Shared, deterministic rules used by the Hub and its regression checks. */
(function (root) {
  "use strict";
  const areas = ["ling", "hum", "nat", "mat", "red"];
  const obj = (v) => (v && typeof v === "object" && !Array.isArray(v) ? v : {});
  const num = (v, fallback = 0, max = 10000000) =>
    typeof v === "number" && Number.isFinite(v)
      ? Math.max(0, Math.min(max, v))
      : fallback;
  const str = (v, max = 1000) => (typeof v === "string" ? v.slice(0, max) : "");
  const id = (v) => typeof v === "string" && /^[a-zA-Z0-9_-]{1,100}$/.test(v);
  const date = (v) =>
    typeof v === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(v) &&
    Number.isFinite(Date.parse(v)) &&
    new Date(v).toISOString().slice(0, 10) === v;
  const iso = (v) =>
    typeof v === "string" && Number.isFinite(Date.parse(v))
      ? v
      : new Date().toISOString();
  const map = (v, fn, key = id) =>
    Object.fromEntries(
      Object.entries(obj(v))
        .filter(([k]) => key(k))
        .slice(0, 1500)
        .map(([k, x]) => [k, fn(x)]),
    );
  function mergeState(base, input) {
    const v = obj(input),
      s = structuredClone(base),
      p = obj(v.profile),
      c = obj(v.course);
    for (const k of ["xp", "answers", "correct", "focus"])
      s[k] = Math.floor(num(v[k], s[k]));
    s.correct = Math.min(s.correct, s.answers);
    s.draft = str(v.draft, 60000);
    s.draftTheme = str(v.draftTheme, 500);
    s.theme = v.theme === "light" ? "light" : "dark";
    s.themeIndex = Math.floor(num(v.themeIndex, 0, 100));
    s.profile = {
      name: str(p.name, 40),
      goal: str(p.goal, 80),
      hours: Math.max(3, Math.round(num(p.hours, 12, 35))),
      weeklyGoal: [3, 5, 7].includes(p.weeklyGoal) ? p.weeklyGoal : 5,
    };
    areas.forEach((a) => {
      s.profile["d_" + a] = Math.max(1, Math.round(num(p["d_" + a], 2, 3)));
    });
    s.area = Object.fromEntries(
      areas.map((a) => [a, num(obj(v.area)[a], 0, 100)]),
    );
    s.activity = map(v.activity, (x) => Math.floor(num(x)), date);
    s.tasks = map(v.tasks, (x) => x === true);
    s.checks = map(v.checks, (x) => x === true);
    s.checkRewards = map(v.checkRewards, (x) => x === true);
    s.library = {
      favorites: map(obj(v.library).favorites, (x) => x === true),
      read: map(obj(v.library).read, (x) => x === true),
    };
    s.officialHistory = (Array.isArray(v.officialHistory) ? v.officialHistory : [])
      .filter((x) => id(obj(x).id) && /^enem-20\d{2}-d[12]$/.test(x.examId || ""))
      .slice(0, 100)
      .map((x) => ({
        id: x.id,
        examId: x.examId,
        date: iso(x.date),
        minutes: Math.max(1, Math.round(num(x.minutes, 120, 360))),
        first: Math.floor(num(x.first, 0, 45)),
        second: Math.floor(num(x.second, 0, 45)),
        note: str(x.note, 2000),
      }));
    s.course = {
      track: areas.includes(c.track) ? c.track : "mat",
      done: map(c.done, (x) => x === true),
      energy: {
        date: date(obj(c.energy).date) ? c.energy.date : "",
        value: num(obj(c.energy).value, 5, 5),
      },
    };
    s.flash = map(v.flash, (x) =>
      x === "mastered"
        ? x
        : {
            stage: Math.floor(num(obj(x).stage, 0, 6)),
            due: date(obj(x).due) ? x.due : "1970-01-01",
            last: date(obj(x).last) ? x.last : "",
            energyDay: date(obj(x).energyDay) ? x.energyDay : "",
          },
    );
    s.essays = (Array.isArray(v.essays) ? v.essays : [])
      .filter((e) => id(obj(e).id) && typeof e.text === "string")
      .slice(0, 30)
      .map((e) => ({
        id: e.id,
        date: iso(e.date),
        text: str(e.text, 60000),
        theme: str(e.theme, 500),
        themeIndex: Math.floor(num(e.themeIndex, 0, 100)),
        diagnostic: num(e.diagnostic, 0, 100),
      }));
    s.errors = (Array.isArray(v.errors) ? v.errors : [])
      .filter((e) => id(obj(e).id) && id(e.qid))
      .slice(0, 1000)
      .map((e) => ({
        id: e.id,
        qid: e.qid,
        selected: e.selected === -1 ? -1 : Math.floor(num(e.selected, 0, 4)),
        date: iso(e.date),
        reviewed: e.reviewed === true,
      }));
    s.plan = (Array.isArray(v.plan) ? v.plan : [])
      .filter((t) => id(obj(t).id) && areas.includes(t.a))
      .slice(0, 70)
      .map((t) => ({
        id: t.id,
        a: t.a,
        name: str(t.name, 100),
        type: str(t.type, 100),
        minutes: Math.max(1, num(t.minutes, 30, 120)),
        done: t.done === true,
        rewarded: t.rewarded === true,
      }));
    s.notes = (Array.isArray(v.notes) ? v.notes : [])
      .filter((n) => obj(n).date)
      .slice(0, 30)
      .map((n) => ({
        date: iso(n.date),
        goal: str(n.goal, 500),
        note: str(n.note, 6000),
        minutes: num(n.minutes, 0, 300),
      }));
    s.onboarding = {
      done: obj(v.onboarding).done === true,
      minutes: Math.max(10, num(obj(v.onboarding).minutes, 20, 60)),
    };
    s.daily = map(
      v.daily,
      (x) => ({
        steps: (Array.isArray(obj(x).steps) ? x.steps : [])
          .filter((k) =>
            ["erros", "flashcards", "trilhas", "questoes"].includes(k),
          )
          .slice(0, 3),
        completed: (Array.isArray(obj(x).completed) ? x.completed : []).filter(
          (k) => ["erros", "flashcards", "trilhas", "questoes"].includes(k),
        ),
      }),
      date,
    );
    s.blueprint = map(
      v.blueprint,
      (x) => str(x, 2000),
      (k) =>
        [
          "tese",
          "argumento1",
          "argumento2",
          "agente",
          "acao",
          "meio",
          "finalidade",
        ].includes(k),
    );
    s.focusGoal = str(v.focusGoal, 500);
    s.focusNote = str(v.focusNote, 6000);
    const t = obj(v.focusTimer);
    s.focusTimer = {
      total: num(t.total, 1500, 10800),
      seconds: num(t.seconds, 1500, 10800),
      running: t.running === true && num(t.end) > 0,
      end: num(t.end, 0, 1e15),
    };
    s.simHistory = (Array.isArray(v.simHistory) ? v.simHistory : [])
      .slice(0, 20)
      .map((x) => ({
        date: iso(obj(x).date),
        correct: num(obj(x).correct, 0, 100),
        total: num(obj(x).total, 0, 100),
        seconds: num(obj(x).seconds, 0, 10800),
      }));
    s.journey = root.KaloreSession?.sanitize(v.journey) || null;
    s.journeyHistory = root.KaloreSession?.history(v.journeyHistory) || [];
    s.attempts = root.KaloreInsights?.history(v.attempts) || [];
    s.questionNotes = root.KaloreInsights?.notes(v.questionNotes) || {};
    s.preferences = {
      motion: obj(v.preferences).motion !== false,
      writingFont: [18, 20, 22].includes(obj(v.preferences).writingFont) ? v.preferences.writingFont : 20,
    };
    return s;
  }
  function shuffle(values, random = Math.random) {
    const out = [...values];
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }
  function planAreas(hours, weights) {
    const count = Math.round(hours * 2),
      out = areas.map((a) => ({
        a,
        n: 1,
        weight: Math.max(1, Number(weights[a]) || 1),
      }));
    for (let i = 5; i < count; i++) {
      out.sort(
        (a, b) =>
          b.weight / (b.n + 1) - a.weight / (a.n + 1) ||
          areas.indexOf(a.a) - areas.indexOf(b.a),
      );
      out[0].n++;
    }
    const result = [];
    while (result.length < count) {
      for (const a of areas) {
        const x = out.find((x) => x.a === a);
        if (x.n) {
          result.push(a);
          x.n--;
        }
      }
    }
    return result;
  }
  function addDays(key, days) {
    const d = new Date(key + "T12:00:00Z");
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
  }
  root.KaloreCore = { mergeState, shuffle, planAreas, addDays, date };
})(globalThis);
