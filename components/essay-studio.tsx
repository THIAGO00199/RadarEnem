"use client";
import { useEffect, useRef, useState } from "react";
import {
  Check,
  Download,
  FileText,
  PenLine,
  Save,
  History,
} from "lucide-react";
import { atenaModel, readWorkspace, WORKSPACE_KEY } from "@/lib/atena";
import { currentHub, markActivity, updateHub } from "@/lib/local-progress";
import { emptyBrief, type EssayBrief } from "@/lib/brief";
import { topics } from "@/lib/radar-data";
import { EssayIdeaExplorer } from "./essay-idea-explorer";
import { AtenaToolLayout } from "./atena-tool-layout";
import { useScriptsReady } from "./client-scripts";
const competencies = [
  {
    title: "Domínio da escrita",
    checks: [
      "Revisei concordância e ortografia.",
      "Conferi a pontuação e a construção das frases.",
      "Mantive um registro adequado à escrita formal.",
    ],
  },
  {
    title: "Tema e repertório",
    checks: [
      "Meu texto responde ao recorte do tema.",
      "Organizei uma dissertação argumentativa.",
      "Expliquei a relação do repertório com o problema.",
    ],
  },
  {
    title: "Projeto de argumentação",
    checks: [
      "Minha tese apresenta uma posição clara.",
      "Expliquei as causas ou efeitos dos argumentos.",
      "Usei exemplos ou referências com conexão lógica.",
    ],
  },
  {
    title: "Coesão e continuidade",
    checks: [
      "Os conectivos expressam as relações certas.",
      "As retomadas têm referentes claros.",
      "Revisei repetições que prejudicam a leitura.",
    ],
  },
  {
    title: "Proposta de intervenção",
    checks: [
      "Indiquei quem age e qual ação será feita.",
      "Expliquei o meio, a finalidade e um detalhe.",
      "A proposta responde ao problema e respeita direitos humanos.",
    ],
  },
];
const outlineLabels = {
  tese: "Tese e posicionamento",
  argumento1: "Primeiro argumento",
  argumento2: "Segundo argumento",
  agente: "Quem vai agir?",
  acao: "O que será feito?",
  meio: "Como?",
  finalidade: "Para quê? E qual detalhe?",
};
function download(name: string, text: string, type = "text/plain") {
  const u = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = u;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(u), 1000);
}
export function EssayStudio() {
  const scriptsReady = useScriptsReady();
  const [text, setText] = useState(""),
    [theme, setTheme] = useState(topics[0].proposal),
    [topicId, setTopicId] = useState(topics[0].id),
    [brief, setBrief] = useState<EssayBrief>(emptyBrief),
    [checks, setChecks] = useState<Record<string, boolean>>({}),
    [status, setStatus] = useState("Preparando seu rascunho."),
    [loaded, setLoaded] = useState(false),
    [review, setReview] = useState(false),
    [showAllVersions, setShowAllVersions] = useState(false),
    [versions, setVersions] = useState<
      NonNullable<ReturnType<typeof currentHub>["essays"]>
    >([]);
  const draftRef = useRef<HTMLTextAreaElement>(null),
    signals = atenaModel.essaySignals(text);
  const latestDraft = useRef({ text, theme, brief });
  latestDraft.current = { text, theme, brief };
  useEffect(() => {
    if (!loaded) return;
    const flush = () => {
      const latest = latestDraft.current;
      try {
        updateHub((h) => ({
          ...h,
          draft: latest.text,
          draftTheme: latest.theme,
          blueprint: latest.brief,
        }));
      } catch {}
    };
    const hide = () => {
      if (document.visibilityState === "hidden") flush();
    };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", hide);
    return () => {
      flush();
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", hide);
    };
  }, [loaded]);
  useEffect(() => {
    if (!scriptsReady) return;
    const hub = currentHub();
    setText(typeof hub.draft === "string" ? hub.draft : "");
    setTheme(
      typeof hub.draftTheme === "string" && hub.draftTheme
        ? hub.draftTheme
        : topics[0].proposal,
    );
    setTopicId(
      topics.find((t) => t.proposal === hub.draftTheme)?.id || topics[0].id,
    );
    setBrief(window.KaloreBrief?.sanitize(hub.blueprint) || emptyBrief());
    setVersions(
      Array.isArray(hub.essays)
        ? hub.essays
            .filter(
              (v) =>
                v &&
                typeof v.id === "string" &&
                typeof v.text === "string" &&
                typeof v.theme === "string",
            )
            .slice(0, 30)
        : [],
    );
    setChecks(readWorkspace().checklist);
    setLoaded(true);
    setStatus("Salvo neste navegador.");
  }, [scriptsReady]);
  useEffect(() => {
    if (!loaded) return;
    setStatus("Salvando…");
    const timer = setTimeout(() => {
      try {
        updateHub((h) => ({
          ...h,
          draft: text,
          draftTheme: theme,
          blueprint: brief,
        }));
        setStatus("Salvo neste navegador.");
      } catch {
        setStatus("O navegador não permitiu salvar. Exporte seu texto.");
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [text, theme, brief, loaded]);
  function mark(key: string) {
    const next = { ...checks, [key]: !checks[key] };
    setChecks(next);
    try {
      const saved = readWorkspace();
      localStorage.setItem(
        WORKSPACE_KEY,
        JSON.stringify({ ...saved, checklist: next }),
      );
    } catch {
      setStatus("Não foi possível salvar o checklist. Exporte a revisão.");
    }
  }
  function saveVersion() {
    if (text.trim().length < 40) {
      setStatus("Escreva um trecho antes de salvar uma versão.");
      return;
    }
    if (
      versions.some(
        (v) =>
          v.text.trim() === text.trim() &&
          v.theme === theme &&
          JSON.stringify(
            window.KaloreBrief?.sanitize(v.blueprint) || emptyBrief(),
          ) === JSON.stringify(brief),
      )
    ) {
      setStatus(
        "Essa versão já está salva. Faça uma revisão para registrar outra.",
      );
      return;
    }
    const record = {
      id: "essay-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
      date: new Date().toISOString(),
      text,
      theme,
      themeIndex: 0,
      diagnostic: 0,
      blueprint: { ...brief },
    };
    try {
      const saved = updateHub((h) =>
        markActivity({
          ...h,
          draft: text,
          draftTheme: theme,
          blueprint: brief,
          xp: (Number(h.xp) || 0) + 60,
          essays: [record, ...(Array.isArray(h.essays) ? h.essays : [])].slice(
            0,
            30,
          ),
        }),
      );
      setVersions(saved.essays || []);
      setStatus("Versão salva. Você pode continuar revisando este rascunho.");
    } catch {
      setStatus(
        "Não consegui salvar a versão. Exporte seu texto para guardar uma cópia.",
      );
    }
  }
  function restoreVersion(version: (typeof versions)[number]) {
    const nextBrief = version.blueprint
      ? window.KaloreBrief?.sanitize(version.blueprint) || emptyBrief()
      : brief;
    try {
      const saved = updateHub((hub) => {
        let history = Array.isArray(hub.essays) ? hub.essays : [];
        const alreadySaved = history.some(
          (v) =>
            v &&
            v.text === text &&
            v.theme === theme &&
            JSON.stringify(
              window.KaloreBrief?.sanitize(v.blueprint) || emptyBrief(),
            ) === JSON.stringify(brief),
        );
        if (
          (text.trim() || Object.values(brief).some((v) => v.trim())) &&
          !alreadySaved
        ) {
          if (history.length >= 30) throw new Error("history-full");
          history = [
            {
              id:
                "essay-" +
                Date.now() +
                "-" +
                Math.random().toString(36).slice(2, 7),
              date: new Date().toISOString(),
              text,
              theme,
              themeIndex: 0,
              diagnostic: 0,
              blueprint: { ...brief },
            },
            ...history,
          ];
        }
        return {
          ...hub,
          draft: version.text,
          draftTheme: version.theme,
          blueprint: nextBrief,
          essays: history,
        };
      });
      latestDraft.current = {
        text: version.text,
        theme: version.theme,
        brief: nextBrief,
      };
      setText(version.text);
      setTheme(version.theme);
      setTopicId(
        topics.find((t) => t.proposal === version.theme)?.id || topics[0].id,
      );
      setBrief(nextBrief);
      setVersions(saved.essays || []);
      setReview(false);
      setStatus(
        "Versão retomada. Seu rascunho anterior foi preservado no histórico.",
      );
      draftRef.current?.focus();
      draftRef.current?.scrollIntoView({ block: "center" });
    } catch (error) {
      setStatus(
        error instanceof Error && error.message === "history-full"
          ? "Histórico cheio. Salve o rascunho como uma nova versão antes de retomar; serão mantidas as 30 mais recentes. Nada foi alterado."
          : "Não foi possível guardar seu rascunho atual. A retomada foi cancelada para proteger seu texto.",
      );
    }
  }
  function chooseTopic(id: string) {
    setTopicId(id);
    const topic = topics.find((t) => t.id === id);
    if (topic) setTheme(topic.proposal);
  }
  return (
    <AtenaToolLayout
      active="redacao"
      title="Ideias que ganham voz."
      kicker="ATENA / ESTÚDIO DE REDAÇÃO"
    >
      <section className="atena-panel atena-studio-intro">
        <PenLine size={25} />
        <div>
          <h2>Seu texto, da tese à intervenção.</h2>
          <p>
            Explore caminhos, escreva com suas palavras e revise pelas cinco
            competências. As checagens locais descrevem a estrutura; a avaliação
            de qualidade exige leitura humana.
          </p>
        </div>
        <a className="atena-button secondary" href="./radar.html">
          Explorar o Radar
        </a>
      </section>
      <section className="atena-panel atena-studio-topics">
        <label>
          Escolha um eixo para explorar
          <select value={topicId} onChange={(e) => chooseTopic(e.target.value)}>
            {topics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
        </label>
        <details className="atena-idea-drawer">
          <summary>
            <span>
              <strong>Explorar teses e argumentos</strong>
              <small>
                17 temas e 34 caminhos para desenvolver suas próprias ideias.
              </small>
            </span>
            <span aria-hidden="true">+</span>
          </summary>
          <EssayIdeaExplorer
            topicId={topicId}
            theme={theme}
            value={brief}
            onChange={setBrief}
          />
        </details>
      </section>
      <div className="atena-studio-grid">
        <section
          className="atena-panel atena-studio-editor"
          aria-labelledby="editorTitle"
        >
          <div className="atena-section-head">
            <div>
              <span className="atena-kicker">
                SUA PRÓXIMA VERSÃO COMEÇA AQUI
              </span>
              <h2 id="editorTitle">O espaço é seu.</h2>
            </div>
            <FileText size={22} />
          </div>
          <label className="atena-editor-theme">
            Tema de prática
            <input
              value={theme}
              maxLength={500}
              onChange={(e) => setTheme(e.target.value)}
            />
          </label>
          <textarea
            ref={draftRef}
            id="atenaEssay"
            disabled={!loaded}
            aria-label="Rascunho da redação"
            spellCheck
            placeholder="Escreva sua introdução, desenvolva seus argumentos e construa uma intervenção. Separe os parágrafos com uma linha em branco."
            maxLength={60000}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="atena-studio-meta">
            <span>{signals.words} palavras</span>
            <span>{signals.paragraphs} parágrafos</span>
            <span role="status">{status}</span>
          </div>
          <div className="atena-inline-actions">
            <button
              className="atena-button primary"
              onClick={() => setReview(true)}
            >
              Revisar estrutura
              <Check size={17} />
            </button>
            <button className="atena-button secondary" onClick={saveVersion}>
              Salvar versão
              <Save size={16} />
            </button>
            <button
              className="atena-button secondary"
              onClick={() =>
                download("atena-redacao.txt", theme + "\n\n" + text)
              }
            >
              Exportar texto
              <Download size={16} />
            </button>
          </div>
          {review && (
            <div className="atena-structural-review" role="status">
              <h3>Uma leitura da estrutura</h3>
              {!signals.hasText ? (
                <p>Escreva um trecho para observar os sinais do seu texto.</p>
              ) : (
                <>
                  <div className="atena-writing-signals">
                    <div>
                      <strong>{signals.words}</strong>
                      <span>palavras</span>
                    </div>
                    <div>
                      <strong>{signals.paragraphs}</strong>
                      <span>parágrafos</span>
                    </div>
                    <div>
                      <strong>{signals.connectors.length}</strong>
                      <span>conectivos identificados</span>
                    </div>
                    <div>
                      <strong>{signals.readingMinutes}</strong>
                      <span>minutos para reler</span>
                    </div>
                  </div>
                  <p>
                    {signals.paragraphs < 4
                      ? "Observe se a introdução, o desenvolvimento e a conclusão estão organizados. A contagem de parágrafos, sozinha, não mede a qualidade."
                      : "Você dividiu o texto em parágrafos. Confira se cada um tem uma função no argumento."}
                  </p>
                  <p>
                    {signals.longSentences
                      ? signals.longSentences +
                        " frases têm mais de 40 palavras. Confira clareza e pontuação; frases longas podem funcionar quando bem construídas."
                      : "Releia as relações entre as frases. O tamanho, sozinho, não garante clareza."}
                  </p>
                  <p>
                    {signals.connectors.length
                      ? "Conectivos encontrados: " +
                        signals.connectors.join(", ") +
                        ". Verifique se expressam a relação que você pretendia."
                      : "A busca por conectivos não encontrou termos da lista local. Confira como você encadeou as ideias; a lista não esgota os recursos de coesão."}
                  </p>
                </>
              )}
            </div>
          )}
        </section>
        <aside className="atena-panel atena-studio-outline">
          <span className="atena-kicker">ANTES E DURANTE A ESCRITA</span>
          <h2>Uma ideia por função.</h2>
          {(
            [
              "tese",
              "argumento1",
              "argumento2",
              "agente",
              "acao",
              "meio",
              "finalidade",
            ] as const
          ).map((key) => (
            <label key={key}>
              {outlineLabels[key]}
              <textarea
                aria-label={outlineLabels[key]}
                rows={key.startsWith("argumento") ? 3 : 2}
                maxLength={2000}
                value={brief[key]}
                onChange={(e) =>
                  setBrief((b) => ({ ...b, [key]: e.target.value }))
                }
              />
            </label>
          ))}
          <button
            className="atena-button secondary"
            onClick={() =>
              download(
                "atena-roteiro.json",
                JSON.stringify({ theme, blueprint: brief }, null, 2),
                "application/json",
              )
            }
          >
            Exportar roteiro
            <Download size={15} />
          </button>
        </aside>
      </div>
      <section className="atena-panel atena-tool-section">
        <span className="atena-kicker">REVISAR É UMA HABILIDADE</span>
        <h2>As cinco competências, na sua mão.</h2>
        <p>
          Marque depois de reler. Este é seu checklist de revisão; as marcações
          representam sua conferência, sem atribuir uma nota automática.
        </p>
        <div className="atena-competencies">
          {competencies.map((c, i) => (
            <article className="atena-competency" key={i}>
              <span>
                C{i + 1} ·{" "}
                {
                  c.checks.filter((_, j) => checks["c" + (i + 1) + "-" + j])
                    .length
                }
                /3
              </span>
              <h3>{c.title}</h3>
              {c.checks.map((label, j) => (
                <label key={j}>
                  <input
                    type="checkbox"
                    checked={!!checks["c" + (i + 1) + "-" + j]}
                    onChange={() => mark("c" + (i + 1) + "-" + j)}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </article>
          ))}
        </div>
        <button
          className="atena-button secondary"
          onClick={() =>
            download(
              "atena-revisao.txt",
              competencies
                .map(
                  (c, i) =>
                    "Competência " +
                    (i + 1) +
                    " — " +
                    c.title +
                    "\n" +
                    c.checks
                      .map(
                        (t, j) =>
                          (checks["c" + (i + 1) + "-" + j] ? "[x] " : "[ ] ") +
                          t,
                      )
                      .join("\n"),
                )
                .join("\n\n"),
            )
          }
        >
          Exportar minha revisão
          <Download size={16} />
        </button>
      </section>
      <section className="atena-panel atena-studio-versions">
        <span className="atena-kicker">SEU PERCURSO DE ESCRITA</span>
        <h2>Cada versão guarda um avanço.</h2>
        <p>
          Guardamos as 30 versões mais recentes neste navegador. Ao retomar,
          preservamos antes seu rascunho atual. Versões antigas sem roteiro
          mantêm o planejamento aberto.
        </p>
        {versions.length ? (
          <div>
            {versions.slice(0, showAllVersions ? 30 : 6).map((v) => (
              <article key={v.id}>
                <div>
                  <strong>{v.theme}</strong>
                  <small>
                    {new Date(v.date).toLocaleDateString("pt-BR")} ·{" "}
                    {(v.text.match(/\S+/g) || []).length} palavras
                  </small>
                </div>
                <div className="atena-version-actions">
                  <button
                    className="atena-button secondary"
                    onClick={() => restoreVersion(v)}
                  >
                    Retomar <History size={14} />
                  </button>
                  <button
                    className="atena-button secondary"
                    onClick={() =>
                      download(
                        "atena-versao-" + v.id + ".txt",
                        v.theme + "\n\n" + v.text,
                      )
                    }
                  >
                    Baixar
                    <Download size={14} />
                  </button>
                </div>
              </article>
            ))}
            {versions.length > 6 && (
              <button
                className="atena-button secondary"
                onClick={() => setShowAllVersions(!showAllVersions)}
              >
                {showAllVersions
                  ? "Mostrar recentes"
                  : `Ver todas as ${versions.length} versões`}
              </button>
            )}
          </div>
        ) : (
          <p>
            Salve sua primeira versão para acompanhar as próximas reescritas.
          </p>
        )}
      </section>
    </AtenaToolLayout>
  );
}
