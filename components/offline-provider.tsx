"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };
type OfflineState = "pending" | "ready" | "unavailable";
type InstallState = { available: boolean; installed: boolean; offline: OfflineState; install: () => Promise<"accepted" | "dismissed" | "unavailable" | "error"> };
const InstallContext = createContext<InstallState>({ available: false, installed: false, offline: "pending", install: async () => "unavailable" });
export const useAtenaInstall = () => useContext(InstallContext);
export function OfflineProvider({ children }: { children: React.ReactNode }) {
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [installed, setInstalled] = useState(false);
  const [offline, setOffline] = useState<OfflineState>("pending");
  useEffect(() => {
    const media = matchMedia("(display-mode: standalone)");
    const detect = () => setInstalled(media.matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
    const before = (event: Event) => { event.preventDefault(); setPrompt(event as InstallPrompt); };
    const done = () => { setInstalled(true); setPrompt(null); };
    detect(); media.addEventListener("change", detect);
    window.addEventListener("beforeinstallprompt", before); window.addEventListener("appinstalled", done);
    return () => { media.removeEventListener("change", detect); window.removeEventListener("beforeinstallprompt", before); window.removeEventListener("appinstalled", done); };
  }, []);
  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("caches" in window)) { setOffline("unavailable"); return; }
    let cancelled = false;
    const cleanups: (() => void)[] = [];
    const check = async () => {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        const names = (await caches.keys()).filter(name => name.startsWith("kalore-enem-"));
        const required = ["estudar.html", "redacao.html", "guia-estrategico.html", "minha-nota.html", "instalar.html"];
        let ready = false;
        for (const name of names) {
          const cache = await caches.open(name);
          if (registration && (await Promise.all(required.map(route => cache.match(new URL(route, registration.scope).href)))).every(Boolean)) { ready = true; break; }
        }
        if (!cancelled) setOffline(ready ? "ready" : "pending");
      } catch { if (!cancelled) setOffline("unavailable"); }
    };
    const timeout = window.setTimeout(() => { if (!cancelled) setOffline(current => current === "ready" ? current : "unavailable"); }, 15000);
    const start = async () => {
      try {
        const registration = await navigator.serviceWorker.register("./sw.js");
        const observe = () => {
          const worker = registration.installing; if (!worker) return;
          const state = () => { if (worker.state === "activated") void check(); };
          worker.addEventListener("statechange", state); cleanups.push(() => worker.removeEventListener("statechange", state));
        };
        registration.addEventListener("updatefound", observe); cleanups.push(() => registration.removeEventListener("updatefound", observe)); observe();
        await navigator.serviceWorker.ready; if (!cancelled) await check();
      } catch { await check(); }
    };
    navigator.serviceWorker.addEventListener("controllerchange", check); window.addEventListener("online", check); void start();
    return () => { cancelled = true; clearTimeout(timeout); cleanups.forEach(cleanup => cleanup()); navigator.serviceWorker.removeEventListener("controllerchange", check); window.removeEventListener("online", check); };
  }, []);
  const install = useCallback(async () => {
    if (!prompt) return "unavailable" as const;
    try { await prompt.prompt(); const choice = await prompt.userChoice; setPrompt(null); return choice.outcome; }
    catch { setPrompt(null); return "error" as const; }
  }, [prompt]);
  const value = useMemo(() => ({ available: Boolean(prompt), installed, offline, install }), [prompt, installed, offline, install]);
  return <InstallContext.Provider value={value}>{children}</InstallContext.Provider>;
}
