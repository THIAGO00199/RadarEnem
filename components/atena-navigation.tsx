"use client";

import { BookOpen, CalendarDays, ChartNoAxesCombined, ChevronDown, FileText, Focus, GraduationCap, Layers3, PenLine, Radar, Sparkles, Target, Users } from "lucide-react";

type HomeView = "inicio" | "plano" | "comunidade";
type Active = HomeView | "estudos" | "redacao" | "nota" | "instalar";

/** The same destinations and grouping across the dashboard and study tools. */
export function AtenaNavigation({ active, onView }: { active: Active; onView?: (view: HomeView) => void }) {
  const homeItem = (view: HomeView, label: string, Icon: typeof Sparkles) => onView ? (
    <button onClick={() => onView(view)} aria-current={active === view ? "page" : undefined}><Icon size={19} />{label}</button>
  ) : (
    <a href={view === "inicio" ? "./" : `./#${view}`}><Icon size={19} />{label}</a>
  );
  return (
    <nav className="atena-navigation" aria-label="Seções da ATENA">
      <span className="atena-nav-caption">SEU ESTUDO</span>
      {homeItem("inicio", "Início", Sparkles)}
      <a href="./estudos.html" aria-current={active === "estudos" ? "page" : undefined}><BookOpen size={19} />Estudos</a>
      <a href="./redacao.html" aria-current={active === "redacao" ? "page" : undefined}><PenLine size={19} />Redação</a>
      <a href="./estudar.html#simulado"><ChartNoAxesCombined size={19} />Simulados</a>
      <a href="./minha-nota.html" aria-current={active === "nota" ? "page" : undefined}><GraduationCap size={19} />Minha nota</a>
      <details className="atena-nav-group">
        <summary><Layers3 size={19} />Materiais e ferramentas<ChevronDown size={15} /></summary>
        <a href="./guia-estrategico.html"><Layers3 size={17} />Argumentos</a>
        <a href="./radar.html"><Radar size={17} />Radar de temas</a>
        <a href="./estudar.html#biblioteca"><FileText size={17} />Biblioteca de PDFs</a>
        <a href="./estudar.html#flashcards"><BookOpen size={17} />Revisão ativa</a>
        <a href="./estudar.html#questoes"><Target size={17} />Questões por assunto</a>
        <a href="./estudar.html#provas-oficiais"><FileText size={17} />Provas oficiais</a>
        <a href="./estudar.html#foco"><Focus size={17} />Modo foco</a>
      </details>
      <details className="atena-nav-group" open={active === "plano" || active === "comunidade" || undefined}>
        <summary><CalendarDays size={19} />Meu espaço<ChevronDown size={15} /></summary>
        {homeItem("plano", "Meu plano", CalendarDays)}
        <a href="./estudar.html#progresso"><ChartNoAxesCombined size={17} />Desempenho</a>
        {homeItem("comunidade", "Comunidade", Users)}
      </details>
    </nav>
  );
}
