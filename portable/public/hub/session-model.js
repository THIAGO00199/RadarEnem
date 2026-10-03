/* A resumable practice session. IDs and answers are validated before use. */
(function (root) {
  "use strict";
  const areas = ["ling", "hum", "nat", "mat"];
  const id = (v) => typeof v === "string" && /^[a-zA-Z0-9_-]{1,100}$/.test(v);
  const integer = (v, max, fallback = 0) => Number.isFinite(v) ? Math.max(0, Math.min(max, Math.floor(v))) : fallback;
  const day = (now) => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(now);
  function sanitize(input) {
    if (!input || !id(input.id) || !Array.isArray(input.items)) return null;
    const seen = new Set();
    const items = input.items.slice(0, 20).filter((x) => {
      if (!x || !id(x.id) || !["question", "flash"].includes(x.kind)) return false;
      const key = x.kind + "/" + x.id;
      if (seen.has(key)) return false;
      seen.add(key); return true;
    }).map((x) => x.kind === "question"
      ? { kind: "question", id: x.id, choice: Number.isInteger(x.choice) && x.choice >= 0 && x.choice < 5 ? x.choice : null }
      : { kind: "flash", id: x.id, grade: ["again", "good", "easy"].includes(x.grade) ? x.grade : null });
    if (!items.length) return null;
    const firstPending = items.findIndex((x) => x.kind === "question" ? x.choice === null : x.grade === null);
    return {
      id: input.id, area: areas.includes(input.area) ? input.area : "all",
      minutes: [10, 20, 30].includes(input.minutes) ? input.minutes : 10,
      createdAt: typeof input.createdAt === "string" && Number.isFinite(Date.parse(input.createdAt)) ? input.createdAt : new Date().toISOString(),
      index: Math.min(integer(input.index, items.length), firstPending < 0 ? items.length : firstPending),
      seconds: integer(input.seconds, 10800), items,
    };
  }
  function history(input) {
    const seen = new Set();
    return (Array.isArray(input) ? input : []).filter((x) => x && id(x.id) && !seen.has(x.id) && seen.add(x.id) && typeof x.date === "string" && Number.isFinite(Date.parse(x.date))).slice(0, 40).map((x) => ({
      id: x.id, date: x.date, area: areas.includes(x.area) ? x.area : "all",
      questions: integer(x.questions, 16), correct: Math.min(integer(x.correct, 16), integer(x.questions, 16)),
      cards: integer(x.cards, 10), seconds: integer(x.seconds, 10800),
    }));
  }
  function shuffle(list, random) {
    const copy = [...list];
    for (let i = copy.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [copy[i], copy[j]] = [copy[j], copy[i]]; }
    return copy;
  }
  function create(state, options, questions, cards, now = new Date(), random = Math.random) {
    const minutes = [10, 20, 30].includes(options.minutes) ? options.minutes : 10;
    const area = options.area === "auto" ? [...areas].sort((a, b) => (state.profile?.["d_" + b] || 2) - (state.profile?.["d_" + a] || 2) || (state.area?.[a] || 0) - (state.area?.[b] || 0))[0] : areas.includes(options.area) ? options.area : "all";
    const qCount = minutes === 10 ? 3 : minutes === 20 ? 6 : 8;
    const fCount = minutes === 10 ? 2 : minutes === 20 ? 3 : 4;
    const pending = new Set((state.errors || []).filter((x) => !x.reviewed).map((x) => x.qid));
    const pool = questions.filter((q) => area === "all" || q.a === area);
    const qs = [...shuffle(pool.filter((q) => pending.has(q.id)), random), ...shuffle(pool.filter((q) => !pending.has(q.id)), random)].slice(0, qCount);
    const preferred = cards.filter((c) => area === "all" || c.a === area);
    const flash = shuffle(preferred, random).sort((a, b) => String(state.flash?.[a.id]?.due || "1970-01-01").localeCompare(String(state.flash?.[b.id]?.due || "1970-01-01"))).slice(0, fCount);
    const items = qs.map((q) => ({ kind: "question", id: q.id, choice: null }));
    items.push(...flash.map((c) => ({ kind: "flash", id: c.id, grade: null })));
    return { area, minutes, createdAt: now.toISOString(), index: 0, seconds: 0, items };
  }
  function summary(session, questions) {
    const qs = session.items.filter((x) => x.kind === "question" && x.choice !== null);
    const cards = session.items.filter((x) => x.kind === "flash" && x.grade !== null).length;
    return { completed: qs.length + cards, total: session.items.length, questions: qs.length, correct: qs.filter((x) => questions.find((q) => q.id === x.id)?.c === x.choice).length, cards };
  }
  function week(state, now = new Date()) {
    const todayKey = day(now), date = new Date(todayKey + "T12:00:00Z"), offset = (date.getUTCDay() + 6) % 7;
    date.setUTCDate(date.getUTCDate() - offset);
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(date); d.setUTCDate(d.getUTCDate() + i);
      const key = d.toISOString().slice(0, 10);
      return { key, count: integer(state.activity?.[key], 1000000), today: key === todayKey, future: key > todayKey };
    });
    return { days, active: days.filter((d) => !d.future && d.count > 0).length, actions: days.filter((d) => !d.future).reduce((n, d) => n + d.count, 0) };
  }
  const api = { sanitize, history, create, summary, week };
  if (typeof module !== "undefined" && module.exports) module.exports = api; else root.KaloreSession = api;
})(typeof window !== "undefined" ? window : globalThis);
