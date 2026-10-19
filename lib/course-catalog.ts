import { AREAS, newTarget, type ScoreTarget, type Values } from "./scores";

export type CourseReference = [modality: number, cutoff: number | null, vacancies: number, bonusPercent: number];
export type CourseOffer = {
  id: string; institution: number; courseCode: number; course: string;
  campus: string; city: string; state: string; degree: string; shift: string;
  weights: number[]; minimums: number[]; minimumAverage: number; references: CourseReference[];
};
export type CourseCatalog = {
  version: 1; year: number; stage: "chamada-regular"; checkedAt: string;
  sources: { cutoffs: { url: string; sha256: string }; rules: { url: string; sha256: string } };
  counts: { institutions: number; offers: number; records: number; positiveReferences: number; missingReferences: number };
  states: Record<string, number>;
  institutions: { id: number; name: string; acronym: string }[];
  modalities: { code: string; description: string }[]; offers: CourseOffer[];
};
export const normalizeCourse = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");
export function parseCatalog(raw: unknown): CourseCatalog {
  const data = raw as CourseCatalog;
  if (!data || data.version !== 1 || data.stage !== "chamada-regular" || data.year !== 2026 || !Array.isArray(data.offers) || data.offers.length !== data.counts?.offers || !Array.isArray(data.institutions) || !Array.isArray(data.modalities) || !data.sources?.cutoffs?.url.startsWith("https://sisu.mec.gov.br/") || !data.sources?.rules?.url.startsWith("https://sisu.mec.gov.br/")) throw new Error("Catálogo incompatível");
  return data;
}
const vector = (array: number[]): Values => Object.fromEntries(AREAS.map(({ id }, index) => [id, String(array[index])])) as Values;
export function targetFromOffer(catalog: CourseCatalog, offer: CourseOffer, reference: CourseReference): ScoreTarget {
  const institution = catalog.institutions.find(item => item.id === offer.institution);
  const modality = catalog.modalities[reference[0]];
  if (!institution || !modality) throw new Error("Oferta incompleta");
  return {
    ...newTarget(), course: offer.course,
    institution: `${institution.acronym} · ${institution.name}`,
    campus: `${offer.campus} · ${offer.city}/${offer.state} · ${offer.shift}`,
    modality: `${modality.code} · ${modality.description}`,
    year: String(catalog.year), cutoff: reference[1] === null ? "" : String(reference[1]),
    source: catalog.sources.cutoffs.url, weights: vector(offer.weights),
    official: { catalogId: offer.id, minimums: vector(offer.minimums), minimumAverage: String(offer.minimumAverage), bonusPercent: reference[3], rulesSource: catalog.sources.rules.url },
  };
}
