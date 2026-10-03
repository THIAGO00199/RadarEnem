/* Focused, local study flows built on the Hub's existing content and progress. */
(function (root) {
  "use strict";
  const names = { all: "Todas as áreas", ling: "Linguagens", hum: "Humanas", nat: "Natureza", mat: "Matemática" };
  function init({ getState, save, toast, escapeHTML: esc, questions, cards, recordAnswer, reviewFlash, markDailyStep }) {
    const $ = (q, el = document) => el.querySelector(q), $$ = (q, el = document) => [...el.querySelectorAll(q)];
    const model = root.KaloreSession, state = () => getState();
    const room = $("#studyRoom"), content = $("#sessionContent");
    let duration = 10, area = "auto", started = 0, cardRevealed = false, homeSnapshot = "";
    const active = () => state().journey;
    const complete = () => !!active() && active().index >= active().items.length;
    function accountTime() {
      if (started && active()) active().seconds = Math.min(10800, active().seconds + Math.max(0, Math.floor((Date.now() - started) / 1000)));
      started = room.open && !document.hidden && active() && !complete() ? Date.now() : 0;
    }
    function persist() { accountTime(); save(); }
    document.addEventListener("visibilitychange", () => { if (active() && room.open) persist(); });
    window.addEventListener("pagehide", () => { if (started) persist(); started = 0; });
    window.addEventListener("pageshow", () => { if (room.open && active() && !complete() && !document.hidden) started = Date.now(); });
    // A reload between answers retains work; only visible practice time counts.
    const checkpoint = setInterval(() => { if (started) persist(); }, 15000);
    function repair() {
      const session = model.sanitize(active());
      if (!session) { state().journey = null; return; }
      const valid = session.items.every((x) => x.kind === "question" ? questions.some((q) => q.id === x.id && (x.choice === null || x.choice < q.o.length)) : cards.some((c) => c.id === x.id));
      state().journey = valid ? session : null;
      if (!valid) toast("O conteúdo desta sessão mudou. Seu histórico foi preservado; monte uma nova sessão.");
    }
    repair();
    function renderHome() {
      const s = state();
      const signature = JSON.stringify([s.activity, s.profile.weeklyGoal, s.journey?.id, s.journey?.index, s.journey?.items, s.journeyHistory]);
      if (signature === homeSnapshot) return;
      homeSnapshot = signature;
      const week = model.week(s), goal = s.profile.weeklyGoal || 5;
      const session = active(), unfinished = session && !complete();
      $("#heroNextSession").textContent = unfinished ? "Retomar minha sessão ↗" : "Montar minha sessão ↗";
      $("#openStudyRoom").textContent = unfinished ? "Retomar sessão →" : "Escolher meu treino →";
      $("#sessionHomeStatus").textContent = unfinished ? `${model.summary(session, questions).completed} de ${session.items.length} atividades realizadas · ${names[session.area]}` : "Questões + memória ativa. Uma atividade por vez, no seu ritmo.";
      $("#weekGoal").value = String(goal);
      $("#weekDays").textContent = week.active;
      $("#weekTarget").textContent = goal;
      $("#weeklyRing").style.setProperty("--week-progress", Math.min(100, week.active / goal * 100) + "%");
      $("#weekDescription").textContent = week.active >= goal ? "Meta alcançada. O próximo passo pode ser uma pausa." : `Mais ${goal - week.active} ${goal - week.active === 1 ? "dia com estudo" : "dias com estudo"} para a sua meta. Cada avanço conta.`;
      const max = Math.max(1, ...week.days.map((d) => d.future ? 0 : d.count));
      $("#weeklyChart").innerHTML = week.days.map((d, i) => `<li${d.today ? ' class="is-today"' : ""}><span class="week-bar" style="--bar-height:${d.future ? 0 : Math.round(d.count / max * 100)}%" aria-hidden="true"></span><span>${["seg", "ter", "qua", "qui", "sex", "sáb", "dom"][i]}</span><span class="sr-only">${d.key}: ${d.future ? "dia futuro" : d.count + " atividades"}${d.today ? ", hoje" : ""}</span></li>`).join("");
      $("#weekActions").textContent = week.actions + " ações registradas nesta semana";
      $("#practiceHistory").innerHTML = s.journeyHistory.length ? s.journeyHistory.slice(0, 3).map((x) => `<div class="practice-history-item"><span class="practice-history-icon" aria-hidden="true">✓</span><div><b>${esc(names[x.area])}</b><small>${new Date(x.date).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit" })} · ${x.correct}/${x.questions} acertos · ${x.cards} cartões</small></div><span>${Math.floor(x.seconds / 60)} min</span></div>`).join("") : '<p class="practice-empty">Sua primeira sessão aparece aqui quando você terminar. Vamos dar o primeiro passo?</p>';
    }
    function finish() {
      const session = active();
      if (!state().journeyHistory.some((x) => x.id === session.id)) {
        const result = model.summary(session, questions);
        state().journeyHistory.unshift({ id: session.id, date: new Date().toISOString(), area: session.area, questions: result.questions, correct: result.correct, cards: result.cards, seconds: session.seconds });
        state().journeyHistory = state().journeyHistory.slice(0, 40);
        markDailyStep("questoes"); if (result.cards) markDailyStep("flashcards");
        persist();
      }
    }
    function renderSetup() {
      $("#sessionTitle").textContent = "Um treino que cabe no seu dia.";
      $("#sessionSubtitle").textContent = "Escolha seu tempo. A gente organiza o próximo passo.";
      $("#sessionProgress").hidden = true;
      const preview = model.create(state(), { minutes: duration, area }, questions, cards);
      const qCount = preview.items.filter((x) => x.kind === "question").length, fCount = preview.items.length - qCount;
      content.innerHTML = `<div class="session-setup"><span class="eyebrow">QUANTO TEMPO VOCÊ TEM?</span><div class="session-durations" role="group" aria-label="Duração estimada">${[10, 20, 30].map((m) => `<button class="session-duration" data-duration="${m}" aria-pressed="${duration === m}"><b>${m}</b><span>minutos</span></button>`).join("")}</div><label class="field"><span>Seu foco agora</span><select id="sessionArea"><option value="auto">Adaptar ao meu progresso</option>${Object.entries(names).map(([key, name]) => `<option value="${key}"${key === area ? " selected" : ""}>${name}</option>`).join("")}</select></label><div class="session-preview"><span class="glow-icon-box" aria-hidden="true">✦</span><div><b>${esc(names[preview.area])}</b><p>${qCount} questões autorais + ${fCount} cartões. Erros pendentes da área entram primeiro; cartões são ordenados pela data de revisão.</p></div></div><button class="btn primary session-start" id="beginSession">Começar meu treino <span aria-hidden="true">→</span></button><p class="session-disclaimer">Tempo estimado, sem contagem regressiva. Suas respostas são salvas neste navegador. Os acertos não são uma nota TRI.</p></div>`;
      $$("[data-duration]", content).forEach((b) => b.onclick = () => { duration = Number(b.dataset.duration); renderSetup(); $(`[data-duration="${duration}"]`, content).focus(); });
      $("#sessionArea").value = area;
      $("#sessionArea").onchange = (e) => { area = e.target.value; renderSetup(); $("#sessionArea").focus(); };
      $("#beginSession").onclick = () => {
        state().journey = { id: crypto.randomUUID(), ...model.create(state(), { minutes: duration, area }, questions, cards) };
        cardRevealed = false; persist(); render(); renderHome(); $("#sessionQuestionTitle")?.focus({ preventScroll: true });
      };
    }
    function renderSummary() {
      finish(); const session = active(), result = model.summary(session, questions);
      $("#sessionTitle").textContent = "Você deu mais um passo.";
      $("#sessionSubtitle").textContent = "Uma sessão concluída. Conhecimento para levar com você.";
      content.innerHTML = `<div class="session-summary"><div class="session-trophy" aria-hidden="true">✦</div><h3>Treino concluído!</h3><p>Seu ritmo é feito de avanços como este.</p><div class="session-result-grid"><div><b>${result.correct}/${result.questions}</b><span>acertos no treino</span></div><div><b>${result.cards}</b><span>cartões revisados</span></div><div><b>${Math.floor(session.seconds / 60)} min</b><span>tempo com a sessão aberta</span></div></div><div id="sessionCelebration"></div><p class="session-disclaimer">${result.correct < result.questions ? "Os erros ficam no seu caderno para revisão. " : ""}Sua meta semanal e seu histórico já foram atualizados.</p><div class="hero-actions"><button class="btn primary" id="sessionDone">Voltar ao meu painel</button><button class="btn" id="sessionAnother">Montar outro treino</button></div></div>`;
      $("#sessionDone").onclick = () => room.close();
      $("#sessionAnother").onclick = () => { state().journey = null; persist(); render(); renderHome(); };
      root.KaloreMotion?.celebrate($("#sessionCelebration")); renderHome();
    }
    function render() {
      if (!active()) { renderSetup(); return; }
      const session = active(), result = model.summary(session, questions);
      $("#sessionProgress").hidden = false;
      $("#sessionProgress").value = result.completed;
      $("#sessionProgress").max = result.total;
      $("#sessionTitle").textContent = names[session.area];
      $("#sessionSubtitle").textContent = `Atividade ${Math.min(session.index + 1, result.total)} de ${result.total} · ${session.minutes} min estimados`;
      if (complete()) { renderSummary(); return; }
      const item = session.items[session.index];
      if (item.kind === "question") {
        const q = questions.find((x) => x.id === item.id), answered = item.choice !== null;
        content.innerHTML = `<div class="session-question"><span class="eyebrow">RECUPERE O RACIOCÍNIO · QUESTÃO AUTORAL</span><h3 id="sessionQuestionTitle" tabindex="-1">${esc(q.q)}</h3><div class="session-options" role="group" aria-labelledby="sessionQuestionTitle">${q.o.map((o, j) => `<button class="session-option${answered && j === q.c ? " is-correct" : answered && j === item.choice ? " is-incorrect" : ""}" data-session-choice="${j}"${answered ? " disabled" : ""}><span aria-hidden="true">${String.fromCharCode(65 + j)}</span><span>${esc(o)}</span>${answered && j === q.c ? '<span class="option-mark" aria-label="Resposta correta">✓</span>' : answered && j === item.choice ? '<span class="option-mark" aria-label="Sua resposta, incorreta">×</span>' : ""}</button>`).join("")}</div>${answered ? `<div class="session-explanation" role="status"><b>${item.choice === q.c ? "Boa! Vamos guardar o raciocínio." : "Esse erro tem algo a ensinar."}</b><p>${esc(q.e)}</p></div><button class="btn primary session-next" id="sessionNext">${session.index === result.total - 1 ? "Ver meu resultado" : "Próxima atividade"} →</button>` : '<p class="session-hint">A resposta vem com uma explicação. Pode tentar sem medo.</p>'}</div>`;
        $$("[data-session-choice]", content).forEach((b) => b.onclick = () => {
          if (item.choice !== null) return;
          item.choice = Number(b.dataset.sessionChoice); recordAnswer(q, item.choice);
          persist(); render(); renderHome(); $("#sessionNext").focus({ preventScroll: true });
          root.KaloreMotion?.answer($(".session-explanation"), item.choice === q.c);
        });
      } else {
        const c = cards.find((x) => x.id === item.id), answered = item.grade !== null;
        content.innerHTML = `<div class="session-flash"><span class="eyebrow">MEMÓRIA ATIVA · TENTE LEMBRAR PRIMEIRO</span><div class="session-recall"><span aria-hidden="true">◈</span><h3 id="sessionQuestionTitle" tabindex="-1">${esc(c.front)}</h3>${cardRevealed || answered ? `<div class="session-flash-answer"><p>${esc(c.back)}</p></div>` : '<p>Explique a ideia com suas palavras antes de revelar.</p>'}</div>${answered ? `<p class="session-explanation" role="status">Revisão salva. A próxima data considera como você lembrou.</p><button class="btn primary session-next" id="sessionNext">${session.index === result.total - 1 ? "Ver meu resultado" : "Próxima atividade"} →</button>` : cardRevealed ? '<p class="session-hint">Como foi lembrar?</p><div class="session-grades" role="group" aria-label="Como foi a revisão"><button class="btn" data-session-grade="again">Preciso revisar</button><button class="btn" data-session-grade="good">Lembrei</button><button class="btn primary" data-session-grade="easy">Foi fácil</button></div>' : '<button class="btn primary session-start" id="sessionReveal">Revelar resposta</button>'}</div>`;
        $("#sessionReveal")?.addEventListener("click", () => { cardRevealed = true; render(); $("[data-session-grade]").focus({ preventScroll: true }); root.KaloreMotion?.enter($(".session-flash-answer")); });
        $$("[data-session-grade]", content).forEach((b) => b.onclick = () => {
          if (item.grade !== null) return;
          item.grade = b.dataset.sessionGrade; reviewFlash(c.id, item.grade);
          persist(); render(); renderHome(); $("#sessionNext").focus({ preventScroll: true });
        });
      }
      $("#sessionNext")?.addEventListener("click", () => { accountTime(); session.index++; cardRevealed = false; persist(); render(); $("#sessionQuestionTitle")?.focus({ preventScroll: true }); content.scrollTop = 0; root.KaloreMotion?.enter(content); });
    }
    function open() { repair(); if (complete()) { state().journey = null; save(); } render(); room.showModal(); started = active() && !complete() ? Date.now() : 0; root.KaloreMotion?.enter(room); }
    room.addEventListener("close", () => { persist(); renderHome(); });
    $("#closeStudyRoom").onclick = () => room.close();
    $("#openStudyRoom").onclick = open;
    $("#heroNextSession").onclick = open;
    $("#weekGoal").onchange = (e) => { state().profile.weeklyGoal = Number(e.target.value); save(); renderHome(); };
    room.addEventListener("keydown", (e) => {
      if (e.altKey || e.ctrlKey || e.metaKey || e.target.matches("input,select,textarea")) return;
      const choice = Number(e.key) - 1;
      if (/^[1-5]$/.test(e.key)) { const button = $(`[data-session-choice="${choice}"]`, content); if (button && !button.disabled) { e.preventDefault(); button.click(); } }
    });

    // Move the existing editor rather than creating a second draft or input handler.
    const writing = $("#writingRoom"), editor = $(".essay-layout .editor"), originalParent = editor.parentNode, sibling = editor.nextSibling;
    $("#enterWritingMode").onclick = () => {
      $("#writerMount").append(editor); document.body.classList.add("writing-mode"); writing.showModal();
      $("#essay").focus({ preventScroll: true }); root.KaloreMotion?.enter(writing);
    };
    $("#closeWritingRoom").onclick = () => writing.close();
    writing.addEventListener("close", () => { originalParent.insertBefore(editor, sibling); document.body.classList.remove("writing-mode"); });
    writing.addEventListener("click", (e) => {
      if (e.target.closest("#analyzeEssay")) writing.close();
      if (e.target.closest("#saveEssay")) writingStatus();
    });
    function writingStatus() {
      const text = $("#essay").value.trim();
      $("#writingVersionStatus").textContent = !text ? "Escreva algo antes de salvar uma versão." : $("#draftStatus").dataset.saved === "false" ? "Não foi possível salvar. Exporte seu texto para preservá-lo." : state().essays.some((e) => e.text === text) ? "Esta versão está salva no seu histórico." : "Seu rascunho está salvo. Você pode salvar uma versão no histórico.";
    }
    $$("[data-writing-font]").forEach((b) => b.onclick = () => {
      state().preferences.writingFont = Number(b.dataset.writingFont); save(); renderWritingFont();
    });
    function renderWritingFont() {
      const size = state().preferences.writingFont;
      writing.style.setProperty("--writing-font", size + "px");
      $$("[data-writing-font]").forEach((b) => b.setAttribute("aria-pressed", String(Number(b.dataset.writingFont) === size)));
    }
    $("#writerSave").onclick = () => { $("#saveEssay").click(); writingStatus(); };
    document.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s" && (writing.open || document.body.dataset.view === "redacao")) { e.preventDefault(); $("#saveEssay").click(); }
    });
    $("#motionPreference").checked = state().preferences.motion;
    function motionPreference() { document.documentElement.classList.toggle("motion-off", !state().preferences.motion); }
    $("#motionPreference").onchange = (e) => {
      state().preferences.motion = e.target.checked;
      try { localStorage.setItem("kalore-motion", String(e.target.checked)); } catch (_) {}
      motionPreference(); save();
    };
    window.addEventListener("storage", (e) => { if (e.key === "kalore-motion") { state().preferences.motion = e.newValue !== "false"; $("#motionPreference").checked = state().preferences.motion; motionPreference(); } });
    root.addEventListener("kalore:progress", renderHome);
    renderHome(); renderWritingFont(); motionPreference();
    return { render: renderHome, dispose: () => clearInterval(checkpoint) };
  }
  root.KaloreExperience = { init };
})(window);
