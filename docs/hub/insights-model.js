/* Local answer history. Accuracy is observed practice, never an ENEM score. */
(function (root) {
  "use strict";
  const areas = ["ling", "hum", "nat", "mat"];
  const sources = ["block", "guided", "sim", "explore"];
  const id = (x) => typeof x === "string" && /^[a-zA-Z0-9_-]{1,100}$/.test(x);
  const calendar = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" });
  const day = (date = new Date()) => calendar.format(date);
  const normalize = (text) => String(text || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  function history(input) {
    const seen = new Set();
    return (Array.isArray(input) ? input : []).filter((x) => x && id(x.id) && id(x.qid) && areas.includes(x.area) && sources.includes(x.source) && Number.isInteger(x.choice) && x.choice >= -1 && x.choice < 5 && typeof x.date === "string" && Number.isFinite(Date.parse(x.date)) && !seen.has(x.id) && seen.add(x.id))
      .sort((a, b) => Date.parse(b.date) - Date.parse(a.date)).slice(0, 1000)
      .map((x) => ({ id: x.id, qid: x.qid, area: x.area, choice: x.choice, source: x.source, date: x.date, confidence: ["sure", "unsure", "guess"].includes(x.confidence) ? x.confidence : null }));
  }
  function notes(input) {
    return Object.fromEntries(Object.entries(input && typeof input === "object" && !Array.isArray(input) ? input : {}).filter(([k, v]) => id(k) && typeof v === "string").slice(0, 200).map(([k, v]) => [k, v.slice(0, 1200)]));
  }
  function validAttempts(state, questions, now = new Date(), period = 0) {
    const today = day(now), cutoff = new Date(today + "T12:00:00Z");
    cutoff.setUTCDate(cutoff.getUTCDate() - Math.max(0, period - 1));
    const start = period ? cutoff.toISOString().slice(0, 10) : "0000-01-01";
    const byId = new Map(questions.map((q) => [q.id, q]));
    return history(state.attempts).filter((a) => {
      const q = byId.get(a.qid), date = day(new Date(a.date));
      return q && q.a === a.area && a.choice < q.o.length && Date.parse(a.date) <= now.getTime() && date >= start && date <= today;
    });
  }
  function summarize(list, questions) {
    const byId = new Map(questions.map((q) => [q.id, q]));
    const correct = list.filter((x) => x.choice === byId.get(x.qid)?.c).length;
    return { total: list.length, correct, unique: new Set(list.map((x) => x.qid)).size, percent: list.length ? Math.round(correct * 100 / list.length) : null, blank: list.filter((x) => x.choice === -1).length };
  }
  function overview(state, questions, now = new Date(), period = 30) {
    const list = validAttempts(state, questions, now, period), total = summarize(list, questions), all = validAttempts(state, questions, now);
    const areaRows = areas.map((area) => ({ area, ...summarize(list.filter((x) => x.area === area), questions), pool: questions.filter((q) => q.a === area).length }));
    const today = day(now), cursor = new Date(today + "T12:00:00Z"); cursor.setUTCDate(cursor.getUTCDate() - 6);
    const days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(cursor); date.setUTCDate(date.getUTCDate() + i); const key = date.toISOString().slice(0, 10);
      return { key, ...summarize(all.filter((x) => day(new Date(x.date)) === key), questions) };
    });
    return { ...total, list, areaRows, days, tracked: all.length, legacy: Math.max(0, (state.answers || 0) - all.length) };
  }
  function questionState(state, q, now = new Date()) {
    return states(state, [q], now)[q.id];
  }
  function states(state, questions, now = new Date()) {
    const out = {}, pending = new Set((state.errors || []).filter((e) => !e.reviewed).map((e) => e.qid));
    for (const q of questions) out[q.id] = { count: 0, last: null, pending: pending.has(q.id), correct: 0, status: pending.has(q.id) ? "review" : "new" };
    const byId = new Map(questions.map((q) => [q.id, q]));
    for (const a of validAttempts(state, questions, now)) {
      const row = out[a.qid], q = byId.get(a.qid);
      row.count++; if (a.choice === q.c) row.correct++;
      if (!row.last) { row.last = a; if (!row.pending) row.status = a.choice === q.c ? "right" : "review"; }
    }
    return out;
  }
  function topics(state, questions, metadata, now = new Date(), period = 30) {
    const list = validAttempts(state, questions, now, period), rows = new Map();
    for (const q of questions) {
      const meta = metadata[q.id]; if (!meta) continue;
      const key = q.a + "/" + meta.topic;
      if (!rows.has(key)) rows.set(key, { key, area: q.a, topic: meta.topic, questions: [] });
      rows.get(key).questions.push(q);
    }
    return [...rows.values()].map((row) => {
      const ids = new Set(row.questions.map((q) => q.id)), attempts = list.filter((a) => ids.has(a.qid));
      return { ...row, ...summarize(attempts, questions), pending: row.questions.filter((q) => (state.errors || []).some((e) => e.qid === q.id && !e.reviewed)).length };
    }).sort((a, b) => b.pending - a.pending || (a.percent ?? 101) - (b.percent ?? 101) || b.total - a.total || a.topic.localeCompare(b.topic, "pt-BR"));
  }
  function choose(state, questions, metadata, now = new Date()) {
    const rows = topics(state, questions, metadata, now, 30);
    const snapshot = states(state, questions, now);
    const row = rows.find((r) => r.pending) || rows.find((r) => r.total >= 3 && r.percent < 70);
    if (row) {
      const ordered = row.questions.map((q) => ({ q, ...snapshot[q.id] })).sort((a, b) => Number(b.pending) - Number(a.pending) || a.count - b.count);
      return { qid: ordered[0].q.id, area: row.area, topic: row.topic, reason: row.pending ? row.pending + " questão(ões) deste assunto aguardam revisão." : row.correct + " de " + row.total + " acertos registrados nos últimos 30 dias. Uma nova tentativa ajuda a conferir o raciocínio." };
    }
    const area = [...areas].sort((a, b) => (state.profile?.["d_" + b] || 2) - (state.profile?.["d_" + a] || 2))[0];
    const q = questions.filter((q) => q.a === area).sort((a, b) => snapshot[a.id].count - snapshot[b.id].count)[0];
    return q ? { qid: q.id, area, topic: metadata[q.id]?.topic || "Fundamentos", reason: "Comece por um item pouco praticado na área que você priorizou. A recomendação acompanha suas respostas." } : null;
  }
  const api = { history, notes, day, normalize, validAttempts, overview, questionState, states, topics, choose };
  if (typeof module !== "undefined" && module.exports) module.exports = api; else root.KaloreInsights = api;
})(typeof window !== "undefined" ? window : globalThis);
