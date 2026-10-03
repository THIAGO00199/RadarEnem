/* Small, cancellable native effects. Content never waits for an animation. */
(function (root) {
  "use strict";
  const media = matchMedia("(prefers-reduced-motion: reduce)");
  const reduced = () => media.matches || !!document.querySelector(".motion-off");
  const ease = "cubic-bezier(.22,1,.36,1)";
  function animate(el, frames, options, id) {
    if (!el || reduced() || !el.animate) return;
    for (const a of el.getAnimations()) if (a.id === id) a.cancel();
    const a = el.animate(frames, { ...options, easing: ease }); a.id = id; return a;
  }
  function enter(element) {
    if (!element || reduced()) return;
    animate(element, [{ transform: "translateY(8px)" }, { transform: "translateY(0)" }], { duration: 320 }, "kalore-enter");
    const items = [...element.querySelectorAll(":scope > .panel,:scope > .glow-card,:scope > .grid2 > .panel,:scope > .today-bento > .panel")].slice(0, 6);
    items.forEach((el, i) => animate(el, [{ transform: "translateY(7px)" }, { transform: "translateY(0)" }], { duration: 360, delay: i * 35 }, "kalore-stagger"));
  }
  function particles(target, count = 8) {
    if (!target || reduced() || !target.animate) return;
    for (let i = 0; i < count; i++) {
      const p = document.createElement("i"); p.className = "feedback-particle"; p.setAttribute("aria-hidden", "true");
      p.style.background = ["var(--glow-action)", "var(--kalore-violet)", "var(--kalore-link)"][i % 3];
      target.append(p); const angle = i / count * Math.PI * 2;
      const a = animate(p, [{ transform: "translate(0,0) rotate(0deg)", opacity: 1 }, { transform: `translate(${Math.cos(angle) * 65}px,${Math.sin(angle) * 40}px) rotate(${i % 2 ? -140 : 140}deg)`, opacity: 0 }], { duration: 650 + i * 20 }, "kalore-particle");
      if (a) { a.onfinish = () => p.remove(); a.oncancel = () => p.remove(); }
      setTimeout(() => p.remove(), 1300);
    }
  }
  function answer(target, correct) {
    animate(target, [{ transform: "translateY(5px)" }, { transform: "translateY(-2px)" }, { transform: "translateY(0)" }], { duration: 360 }, "kalore-answer");
    if (correct) particles(target);
  }
  function celebrate(target) {
    if (!target || reduced()) return;
    target.classList.add("glow-celebration"); particles(target, 12);
    animate(target, [{ transform: "scale(.98)" }, { transform: "scale(1.035)" }, { transform: "scale(1)" }], { duration: 450 }, "kalore-celebrate");
  }
  function feedback(target, correct, detail) {
    if (!target) return; target.querySelector(".feedback-chip")?.remove();
    const box = document.createElement("div"); box.className = "feedback-chip"; box.dataset.kind = correct ? "success" : "retry"; box.setAttribute("role", "status");
    const symbol = document.createElement("span"); symbol.className = "feedback-symbol"; symbol.setAttribute("aria-hidden", "true"); symbol.textContent = correct ? "✓" : "↻";
    const copy = document.createElement("div"); copy.className = "feedback-copy";
    const title = document.createElement("strong"); title.textContent = correct ? "Mandou bem!" : "Vamos entender juntos.";
    const sub = document.createElement("small"); sub.textContent = detail || (correct ? "Mais uma ideia que agora é sua." : "O erro indica o próximo ponto para revisar.");
    copy.append(title, sub); box.append(symbol, copy); target.append(box); answer(box, correct);
  }
  function init(scope = document) {
    const progress = document.createElement("div"); progress.className = "glow-scroll-progress"; progress.setAttribute("aria-hidden", "true"); document.body.append(progress);
    const seen = new WeakSet(), pending = new Set(); let scanFrame = 0, scrollFrame = 0;
    const io = typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver((entries) => {
      entries.filter((e) => e.isIntersecting).forEach((entry, i) => {
        animate(entry.target, [{ transform: "translateY(12px)" }, { transform: "translateY(0)" }], { duration: 430, delay: Math.min(i, 4) * 40 }, "kalore-reveal");
        pending.delete(entry.target); io.unobserve(entry.target);
      });
    }, { threshold: .08 });
    function scan() {
      scanFrame = 0; if (!io || reduced()) return;
      for (const el of scope.querySelectorAll(".panel,.glow-card,.pdf-resource,.metric")) {
        if (seen.has(el)) continue; const r = el.getBoundingClientRect(); if (!r.height) continue;
        seen.add(el); if (r.top < innerHeight) continue; pending.add(el); io.observe(el);
      }
      for (const el of pending) if (!el.isConnected) { io.unobserve(el); pending.delete(el); }
    }
    const observer = new MutationObserver((records) => {
      const relevant = records.some((r) => r.type === "attributes" ? r.target.matches(".tab") : [...r.addedNodes].some((n) => n.nodeType === 1 && !n.matches(".feedback-particle,.glow-ripple")));
      if (relevant && !scanFrame) scanFrame = requestAnimationFrame(scan);
    });
    observer.observe(scope, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] }); scan();
    function update() { scrollFrame = 0; const max = document.documentElement.scrollHeight - innerHeight; progress.style.setProperty("--scroll-progress", max > 0 ? String(Math.min(1, Math.max(0, scrollY / max))) : "0"); }
    function scroll() { if (!scrollFrame) scrollFrame = requestAnimationFrame(update); }
    function ripple(e) {
      if (reduced()) return; const target = e.target.closest(".btn,.button,.icon-btn,.icon-button,.session-option,.session-duration");
      if (!target || target.disabled || !target.animate) return;
      const r = target.getBoundingClientRect(), p = document.createElement("span"); p.className = "glow-ripple"; p.setAttribute("aria-hidden", "true");
      p.style.left = (e.type === "pointerdown" ? e.clientX - r.left : r.width / 2) + "px";
      p.style.top = (e.type === "pointerdown" ? e.clientY - r.top : r.height / 2) + "px";
      target.append(p); const a = animate(p, [{ transform: "translate(-50%,-50%) scale(0)", opacity: .2 }, { transform: "translate(-50%,-50%) scale(5)", opacity: 0 }], { duration: 420 }, "kalore-ripple");
      if (a) { a.onfinish = () => p.remove(); a.oncancel = () => p.remove(); } setTimeout(() => p.remove(), 700);
    }
    function key(e) { if ((e.key === "Enter" || e.key === " ") && e.target.matches("button,a.button,a.btn")) ripple(e); }
    function stop() {
      if (!reduced() && !document.hidden) return;
      for (const a of document.getAnimations()) if (a.id?.startsWith("kalore-")) a.cancel();
    }
    const preference = new MutationObserver(stop); preference.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    addEventListener("scroll", scroll, { passive: true }); document.addEventListener("pointerdown", ripple, { passive: true }); document.addEventListener("keydown", key);
    media.addEventListener("change", stop); document.addEventListener("visibilitychange", stop); update();
    return () => { observer.disconnect(); preference.disconnect(); io?.disconnect(); removeEventListener("scroll", scroll); document.removeEventListener("pointerdown", ripple); document.removeEventListener("keydown", key); media.removeEventListener("change", stop); document.removeEventListener("visibilitychange", stop); cancelAnimationFrame(scanFrame); cancelAnimationFrame(scrollFrame); progress.remove(); };
  }
  root.KaloreMotion = { enter, answer, feedback, celebrate, init, reduced };
})(window);
