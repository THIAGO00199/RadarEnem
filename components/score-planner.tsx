"use client";

import { useEffect, useState, type SetStateAction } from "react";
import { ArrowUpRight, GraduationCap, Pencil, Plus, Trash2 } from "lucide-react";
import { AtenaToolLayout } from "./atena-tool-layout";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { AREAS, SCORE_KEY, newTarget, numberValue, sanitizeScores, scoreValue, targetError, weightedAverage, type ScoreState, type ScoreTarget } from "@/lib/scores";

const format = (value: number) => value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function ScorePlanner() {
  const [state, setState] = useState<ScoreState>(() => sanitizeScores(null));
  const [loaded, setLoaded] = useState(false);
  const [dirty, setDirty] = useState(false);
  const update = (value: SetStateAction<ScoreState>) => { setState(value); setDirty(true); };
  const [storageError, setStorageError] = useState("");
  const [draft, setDraft] = useState<ScoreTarget | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [removed, setRemoved] = useState<ScoreTarget | null>(null);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SCORE_KEY);
      if (raw) setState(sanitizeScores(JSON.parse(raw)));
    } catch { setStorageError("Não foi possível recuperar as notas salvas. Você pode preencher a simulação novamente."); }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (!loaded || !dirty) return;
    try { localStorage.setItem(SCORE_KEY, JSON.stringify(state)); }
    catch { setStorageError("O navegador não permitiu salvar. Suas alterações duram apenas enquanto esta página estiver aberta."); }
  }, [loaded, state, dirty]);
  const average = weightedAverage(state.scores);
  const complete = AREAS.filter(({ id }) => scoreValue(state.scores[id], id) !== null).length;
  const edit = (target: ScoreTarget) => { setError(""); setDraft({ ...target, weights: { ...target.weights } }); };
  const save = () => {
    if (!draft) return;
    const problem = targetError(draft);
    if (problem) { setError(problem); return; }
    if (!draft.id && state.targets.length >= 12) { setError("Você pode comparar até 12 objetivos. Edite ou remova um para continuar."); return; }
    const target = { ...draft, id: draft.id || crypto.randomUUID() };
    update(current => ({ ...current, targets: current.targets.some(item => item.id === target.id) ? current.targets.map(item => item.id === target.id ? target : item) : [...current.targets, target] }));
    setDraft(null);
    setNotice("Objetivo salvo neste navegador.");
  };

  return (
    <AtenaToolLayout active="nota" kicker="ENEM / SEUS OBJETIVOS" title="Onde usar minha nota?" description="Veja sua média, ajuste os pesos e acompanhe os cursos que você quer alcançar.">
      <div className="atena-scores-layout">
        <section className="atena-panel atena-scores-entry" aria-labelledby="scoresTitle">
          <span className="atena-kicker">01 / SUAS NOTAS</span>
          <h2 id="scoresTitle">Seu ponto de partida</h2>
          <label className="atena-score-label">Origem das notas
            <select value={state.kind} onChange={event => update(current => ({ ...current, kind: event.target.value as ScoreState["kind"] }))}>
              <option value="simulacao">Simulação de notas</option><option value="boletim">Meu boletim do ENEM</option>
            </select>
          </label>
          <p className="atena-score-help">{state.kind === "simulacao" ? "Use notas que você deseja testar. Quantidade de acertos não equivale à nota do ENEM." : "Transcreva as cinco notas do seu boletim. Para comparar outra edição, substitua os valores."}</p>
          <div className="atena-score-inputs">
            {AREAS.map(({ id, name, short }) => {
              const invalid = state.scores[id] !== "" && scoreValue(state.scores[id], id) === null;
              return <label key={id} className="atena-score-label"><span><abbr title={name}>{short}</abbr>{name}</span>
                <input aria-label={name} inputMode="decimal" autoComplete="off" maxLength={12} placeholder="Ex.: 650,5" value={state.scores[id]} aria-invalid={invalid || undefined} aria-describedby={invalid ? `score-error-${id}` : undefined} onChange={event => update(current => ({ ...current, scores: { ...current.scores, [id]: event.target.value } }))} />
                {invalid && <small id={`score-error-${id}`} className="atena-score-error">{id === "redacao" ? "Use uma nota de 0 a 1.000." : "Informe uma nota válida, sem separador de milhar."}</small>}
              </label>;
            })}
          </div>
          <div className="atena-score-average" aria-live="polite" aria-atomic="true">
            <span>Média simples{state.kind === "simulacao" ? " · simulação" : ""}</span>
            <strong>{average === null ? "—" : format(average)}</strong>
            <small>{average === null ? `${complete} de 5 notas preenchidas. Complete todas para calcular.` : "Todos os pesos iguais a 1. A média de cada curso aparece ao lado."}</small>
          </div>
        </section>
        <section className="atena-score-goals" aria-labelledby="goalsTitle">
          <div className="atena-section-head">
            <div><span className="atena-kicker">02 / SEUS CAMINHOS</span><h2 id="goalsTitle">Cursos no seu horizonte</h2></div>
            <button className="atena-button secondary" disabled={!loaded || state.targets.length >= 12} onClick={() => edit(newTarget())}><Plus size={17} />Adicionar curso</button>
          </div>
          {!state.targets.length && <div className="atena-score-empty">
            <GraduationCap size={38} />
            <h3>Qual curso você tem em mente?</h3>
            <p>Adicione a instituição e os pesos do curso. Se tiver uma nota de corte de referência, guarde também o ano e a modalidade.</p>
            <button className="atena-button primary" disabled={!loaded} onClick={() => edit(newTarget())}>Adicionar meu primeiro curso<Plus size={17} /></button>
          </div>}
          <div className="atena-score-targets">
            {state.targets.map(target => {
              const weighted = weightedAverage(state.scores, target.weights), cutoff = numberValue(target.cutoff);
              // Round only the displayed comparison, never the weighted calculation.
              const delta = weighted !== null && cutoff !== null ? Math.round((weighted - cutoff) * 100) / 100 : null;
              return <article className="atena-panel atena-score-target" key={target.id}>
                <div className="atena-section-head"><div><h3>{target.course}</h3><p>{target.institution}{target.campus ? ` · ${target.campus}` : ""}</p></div>
                  <div className="atena-score-actions"><button className="atena-icon" aria-label={`Editar ${target.course}`} onClick={() => edit(target)}><Pencil size={16} /></button><button className="atena-icon" aria-label={`Remover ${target.course}`} onClick={() => { setRemoved(target); update(current => ({ ...current, targets: current.targets.filter(item => item.id !== target.id) })); setNotice("Objetivo removido."); }}><Trash2 size={16} /></button></div>
                </div>
                <p className="atena-score-context">{target.modality}{target.year ? ` · referência ${target.year}` : ""}</p>
                <div className="atena-score-comparison"><div><span>Sua média com pesos</span><strong>{weighted === null ? "—" : format(weighted)}</strong></div><div><span>Referência informada</span><strong>{cutoff === null ? "Não informada" : format(cutoff)}</strong></div></div>
                <p className="atena-score-difference">{delta === null ? (weighted === null ? "Preencha as cinco notas para comparar." : "Adicione uma referência para acompanhar a diferença.") : delta === 0 ? "Sua média coincide com a referência informada." : `${format(Math.abs(delta))} pontos ${delta > 0 ? "acima" : "abaixo"} da referência informada.`}</p>
                <details className="atena-score-details"><summary>Pesos e fonte</summary><p>{AREAS.map(({ id, short }) => `${short}: ${target.weights[id]}`).join(" · ")}</p>{target.source ? <a href={target.source} target="_blank" rel="noopener noreferrer">Abrir fonte informada<ArrowUpRight size={14} /></a> : <p>Referência pessoal, sem fonte vinculada. Confira os dados no edital.</p>}</details>
              </article>;
            })}
          </div>
          <aside className="atena-score-guidance">
            <h3>Confira as regras de cada curso</h3>
            <p>Os cursos são adicionados por você. Consulte pesos, notas mínimas, campus, turno e modalidade no processo seletivo. Uma nota de corte é uma referência: pode mudar e não garante aprovação.</p>
            <a href="https://sisu.mec.gov.br/cursos" target="_blank" rel="noopener noreferrer">Consultar cursos no Sisu<ArrowUpRight size={15} /></a>
          </aside>
        </section>
      </div>
      <div className="atena-score-storage"><span>{storageError || "Notas e objetivos ficam neste navegador e entram no backup completo da ATENA."}</span><a href="./#plano">Abrir backup<ArrowUpRight size={14} /></a></div>
      {(notice || removed) && <div className="atena-score-notice" role="status"><span>{notice}</span>{removed && <button className="atena-text-button" disabled={state.targets.length >= 12} onClick={() => { update(current => ({ ...current, targets: [...current.targets, removed] })); setRemoved(null); setNotice("Objetivo recuperado."); }}>Desfazer remoção</button>}</div>}
      <Dialog open={draft !== null} onOpenChange={open => { if (!open) setDraft(null); }}>
        <DialogContent className="atena-dialog atena-score-dialog">
          <DialogHeader><DialogTitle>{draft?.id ? "Editar objetivo" : "Adicionar um curso"}</DialogTitle><DialogDescription>Use os dados da instituição e da modalidade em que você quer concorrer.</DialogDescription></DialogHeader>
          {draft && <form className="atena-score-form" onSubmit={event => { event.preventDefault(); save(); }}>
            <div className="atena-score-form-grid">
              {([{ key: "course", label: "Curso", placeholder: "Ex.: Engenharia Civil", required: true }, { key: "institution", label: "Instituição", placeholder: "Ex.: universidade desejada", required: true }, { key: "campus", label: "Campus e turno (opcional)", placeholder: "Ex.: Campus Centro · noturno" }, { key: "modality", label: "Modalidade de concorrência", required: true }] as const).map(field => <label className="atena-score-label" key={field.key}>{field.label}<input value={draft[field.key]} maxLength={120} required={"required" in field && field.required} placeholder={"placeholder" in field ? field.placeholder : undefined} onChange={event => setDraft({ ...draft, [field.key]: event.target.value })} /></label>)}
            </div>
            <fieldset className="atena-score-weights"><legend>Pesos do curso</legend><p>Começamos com peso 1. Ajuste conforme o edital.</p><div>{AREAS.map(({ id, short, name }) => <label className="atena-score-label" key={id}><abbr title={name}>{short}</abbr><input aria-label={`Peso de ${name}`} inputMode="decimal" maxLength={12} required value={draft.weights[id]} onChange={event => setDraft({ ...draft, weights: { ...draft.weights, [id]: event.target.value } })} /></label>)}</div></fieldset>
            <details className="atena-score-reference" open={Boolean(draft.cutoff)}><summary>Adicionar nota de corte de referência (opcional)</summary><div className="atena-score-form-grid"><label className="atena-score-label">Nota de referência<input inputMode="decimal" maxLength={12} placeholder="Ex.: 720,5" value={draft.cutoff} onChange={event => setDraft({ ...draft, cutoff: event.target.value })} /></label><label className="atena-score-label">Ano da referência<input inputMode="numeric" maxLength={4} placeholder="Ex.: 2026" value={draft.year} onChange={event => setDraft({ ...draft, year: event.target.value })} /></label></div><label className="atena-score-label">Link da fonte (opcional)<input type="url" placeholder="https://…" maxLength={2000} value={draft.source} onChange={event => setDraft({ ...draft, source: event.target.value })} /></label><p>Compare o mesmo campus, turno e modalidade. A ATENA não verifica automaticamente a referência.</p></details>
            {error && <p className="atena-score-error" role="alert">{error}</p>}
            <div className="atena-score-form-actions"><button type="button" className="atena-button secondary" onClick={() => setDraft(null)}>Cancelar</button><button type="submit" className="atena-button primary">Salvar objetivo</button></div>
          </form>}
        </DialogContent>
      </Dialog>
    </AtenaToolLayout>
  );
}
