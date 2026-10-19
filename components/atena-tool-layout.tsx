"use client";
import { AtenaNavigation } from "./atena-navigation";
import { useAccessibleMenu } from "./use-accessible-menu";
import { useEffect, useState } from "react";
import { ArrowLeft, Download, Menu, Moon, Sun, X } from "lucide-react";
export function AtenaToolLayout({
  children,
  title,
  kicker,
  active,
  description = "Aprenda, experimente e continue. Todo avanço conta.",
}: {
  children: React.ReactNode;
  title: string;
  kicker: string;
  active: "estudos" | "redacao" | "nota" | "instalar";
  description?: string;
}) {
  const [menu, setMenu] = useState(false),
    [theme, setTheme] = useState<"dark" | "light">("dark");
  useEffect(
    () =>
      setTheme(
        document.documentElement.dataset.theme === "light" ? "light" : "dark",
      ),
    [],
  );
  const sidebarRef = useAccessibleMenu(menu, () => setMenu(false));
  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("kalore-color-theme", next);
    } catch {}
  };
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
        aria-label="Navegação principal"
        role={menu ? "dialog" : undefined}
        aria-modal={menu || undefined}
        className={"atena-sidebar " + (menu ? "open" : "")}
      >
        <a className="atena-brand" href="./" aria-label="ATENA, início">
          <img src="./atena/symbol.svg" alt="" width="35" height="42" />
          <span>
            ATENA<small>CONHECIMENTO É PODER</small>
          </span>
        </a>
        <button
          className="atena-mobile-close atena-icon"
          aria-label="Fechar navegação"
          onClick={() => setMenu(false)}
        >
          <X size={20} />
        </button>
        <AtenaNavigation active={active} />
        <a
          className="atena-sidebar-offline"
          href="./instalar.html"
        >
          <Download size={20} />
          <span>
            Instalar ATENA<small>Android, iPhone e computador</small>
          </span>
        </a>
        <div className="atena-sidebar-bottom">
          <span className="atena-avatar">A</span>
          <div>
            <strong>Seu espaço. Seu ritmo.</strong>
            <small>Gratuito e de código aberto.</small>
          </div>
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
            <Menu size={20} />
          </button>
          <a className="atena-back-link" href="./">
            <ArrowLeft size={16} />
            Voltar ao painel
          </a>
          <button
            className="atena-icon"
            style={{ marginLeft: "auto" }}
            aria-label="Alternar tema"
            onClick={toggle}
          >
            {theme === "dark" ? <Sun size={19} /> : <Moon size={19} />}
          </button>
        </header>
        <main id="atena-main" className="atena-main">
          <div className="atena-welcome">
            <div>
              <span className="atena-kicker">{kicker}</span>
              <h1>{title}</h1>
              <p>{description}</p>
            </div>
          </div>
          {children}
          <footer className="atena-footer">
            <span>ATENA · Feito por Kaloré, para todos.</span>
            <a href="./estudar.html#biblioteca">Biblioteca de PDFs</a>
            <a
              href="https://github.com/THIAGO00199/RadarEnem"
              target="_blank"
              rel="noreferrer"
            >
              Código aberto
            </a>
          </footer>
        </main>
      </div>
    </div>
  );
}
