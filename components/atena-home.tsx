"use client";

import { AtenaNavigation } from "./atena-navigation";
import { backup } from "@/lib/backup";
import { useAccessibleMenu } from "./use-accessible-menu";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ArrowUpRight,
  ArrowRight,
  BookOpen,
  ChartNoAxesCombined,
  Check,
  ChevronRight,
  Download,
  FileText,
  Flame,
  Focus,
  Terminal,
  GraduationCap,
  Layers,
  Menu,
  Moon,
  PenLine,
  Radar,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Sun,
  Target,
  Users,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  atenaModel,
  readHub,
  readWorkspace,
  WORKSPACE_KEY,
  type Area,
  type Workspace,
} from "@/lib/atena";
type View = "inicio" | "plano" | "comunidade";
const tools = [
  {
    name: "Trilhas de estudo",
    detail: "Aprenda um conceito. Coloque em prática.",
    url: "./estudos.html",
    Icon: BookOpen,
    tone: "gold",
  },
  {
    name: "Estúdio de redação",
    detail: "Da primeira ideia à sua melhor versão.",
    url: "./redacao.html",
    Icon: PenLine,
    tone: "cream",
  },
  {
    name: "Simulados",
    detail: "Treine o raciocínio e a gestão do tempo.",
    url: "./estudar.html#simulado",
    Icon: ChartNoAxesCombined,
    tone: "blue",
  },
  {
    name: "Radar de temas",
    detail: "Atualidades, fontes e caminhos para escrever.",
    url: "./radar.html",
    Icon: Radar,
    tone: "gold",
  },
  {
    name: "Biblioteca de PDFs",
    detail: "Cadernos autorais e materiais oficiais.",
    url: "./estudar.html#biblioteca",
    Icon: FileText,
    tone: "cream",
  },
  {
    name: "Revisão ativa",
    detail: "Cartões, intervalos e o seu caderno de erros.",
    url: "./estudar.html#flashcards",
    Icon: Layers,
    tone: "blue",
  },
];
const extraTools = [
  { name: "Minha nota", detail: "Calcule sua média e compare objetivos com pesos por curso.", url: "./minha-nota.html", Icon: GraduationCap },
  {
    name: "Argumentos e repertórios",
    detail: "Teses, causas e referências para 18 temas.",
    url: "./guia-estrategico.html",
    Icon: Layers,
  },
  {
    name: "Questões por assunto",
    detail: "84 questões autorais com explicação",
    url: "./estudar.html#questoes",
    Icon: GraduationCap,
  },
  {
    name: "Modo foco",
    detail: "Uma tarefa por vez, com cronômetro",
    url: "./estudar.html#foco",
    Icon: Focus,
  },
  {
    name: "Provas oficiais",
    detail: "Cadernos do Inep e registro do treino",
    url: "./estudar.html#provas-oficiais",
    Icon: ShieldCheck,
  },
  {
    name: "Meu desempenho",
    detail: "Acertos, histórico e próximos passos",
    url: "./estudar.html#progresso",
    Icon: ChartNoAxesCombined,
  },
];
function Brand() {
  return (
    <a className="atena-brand" href="./" aria-label="ATENA, início">
      <img src="./atena/symbol.svg" alt="" width="35" height="42" />
      <span>
        ATENA<small>CONHECIMENTO É PODER</small>
      </span>
    </a>
  );
}
function download(name: string, data: unknown) {
  const address = URL.createObjectURL(
      new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
    ),
    a = document.createElement("a");
  a.href = address;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(address), 1000);
}
export default function Home({ generatedAt }: { generatedAt: string }) {
  const [workspace, setWorkspace] = useState<Workspace>(() =>
      atenaModel.sanitize(null),
    ),
    [hub, setHub] = useState<unknown>(null),
    [view, setView] = useState<View>("inicio"),
    [loaded, setLoaded] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [menu, setMenu] = useState(false),
    [searchOpen, setSearchOpen] = useState(false),
    [query, setQuery] = useState(""),
    [profileOpen, setProfileOpen] = useState(false),
    [message, setMessage] = useState("");
  const [profile, setProfile] = useState(workspace.profile),
    [now, setNow] = useState(() => new Date(generatedAt));
  const importRef = useRef<HTMLInputElement>(null);
  const fullImportRef = useRef<HTMLInputElement>(null);
  const sidebarRef = useAccessibleMenu(menu, () => setMenu(false));
  const model = atenaModel,
    week = model.monday(now),
    today = model.day(now),
    plan = useMemo(() => model.plan(workspace, now), [workspace, now, model]);
  const summary = useMemo(
      () => model.overview(hub, workspace, now),
      [hub, workspace, now, model],
    ),
    goal = workspace.profile.weeklyGoal,
    percent = Math.min(100, Math.round((summary.activeDays * 100) / goal));
  const normalized = (s: string) =>
    s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  const filtered = [...tools, ...extraTools].filter((t) =>
    normalized(t.name + " " + t.detail).includes(normalized(query)),
  );
  const next =
    plan.find((t) => !t.done && t.date <= today) || plan.find((t) => !t.done);
  useEffect(() => {
    setWorkspace(readWorkspace());
    setHub(readHub());
    setNow(new Date());
    setView(
      location.hash === "#plano"
        ? "plano"
        : location.hash === "#comunidade"
          ? "comunidade"
          : "inicio",
    );
    setTheme(
      document.documentElement.dataset.theme === "light" ? "light" : "dark",
    );
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(WORKSPACE_KEY, JSON.stringify(workspace));
    } catch {
      setMessage(
        "O navegador não permitiu salvar. Exporte seu planejamento para guardar uma cópia.",
      );
    }
  }, [workspace, loaded]);
  useEffect(() => {
    if (!loaded) return;
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("kalore-color-theme", theme);
    } catch {}
  }, [theme, loaded]);
  useEffect(() => {
    const refresh = () => {
      setWorkspace(readWorkspace());
      setHub(readHub());
      setNow(new Date());
    };
    const storage = (e: StorageEvent) => {
      if (e.key === WORKSPACE_KEY || e.key === "kalore-hub-v3") refresh();
      if (
        e.key === "kalore-color-theme" &&
        (e.newValue === "dark" || e.newValue === "light")
      )
        setTheme(e.newValue);
    };
    const hash = () => {
      setView(
        location.hash === "#plano"
          ? "plano"
          : location.hash === "#comunidade"
            ? "comunidade"
            : "inicio",
      );
      setMenu(false);
    };
    const keyboard = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
      if (e.key === "Escape") setMenu(false);
    };
    window.addEventListener("storage", storage);
    window.addEventListener("focus", refresh);
    window.addEventListener("hashchange", hash);
    window.addEventListener("keydown", keyboard);
    return () => {
      window.removeEventListener("storage", storage);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("hashchange", hash);
      window.removeEventListener("keydown", keyboard);
    };
  }, []);
  function go(v: View) {
    setView(v);
    setMenu(false);
    history.pushState(null, "", v === "inicio" ? "#inicio" : "#" + v);
    window.scrollTo({
      top: 0,
      behavior: matchMedia("(prefers-reduced-motion:reduce)").matches
        ? "instant"
        : "smooth",
    });
  }
  function complete(id: string) {
    setWorkspace((previous) => ({
      ...previous,
      weeks: {
        ...previous.weeks,
        [week]: plan.map((t) =>
          t.id === id
            ? { ...t, done: !t.done, completedAt: t.done ? null : today }
            : t,
        ),
      },
    }));
  }
  function openProfile() {
    setProfile(workspace.profile);
    setProfileOpen(true);
  }
  function saveProfile() {
    setWorkspace((p) => ({
      ...p,
      profile: model.sanitize({ profile }).profile,
    }));
    setProfileOpen(false);
    setMessage("Preferências salvas. Seu próximo plano seguirá esse ritmo.");
  }
  async function share() {
    const url = new URL("./", location.href).href;
    try {
      if (navigator.share)
        await navigator.share({
          title: "ATENA · Estude no seu ritmo",
          text: "Questões, redação, simulados e PDFs gratuitos para o ENEM.",
          url,
        });
      else {
        await navigator.clipboard.writeText(url);
        setMessage("Link copiado. Convide alguém para estudar com você.");
      }
    } catch (e) {
      if (!(e instanceof DOMException && e.name === "AbortError"))
        setMessage("Copie o endereço do navegador para compartilhar.");
    }
  }
  async function importWorkspace(file: File) {
    try {
      if (file.size > 1e6) throw Error();
      const value = JSON.parse(await file.text());
      if (
        value.app !== "ATENA" ||
        value.version !== 1 ||
        !value.workspace ||
        typeof value.workspace !== "object"
      )
        throw Error();
      setWorkspace(model.sanitize(value.workspace));
      setMessage(
        "Planejamento e cartões importados. Seu progresso de questões foi preservado.",
      );
    } catch {
      setMessage(
        "Escolha um backup de planejamento ATENA válido, de até 1 MB.",
      );
    } finally {
      if (importRef.current) importRef.current.value = "";
    }
  }
  async function importFullBackup(file: File) {
    try {
      if (file.size > 12_000_000) throw Error("Backup acima de 12 MB.");
      const value: unknown = JSON.parse(await file.text());
      if (!window.confirm("Substituir o estudo deste navegador pelo backup? Você poderá desfazer a importação.")) return;
      backup.restore(value);
      location.reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível importar o backup.");
    } finally {
      if (fullImportRef.current) fullImportRef.current.value = "";
    }
  }
  const planner = (
    <section className="atena-panel atena-planner" aria-labelledby="planTitle">
      <div className="atena-section-head">
        <div>
          <span className="atena-kicker">UM PASSO DE CADA VEZ</span>
          <h2 id="planTitle">Sua semana, com direção.</h2>
        </div>
        <button
          className="atena-icon"
          aria-label="Ajustar meu ritmo de estudo"
          onClick={openProfile}
        >
          <Settings2 size={19} />
        </button>
      </div>
      <div className="atena-plan-list">
        {plan.map((task) => (
          <article
            className={"atena-plan-task " + (task.done ? "completed" : "")}
            key={task.id}
          >
            <button
              className="atena-task-check"
              aria-label={
                (task.done ? "Desmarcar" : "Concluir") +
                " tarefa: " +
                task.title
              }
              aria-pressed={task.done}
              onClick={() => complete(task.id)}
            >
              {task.done ? <Check size={17} /> : <span />}
            </button>
            <div>
              <span>
                {new Date(task.date + "T12:00:00Z").toLocaleDateString(
                  "pt-BR",
                  {
                    weekday: "short",
                    day: "2-digit",
                    month: "2-digit",
                    timeZone: "UTC",
                  },
                )}{" "}
                · {model.names[task.area]}
              </span>
              <h3>{task.title}</h3>
              <small>
                {task.minutes} min · {task.done ? "concluído" : "no seu ritmo"}
              </small>
            </div>
            <a
              href={
                task.tab === "trilhas"
                  ? "./estudos.html"
                  : task.tab === "redacao"
                    ? "./redacao.html"
                    : "./estudar.html#" + task.tab
              }
              aria-label={"Abrir treino de " + model.names[task.area]}
            >
              <ArrowUpRight size={19} />
            </a>
          </article>
        ))}
      </div>
      <div className="atena-plan-bottom">
        <span>
          {summary.completed}/{plan.length} blocos concluídos
        </span>
        <button
          className="atena-text-button"
          onClick={() =>
            download("atena-planejamento.json", {
              app: "ATENA",
              version: 1,
              exportedAt: new Date().toISOString(),
              workspace,
            })
          }
        >
          <Download size={15} />
          Exportar planejamento
        </button>
      </div>
    </section>
  );
  return (
    <div className="atena-shell">
      <input type="file" ref={fullImportRef} accept="application/json,.json" hidden aria-label="Arquivo de backup completo" onChange={event => { const file = event.target.files?.[0]; if (file) void importFullBackup(file); }} />
      <a className="atena-skip" href="#atena-main">
        Pular para o conteúdo
      </a>
      {menu && (
        <button
          className="atena-menu-backdrop"
          aria-label="Fechar navegação"
          onClick={() => setMenu(false)}
        />
      )}
      <aside
        ref={sidebarRef}
        role={menu ? "dialog" : undefined}
        aria-modal={menu || undefined}
        className={"atena-sidebar " + (menu ? "open" : "")}
        aria-label="Navegação principal"
      >
        <Brand />
        <button
          className="atena-mobile-close atena-icon"
          aria-label="Fechar navegação"
          onClick={() => setMenu(false)}
        >
          <X size={20} />
        </button>
        <AtenaNavigation active={view} onView={go} />
        <a
          className="atena-sidebar-offline"
          href="./estudar-offline.html"
          download="atena-offline.html"
        >
          <Download size={20} />
          <span>
            Seu estudo vai com você.<small>Baixar aplicativo offline</small>
          </span>
          <ArrowUpRight size={16} />
        </a>
        <div className="atena-sidebar-bottom">
          <span className="atena-avatar">
            {(summary.name || "A").slice(0, 1).toUpperCase()}
          </span>
          <div>
            <strong>{summary.name || "Seu espaço, seu ritmo"}</strong>
            <small>Gratuito. Aberto. Seu.</small>
          </div>
          <button
            className="atena-icon"
            aria-label="Editar minhas preferências"
            onClick={openProfile}
          >
            <Settings2 size={17} />
          </button>
        </div>
      </aside>
      <div className="atena-stage" inert={menu || undefined}>
        <header className="atena-topbar">
          <button
            className="atena-mobile-menu atena-icon"
            aria-label="Abrir navegação"
            aria-expanded={menu}
            onClick={() => setMenu((v) => !v)}
          >
            <Menu size={22} />
          </button>
          <span className="atena-breadcrumb">
            Seu espaço <ChevronRight size={13} />
            <strong>
              {view === "inicio"
                ? "Visão geral"
                : view === "plano"
                  ? "Meu plano"
                  : "Comunidade"}
            </strong>
          </span>
          <button
            className="atena-search-trigger"
            onClick={() => {
              setQuery("");
              setSearchOpen(true);
            }}
          >
            <Search size={17} />
            <span>O que você quer aprender?</span>
            <kbd>⌘ K</kbd>
          </button>
          <div className="atena-top-actions">
            <span className="atena-streak">
              <Flame size={17} />
              {summary.streak}
              <span>{summary.streak === 1 ? "dia" : "dias"}</span>
            </span>
            <button
              className="atena-icon"
              aria-label="Alternar tema"
              onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
            >
              {theme === "dark" ? <Sun size={19} /> : <Moon size={19} />}
            </button>
          </div>
        </header>
        <main id="atena-main" className="atena-main">
          <div className="atena-welcome">
            <div>
              <span className="atena-kicker">ATENA / ENEM 2026</span>
              <h1>
                {view === "inicio"
                  ? summary.name
                    ? "Vamos estudar, " + summary.name + "?"
                    : "Seu estudo começa aqui."
                  : view === "plano"
                    ? "Constância tem um plano."
                    : "Conhecimento cresce quando circula."}
              </h1>
              <p>
                {view === "inicio"
                  ? "Um pouco de foco hoje. Mais possibilidades amanhã."
                  : view === "plano"
                    ? "Uma semana possível é melhor que um cronograma impossível."
                    : "Convide, compartilhe e ajude a construir uma educação mais aberta."}
              </p>
            </div>
            <button
              className="atena-button secondary"
              aria-label="Meu ritmo"
              onClick={openProfile}
            >
              <Settings2 size={16} />
              <span>Meu ritmo</span>
            </button>
          </div>
          {view === "inicio" && (
            <>
              <div className="atena-home-grid">
                <section className="atena-focus-card" aria-labelledby="nextStudyTitle">
                  <img className="atena-focus-art" src="./atena/atena.webp" alt="" width="1229" height="1536" fetchPriority="high" />
                  <div className="atena-focus-copy">
                    <span className="atena-kicker">SEU PRÓXIMO PASSO · {next?.minutes || workspace.profile.minutes} MIN</span>
                    <h2 id="nextStudyTitle">{summary.pending ? "Um erro pode virar aprendizado." : next?.title || "Semana concluída. Vamos revisar?"}</h2>
                    <p>{summary.pending ? `${summary.pending} questões para retomar. Confira a explicação e tente outra vez.` : "Uma atividade de cada vez. Seu plano já está pronto para começar."}</p>
                    <a className="atena-button primary" href={summary.pending ? "./estudar.html#erros" : next?.tab === "trilhas" ? "./estudos.html" : next?.tab === "redacao" ? "./redacao.html" : "./estudar.html#" + (next?.tab || "flashcards")}>
                      {summary.pending ? "Revisar meus erros" : "Começar atividade"}<ArrowRight size={18} />
                    </a>
                    <button className="atena-text-button" onClick={() => go("plano")}>Ver meu plano<ArrowUpRight size={15} /></button>
                  </div>
                </section>
                <section className="atena-panel atena-week-compact" aria-labelledby="weekTitle">
                  <div className="atena-section-head">
                    <h2 id="weekTitle">Sua semana</h2>
                    <button className="atena-icon" aria-label="Editar meta semanal" onClick={openProfile}><Settings2 size={18} /></button>
                  </div>
                  <p className="atena-week-total"><strong>{summary.activeDays}</strong> de {goal} dias de estudo</p>
                  <progress className="atena-week-progress" max="100" value={percent} aria-label="Meta semanal" />
                  <div className="atena-week-days" aria-label="Atividade nesta semana">
                    {summary.days.map((d, i) => (
                      <div key={d.date} className={(d.active ? "active " : "") + (d.date === today ? "today" : "")}>
                        <span>{["S", "T", "Q", "Q", "S", "S", "D"][i]}</span>
                        <span role="img" aria-label={d.date + ": " + (d.active ? "atividade registrada" : "sem atividade registrada")}>
                          {d.active ? <Check size={15} /> : <span />}
                        </span>
                      </div>
                    ))}
                  </div>
                  <a className="atena-text-button" href="./estudar.html#progresso">Ver desempenho<ArrowUpRight size={15} /></a>
                </section>
              </div>
              <section className="atena-score-invitation" aria-labelledby="scoreInvitationTitle">
                <span className="atena-tool-icon gold"><GraduationCap size={26} /></span>
                <div>
                  <span className="atena-kicker">OLHE PARA O SEU OBJETIVO</span>
                  <h2 id="scoreInvitationTitle">Onde usar minha nota?</h2>
                  <p>Calcule sua média e compare os cursos que você tem em mente.</p>
                </div>
                <a className="atena-button secondary" href="./minha-nota.html">Explorar minha nota<ArrowUpRight size={17} /></a>
              </section>
              <div className="atena-home-help">
                <span>Quer estudar outra coisa?</span>
                <button className="atena-text-button" onClick={() => { setQuery(""); setSearchOpen(true); }}>Encontrar uma ferramenta<Search size={15} /></button>
              </div>
            </>
          )}
          {view === "plano" && (
            <div className="atena-lower-grid">
              {planner}
              <section className="atena-panel atena-plan-info">
                <Target size={30} />
                <h2>Um ritmo que cabe na sua vida.</h2>
                <p>Guarde redações, respostas, cartões, planejamento, anotações e preferências em um único arquivo.</p>
                <button className="atena-button secondary" onClick={() => { try { download("atena-backup-completo.json", backup.create()); } catch { setMessage("O navegador não permitiu ler os dados. Mantenha suas páginas abertas."); } }}>Baixar backup completo</button>
                <button className="atena-button secondary" onClick={() => fullImportRef.current?.click()}>Importar backup completo</button>
                <button className="atena-text-button" onClick={() => { try { backup.undo(); location.reload(); } catch (error) { setMessage(error instanceof Error ? error.message : "Não foi possível desfazer."); } }}>Desfazer última importação</button>
                <p>O arquivo contém seus textos e dados pessoais. Guarde-o em um local de sua confiança. O backup permite transferir o estudo entre aparelhos e endereços.</p>
                <p>
                  Seu plano atual tem {goal} blocos de{" "}
                  {workspace.profile.minutes} minutos por semana. A primeira
                  atividade prioriza {model.names[workspace.profile.priority]}.
                </p>
                <p>
                  As marcações ficam neste aparelho. Uma nova semana recebe um
                  novo plano; seu histórico recente é preservado.
                </p>
                <button className="atena-button primary" onClick={openProfile}>
                  Ajustar meu ritmo
                  <Settings2 size={17} />
                </button>
                <button
                  className="atena-button secondary"
                  onClick={() => {
                    setWorkspace((p) => ({
                      ...p,
                      weeks: {
                        ...p.weeks,
                        [week]: model.plan({ ...p, weeks: {} }, now),
                      },
                    }));
                    setMessage(
                      "Plano desta semana recriado com suas preferências atuais.",
                    );
                  }}
                >
                  Recriar esta semana
                </button>
                <button
                  className="atena-text-button"
                  onClick={() => importRef.current?.click()}
                >
                  Importar planejamento
                </button>
              </section>
            </div>
          )}
          {view === "comunidade" && (
            <>
              <div className="atena-community-grid">
                <section className="atena-panel">
                  <Users size={32} />
                  <span className="atena-kicker">
                    DE ESTUDANTE PARA ESTUDANTE
                  </span>
                  <h2>Você não precisa estudar sozinho.</h2>
                  <p>
                    Convide uma pessoa, escolham o mesmo tema e comparem suas
                    teses. Depois, tentem explicar uma questão um para o outro.
                  </p>
                  <button className="atena-button primary" onClick={share}>
                    Convidar para a ATENA
                    <ArrowUpRight size={17} />
                  </button>
                </section>
                <section className="atena-panel">
                  <Terminal size={32} />
                  <span className="atena-kicker">CONSTRUÇÃO ABERTA</span>
                  <h2>O próximo avanço pode vir de você.</h2>
                  <p>
                    Encontrou um erro, faltou um conteúdo ou tem uma ideia?
                    Registre no repositório. Inclua a ferramenta, o aparelho e o
                    que você esperava encontrar.
                  </p>
                  <a
                    className="atena-button secondary"
                    href="https://github.com/THIAGO00199/RadarEnem/issues/new"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Enviar uma ideia
                    <ArrowUpRight size={17} />
                  </a>
                </section>
              </div>
              <section className="atena-panel atena-community-mission">
                <span className="atena-kicker">
                  MISSÃO EM DUPLA / 10 MINUTOS
                </span>
                <h2>Conhecimento bom é conhecimento explicado.</h2>
                <ol>
                  <li>Escolham uma questão e respondam individualmente.</li>
                  <li>Expliquem o raciocínio e confiram a resolução.</li>
                  <li>Escrevam uma tese de uma frase para um tema do Radar.</li>
                  <li>
                    Troquem uma sugestão concreta para melhorar o argumento.
                  </li>
                </ol>
                <a
                  className="atena-button primary"
                  href="./estudar.html#questoes"
                >
                  Começar a missão
                  <ArrowRight size={17} />
                </a>
              </section>
            </>
          )}
          <footer className="atena-footer">
            <div>
              <img src="./atena/symbol.svg" alt="" width="23" height="28" />
              <span>
                ATENA <small>Feito por Kaloré, para todos.</small>
              </span>
            </div>
            <span>Educação aberta. Progresso no seu ritmo.</span>
            <a
              href="https://github.com/THIAGO00199/RadarEnem"
              target="_blank"
              rel="noreferrer"
            >
              Código aberto
              <ArrowUpRight size={14} />
            </a>
          </footer>
        </main>
      </div>
      <nav
        inert={menu || undefined}
        className="atena-mobile-dock"
        aria-label="Acesso rápido"
      >
        <button
          onClick={() => go("inicio")}
          aria-current={view === "inicio" ? "page" : undefined}
        >
          <Sparkles size={20} />
          Início
        </button>
        <a href="./estudos.html">
          <BookOpen size={20} />
          Estudos
        </a>
        <a href="./redacao.html">
          <PenLine size={20} />
          Redação
        </a>
        <a href="./guia-estrategico.html">
          <Layers size={20} />
          Argumentos
        </a>
        <button onClick={() => setMenu(true)}>
          <Menu size={20} />
          Mais
        </button>
      </nav>
      <input
        type="file"
        hidden
        ref={importRef}
        accept="application/json,.json"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void importWorkspace(file);
        }}
      />
      {message && (
        <div className="atena-toast" role="status">
          <span>{message}</span>
          <button aria-label="Fechar mensagem" onClick={() => setMessage("")}>
            <X size={16} />
          </button>
        </div>
      )}
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="atena-dialog">
          <DialogHeader>
            <DialogTitle>Seu próximo aprendizado.</DialogTitle>
            <DialogDescription>
              Busque uma ferramenta e vá direto ao que precisa.
            </DialogDescription>
          </DialogHeader>
          <label className="atena-search-input">
            <Search size={20} />
            <input
              autoFocus
              aria-label="Buscar ferramenta"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Redação, questões, PDF…"
            />
          </label>
          <div className="atena-search-results">
            {filtered.map(({ name, detail, url, Icon }) => (
              <a href={url} key={name}>
                <Icon size={20} />
                <span>
                  <strong>{name}</strong>
                  <small>{detail}</small>
                </span>
                <ArrowUpRight size={16} />
              </a>
            ))}
            {!filtered.length && (
              <p>
                Nenhuma ferramenta com esse nome. Tente “redação” ou “questões”.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="atena-dialog">
          <DialogHeader>
            <DialogTitle>Seu ritmo. Suas possibilidades.</DialogTitle>
            <DialogDescription>
              Personalize o plano. As preferências ficam neste navegador.
            </DialogDescription>
          </DialogHeader>
          <form
            className="atena-profile-form"
            onSubmit={(e) => {
              e.preventDefault();
              saveProfile();
            }}
          >
            <label>
              Como podemos te chamar?
              <input
                maxLength={40}
                value={profile.name}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="Seu primeiro nome (opcional)"
              />
            </label>
            <div>
              <label>
                Tempo por bloco
                <select
                  value={profile.minutes}
                  onChange={(e) =>
                    setProfile((p) => ({
                      ...p,
                      minutes: Number(e.target.value),
                    }))
                  }
                >
                  {[15, 25, 45, 60].map((n) => (
                    <option key={n} value={n}>
                      {n} minutos
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Meta semanal
                <select
                  value={profile.weeklyGoal}
                  onChange={(e) =>
                    setProfile((p) => ({
                      ...p,
                      weeklyGoal: Number(e.target.value),
                    }))
                  }
                >
                  {[3, 5, 7].map((n) => (
                    <option key={n} value={n}>
                      {n} dias
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label>
              Uma área para dar mais atenção
              <select
                value={profile.priority}
                onChange={(e) =>
                  setProfile((p) => ({
                    ...p,
                    priority: e.target.value as Area,
                  }))
                }
              >
                {Object.entries(model.names).map(([key, name]) => (
                  <option key={key} value={key}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
            <button className="atena-button primary" type="submit">
              Salvar meu ritmo
              <Check size={18} />
            </button>
            <p>
              O plano atual é preservado. Em “Meu plano”, você pode recriar a
              semana com as novas preferências.
            </p>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
