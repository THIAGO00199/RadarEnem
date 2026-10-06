/* ATENA: deterministic planning, review and writing rules. No remote inference. */
(function (root) {
  "use strict";
  const areas = ["mat", "nat", "hum", "ling", "red"];
  const names = {
    mat: "Matemática",
    nat: "Natureza",
    hum: "Humanas",
    ling: "Linguagens",
    red: "Redação",
  };
  const object = (v) =>
    v && typeof v === "object" && !Array.isArray(v) ? v : {};
  const text = (v, max = 300) => (typeof v === "string" ? v.slice(0, max) : "");
  const number = (v, max = 1e7) =>
    typeof v === "number" && Number.isFinite(v)
      ? Math.max(0, Math.min(max, v))
      : 0;
  const validDay = (v) =>
    typeof v === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(v) &&
    Number.isFinite(Date.parse(v)) &&
    new Date(v).toISOString().slice(0, 10) === v;
  const validId = (v) => typeof v === "string" && /^[\w-]{1,100}$/.test(v);
  const day = (now = new Date()) =>
    new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(
      now,
    );
  const addDays = (key, n) => {
    const d = new Date(key + "T12:00:00Z");
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
  };
  const monday = (now = new Date()) => {
    const key = day(now),
      d = new Date(key + "T12:00:00Z");
    return addDays(key, -((d.getUTCDay() + 6) % 7));
  };
  function sanitize(input) {
    const v = object(input),
      p = object(v.profile),
      seen = new Set();
    const weeks = Object.fromEntries(
      Object.entries(object(v.weeks))
        .filter(([k]) => validDay(k))
        .sort(([a], [b]) => b.localeCompare(a))
        .slice(0, 16)
        .map(([k, items]) => [
          k,
          (Array.isArray(items) ? items : [])
            .filter(
              (x) =>
                validId(object(x).id) &&
                areas.includes(x.area) &&
                validDay(x.date),
            )
            .slice(0, 14)
            .map((x) => ({
              id: x.id,
              area: x.area,
              date: x.date,
              title: text(x.title, 120),
              minutes: Math.max(5, number(x.minutes, 90)),
              done: x.done === true,
              completedAt: validDay(x.completedAt)
                ? x.completedAt
                : x.done === true
                  ? x.date
                  : null,
              tab: [
                "trilhas",
                "questoes",
                "redacao",
                "flashcards",
                "erros",
                "simulado",
              ].includes(x.tab)
                ? x.tab
                : "trilhas",
            })),
        ]),
    );
    const cards = (Array.isArray(v.cards) ? v.cards : [])
      .filter(
        (x) =>
          validId(object(x).id) &&
          text(x.front) &&
          text(x.back) &&
          !seen.has(x.id) &&
          seen.add(x.id),
      )
      .slice(0, 100)
      .map((x) => ({
        id: x.id,
        front: text(x.front, 500),
        back: text(x.back, 1600),
        area: areas.includes(x.area) ? x.area : "mat",
        stage: Math.floor(number(x.stage, 6)),
        due: validDay(x.due) ? x.due : "1970-01-01",
      }));
    return {
      version: 1,
      profile: {
        name: text(p.name, 40),
        minutes: [15, 25, 45, 60].includes(p.minutes) ? p.minutes : 25,
        weeklyGoal: [3, 5, 7].includes(p.weeklyGoal) ? p.weeklyGoal : 5,
        priority: areas.includes(p.priority) ? p.priority : "mat",
      },
      weeks,
      cards,
      checklist: Object.fromEntries(
        Object.entries(object(v.checklist))
          .filter(([k]) => /^c[1-5]-[0-2]$/.test(k))
          .map(([k, v]) => [k, v === true]),
      ),
    };
  }
  function plan(workspace, now = new Date()) {
    const s = sanitize(workspace),
      key = monday(now);
    if (s.weeks[key]?.length) return s.weeks[key];
    const sequence = [
      s.profile.priority,
      "red",
      "mat",
      "nat",
      "hum",
      "ling",
      "red",
    ];
    const labels = {
      mat: "Pratique problemas e explique o raciocínio",
      nat: "Conecte um conceito a uma questão",
      hum: "Relacione contexto, fonte e interpretação",
      ling: "Leia um texto e justifique a resposta",
      red: "Construa uma tese e dois argumentos",
    };
    return sequence
      .slice(0, s.profile.weeklyGoal)
      .map((area, i) => ({
        id: "week-" + key + "-" + i,
        area,
        date: addDays(key, i),
        title:
          i === 6 ? "Releia sua redação e revise os cartões" : labels[area],
        minutes: s.profile.minutes,
        done: false,
        tab:
          i === 6
            ? "flashcards"
            : area === "red"
              ? "redacao"
              : i === 0
                ? "trilhas"
                : "questoes",
      }));
  }
  function overview(hub, workspace, now = new Date()) {
    const h = object(hub),
      w = sanitize(workspace),
      today = day(now),
      key = monday(now),
      tasks = plan(w, now),
      activity = object(h.activity);
    const completedDays = new Set(
      Object.values(w.weeks)
        .flat()
        .filter((t) => t.done && (t.completedAt || t.date) <= today)
        .map((t) => t.completedAt || t.date),
    );
    const active = (k) => number(activity[k]) > 0 || completedDays.has(k);
    let streak = 0,
      cursor = active(today) ? today : addDays(today, -1);
    while (active(cursor) && streak < 370) {
      streak++;
      cursor = addDays(cursor, -1);
    }
    const days = Array.from({ length: 7 }, (_, i) => {
      const date = addDays(key, i);
      return {
        date,
        active: date <= today && active(date),
        count:
          date <= today
            ? number(activity[date]) +
              tasks.filter((t) => t.done && (t.completedAt || t.date) === date)
                .length
            : 0,
      };
    });
    const answers = Math.floor(number(h.answers)),
      correct = Math.min(answers, Math.floor(number(h.correct))),
      pending = (Array.isArray(h.errors) ? h.errors : []).filter(
        (e) => !e.reviewed,
      ).length;
    return {
      answers,
      correct,
      accuracy: answers ? Math.round((correct * 100) / answers) : null,
      focus: Math.floor(number(h.focus)),
      essays: (Array.isArray(h.essays) ? h.essays : []).length,
      streak,
      days,
      activeDays: days.filter((d) => d.active).length,
      completed: tasks.filter((t) => t.done).length,
      pending,
      name: w.profile.name || text(object(h.profile).name, 40),
      xp: Math.floor(number(h.xp)),
    };
  }
  function review(card, grade, now = new Date()) {
    if (!["again", "good"].includes(grade)) return card;
    const stage = grade === "again" ? 0 : Math.min(6, (card.stage || 0) + 1),
      interval = [0, 1, 3, 7, 14, 30, 60][stage];
    return { ...card, stage, due: addDays(day(now), interval) };
  }
  function essaySignals(value) {
    const raw = text(value, 60000).trim(),
      paragraphs = raw
        ? raw
            .split(/\n\s*\n|\n/)
            .map((x) => x.trim())
            .filter(Boolean)
        : [],
      words = raw ? raw.split(/\s+/).length : 0;
    const connectors = [
      "portanto",
      "além disso",
      "entretanto",
      "nesse sentido",
      "por conseguinte",
      "desse modo",
      "contudo",
      "dessa forma",
      "em primeiro lugar",
      "por outro lado",
    ];
    const found = connectors.filter((x) =>
      raw.toLocaleLowerCase("pt-BR").includes(x),
    );
    const sentences = raw
      .split(/[.!?]+/)
      .map((x) => x.trim())
      .filter(Boolean);
    return {
      words,
      paragraphs: paragraphs.length,
      connectors: found,
      longSentences: sentences.filter((x) => x.split(/\s+/).length > 40).length,
      readingMinutes: Math.max(1, Math.ceil(words / 180)),
      hasText: raw.length > 0,
    };
  }
  const api = {
    areas,
    names,
    day,
    addDays,
    monday,
    sanitize,
    plan,
    overview,
    review,
    essaySignals,
  };
  root.AtenaModel = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(globalThis);
