export const SCORE_KEY = "atena-scores-v1";
export const AREAS = [
  { id: "linguagens", name: "Linguagens", short: "LC" },
  { id: "humanas", name: "Ciências Humanas", short: "CH" },
  { id: "natureza", name: "Ciências da Natureza", short: "CN" },
  { id: "matematica", name: "Matemática", short: "MT" },
  { id: "redacao", name: "Redação", short: "RED" },
] as const;
export type ScoreArea = (typeof AREAS)[number]["id"];
export type Values = Record<ScoreArea, string>;
export type ScoreTarget = {
  id: string;
  course: string;
  institution: string;
  campus: string;
  modality: string;
  year: string;
  cutoff: string;
  source: string;
  weights: Values;
  official?: { catalogId: string; minimums: Values; minimumAverage: string; bonusPercent: number; rulesSource: string };
};
export type ScoreState = { version: 1; kind: "simulacao" | "boletim"; scores: Values; targets: ScoreTarget[] };
export const values = (initial = ""): Values => Object.fromEntries(AREAS.map(({ id }) => [id, initial])) as Values;

// Empty strings stay empty: an unfinished form must never look like a zero score.
export function numberValue(raw: string): number | null {
  const clean = raw.trim().replace(",", ".");
  if (!/^\d+(?:\.\d+)?$/.test(clean)) return null;
  const number = Number(clean);
  return Number.isFinite(number) ? number : null;
}
export function scoreValue(raw: string, area: ScoreArea): number | null {
  const number = numberValue(raw);
  // Objective TRI scores are not necessarily capped at 1,000 like the essay.
  return number !== null && number <= (area === "redacao" ? 1000 : 10000) ? number : null;
}
export function weightedAverage(scores: Values, weights = values("1")): number | null {
  let sum = 0, total = 0;
  for (const { id } of AREAS) {
    const score = scoreValue(scores[id], id), weight = numberValue(weights[id]);
    if (score === null || weight === null || weight > 100) return null;
    sum += score * weight;
    total += weight;
  }
  return total > 0 ? sum / total : null;
}
export function safeSource(raw: string): string {
  try {
    const url = new URL(raw);
    return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password ? url.href : "";
  } catch { return ""; }
}
export function newTarget(): ScoreTarget {
  return { id: "", course: "", institution: "", campus: "", modality: "Ampla concorrência", year: "", cutoff: "", source: "", weights: values("1") };
}
export function targetError(target: ScoreTarget): string {
  if (!target.course.trim() || !target.institution.trim() || !target.modality.trim()) return "Preencha curso, instituição e modalidade de concorrência.";
  if (weightedAverage(values("0"), target.weights) === null) return "Informe os cinco pesos entre 0 e 100. Pelo menos um precisa ser maior que zero.";
  if (target.year && !/^20\d{2}$/.test(target.year)) return "Informe um ano com quatro dígitos, como 2026.";
  if (target.cutoff.trim()) {
    const cutoff = numberValue(target.cutoff);
    if (cutoff === null || cutoff > 10000) return "Informe uma nota de referência válida.";
    if (!target.year) return "Informe o ano da nota de referência para comparar o mesmo processo seletivo.";
  }
  if (target.source.trim() && !safeSource(target.source.trim())) return "Use um endereço de fonte que comece com https:// ou http://.";
  return "";
}
export function minimumStatus(scores: Values, official: ScoreTarget["official"]): { complete: boolean; unmet: string[] } {
  const average = weightedAverage(scores);
  if (!official || average === null) return { complete: false, unmet: [] };
  const unmet: string[] = AREAS.filter(({ id }) => scoreValue(scores[id], id)! < Number(official.minimums[id])).map(({ name }) => name);
  // The MEC report defines this threshold as the SIMPLE mean, even for weighted courses.
  if (average < Number(official.minimumAverage)) unmet.push("média simples mínima");
  return { complete: true, unmet };
}
export function sanitizeScores(raw: unknown): ScoreState {
  const empty: ScoreState = { version: 1, kind: "simulacao", scores: values(), targets: [] };
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return empty;
  const data = raw as Record<string, unknown>;
  if (data.version !== 1) return empty;
  const record = (value: unknown): Record<string, unknown> => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
  const text = (value: unknown, limit = 120) => typeof value === "string" ? value.slice(0, limit) : "";
  const scores = record(data.scores);
  for (const { id } of AREAS) {
    const value = text(scores[id], 12);
    empty.scores[id] = scoreValue(value, id) === null ? "" : value;
  }
  empty.kind = data.kind === "boletim" ? "boletim" : "simulacao";
  const used = new Set<string>();
  for (const rawTarget of (Array.isArray(data.targets) ? data.targets.slice(0, 12) : [])) {
    const input = record(rawTarget), weights = record(input.weights);
    const target = newTarget();
    for (const key of ["id", "course", "institution", "campus", "modality", "year", "cutoff"] as const) target[key] = text(input[key], key === "modality" ? 1500 : 300);
    target.source = safeSource(text(input.source, 2000));
    for (const { id } of AREAS) target.weights[id] = text(weights[id], 12);
    const official = record(input.official), minimums = record(official.minimums);
    const minimumValues = values();
    for (const { id } of AREAS) minimumValues[id] = text(minimums[id], 12);
    const minimumAverage = text(official.minimumAverage, 12), bonusPercent = official.bonusPercent;
    if (/^[a-f0-9]{16}$/.test(text(official.catalogId)) && AREAS.every(({ id }) => scoreValue(minimumValues[id], id) !== null) && numberValue(minimumAverage) !== null && Number(minimumAverage) <= 10000 && typeof bonusPercent === "number" && Number.isFinite(bonusPercent) && bonusPercent >= 0 && bonusPercent <= 100 && safeSource(text(official.rulesSource, 2000))) {
      target.official = { catalogId: text(official.catalogId), minimums: minimumValues, minimumAverage, bonusPercent, rulesSource: safeSource(text(official.rulesSource, 2000)) };
    }
    if (/^[a-zA-Z0-9_-]{1,80}$/.test(target.id) && !used.has(target.id) && !targetError(target)) {
      empty.targets.push(target);
      used.add(target.id);
    }
  }
  return empty;
}
