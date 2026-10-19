"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { AREAS, minimumStatus, weightedAverage, type ScoreTarget, type Values } from "@/lib/scores";
import { normalizeCourse, parseCatalog, targetFromOffer, type CourseCatalog } from "@/lib/course-catalog";

const format = (value: number) => value.toLocaleString("pt-BR", { maximumFractionDigits: 2, minimumFractionDigits: 2 });
const pageSize = 9;

export function CourseExplorer({ scores, onChoose, onClose }: { scores: Values; onChoose: (target: ScoreTarget) => void; onClose: () => void }) {
  const [catalog, setCatalog] = useState<CourseCatalog | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [query, setQuery] = useState("");
  const [state, setState] = useState("");
  const [institution, setInstitution] = useState("");
  const [modality, setModality] = useState("AC");
  const [page, setPage] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    fetch("./data/sisu-catalog-2026.json", { signal: controller.signal }).then(response => {
      if (!response.ok) throw new Error("Catálogo indisponível");
      return response.json();
    }).then(data => { setCatalog(parseCatalog(data)); setError(false); }).catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => controller.abort();
  }, [attempt]);
  const indexed = useMemo(() => {
    if (!catalog) return [];
    const institutions = new Map(catalog.institutions.map(item => [item.id, item]));
    return catalog.offers.map(offer => ({ offer, institution: institutions.get(offer.institution)!, text: normalizeCourse([offer.course, offer.campus, offer.city, institutions.get(offer.institution)?.name, institutions.get(offer.institution)?.acronym].join(" ")) }));
  }, [catalog]);
  const results = useMemo(() => {
    const terms = normalizeCourse(query).trim().split(/\s+/).filter(Boolean);
    return indexed.flatMap(item => {
      if ((state && item.offer.state !== state) || (institution && String(item.offer.institution) !== institution) || !terms.every(term => item.text.includes(term))) return [];
      const references = item.offer.references.filter(ref => catalog?.modalities[ref[0]].code === modality && (ref[2] > 0 || ref[1] !== null));
      return references.map(reference => ({ ...item, reference }));
    });
  }, [catalog, indexed, query, state, institution, modality]);
  const pages = Math.max(1, Math.ceil(results.length / pageSize));
  const currentPage = Math.min(page, pages - 1);
  const institutions = catalog?.institutions.filter(item => !state || indexed.some(row => row.offer.state === state && row.offer.institution === item.id)).sort((a, b) => a.acronym.localeCompare(b.acronym, "pt-BR")) || [];
  const reset = () => { setQuery(""); setState(""); setInstitution(""); setModality("AC"); setPage(0); };
  return <section className="atena-panel atena-course-explorer" aria-labelledby="catalogTitle">
    <div className="atena-section-head"><div><span className="atena-kicker">CATÁLOGO OFICIAL / SISU 2026</span><h2 id="catalogTitle">Encontre um curso e compare</h2></div><button className="atena-icon" aria-label="Fechar catálogo de cursos" onClick={onClose}><X size={18} /></button></div>
    <p className="atena-score-help">Notas da chamada regular de 2026. Cada referência corresponde a uma instituição, campus, turno e modalidade. As notas são históricas e não garantem aprovação em outra seleção.</p>
    {!catalog && !error && <p role="status">Carregando catálogo nacional…</p>}
    {error && <div role="alert"><p>Não foi possível abrir o catálogo. Conecte-se à internet para o primeiro acesso ou cadastre um objetivo manualmente.</p><button className="atena-button secondary" onClick={() => { setError(false); setAttempt(value => value + 1); }}>Tentar novamente</button></div>}
    {catalog && <>
      <div className="atena-course-filters">
        <label className="atena-score-label atena-course-search"><span><Search size={15} /> Curso, faculdade ou cidade</span><input type="search" value={query} maxLength={120} placeholder="Ex.: Medicina UFPR" onChange={event => { setQuery(event.target.value); setPage(0); }} /></label>
        <label className="atena-score-label">Estado<select aria-label="Estado" value={state} onChange={event => { setState(event.target.value); setInstitution(""); setPage(0); }}><option value="">Todos os estados</option>{Object.keys(catalog.states).sort().map(uf => <option key={uf}>{uf}</option>)}</select></label>
        <label className="atena-score-label">Instituição<select aria-label="Instituição" value={institution} onChange={event => { setInstitution(event.target.value); setPage(0); }}><option value="">Todas as instituições</option>{institutions.map(item => <option key={item.id} value={item.id}>{item.acronym} · {item.name}</option>)}</select></label>
        <label className="atena-score-label">Modalidade<select aria-label="Modalidade" value={modality} onChange={event => { setModality(event.target.value); setPage(0); }}>{Array.from(new Set(catalog.modalities.map(item => item.code))).sort((a, b) => a === "AC" ? -1 : b === "AC" ? 1 : a.localeCompare(b)).map(code => <option key={code} value={code}>{code === "AC" ? "AC · Ampla concorrência" : code}</option>)}</select></label>
      </div>
      <p className="atena-score-help">A descrição completa da modalidade aparece em cada curso. Códigos de ações afirmativas próprias podem ter regras diferentes entre instituições. A escolha do filtro não verifica sua elegibilidade.</p>
      <div className="atena-course-result-head"><p role="status" aria-live="polite">{results.length.toLocaleString("pt-BR")} {results.length === 1 ? "oferta encontrada" : "ofertas encontradas"} · {catalog.counts.institutions} instituições no catálogo</p><button className="atena-text-button" onClick={reset}>Limpar filtros</button></div>
      {!results.length && <div className="atena-course-empty"><h3>Nenhum curso com esses filtros</h3><p>Tente outra palavra, estado ou modalidade. O catálogo contém apenas ofertas presentes na base SiSU 2026.</p></div>}
      <div className="atena-course-grid">
        {results.slice(currentPage * pageSize, (currentPage + 1) * pageSize).map(({ offer, institution: institutionInfo, reference }) => {
          const target = targetFromOffer(catalog, offer, reference);
          const weighted = weightedAverage(scores, target.weights), minima = minimumStatus(scores, target.official);
          const bonus = reference[3] > 0;
          const delta = weighted !== null && reference[1] !== null && !bonus ? weighted - reference[1] : null;
          return <article className="atena-course-card" key={`${offer.id}-${reference[0]}`}>
            <span className="atena-kicker">{institutionInfo.acronym} · {offer.state}</span><h3>{offer.course}</h3><p>{offer.city} · {offer.shift} · {offer.degree}</p>
            <p className="atena-course-campus">{offer.campus}</p>
            <div className="atena-score-comparison"><div><span>Corte 2026 · {catalog.modalities[reference[0]].code}</span><strong>{reference[1] === null ? "Sem referência" : format(reference[1])}</strong></div><div><span>Sua média ponderada{bonus ? " · sem bônus" : ""}</span><strong>{weighted === null ? "—" : format(weighted)}</strong></div></div>
            <p className="atena-course-comparison">{bonus ? `Modalidade com bônus de ${reference[3]}%. Confira o edital; a comparação automática com o corte não está disponível.` : delta === null ? weighted === null ? "Preencha suas cinco notas para comparar." : "A base não publica uma nota de corte válida para esta oferta." : `${format(Math.abs(delta))} pontos ${delta >= 0 ? "acima" : "abaixo"} do corte histórico.`}</p>
            {minima.complete && <p className={`atena-course-minimum ${minima.unmet.length ? "unmet" : ""}`}>{minima.unmet.length ? `Abaixo dos mínimos: ${minima.unmet.join(", ")}.` : "Suas notas atendem aos mínimos numéricos desta oferta."}</p>}
            <details className="atena-score-details"><summary>Modalidade, pesos e mínimos</summary><p>{catalog.modalities[reference[0]].description}</p><p>Pesos: {AREAS.map(({ short }, index) => `${short} ${offer.weights[index]}`).join(" · ")}</p><p>Mínimos: {AREAS.map(({ short }, index) => `${short} ${offer.minimums[index]}`).join(" · ")}. Média simples mínima: {offer.minimumAverage}.</p><p>Vagas informadas nesta modalidade: {reference[2]}. Confira os critérios e documentos no edital da instituição.</p></details>
            <button className="atena-button secondary" onClick={() => onChoose(target)}>Adicionar aos meus objetivos<ArrowUpRight size={15} /></button>
          </article>;
        })}
      </div>
      {results.length > 0 && <nav className="atena-course-pagination" aria-label="Páginas do catálogo"><button className="atena-button secondary" disabled={currentPage === 0} aria-label="Página anterior de cursos" onClick={() => setPage(currentPage - 1)}><ChevronLeft size={16} />Anterior</button><span>Página {currentPage + 1} de {pages}</span><button className="atena-button secondary" disabled={currentPage + 1 >= pages} aria-label="Próxima página de cursos" onClick={() => setPage(currentPage + 1)}>Próxima<ChevronRight size={16} /></button></nav>}
      <details className="atena-course-provenance"><summary>De onde vêm os dados?</summary><p>Ministério da Educação · SiSU 2026 · chamada regular. Consulta à base em {new Date(catalog.checkedAt).toLocaleDateString("pt-BR", { timeZone: "UTC" })}. Nota de corte é a nota do último classificado nas vagas daquela modalidade, conforme a planilha. Valores ausentes ou zero na origem aparecem como “sem referência”.</p><p>As cinco notas são necessárias para calcular a média com os pesos. O mínimo de média da base é uma média simples. Regras de participação, cotas, bônus e documentação precisam ser conferidas no edital.</p><a href={catalog.sources.cutoffs.url} target="_blank" rel="noopener noreferrer">Planilha oficial de notas de corte<ArrowUpRight size={14} /></a><a href={catalog.sources.rules.url} target="_blank" rel="noopener noreferrer">Planilha oficial de pesos, mínimos e vagas<ArrowUpRight size={14} /></a></details>
    </>}
  </section>;
}
