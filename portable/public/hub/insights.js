/* Actionable local progress, a question explorer and a protected Radar handoff. */
(function (root) {
  "use strict";
  const names = { mat: "Matemática", nat: "Natureza", hum: "Humanas", ling: "Linguagens", red: "Redação" };
  const sourceNames = { block: "Bloco", guided: "Sessão guiada", sim: "Simulado autoral", explore: "Por assunto" };
  function init({ getState, save, escapeHTML: esc, questions, cards, trails, recordAnswer, activateTab, download, setEssayTheme }) {
    const $ = (q, el = document) => el.querySelector(q), $$ = (q, el = document) => [...el.querySelectorAll(q)];
    const state = () => getState(), model = root.KaloreInsights, metadata = root.KalorePracticeData.metadata;
    let period = 30, page = 1, selected = null, choice = null, confidence = null, signature = "", questionSnapshot = {};
    const room = $("#practiceRoom"), content = $("#practiceContent"), menu = $("#toolMenu");
    const date = (iso) => new Date(iso).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit" });
    const groups = [
      ["Meu espaço", ["hoje", "progresso", "plano", "foco"]],
      ["Praticar", ["trilhas", "questoes", "simulado", "provas-oficiais", "redacao", "flashcards", "erros"]],
      ["Explorar", ["biblioteca", "revisao", "prova"]],
    ];
    function renderMenu() {
      const current = document.body.dataset.view;
      $("#toolMenuList").innerHTML = groups.map(([title, ids]) => '<section><h3>' + title + '</h3><div class="tool-menu-grid">' + ids.map((id) => {
        const original = $('.nav-tabs [data-tab="' + id + '"]'), label = original?.querySelector(".nav-text")?.textContent || id;
        return '<button class="tool-menu-item' + (id === current ? ' on' : '') + '" data-menu-go="' + id + '"' + (id === current ? ' aria-current="page"' : '') + '>' + (original?.querySelector("svg")?.outerHTML || "") + '<span>' + esc(label) + '</span><span aria-hidden="true">' + (id === current ? "✓" : "→") + '</span></button>';
      }).join("") + '</div></section>').join("");
    }
    $("#openToolMenu").onclick = () => { renderMenu(); menu.showModal(); root.KaloreMotion?.enter(menu); };
    $("#closeToolMenu").onclick = () => menu.close();
    $("#toolMenuList").onclick = (e) => { const b = e.target.closest("[data-menu-go]"); if (b) { menu.close(); activateTab(b.dataset.menuGo); $("#" + b.dataset.menuGo + " h2")?.focus({ preventScroll: true }); } };
    function syncDock() {
      const current = document.body.dataset.view, direct = ["hoje", "questoes", "redacao", "progresso"].includes(current);
      $$(".mobile-dock [data-go]").forEach((b) => { b.classList.toggle("on", b.dataset.go === current); b.setAttribute("aria-current", b.dataset.go === current ? "page" : "false"); });
      $("#openToolMenu").classList.toggle("on", !direct); $("#openToolMenu").setAttribute("aria-label", direct ? "Mais ferramentas" : "Mais ferramentas, seção atual: " + ($("#workspaceTitle").textContent || current));
    }
    $$(".tab > .section-head h2").forEach((h) => h.setAttribute("tabindex", "-1"));
    function renderChart(days) {
      const max = Math.max(1, ...days.map((d) => d.total));
      $("#answerChart").innerHTML = '<ol class="answer-chart" aria-label="Respostas registradas por dia">' + days.map((d) => '<li><span class="chart-total">' + d.total + '</span><div class="answer-column" role="img" aria-label="' + date(d.key + "T12:00:00Z") + ': ' + d.correct + ' acertos em ' + d.total + ' tentativas"><i class="answer-other" style="height:' + (d.total - d.correct) / max * 100 + '%"></i><i class="answer-right" style="height:' + d.correct / max * 100 + '%"></i></div><span>' + date(d.key + "T12:00:00Z") + '</span></li>').join("") + '</ol>';
    }
    function renderProgress() {
      const s = state(), data = model.overview(s, questions, new Date(), period);
      $("#insightSummary").innerHTML = [
        [data.percent === null ? "—" : data.percent + "%", "de acertos registrados", data.total ? data.correct + " de " + data.total + " respostas" : "O primeiro treino abre este mapa."],
        [data.unique, "questões diferentes", "Repetições entram nas tentativas, uma vez na cobertura."],
        [s.errors.filter((x) => !x.reviewed && questions.some((q) => q.id === x.qid)).length, "questões para revisar", "Retomar o raciocínio vale mais que decorar a letra."],
      ].map(([value, label, note], i) => '<article class="panel insight-kpi insight-kpi-' + i + '"><span class="eyebrow">0' + (i + 1) + ' / SUA PRÁTICA</span><strong>' + value + '</strong><h3>' + label + '</h3><p>' + note + '</p></article>').join("");
      renderChart(data.days);
      $("#insightAreas").innerHTML = data.areaRows.map((r) => '<div class="insight-area"><div><strong>' + names[r.area] + '</strong><span>' + (r.percent === null ? "Sem registro" : r.percent + "% · " + r.correct + "/" + r.total) + '</span></div><div class="insight-track" role="img" aria-label="' + names[r.area] + ': ' + (r.percent === null ? "sem respostas registradas" : r.percent + '% de acertos, ' + r.total + ' tentativas') + '"><i style="width:' + (r.percent || 0) + '%"></i></div><small>' + (r.total ? r.total < 5 ? "Amostra inicial · menos de 5 tentativas" : r.unique + " questões diferentes praticadas" : "Faça um treino para começar a observar esta área.") + '</small></div>').join("");
      const recommendation = model.choose(s, questions, metadata);
      $("#insightNext").innerHTML = recommendation ? '<span class="glow-pill">' + names[recommendation.area] + '</span><h3>' + esc(recommendation.topic) + '</h3><p>' + esc(recommendation.reason) + '</p><button class="btn primary" data-practice-q="' + recommendation.qid + '">Treinar este assunto →</button><small>Usa erros pendentes e suas respostas. Você pode escolher outro caminho.</small>' : '<h3>Comece pelo que faz sentido.</h3><p>Explore o banco autoral e escolha seu primeiro assunto.</p>';
      const known = cards.map((c) => ({ c, meta: s.flash[c.id] })).filter(({ meta }) => meta && (meta === "mastered" || meta.last || meta.stage > 0));
      const due = known.filter(({ meta }) => typeof meta === "object" && meta.due <= model.day()).length;
      const lessons = Object.values(trails).flat().filter((l) => s.course.done[l.id]).length;
      $("#insightMemory").innerHTML = '<dl><div><dt>Cartões já revisados</dt><dd>' + known.length + '/' + cards.length + '</dd></div><div><dt>Cartões no dia de voltar</dt><dd>' + due + '</dd></div><div><dt>Lições concluídas</dt><dd>' + lessons + '/' + Object.values(trails).flat().length + '</dd></div><div><dt>Versões de redação salvas</dt><dd>' + s.essays.length + '</dd></div><div><dt>Minutos de foco registrados</dt><dd>' + s.focus + '</dd></div></dl>';
      const area = $("#insightArea").value, rows = model.topics(s, questions, metadata, new Date(), period).filter((r) => area === "all" || r.area === area);
      $("#topicMap").innerHTML = rows.map((r) => '<button class="topic-map-card' + (r.pending ? " needs-review" : "") + '" data-topic-key="' + esc(r.key) + '"><span class="eyebrow">' + names[r.area] + '</span><strong>' + esc(r.topic) + '</strong><span class="topic-map-score">' + (r.percent === null ? "Comece por aqui" : r.percent + '% <small>' + r.correct + "/" + r.total + ' tentativas</small>') + '</span><span class="topic-map-status">' + (r.pending ? r.pending + " questão(ões) para revisar" : r.total ? r.total < 5 ? "Amostra inicial" : r.unique + " questão(ões) diferentes" : r.questions.length + " questões disponíveis") + '<span aria-hidden="true">↗</span></span></button>').join("");
      $("#insightScope").textContent = "Detalhamento das últimas 1.000 tentativas válidas desta versão. " + (data.legacy ? data.legacy + " resposta(s) anteriores permanecem no aproveitamento geral, sem área ou data reconstruídas. " : "") + "Treinos oficiais registrados manualmente ficam separados em Provas oficiais. Os dados ficam neste navegador e acompanham seu backup.";
      $$("[data-topic-key]").forEach((b) => b.onclick = () => {
        const row = rows.find((x) => x.key === b.dataset.topicKey);
        $("#catalogArea").value = row.area; refreshTopics(row.topic); $("#catalogStatus").value = "all"; $("#catalogSearch").value = ""; page = 1;
        activateTab("questoes"); renderCatalog(); $("#practiceCatalog").scrollIntoView({ block: "start" });
      });
    }
    function refreshTopics(preferred = "all") {
      const area = $("#catalogArea").value;
      const topics = [...new Set(questions.filter((q) => area === "all" || q.a === area).map((q) => metadata[q.id].topic))].sort((a, b) => a.localeCompare(b, "pt-BR"));
      $("#catalogTopic").innerHTML = '<option value="all">Todos os assuntos</option>' + topics.map((t) => '<option value="' + esc(t) + '">' + esc(t) + '</option>').join("");
      $("#catalogTopic").value = topics.includes(preferred) ? preferred : "all";
    }
    function renderCatalog() {
      const s = state(), area = $("#catalogArea").value, topic = $("#catalogTopic").value, filter = $("#catalogStatus").value;
      questionSnapshot = model.states(s, questions);
      const terms = model.normalize($("#catalogSearch").value).split(/\s+/).filter(Boolean);
      const list = questions.filter((q) => {
        const info = questionSnapshot[q.id], meta = metadata[q.id], text = model.normalize(q.q + " " + meta.topic + " " + names[q.a]);
        return (area === "all" || q.a === area) && (topic === "all" || meta.topic === topic) && terms.every((t) => text.includes(t)) &&
          (filter === "all" || filter === "context" && q.contextual || filter === "uncertain" && info.status === "right" && ["guess", "unsure"].includes(info.last?.confidence) || filter === info.status);
      });
      const pages = Math.max(1, Math.ceil(list.length / 6)); page = Math.min(page, pages);
      $("#catalogTotal").textContent = questions.length + " questões autorais";
      $("#catalogResults").textContent = list.length ? list.length + " resultado(s) · mostrando " + ((page - 1) * 6 + 1) + "–" + Math.min(page * 6, list.length) : "Nenhuma questão neste filtro. Tente outro assunto.";
      $("#catalogList").innerHTML = list.slice((page - 1) * 6, page * 6).map((q) => {
        const info = questionSnapshot[q.id], meta = metadata[q.id], label = info.status === "new" ? "Sem registro" : info.status === "review" ? "Para revisar" : ["guess", "unsure"].includes(info.last?.confidence) ? "Acertou com dúvida" : "Última: acerto";
        return '<button class="catalog-question" data-practice-q="' + q.id + '"><span class="catalog-question-top"><span>' + names[q.a] + ' · ' + esc(meta.topic) + '</span><span class="catalog-badge ' + info.status + '">' + label + '</span></span><strong>' + esc(q.q) + '</strong><span class="catalog-question-bottom"><span>' + (q.contextual ? "Contextualizada · 5 alternativas" : "Fundamentos · 4 alternativas") + (s.questionNotes[q.id] ? " · Com anotação" : "") + '</span><span>Resolver ↗</span></span></button>';
      }).join("") || '<div class="catalog-empty"><span aria-hidden="true">↗</span><h4>Vamos abrir o caminho?</h4><p>Limpe os filtros para reencontrar as questões.</p><button class="btn" id="resetCatalog">Limpar filtros</button></div>';
      $("#catalogPagination").innerHTML = pages > 1 ? '<button class="btn" data-catalog-page="' + (page - 1) + '"' + (page === 1 ? " disabled" : "") + '>← Anterior</button><span>' + page + ' de ' + pages + '</span><button class="btn" data-catalog-page="' + (page + 1) + '"' + (page === pages ? " disabled" : "") + '>Próxima →</button>' : "";
      const reset = $("#resetCatalog"); if (reset) reset.onclick = () => { $("#catalogArea").value = "all"; refreshTopics(); $("#catalogStatus").value = "all"; $("#catalogSearch").value = ""; page = 1; renderCatalog(); $("#catalogSearch").focus(); };
    }
    function renderQuestion() {
      const q = selected, meta = metadata[q.id], answered = choice !== null, right = choice === q.c;
      $("#practiceTitle").textContent = meta.topic; $("#practiceArea").textContent = names[q.a].toUpperCase() + " · QUESTÃO AUTORAL";
      content.innerHTML = '<div class="practice-question"><span class="glow-pill">' + (q.contextual ? "Contextualizada · 5 alternativas" : "Fundamentos · 4 alternativas") + '</span><h3 id="practicePrompt" tabindex="-1">' + esc(q.q) + '</h3>' +
        (!answered ? '<fieldset class="confidence-picker"><legend>Como você está se sentindo? <span>Opcional</span></legend><button data-confidence="sure" aria-pressed="' + (confidence === "sure") + '">Sei o caminho</button><button data-confidence="unsure" aria-pressed="' + (confidence === "unsure") + '">Estou em dúvida</button><button data-confidence="guess" aria-pressed="' + (confidence === "guess") + '">Vou tentar</button></fieldset><details class="practice-hint"><summary>Uma pista para começar ↗</summary><p>' + esc(q.hint || meta.strategy) + '</p></details>' : "") +
        '<div class="practice-options" role="group" aria-labelledby="practicePrompt">' + q.o.map((o, i) => '<button class="practice-option' + (answered && i === q.c ? ' correct' : answered && i === choice ? ' incorrect' : '') + '" data-practice-choice="' + i + '"' + (answered ? " disabled" : "") + '><span aria-hidden="true">' + String.fromCharCode(65 + i) + '</span><span>' + esc(o) + '</span>' + (answered && i === q.c ? '<b aria-label="Correta">✓</b>' : answered && i === choice ? '<b aria-label="Sua resposta incorreta">×</b>' : "") + '</button>').join("") + '</div>' +
        (answered ? '<section class="practice-feedback' + (right ? ' is-right' : '') + '" role="status"><strong>' + (right ? "O raciocínio funcionou." : "Vamos entender o ponto de virada.") + '</strong><p>' + esc(q.e) + '</p>' + (right && ["guess", "unsure"].includes(confidence) ? '<p class="confidence-note">Você acertou com dúvida. Explique o caminho em suas palavras e volte a este assunto depois.</p>' : "") + '</section><div class="practice-notebook"><label for="questionNote">O que quero lembrar na próxima vez</label><textarea id="questionNote" maxlength="1200" rows="3" placeholder="Escreva o raciocínio, a confusão ou a pista que ajudou."></textarea><span id="questionNoteStatus" role="status">Anotação opcional · fica no seu backup.</span></div><div class="practice-footer"><button class="btn" id="practiceBack">Voltar ao meu espaço</button><button class="btn primary" id="practiceNext">Outra deste assunto →</button></div>' : '<p class="practice-keyboard">Teclas 1–' + q.o.length + ' para responder · Esc para fechar. Cada resposta é registrada uma vez.</p>') + '</div>';
      $$("[data-confidence]", content).forEach((b) => b.onclick = () => { confidence = b.dataset.confidence; $$("[data-confidence]", content).forEach((x) => x.setAttribute("aria-pressed", String(x.dataset.confidence === confidence))); });
      $$("[data-practice-choice]", content).forEach((b) => b.onclick = () => {
        if (choice !== null) return; choice = Number(b.dataset.practiceChoice);
        recordAnswer(q, choice, confidence); renderQuestion(); render(true); root.KaloreMotion?.answer(content, choice === q.c);
        $("#practiceNext").focus({ preventScroll: true });
      });
      if (answered) {
        $("#questionNote").value = state().questionNotes[q.id] || "";
        $("#questionNote").oninput = (e) => { state().questionNotes[q.id] = e.target.value.slice(0, 1200); const saved = save(); const status = $("#questionNoteStatus"); const text = saved ? "Anotação salva neste navegador." : "Sem salvar · exporte seu progresso para preservar a anotação."; if (status.textContent !== text) status.textContent = text; };
        $("#practiceBack").onclick = () => room.close();
        $("#practiceNext").onclick = () => {
          const snapshot = model.states(state(), questions), next = questions.filter((x) => x.id !== q.id && metadata[x.id].topic === meta.topic && x.a === q.a).sort((a, b) => Number(snapshot[b.id].pending) - Number(snapshot[a.id].pending) || snapshot[a.id].count - snapshot[b.id].count)[0];
          if (next) openQuestion(next.id); else { $("#practiceNext").textContent = "Explorar outros assuntos →"; $("#practiceNext").onclick = () => { room.close(); activateTab("questoes"); $("#practiceCatalog").scrollIntoView({ block: "start" }); }; }
        };
      }
    }
    function openQuestion(id) {
      selected = questions.find((q) => q.id === id); if (!selected) return;
      choice = null; confidence = null; renderQuestion(); if (!room.open) room.showModal();
      $("#practicePrompt").focus({ preventScroll: true }); root.KaloreMotion?.enter(content);
    }
    $("#closePracticeRoom").onclick = () => room.close();
    document.addEventListener("click", (e) => { const b = e.target.closest?.("[data-practice-q]"); if (b) openQuestion(b.dataset.practiceQ); });
    document.addEventListener("keydown", (e) => { if (!room.open || !room.contains(document.activeElement) || choice !== null || e.altKey || e.ctrlKey || e.metaKey || e.target.closest("input,textarea,select") || !/^[1-5]$/.test(e.key)) return; const b = $('[data-practice-choice="' + (Number(e.key) - 1) + '"]', content); if (b) { e.preventDefault(); b.click(); } });
    $$(".catalog-controls input,.catalog-controls select").forEach((el) => el.addEventListener(el.tagName === "INPUT" ? "input" : "change", () => { if (el.id === "catalogArea") refreshTopics(); page = 1; renderCatalog(); }));
    $("#catalogPagination").onclick = (e) => { const b = e.target.closest("[data-catalog-page]"); if (b) { page = Number(b.dataset.catalogPage); renderCatalog(); $("#catalogResults").scrollIntoView({ block: "center" }); $("#catalogList button")?.focus({ preventScroll: true }); } };
    $$("[data-insight-period]").forEach((b) => b.onclick = () => { period = Number(b.dataset.insightPeriod); $$("[data-insight-period]").forEach((x) => { x.classList.toggle("on", x === b); x.setAttribute("aria-pressed", String(x === b)); }); renderProgress(); });
    $("#insightArea").onchange = renderProgress;
    $("#exportInsights").onclick = () => {
      const data = model.overview(state(), questions, new Date(), period);
      const rows = model.topics(state(), questions, metadata, new Date(), period);
      download("kalore-meu-progresso.md", "# Meu progresso · Kaloré\n\nExportado em " + model.day() + ". Período: " + (period ? period + " dias" : "todo o registro") + ".\n\n" + data.correct + " de " + data.total + " respostas certas. " + data.unique + " questões diferentes.\n\n## Assuntos\n\n" + rows.map((r) => "- " + names[r.area] + " / " + r.topic + ": " + r.correct + "/" + r.total + " acertos; " + r.pending + " questão(ões) para revisar.").join("\n") + "\n\n## Tentativas\n\n" + data.list.map((a) => "- " + a.date + " · " + sourceNames[a.source] + " · " + a.qid + " · alternativa " + (a.choice === -1 ? "em branco" : String.fromCharCode(65 + a.choice))).join("\n") + "\n\n## Minhas anotações\n\n" + Object.entries(state().questionNotes).filter(([, note]) => note.trim()).map(([id, note]) => "### " + id + "\n\n" + note).join("\n\n") + "\n\nDados locais de prática autoral; não estimam domínio ou nota TRI. Respostas anteriores sem detalhamento: " + data.legacy + ".", "text/markdown");
    };
    function setupBrief() {
      const topicId = new URLSearchParams(location.search).get("roteiro"); if (!topicId) return;
      let brief; try { brief = root.KaloreBrief.handoff(JSON.parse(localStorage.getItem("kalore-essay-brief-v1") || "null")); } catch (_) {}
      if (!brief || brief.topicId !== topicId) return;
      const panel = $("#briefImport"); panel.hidden = false; $("#briefImportTitle").textContent = brief.theme;
      const preview = document.createElement("details"); preview.className = "brief-preview"; const summary = document.createElement("summary"); summary.textContent = "Conferir meu planejamento"; preview.append(summary);
      for (const field of root.KaloreBrief.fields) if (brief.blueprint[field].trim()) { const p = document.createElement("p"), strong = document.createElement("strong"); strong.textContent = $("textarea[data-blueprint='" + field + "'],input[data-blueprint='" + field + "']")?.closest("label").querySelector("span").textContent || field; p.append(strong, document.createTextNode(brief.blueprint[field])); preview.append(p); }
      panel.insertBefore(preview, panel.querySelector(".hero-actions"));
      $("#applyBrief").onclick = () => {
        let count = 0;
        $$("[data-blueprint]").forEach((el) => { const key = el.dataset.blueprint; if (!state().blueprint[key]?.trim() && brief.blueprint[key].trim()) { state().blueprint[key] = brief.blueprint[key]; el.value = brief.blueprint[key]; count++; } });
        const hasDraft = !!state().draft.trim(); if (!hasDraft) setEssayTheme(brief.theme);
        const saved = save();
        $(".blueprint").open = true;
        $("#briefImportStatus").textContent = (count ? count + " campo(s) preenchido(s). " : "Seu roteiro já está preenchido. Compare o planejamento acima e ajuste os campos que quiser. ") + (hasDraft ? "Seu texto e o tema do rascunho foram preservados. " : "O tema foi selecionado no editor. ") + (!saved ? "O navegador não salvou; exporte uma cópia." : "Os campos já preenchidos foram preservados.");
        if (saved) try { localStorage.removeItem("kalore-essay-brief-v1"); } catch (_) {}
      };
      $("#dismissBrief").onclick = () => { panel.hidden = true; try { localStorage.removeItem("kalore-essay-brief-v1"); } catch (_) {} };
    }
    function render(force = false) {
      const s = state(), key = JSON.stringify([s.attempts.length, s.attempts[0]?.id, s.answers, s.errors.map((x) => [x.qid, x.reviewed]), s.flash, s.course.done, s.focus, s.essays.length]);
      const changed = key !== signature; signature = key;
      if (changed || force) {
        if (document.body.dataset.view === "progresso") renderProgress();
        if (document.body.dataset.view === "questoes") renderCatalog();
      }
    }
    root.addEventListener("kalore:view", () => { syncDock(); render(true); });
    root.addEventListener("kalore:progress", () => render());
    refreshTopics(); render(true); syncDock(); setupBrief();
    return { render, openQuestion };
  }
  root.KaloreInsightsUI = { init };
})(window);
