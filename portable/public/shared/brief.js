/* A writing outline can move between products without replacing an essay. */
(function (root) {
  "use strict";
  const fields = ["tese", "argumento1", "argumento2", "agente", "acao", "meio", "finalidade"];
  function sanitize(input) {
    const obj = input && typeof input === "object" && !Array.isArray(input) ? input : {};
    return Object.fromEntries(fields.map((key) => [key, typeof obj[key] === "string" ? obj[key].slice(0, 2000) : ""]));
  }
  function map(input, ids) {
    return Object.fromEntries(Object.entries(input && typeof input === "object" && !Array.isArray(input) ? input : {}).filter(([id]) => ids.includes(id)).map(([id, v]) => [id, sanitize(v)]));
  }
  function handoff(input, now = new Date()) {
    if (!input || input.version !== 1 || typeof input.topicId !== "string" || !/^[a-zA-Z0-9_-]{1,100}$/.test(input.topicId) || typeof input.theme !== "string" || !input.theme.trim() || input.theme.length > 500 || typeof input.createdAt !== "string" || !Number.isFinite(Date.parse(input.createdAt)) || Date.parse(input.createdAt) > now.getTime() + 60000 || now.getTime() - Date.parse(input.createdAt) > 86400000) return null;
    const blueprint = sanitize(input.blueprint);
    if (!fields.some((k) => blueprint[k].trim())) return null;
    return { version: 1, topicId: input.topicId, theme: input.theme, createdAt: input.createdAt, blueprint };
  }
  const api = { fields, sanitize, map, handoff };
  if (typeof module !== "undefined" && module.exports) module.exports = api; else root.KaloreBrief = api;
})(typeof window !== "undefined" ? window : globalThis);
