/* Editorial study paths. No prediction, generated essay or automatic grade. */
(function (root) {
  "use strict";
  const fields = ["tese", "argumento1", "argumento2", "agente", "acao", "meio", "finalidade"];
  const normalize = (text) => String(text ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  const all = () => root.KaloreEssayIdeasData.topics;
  function search(query = "", axis = "all") {
    const terms = normalize(query).split(/\s+/).filter(Boolean);
    return all().filter((t) => (axis === "all" || t.axis === axis) && terms.every((term) => normalize([t.title, t.axis, ...t.proposals, ...t.keywords].join(" ")).includes(term)));
  }
  const get = (id) => all().find((t) => t.id === id) || null;
  const findTheme = (theme) => all().find((t) => t.proposals.some((p) => normalize(p) === normalize(theme))) || null;
  function blueprint(topicId, routeId) {
    const route = get(topicId)?.routes.find((r) => r.id === routeId);
    if (!route) return null;
    const argument = (a) => [a.claim, a.reason, "Exemplo hipotético para desenvolver: " + a.example, "Pergunta de ligação: " + a.question].join("\n\n");
    return { tese: route.thesis, argumento1: argument(route.arguments[0]), argumento2: argument(route.arguments[1]), ...route.intervention };
  }
  function fillEmpty(current, suggestion) {
    const result = {};
    let added = 0;
    for (const field of fields) {
      const old = typeof current?.[field] === "string" ? current[field] : "";
      const next = typeof suggestion?.[field] === "string" ? suggestion[field] : "";
      // Never truncate the student's text or silently replace it.
      result[field] = old.trim() || next.length > 2000 ? old : next;
      if (!old.trim() && next && next.length <= 2000) added++;
    }
    return { value: result, added };
  }
  function markdown(topicId, proposalIndex = 0) {
    const t = get(topicId);
    if (!t) return "";
    const heading = ["# Laboratório de ideias · Kaloré", t.proposals[proposalIndex] || t.proposals[0], "Proposta autoral de treino. Não é previsão do ENEM. Exemplos hipotéticos não são evidências reais. Adapte ao recorte e confira fontes antes de citar."];
    for (const r of t.routes) {
      heading.push("## " + r.label, "### Tese possível", r.thesis);
      r.arguments.forEach((a, i) => heading.push("### Argumento " + (i + 1), a.claim, a.reason, "Exemplo hipotético: " + a.example, "Pergunta de ligação: " + a.question));
      heading.push("### Intervenção possível", ...Object.entries(r.intervention).map(([key, val]) => key + ": " + val), "Cuidado: " + r.care);
    }
    heading.push("## Conceitos para estudar", ...t.concepts.map((c) => c.title + ": " + c.text), "## Perguntas para sair do óbvio", ...t.questions.map((q) => "- " + q), "## Fontes para conferir online", ...t.sources.map((s) => "- " + s.title + ": " + s.url));
    return heading.join("\n\n");
  }
  root.KaloreEssayIdeas = { all, search, get, findTheme, blueprint, fillEmpty, markdown, fields };
})(globalThis);
