"use client";

import { createContext, useContext, useEffect, useState } from "react";

const scripts = [
  "shared/motion.js",
  "shared/brief.js",
  "shared/essay-ideas-data.js",
  "shared/essay-ideas-model.js",
  "shared/essay-ideas-ui.js",
];
const pending = new Map<string, Promise<void>>();
const ScriptsReady = createContext(false);
export const useScriptsReady = () => useContext(ScriptsReady);

export function ClientScripts({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    (window as unknown as { __KALORE_STATIC__: boolean }).__KALORE_STATIC__ =
      true;
    async function prepare() {
      await Promise.all(
        scripts.map((path) => {
          if (!pending.has(path)) {
            pending.set(
              path,
              new Promise<void>((resolve, reject) => {
                const script = document.createElement("script");
                script.src = "./" + path;
                // Download together, execute in dependency order.
                script.async = false;
                script.dataset.atenaScript = path;
                script.onload = () => resolve();
                script.onerror = () => reject(new Error(path));
                document.head.append(script);
              }),
            );
          }
          return pending.get(path);
        }),
      );
      if (active) setReady(true);
    }
    prepare().catch(() => {
      if (active) setFailed(true);
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <ScriptsReady.Provider value={ready}>
      <div
        data-atena-ready={String(ready)}
        aria-busy={!ready}
        inert={!ready || undefined}
      >
        {children}
      </div>
      {!ready && (
        <div className="atena-boot-status" role="status">
          <span>
            {failed
              ? "Um arquivo não carregou. Seu texto está preservado."
              : "Preparando suas ferramentas…"}
          </span>
          {failed && (
            <button
              className="atena-button primary"
              onClick={() => location.reload()}
            >
              Tentar novamente
            </button>
          )}
        </div>
      )}
      <noscript>
        Ative JavaScript para editar, salvar e usar as ferramentas. Os conteúdos
        apresentados continuam disponíveis para leitura.
      </noscript>
    </ScriptsReady.Provider>
  );
}
