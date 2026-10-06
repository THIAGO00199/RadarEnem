"use client";
import { useAccessibleMenu } from "./use-accessible-menu";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  ArrowUpRight,
  ArrowRight,
  BookOpen,
  CalendarDays,
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
        <span className="atena-nav-caption">SEU UNIVERSO DE ESTUDO</span>
        <nav>
          <button
            onClick={() => go("inicio")}
            aria-current={view === "inicio" ? "page" : undefined}
          >
            <Sparkles size={19} />
            Início
          </button>
          <a href="./estudos.html">
            <BookOpen size={19} />
            Estudos
            <ChevronRight size={14} />
          </a>
          <a href="./redacao.html">
            <PenLine size={19} />
            Redação
          </a>
          <a href="./estudar.html#simulado">
            <ChartNoAxesCombined size={19} />
            Simulados
          </a>
          <a href="./radar.html">
            <Radar size={19} />
            Radar de temas
          </a>
          <button
            onClick={() => go("plano")}
            aria-current={view === "plano" ? "page" : undefined}
          >
            <CalendarDays size={19} />
            Meu plano
          </button>
          <a href="./estudar.html#progresso">
            <Target size={19} />
            Desempenho
          </a>
          <button
            onClick={() => go("comunidade")}
            aria-current={view === "comunidade" ? "page" : undefined}
          >
            <Users size={19} />
            Comunidade
          </button>
        </nav>
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
                    ? "Seu próximo capítulo, " + summary.name + "."
                    : "Seu próximo capítulo começa aqui."
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
              <section className="atena-hero" aria-labelledby="heroTitle">
                <div className="atena-hero-copy">
                  <span className="atena-kicker">
                    <span className="atena-live-dot" /> SABEDORIA ANTIGA.
                    AMBIÇÃO NOVA.
                  </span>
                  <h2 id="heroTitle">
                    Conhecimento
                    <br />é poder.
                    <br />
                    <em>Faça dele o seu.</em>
                  </h2>
                  <p>
                    Da primeira questão à redação que você tem orgulho de
                    escrever. Tudo em um lugar, no seu ritmo.
                  </p>
                  <div className="atena-hero-actions">
                    <a
                      className="atena-button primary"
                      href={
                        summary.pending
                          ? "./estudar.html#erros"
                          : "./estudos.html"
                      }
                    >
                      {summary.pending
                        ? "Revisar meus erros"
                        : "Começar meu estudo"}
                      <ArrowUpRight size={18} />
                    </a>
                    <a className="atena-hero-link" href="./redacao.html">
                      Explorar redação
                      <ArrowRight size={16} />
                    </a>
                  </div>
                  <div className="atena-hero-trust">
                    <span>
                      <ShieldCheck size={14} />
                      Gratuito
                    </span>
                    <span>Sem cadastro</span>
                    <span>Código aberto</span>
                  </div>
                </div>
                <img
                  className="atena-hero-image"
                  src="./atena/atena.webp"
                  alt="Atena em mármore, com detalhes dourados, segurando uma prova do ENEM e o seu painel de estudos."
                  width="1229"
                  height="1536"
                  fetchPriority="high"
                />
                <span className="atena-hero-number" aria-hidden="true">
                  01 / O SEU FUTURO
                </span>
                <div className="atena-hero-tag">
                  <span>✦</span> A sabedoria abre caminhos.
                </div>
              </section>
              <section
                className="atena-metrics"
                aria-label="Seu progresso registrado"
              >
                <article>
                  <span>SEQUÊNCIA ATUAL</span>
                  <strong>
                    {summary.streak}
                    <small>{summary.streak === 1 ? "dia" : "dias"}</small>
                  </strong>
                  <Flame size={21} />
                </article>
                <article>
                  <span>QUESTÕES PRATICADAS</span>
                  <strong>
                    {summary.answers}
                    <small>tentativas</small>
                  </strong>
                  <GraduationCap size={21} />
                </article>
                <article>
                  <span>FOCO REGISTRADO</span>
                  <strong>
                    {summary.focus}
                    <small>minutos</small>
                  </strong>
                  <Focus size={21} />
                </article>
                <article>
                  <span>REDAÇÕES SALVAS</span>
                  <strong>
                    {summary.essays}
                    <small>versões</small>
                  </strong>
                  <PenLine size={21} />
                </article>
              </section>
              <div className="atena-dashboard-grid">
                <section className="atena-panel atena-next">
                  <span className="atena-kicker">SEU PRÓXIMO PASSO</span>
                  <div className="atena-next-heading">
                    <span className="atena-tool-icon gold">
                      <BookOpen size={23} />
                    </span>
                    <span className="atena-duration">
                      {next?.minutes || workspace.profile.minutes} MIN
                    </span>
                  </div>
                  <h2>
                    {summary.pending
                      ? "Volte a um erro. Encontre um caminho."
                      : next?.title || "Semana concluída. Que tal revisar?"}
                  </h2>
                  <p>
                    {summary.pending
                      ? summary.pending +
                        " questões aguardam revisão. Leia a explicação e tente justificar a resposta."
                      : "Uma atividade curta, um avanço concreto. Você escolhe quando começar."}
                  </p>
                  <a
                    className="atena-button primary"
                    href={
                      summary.pending
                        ? "./estudar.html#erros"
                        : next?.tab === "trilhas"
                          ? "./estudos.html"
                          : next?.tab === "redacao"
                            ? "./redacao.html"
                            : "./estudar.html#" + (next?.tab || "flashcards")
                    }
                  >
                    Vamos nessa
                    <ArrowRight size={18} />
                  </a>
                </section>
                <section className="atena-panel atena-week">
                  <div className="atena-section-head">
                    <div>
                      <span className="atena-kicker">
                        CONSTÂNCIA, SEM PRESSÃO
                      </span>
                      <h2>Sua meta semanal</h2>
                    </div>
                    <button
                      className="atena-icon"
                      aria-label="Editar meta semanal"
                      onClick={openProfile}
                    >
                      <Settings2 size={18} />
                    </button>
                  </div>
                  <div className="atena-week-score">
                    <div
                      className="atena-ring"
                      style={{ "--progress": percent + "%" } as CSSProperties}
                    >
                      <div>
                        <strong>
                          {percent}
                          <small>%</small>
                        </strong>
                      </div>
                    </div>
                    <div>
                      <strong>
                        {summary.activeDays} de {goal} dias
                      </strong>
                      <p>
                        {summary.activeDays
                          ? "Cada dia de prática constrói o próximo."
                          : "Seu primeiro dia pode ser hoje."}
                      </p>
                    </div>
                  </div>
                  <div
                    className="atena-week-days"
                    aria-label="Atividade nesta semana"
                  >
                    {summary.days.map((d, i) => (
                      <div
                        key={d.date}
                        className={
                          (d.active ? "active " : "") +
                          (d.date === today ? "today" : "")
                        }
                      >
                        <span>{["S", "T", "Q", "Q", "S", "S", "D"][i]}</span>
                        <span
                          role="img"
                          aria-label={
                            d.date +
                            ": " +
                            (d.active
                              ? "atividade registrada"
                              : "sem atividade registrada")
                          }
                        >
                          {d.active ? <Check size={15} /> : <span />}
                        </span>
                      </div>
                    ))}
                  </div>
                  <button
                    className="atena-text-button"
                    onClick={() => go("plano")}
                  >
                    Ver meu plano
                    <ArrowUpRight size={15} />
                  </button>
                </section>
                <section className="atena-panel atena-writing-card">
                  <span className="atena-kicker">IDEIAS QUE GANHAM VOZ</span>
                  <PenLine size={31} />
                  <h2>
                    Uma tese.
                    <br />
                    Mil possibilidades.
                  </h2>
                  <p>
                    Explore 17 temas, compare argumentos e desenvolva uma
                    intervenção com propósito.
                  </p>
                  <a href="./redacao.html">
                    Entrar no estúdio
                    <ArrowUpRight size={18} />
                  </a>
                </section>
              </div>
              <section className="atena-tools-section">
                <div className="atena-section-head">
                  <div>
                    <span className="atena-kicker">
                      O SEU ARSENAL DE CONHECIMENTO
                    </span>
                    <h2>Menos abas. Mais aprendizado.</h2>
                  </div>
                  <span className="atena-section-note">
                    Escolha por onde começar.
                  </span>
                </div>
                <div className="atena-tools-grid">
                  {tools.map(({ name, detail, url, Icon, tone }, i) => (
                    <a className="atena-tool-card" href={url} key={name}>
                      <div>
                        <span className={"atena-tool-icon " + tone}>
                          <Icon size={24} />
                        </span>
                        <span className="atena-tool-number">0{i + 1}</span>
                      </div>
                      <h3>{name}</h3>
                      <p>{detail}</p>
                      <ArrowUpRight className="atena-tool-arrow" size={19} />
                    </a>
                  ))}
                </div>
              </section>
              <div className="atena-lower-grid">
                {planner}
                <section className="atena-panel atena-offline-card">
                  <span className="atena-kicker">
                    SEM INTERNET? COM POSSIBILIDADES.
                  </span>
                  <div className="atena-offline-art" aria-hidden="true">
                    <Download size={43} />
                    <span>100%</span>
                    <small>OFFLINE</small>
                  </div>
                  <h2>Seu estudo não precisa de sinal.</h2>
                  <p>
                    Um arquivo com o Hub, o estúdio de redação, suas ferramentas
                    e quatro PDFs autorais. Baixe e abra no navegador.
                  </p>
                  <a
                    className="atena-button secondary"
                    href="./estudar-offline.html"
                    download="atena-offline.html"
                  >
                    Levar a ATENA comigo
                    <Download size={17} />
                  </a>
                  <small>
                    Fontes e provas oficiais externas abrem com internet. Os
                    dados ficam no navegador; use o backup para transferir.
                  </small>
                </section>
              </div>
            </>
          )}
          {view === "plano" && (
            <div className="atena-lower-grid">
              {planner}
              <section className="atena-panel atena-plan-info">
                <Target size={30} />
                <h2>Um ritmo que cabe na sua vida.</h2>
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
        <button
          onClick={() => go("plano")}
          aria-current={view === "plano" ? "page" : undefined}
        >
          <CalendarDays size={20} />
          Plano
        </button>
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
