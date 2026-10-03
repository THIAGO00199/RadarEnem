/* Biblioteca e treino oficial. Nenhum serviço externo recebe dados do aluno. */
(function (root) {
  "use strict";
  const normalize = (s) => String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  const matchResource = (r, q) => {
    const text = normalize([r.title, r.desc, r.source, r.year, ...r.tags].join(" "));
    return normalize(q).split(/\s+/).every((term) => text.includes(term));
  };
  const areas = { redacao: "Redação", matematica: "Matemática", natureza: "Natureza", humanas: "Humanas", linguagens: "Linguagens", provas: "Provas oficiais", revisao: "Revisão", planejamento: "Planejamento" };
  function init({ getState, save, escapeHTML: esc, toast, activateTab }) {
    const $ = (q) => document.querySelector(q), $$ = (q) => [...document.querySelectorAll(q)];
    const { resources, exams } = root.KaloreLibrary;
    const state = () => getState();
    let view = "all", page = 1;
    const pageSize = 12;
    const filtered = () => resources.filter((r) =>
      ($("#libraryCat").value === "all" || r.cat === $("#libraryCat").value) &&
      ($("#libraryYear").value === "all" || String(r.year) === $("#libraryYear").value) &&
      ($("#libraryKind").value === "all" || r.kind === $("#libraryKind").value) &&
      (view === "all" || (view === "saved" ? state().library.favorites[r.id] : state().library.read[r.id])) &&
      matchResource(r, $("#librarySearch").value));
    $("#libraryYear").innerHTML += [...new Set(resources.map((r) => r.year))].sort((a, b) => b - a).map((y) => `<option value="${y}">${y}</option>`).join("");
    function renderLibrary() {
      const list = filtered(), pages = Math.max(1, Math.ceil(list.length / pageSize));
      $("#biblioteca").classList.toggle("is-filtered", view !== "all" || $("#librarySearch").value.trim() !== "" || ["libraryCat", "libraryYear", "libraryKind"].some((id) => $("#" + id).value !== "all"));
      page = Math.max(1, Math.min(page, pages));
      const saved = resources.filter((r) => state().library.favorites[r.id]).length;
      const read = resources.filter((r) => state().library.read[r.id]).length;
      $("#libraryOverview").innerHTML = `<div><b>${resources.length}</b><span>PDFs para estudar</span></div><div><b>${exams.length}</b><span>provas com gabarito</span></div><div><b>${saved}</b><span>nos seus favoritos</span></div><div><b>${read}</b><span>materiais estudados</span></div>`;
      $("#libraryResults").textContent = list.length ? `${list.length} ${list.length === 1 ? "material encontrado" : "materiais encontrados"} · mostrando ${1 + (page - 1) * pageSize}–${Math.min(page * pageSize, list.length)}` : "Nenhum material encontrado. Tente outro assunto ou limpe os filtros.";
      $$('[data-library-view]').forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.libraryView === view)));
      $("#libraryGrid").innerHTML = list.slice((page - 1) * pageSize, page * pageSize).map((r) => {
        const favorite = state().library.favorites[r.id] === true, read = state().library.read[r.id] === true;
        return `<article class="panel resource pdf-resource" data-resource="${r.id}"><div class="pdf-cover pdf-${r.cat}" aria-hidden="true"><span>PDF / ${r.year}</span><b>${esc(areas[r.cat])}</b><i>${r.local ? "K" : "↗"}</i></div><div class="resource-content"><div class="resource-meta"><span class="chip">${esc(r.source)}</span>${r.local ? '<span class="chip">Offline</span>' : ""}${r.size ? `<span class="resource-size">${esc(r.size)}</span>` : ""}</div><h3>${esc(r.title)}</h3><p>${esc(r.desc)}</p><div class="resource-links"><a class="pdf-open" href="${esc(r.url)}" ${r.local ? 'download' : 'target="_blank" rel="noopener noreferrer"'}>${r.local ? "Baixar PDF ↓" : "Abrir PDF ↗"}</a><a href="${esc(r.sourceUrl)}" ${r.local ? "" : 'target="_blank" rel="noopener noreferrer"'}>${r.local ? "Ver guia" : "Fonte"}</a></div><div class="resource-actions"><button data-library-save="${r.id}" aria-pressed="${favorite}" aria-label="${favorite ? "Remover" : "Salvar"} ${esc(r.title)} ${favorite ? "dos" : "nos"} favoritos">${favorite ? "★ Salvo" : "☆ Salvar"}</button><button data-library-read="${r.id}" aria-pressed="${read}">${read ? "✓ Estudado" : "Marcar estudado"}</button>${r.examId && r.kind === "prova" ? `<button data-train-exam="${r.examId}">Treinar →</button>` : ""}</div></div></article>`;
      }).join("") || '<article class="panel library-empty"><h3>Vamos encontrar outra leitura?</h3><p>Busque por matéria, ano ou instituição. Seus favoritos ficam disponíveis no filtro “Favoritos”.</p><button class="btn" data-library-clear>Ver todos os PDFs</button></article>';
      $("#libraryPagination").innerHTML = pages > 1 ? `<button class="btn" data-library-page="${page - 1}" ${page === 1 ? "disabled" : ""}>← Anterior</button><span>Página ${page} de ${pages}</span><button class="btn" data-library-page="${page + 1}" ${page === pages ? "disabled" : ""}>Próxima →</button>` : "";
    }
    function resetLibrary() {
      $("#librarySearch").value = "";
      for (const id of ["libraryCat", "libraryYear", "libraryKind"]) $("#" + id).value = "all";
      view = "all"; page = 1;
    }
    function preset(value) {
      resetLibrary();
      if (value === "guias") $("#libraryKind").value = "guia";
      else if (areas[value]) $("#libraryCat").value = value;
      renderLibrary();
    }
    for (const id of ["librarySearch", "libraryCat", "libraryYear", "libraryKind"]) $("#" + id).addEventListener(id === "librarySearch" ? "input" : "change", () => { page = 1; renderLibrary(); });
    $("#libraryReset").onclick = () => { resetLibrary(); renderLibrary(); };
    $$('[data-library-preset]').forEach((b) => b.onclick = () => preset(b.dataset.libraryPreset));
    $$('[data-library-view]').forEach((b) => b.onclick = () => { view = b.dataset.libraryView; page = 1; renderLibrary(); });
    $("#biblioteca").addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      if (b.hasAttribute("data-library-clear")) { resetLibrary(); renderLibrary(); }
      for (const [data, key] of [["librarySave", "favorites"], ["libraryRead", "read"]]) {
        if (b.dataset[data] && resources.some((r) => r.id === b.dataset[data])) {
          const id = b.dataset[data]; state().library[key][id] = !state().library[key][id]; save(); renderLibrary();
          $("#libraryGrid").querySelector(`[data-${key === "favorites" ? "library-save" : "library-read"}="${id}"]`)?.focus({ preventScroll: true });
        }
      }
      if (b.dataset.libraryPage) { page = Number(b.dataset.libraryPage); renderLibrary(); $("#libraryResults").scrollIntoView({ block: "center" }); }
      if (b.dataset.trainExam) { selectExam(b.dataset.trainExam); activateTab("provas-oficiais"); }
    });
    $("#officialExam").innerHTML = exams.map((e) => `<option value="${e.id}">ENEM ${e.year} · ${e.day}º dia · azul</option>`).join("");
    const timerKey = "kalore-official-session-v1";
    let timer = { examId: exams[0].id, elapsed: 0, started: 0, running: false };
    let restored = null;
    try {
      restored = JSON.parse(sessionStorage.getItem(timerKey) || "null");
      if (restored && exams.some((e) => e.id === restored.examId) && Number.isFinite(restored.elapsed) && restored.elapsed >= 0 && restored.elapsed <= 86400000) {
        timer = { examId: restored.examId, elapsed: restored.elapsed, started: Number.isFinite(restored.started) && restored.started > 0 && restored.started <= Date.now() ? restored.started : 0, running: restored.running === true && Number.isFinite(restored.started) && restored.started > 0 && restored.started <= Date.now() && Date.now() - restored.started < 86400000 };
      }
    } catch (_) {}
    $("#officialExam").value = timer.examId;
    function persist() {
      try { sessionStorage.setItem(timerKey, JSON.stringify({ ...timer, first: $("#officialFirst").value, second: $("#officialSecond").value, minutes: $("#officialMinutes").value, note: $("#officialNote").value.slice(0, 2000) })); } catch (_) {}
    }
    const selectedExam = () => exams.find((e) => e.id === $("#officialExam").value) || exams[0];
    const elapsed = () => Math.min(86400000, timer.elapsed + (timer.running ? Math.max(0, Date.now() - timer.started) : 0));
    function clock() {
      const seconds = Math.floor(elapsed() / 1000);
      $("#officialClock").textContent = [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60].map((x) => String(x).padStart(2, "0")).join(":");
      $("#officialTimerStart").textContent = timer.running ? "Pausar" : timer.elapsed ? "Continuar" : "Começar";
      $("#officialExam").disabled = timer.running;
    }
    function renderExam() {
      const e = selectedExam();
      $("#officialFirstLabel").textContent = (e.day === 1 ? "Linguagens" : "Natureza") + " · acertos";
      $("#officialSecondLabel").textContent = (e.day === 1 ? "Humanas" : "Matemática") + " · acertos";
      $("#officialExamInfo").innerHTML = `<div class="official-exam-cover"><span>ENEM / ${e.year}</span><h3>${e.day}º dia · caderno ${e.booklet} azul</h3><p>${e.day === 1 ? "Linguagens, Ciências Humanas e Redação" : "Ciências da Natureza e Matemática"}</p><span class="chip">Aplicação regular · 90 questões</span></div><div class="official-exam-links"><a class="btn primary" href="${esc(e.url)}" target="_blank" rel="noopener noreferrer">Abrir prova PDF ↗</a><a class="btn" href="${esc(e.answerUrl)}" target="_blank" rel="noopener noreferrer">Gabarito correspondente ↗</a><a href="${esc(e.sourceUrl)}" target="_blank" rel="noopener noreferrer">Catálogo oficial do Inep ↗</a></div>`;
    }
    function selectExam(id) {
      if (!exams.some((e) => e.id === id)) return;
      if (timer.running) { toast("Pause o cronômetro antes de escolher outra prova."); return; }
      if (timer.examId !== id) {
        timer = { examId: id, elapsed: 0, started: 0, running: false };
        $("#officialResultForm").reset(); $("#officialFeedback").textContent = "";
      }
      $("#officialExam").value = id; persist(); renderExam(); clock();
    }
    $("#officialExam").onchange = () => selectExam($("#officialExam").value);
    $("#officialTimerStart").onclick = () => {
      if (timer.running) { timer.elapsed = elapsed(); timer.running = false; timer.started = 0; $("#officialMinutes").value = Math.max(1, Math.round(timer.elapsed / 60000)); }
      else { timer.started = Date.now(); timer.running = true; }
      persist(); clock();
    };
    $("#officialTimerReset").onclick = () => { timer.elapsed = 0; timer.started = 0; timer.running = false; persist(); clock(); };
    setInterval(() => { if (timer.running && !document.hidden) clock(); }, 1000);
    window.addEventListener("pagehide", () => { persist(); });
    document.addEventListener("visibilitychange", () => { if (!document.hidden) clock(); });
    $("#officialResultForm").addEventListener("input", persist);
    if (restored && restored.examId === timer.examId) {
      for (const [field, key] of [["officialFirst", "first"], ["officialSecond", "second"], ["officialMinutes", "minutes"], ["officialNote", "note"]]) if (typeof restored[key] === "string") $("#" + field).value = restored[key].slice(0, key === "note" ? 2000 : 10);
    }
    function renderHistory() {
      const history = state().officialHistory.filter((x) => exams.some((e) => e.id === x.examId));
      $("#officialExport").disabled = !history.length;
      $("#officialHistory").innerHTML = history.length ? `<div class="official-history">${history.map((x) => {
        const e = exams.find((e) => e.id === x.examId);
        return `<article class="panel official-history-item"><div><span class="eyebrow">${esc(new Date(x.date).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" }))} / ${x.minutes} MIN</span><h3>ENEM ${e.year} · ${e.day}º dia</h3><p>${e.day === 1 ? "Linguagens" : "Natureza"}: ${x.first}/45 · ${e.day === 1 ? "Humanas" : "Matemática"}: ${x.second}/45</p>${x.note ? `<p class="muted">${esc(x.note)}</p>` : ""}</div><b>${x.first + x.second}<small>/90 acertos</small></b></article>`;
      }).join("")}</div>` : '<article class="panel empty"><h3>Seu primeiro treino começa com uma prova.</h3><p>Abra o PDF, resolva no seu ritmo e confira o gabarito. Depois, registre seus acertos aqui.</p></article>';
      if (!history.length) { $("#officialInsights").innerHTML = ""; return; }
      const last = history[0], e = exams.find((e) => e.id === last.examId);
      const weak = last.first <= last.second ? (e.day === 1 ? "linguagens" : "natureza") : (e.day === 1 ? "humanas" : "matematica");
      const comparable = history.filter((x) => exams.find((e) => e.id === x.examId).day === e.day);
      const prev = comparable[1], delta = prev ? last.first + last.second - prev.first - prev.second : null;
      $("#officialInsights").innerHTML = `<article class="panel official-insight"><div><span class="eyebrow">SUA PRÓXIMA AÇÃO</span><h3>Uma revisão de ${esc(areas[weak].toLowerCase())} agora.</h3><p>${last.first === last.second ? "As duas áreas tiveram o mesmo resultado. Comece pela primeira e reveja a outra em seguida." : "Esta foi a área com menos acertos no último treino."} Escolha um capítulo, resolva cinco exercícios e refaça os erros sem consultar a solução.</p><small class="muted">${delta === null ? "Registre mais um treino do mesmo dia para comparar." : `${delta > 0 ? "+" : ""}${delta} acertos em relação ao treino anterior do mesmo dia. As edições têm dificuldades diferentes.`}</small></div><button class="btn primary" data-official-review="${weak}">Abrir materiais de ${esc(areas[weak])} →</button></article>`;
      $("#officialInsights").querySelector("button").onclick = () => { preset(weak); activateTab("biblioteca"); };
    }
    $("#officialResultForm").onsubmit = (event) => {
      event.preventDefault();
      if (!event.target.reportValidity()) return;
      if (timer.running) { $("#officialFeedback").textContent = "Pause o cronômetro antes de salvar o resultado."; return; }
      const first = Number($("#officialFirst").value), second = Number($("#officialSecond").value), minutes = Number($("#officialMinutes").value);
      if (![first, second, minutes].every(Number.isInteger) || first < 0 || first > 45 || second < 0 || second > 45 || minutes < 1 || minutes > 360) return;
      const record = { id: "official-" + crypto.randomUUID(), examId: selectedExam().id, date: new Date().toISOString(), first, second, minutes, note: $("#officialNote").value.trim().slice(0, 2000) };
      state().officialHistory.unshift(record); state().officialHistory = state().officialHistory.slice(0, 100); save(); renderHistory();
      window.dispatchEvent(new CustomEvent("kalore:progress"));
      $("#officialFeedback").textContent = "Treino salvo. Sua próxima revisão está logo abaixo.";
      $("#officialFirst").value = ""; $("#officialSecond").value = ""; $("#officialNote").value = ""; persist();
    };
    $("#officialExport").onclick = () => {
      // Prevent spreadsheet formulas in notes while preserving multiline CSV fields.
      const field = (v) => '"' + String(v).replace(/^[\t\r\n ]*[=+@-]/, "'$&").replace(/"/g, '""') + '"';
      const csv = ["data;prova;dia;acertos_area_1;acertos_area_2;minutos;revisar", ...state().officialHistory.filter((x) => exams.some((e) => e.id === x.examId)).map((x) => { const e = exams.find((e) => e.id === x.examId); return [x.date, e.year, e.day, x.first, x.second, x.minutes, x.note].map(field).join(";"); })].join("\r\n");
      const u = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" })); const a = document.createElement("a"); a.href = u; a.download = "kalore-treinos-enem.csv"; a.click(); setTimeout(() => URL.revokeObjectURL(u), 1000);
    };
    const tools = [
      ["hoje", "Minha rota de hoje", "missão diária progresso conquistas sequência"],
      ["progresso", "Meu progresso por assunto", "acertos desempenho histórico mapa evolução estatísticas"],
      ["trilhas", "Trilhas e lições", "aprender aula matemática linguagens humanas natureza"],
      ["redacao", "Laboratório de redação", "escrever tese argumento intervenção revisar"],
      ["provas-oficiais", "Treinar prova oficial", "enem pdf gabarito 2025 histórico acertos"],
      ["biblioteca", "Biblioteca de PDFs", "baixar apostila livro cartilha material"],
      ["questoes", "Questões comentadas", "praticar exercício resposta"],
      ["simulado", "Simulado autoral", "cronometrado marcar revisão"],
      ["revisao", "Guia de revisão", "fórmula resumo conceito"],
      ["flashcards", "Flashcards", "memória revisão espaçada"],
      ["erros", "Caderno de erros", "refazer erradas"],
      ["plano", "Plano semanal", "horas organizar calendário"],
      ["foco", "Foco e Pomodoro", "tempo cronômetro estudar"],
    ];
    function renderQuickSearch() {
      const q = $("#quickSearchInput").value, matchedTools = tools.filter((t) => normalize(t.join(" ")).includes(normalize(q))).slice(0, 5);
      const matchedPDFs = q.trim() ? resources.filter((r) => matchResource(r, q)).slice(0, 6) : resources.filter((r) => r.featured).slice(0, 3);
      $("#quickSearchResults").innerHTML = matchedTools.map((t) => `<button data-quick-tool="${t[0]}"><span>FERRAMENTA</span><b>${esc(t[1])}</b><i>→</i></button>`).join("") + matchedPDFs.map((r) => `<button data-quick-pdf="${r.id}"><span>PDF / ${esc(r.source)}</span><b>${esc(r.title)}</b><i>→</i></button>`).join("") || '<p class="muted">Nenhum resultado. Busque por uma matéria ou por “prova”.</p>';
    }
    $("#openQuickSearch").onclick = () => { $("#quickSearchInput").value = ""; renderQuickSearch(); $("#quickSearch").showModal(); $("#quickSearchInput").focus(); };
    $("#closeQuickSearch").onclick = () => $("#quickSearch").close();
    $("#quickSearchInput").oninput = renderQuickSearch;
    $("#quickSearchResults").onclick = (event) => {
      const b = event.target.closest("button"); if (!b) return;
      $("#quickSearch").close();
      if (b.dataset.quickTool) activateTab(b.dataset.quickTool);
      if (b.dataset.quickPdf) { const r = resources.find((r) => r.id === b.dataset.quickPdf); if (r) { resetLibrary(); $("#librarySearch").value = r.title; renderLibrary(); activateTab("biblioteca"); } }
    };
    document.addEventListener("keydown", (event) => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") { event.preventDefault(); $("#openQuickSearch").click(); } });
    renderLibrary(); renderExam(); clock(); renderHistory();
    return { renderLibrary };
  }
  root.KaloreStudy = { init, normalize, matchResource };
})(globalThis);
