(function () {
  "use strict";
  const $ = (q, c = document) => c.querySelector(q);
  const $$ = (q, c = document) => Array.from(c.querySelectorAll(q));
  const KEY = "kalore-hub-v3",
    OLD = "kalore-hub-v2",
    TZ = "America/Sao_Paulo";
  const base = {
    activity: {},
    tasks: {},
    focus: 0,
    essays: [],
    draft: "",
    plan: [],
    area: { ling: 0, hum: 0, nat: 0, mat: 0, red: 0 },
    checks: {},
    xp: 0,
    answers: 0,
    correct: 0,
    errors: [],
    flash: {},
    profile: { name: "", goal: "", hours: 12 },
    notes: [],
    theme: "dark",
    onboarding: { done: false, minutes: 20 },
    daily: {},
    themeIndex: 0,
    checkRewards: {},
    blueprint: {},
    focusGoal: "",
    focusNote: "",
    focusTimer: { total: 1500, seconds: 1500, running: false, end: 0 },
    simHistory: [],
    course: { track: "mat", done: {}, energy: { date: "", value: 5 } },
  };
  function load() {
    try {
      let v = JSON.parse(localStorage.getItem(KEY) || "null");
      if (v) return merge(v);
      let old = JSON.parse(localStorage.getItem(OLD) || "null");
      if (old) {
        let migrated = merge(old);
        migrated.xp = Math.min(
          1500,
          migrated.focus * 2 +
            migrated.essays.length * 60 +
            Object.values(migrated.tasks).filter(Boolean).length * 15,
        );
        localStorage.setItem(KEY, JSON.stringify(migrated));
        return migrated;
      }
    } catch (e) {}
    return structuredClone(base);
  }
  function merge(v) {
    return KaloreCore.mergeState(base, v);
  }
  let s = load(),
    timer = { seconds: 1500, total: 1500, running: false, end: 0, id: null },
    installPrompt = null,
    currentQuiz = [],
    quizBlock = { answered: 0, correct: 0 },
    trailSession = null;
  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(s));
    } catch (e) {
      toast(
        "Não consegui salvar neste navegador. Exporte seus dados para não perder o progresso.",
      );
    }
  }
  function dayKey(d = new Date()) {
    return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(d);
  }
  function fmtDate(iso) {
    try {
      return new Date(iso).toLocaleDateString("pt-BR", {
        timeZone: TZ,
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch (e) {
      return iso;
    }
  }
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("on");
    clearTimeout(toast.t);
    toast.t = setTimeout(() => t.classList.remove("on"), 3300);
  }
  function addActivity(amount = 1) {
    const k = dayKey();
    s.activity[k] = (s.activity[k] || 0) + amount;
    save();
    renderMetrics();
    renderHeatmap();
    renderBadges();
  }
  function addXP(n, msg) {
    s.xp = (s.xp || 0) + n;
    addActivity();
    if (msg) toast(msg + " +" + n + " XP");
    renderMetrics();
  }
  function streak() {
    let count = 0,
      d = new Date();
    for (let i = 0; i < 370; i++) {
      const k = dayKey(d);
      if (s.activity[k]) {
        count++;
        d.setDate(d.getDate() - 1);
        continue;
      }
      if (i === 0) {
        d.setDate(d.getDate() - 1);
        continue;
      }
      break;
    }
    return count;
  }
  function level() {
    return Math.floor((s.xp || 0) / 250) + 1;
  }
  function examDays() {
    return Math.max(
      0,
      Math.ceil(
        (new Date("2026-11-08T00:00:00-03:00") - Date.now()) / 86400000,
      ),
    );
  }
  function activateTab(id, writeHash = true) {
    if (!$$(".tab").some((t) => t.id === id)) id = "hoje";
    $$(".nav-tabs button").forEach((b) =>
      b.classList.toggle("on", b.dataset.tab === id),
    );
    $$(".nav-tabs button").forEach((b) => {
      b.setAttribute("aria-current", b.dataset.tab === id ? "page" : "false");
    });
    $$(".tab").forEach((x) => x.classList.toggle("on", x.id === id));
    $$(".mobile-dock button").forEach((b) =>
      b.classList.toggle("on", b.dataset.go === id),
    );
    if (writeHash) history.pushState(null, "", "#" + id);
    window.scrollTo({
      top: Math.max(
        0,
        $("#" + id).offsetTop -
          (innerWidth <= 760
            ? 68 + $(".nav-tabs").getBoundingClientRect().height + 12
            : 96),
      ),
      behavior:
        writeHash && !matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "smooth"
          : "instant",
    });
  }
  $$("[data-tab]").forEach((b) =>
    b.addEventListener("click", () => activateTab(b.dataset.tab)),
  );
  $$("[data-go]").forEach((b) =>
    b.addEventListener("click", () => activateTab(b.dataset.go)),
  );
  if (location.hash) activateTab(location.hash.slice(1), false);
  window.addEventListener("hashchange", () =>
    activateTab(location.hash.slice(1) || "hoje", false),
  );
  $("#days").textContent = examDays();
  function renderMetrics() {
    const lv = level();
    $("#streak").textContent = streak();
    $("#done").textContent = Object.values(s.tasks).filter(Boolean).length;
    $("#focus").textContent = s.focus || 0;
    $("#essays").textContent = s.essays.length;
    $("#xp").textContent = s.xp || 0;
    $("#level").textContent = "Nível " + lv;
    const inLevel = (s.xp || 0) % 250;
    $("#levelBar").style.width = (inLevel / 250) * 100 + "%";
    $("#accuracy").textContent = s.answers
      ? Math.round(((s.correct || 0) / s.answers) * 100) + "%"
      : "—";
  }
  renderMetrics();
  const areaNames = {
    ling: "Linguagens",
    hum: "Humanas",
    nat: "Natureza",
    mat: "Matemática",
    red: "Redação",
  };
  const trails = {
    mat: {
      icon: "∑",
      title: "Matemática",
      units: [
        {
          id: "mat1",
          title: "Porcentagem sem medo",
          desc: "Transforme porcentagens em multiplicadores e resolva aumentos e descontos.",
          concept:
            "20% = 0,20. Para calcular x% de N, multiplique N por x/100.",
          q: "Um tênis de R$ 300 recebe 15% de desconto. Qual o preço final?",
          o: ["R$ 245", "R$ 255", "R$ 265", "R$ 285"],
          c: 1,
          e: "15% de 300 = 45; 300 − 45 = 255.",
        },
        {
          id: "mat2",
          title: "Razão e proporção",
          desc: "Leia relações entre grandezas e use proporcionalidade com unidade correta.",
          concept:
            "Uma razão compara duas grandezas. Em proporções, produtos cruzados ajudam a encontrar o valor desconhecido.",
          q: "Se 4 cadernos custam R$ 28, quanto custam 7, mantendo o preço unitário?",
          o: ["R$ 42", "R$ 45", "R$ 49", "R$ 52"],
          c: 2,
          e: "Cada caderno custa R$ 7; 7×7 = R$ 49.",
        },
        {
          id: "mat3",
          title: "Função afim",
          desc: "Entenda taxa de variação, valor inicial e leitura de gráficos.",
          concept:
            "Em f(x)=ax+b, a indica quanto y varia quando x aumenta uma unidade; b é o valor quando x=0.",
          q: "Em f(x)=3x−2, quanto vale f(4)?",
          o: ["8", "10", "12", "14"],
          c: 1,
          e: "3×4−2 = 10.",
        },
        {
          id: "mat4",
          title: "Estatística essencial",
          desc: "Média, mediana e leitura crítica de conjuntos de dados.",
          concept:
            "A média usa todos os valores; a mediana é o valor central após ordenar os dados.",
          q: "Qual a mediana de 2, 4, 7, 9 e 20?",
          o: ["4", "7", "8,4", "9"],
          c: 1,
          e: "Com cinco valores ordenados, o terceiro é a mediana: 7.",
        },
        {
          id: "mat5",
          boss: true,
          title: "Chefe: Matemática base",
          desc: "Checkpoint da unidade. Resolva sem fórmula decorada.",
          concept:
            "Misture porcentagem, proporção, função e estatística escolhendo a ideia adequada.",
          q: "Uma conta sobe de R$ 160 para R$ 184. O aumento percentual foi:",
          o: ["10%", "12%", "15%", "24%"],
          c: 2,
          e: "O aumento foi 24. 24/160=0,15=15%.",
        },
      ],
    },
    nat: {
      icon: "⚗",
      title: "Natureza",
      units: [
        {
          id: "nat1",
          title: "Energia e transformações",
          desc: "Reconheça conversões de energia em situações do cotidiano.",
          concept:
            "A energia pode mudar de forma, mas a análise deve acompanhar o sistema e as transferências.",
          q: "Num painel solar fotovoltaico, a transformação principal é:",
          o: [
            "luminosa em elétrica",
            "elétrica em química",
            "química em sonora",
            "térmica em nuclear",
          ],
          c: 0,
          e: "Células fotovoltaicas convertem energia luminosa em elétrica.",
        },
        {
          id: "nat2",
          title: "Ecologia",
          desc: "Fluxo de energia, cadeias alimentares e relações ecológicas.",
          concept:
            "Energia entra majoritariamente pelos produtores e diminui a cada transferência trófica.",
          q: "A maior quantidade de energia disponível em uma cadeia tende a estar:",
          o: [
            "nos decompositores apenas",
            "nos produtores",
            "no último predador",
            "igual em todos os níveis",
          ],
          c: 1,
          e: "Os produtores formam a base energética da cadeia.",
        },
        {
          id: "nat3",
          title: "Eletricidade básica",
          desc: "Tensão, resistência, corrente e potência.",
          concept:
            "A Lei de Ohm relaciona V=R·I. Potência elétrica pode ser calculada por P=V·I.",
          q: "Com 12 V em um resistor de 6 Ω, a corrente é:",
          o: ["0,5 A", "2 A", "6 A", "72 A"],
          c: 1,
          e: "I=V/R=12/6=2 A.",
        },
        {
          id: "nat4",
          title: "Química e pH",
          desc: "Interprete acidez e ordens de grandeza.",
          concept:
            "A escala de pH é logarítmica: uma unidade representa fator 10 na concentração de H⁺.",
          q: "Comparando pH 3 e pH 5, a solução de pH 3 tem concentração de H⁺:",
          o: [
            "2 vezes maior",
            "10 vezes maior",
            "100 vezes maior",
            "1000 vezes menor",
          ],
          c: 2,
          e: "São duas unidades: 10²=100 vezes.",
        },
        {
          id: "nat5",
          boss: true,
          title: "Chefe: Natureza base",
          desc: "Checkpoint interdisciplinar.",
          concept: "Leia o fenômeno antes de escolher a fórmula ou conceito.",
          q: "Se a resistência dobra e a tensão permanece constante, a corrente elétrica:",
          o: ["dobra", "cai pela metade", "fica igual", "quadruplica"],
          c: 1,
          e: "I=V/R; dobrar R reduz I à metade.",
        },
      ],
    },
    hum: {
      icon: "⌘",
      title: "Humanas",
      units: [
        {
          id: "hum1",
          title: "Cidadania",
          desc: "Direitos, deveres e participação na vida coletiva.",
          concept:
            "Cidadania envolve dimensões civis, políticas e sociais e formas de participação.",
          q: "Qual situação representa exercício de cidadania para além do voto?",
          o: [
            "participar de conselho comunitário",
            "ignorar decisões públicas",
            "evitar qualquer debate",
            "recusar direitos sociais",
          ],
          c: 0,
          e: "Participação em conselhos e espaços públicos é exercício de cidadania.",
        },
        {
          id: "hum2",
          title: "Urbanização brasileira",
          desc: "Industrialização, êxodo rural e metropolização.",
          concept:
            "A urbanização acelerou com industrialização, transformações no campo e migrações internas.",
          q: "Um fator importante da urbanização brasileira no século XX foi:",
          o: [
            "êxodo rural",
            "fim da indústria",
            "queda absoluta dos serviços",
            "proibição de migrações",
          ],
          c: 0,
          e: "O êxodo rural contribuiu para o crescimento urbano.",
        },
        {
          id: "hum3",
          title: "Globalização",
          desc: "Fluxos globais e desigualdades.",
          concept:
            "Globalização intensifica fluxos econômicos, informacionais e produtivos, sem eliminar fronteiras e desigualdades.",
          q: "Uma característica da globalização contemporânea é:",
          o: [
            "redução de todos os fluxos",
            "intensificação de redes produtivas e informacionais",
            "fim dos Estados",
            "igualdade automática entre países",
          ],
          c: 1,
          e: "Redes e fluxos se intensificam, mas desigualdades permanecem.",
        },
        {
          id: "hum4",
          title: "Trabalho e produção",
          desc: "Divisão do trabalho e mudanças econômicas.",
          concept:
            "A divisão internacional do trabalho distribui atividades e especializações entre economias.",
          q: "A expressão “divisão internacional do trabalho” refere-se à:",
          o: [
            "separação de bairros",
            "distribuição produtiva entre países",
            "divisão dos poderes",
            "grade escolar",
          ],
          c: 1,
          e: "Ela descreve especializações e posições produtivas na economia mundial.",
        },
        {
          id: "hum5",
          boss: true,
          title: "Chefe: Humanas base",
          desc: "Checkpoint de interpretação social.",
          concept:
            "Conecte processos históricos, sociais, políticos e econômicos sem reduzir fenômenos a uma causa única.",
          q: "Eleições periódicas em democracias representativas têm como função:",
          o: [
            "eliminar conflitos",
            "renovar representação política",
            "substituir leis automaticamente",
            "impedir participação social",
          ],
          c: 1,
          e: "Eleições renovam mandatos e representantes.",
        },
      ],
    },
    ling: {
      icon: "¶",
      title: "Linguagens",
      units: [
        {
          id: "ling1",
          title: "Tese e argumento",
          desc: "Encontre o ponto central defendido por um texto.",
          concept:
            "A tese é a posição central; argumentos são razões, dados ou relações usadas para sustentá-la.",
          q: "Em um artigo de opinião, a tese corresponde principalmente:",
          o: [
            "ao ponto de vista defendido",
            "à fonte bibliográfica",
            "ao título",
            "a qualquer exemplo",
          ],
          c: 0,
          e: "A tese organiza o posicionamento do texto.",
        },
        {
          id: "ling2",
          title: "Coesão",
          desc: "Entenda o papel dos conectores.",
          concept:
            "Conectores explicitam relações como causa, contraste, consequência e conclusão.",
          q: "“Contudo” costuma introduzir:",
          o: ["adição", "contraste", "causa", "exemplo"],
          c: 1,
          e: "“Contudo” marca oposição ou contraste.",
        },
        {
          id: "ling3",
          title: "Inferência",
          desc: "Leia o que o texto sugere sem inventar informação.",
          concept:
            "Inferir é construir uma conclusão sustentada por pistas do texto e pelo contexto.",
          q: "Uma inferência válida deve:",
          o: [
            "contradizer o texto",
            "ser sustentada por pistas textuais",
            "depender só de opinião pessoal",
            "ignorar contexto",
          ],
          c: 1,
          e: "A inferência precisa ser justificável por evidências do texto.",
        },
        {
          id: "ling4",
          title: "Figuras de linguagem",
          desc: "Reconheça efeitos de sentido.",
          concept:
            "Figuras organizam efeitos expressivos; personificação atribui traços humanos a seres não humanos.",
          q: "“A cidade acordou nervosa” contém:",
          o: ["personificação", "onomatopeia", "eufemismo", "pleonasmo"],
          c: 0,
          e: "A cidade recebe uma característica humana.",
        },
        {
          id: "ling5",
          boss: true,
          title: "Chefe: Linguagens base",
          desc: "Checkpoint de leitura e argumentação.",
          concept:
            "Leia objetivo, gênero e contexto antes de nomear recursos linguísticos.",
          q: "Informação explícita é aquela que:",
          o: [
            "está declarada diretamente",
            "depende de adivinhação",
            "existe fora do texto",
            "só aparece por ironia",
          ],
          c: 0,
          e: "Explícita significa apresentada diretamente no texto.",
        },
      ],
    },
    red: {
      icon: "✎",
      title: "Redação",
      units: [
        {
          id: "red1",
          title: "Tese forte",
          desc: "Transforme tema em posição argumentável.",
          concept:
            "Uma tese funcional responde ao problema e antecipa o caminho dos argumentos.",
          q: "Qual tese é mais adequada a um texto sobre desinformação científica?",
          o: [
            "A ciência existe.",
            "A desinformação científica se mantém por baixa alfabetização midiática e circulação irresponsável de conteúdo, exigindo educação e responsabilização.",
            "Redes sociais são legais.",
            "O tema é importante.",
          ],
          c: 1,
          e: "Ela apresenta posição e dois eixos que podem ser desenvolvidos.",
        },
        {
          id: "red2",
          title: "Desenvolvimento",
          desc: "Monte parágrafo com função clara.",
          concept:
            "Um desenvolvimento pode usar tópico frasal, explicação, repertório pertinente e ligação com a tese.",
          q: "Qual elemento evita que repertório vire “nome jogado”?",
          o: [
            "explicar sua relação com o argumento",
            "usar autor famoso sempre",
            "colocar aspas",
            "aumentar o tamanho da frase",
          ],
          c: 0,
          e: "O repertório precisa ser produtivo, isto é, contribuir para o raciocínio.",
        },
        {
          id: "red3",
          title: "Coesão na redação",
          desc: "Faça as ideias conversarem.",
          concept:
            "Coesão não é decorar conectivos; é explicitar relações lógicas entre frases e parágrafos.",
          q: "Para introduzir consequência, um conector adequado é:",
          o: ["por conseguinte", "embora", "por exemplo", "por outro lado"],
          c: 0,
          e: "“Por conseguinte” indica consequência/conclusão.",
        },
        {
          id: "red4",
          title: "Intervenção",
          desc: "Construa proposta concreta e relacionada ao problema.",
          concept:
            "Uma revisão útil procura agente, ação, meio/modo, finalidade e detalhamento, respeitando os direitos humanos.",
          q: "Qual opção apresenta agente e ação?",
          o: [
            "É necessário melhorar.",
            "O Ministério da Educação deve ampliar programas de educação midiática nas escolas.",
            "Logo, existe um problema.",
            "Tal questão é difícil.",
          ],
          c: 1,
          e: "Há agente definido e ação concreta.",
        },
        {
          id: "red5",
          boss: true,
          title: "Chefe: Arquitetura da redação",
          desc: "Checkpoint da estrutura argumentativa.",
          concept:
            "O texto precisa manter tema, tese, argumentos conectados e intervenção coerente.",
          q: "Se a conclusão propõe uma ação sem relação com os argumentos anteriores, o principal problema é:",
          o: [
            "falta de coerência",
            "excesso de parágrafos",
            "uso de título",
            "presença de repertório",
          ],
          c: 0,
          e: "A intervenção deve responder aos problemas discutidos no desenvolvimento.",
        },
      ],
    },
  };
  function ensureEnergy() {
    const k = dayKey();
    if (s.course.energy.date !== k) {
      s.course.energy = { date: k, value: 5 };
      save();
    }
    return s.course.energy.value;
  }
  function trailList() {
    return trails[s.course.track]?.units || trails.mat.units;
  }
  function trailUnlocked(i, list = trailList()) {
    return i === 0 || !!s.course.done[list[i - 1].id];
  }
  function trailProgress() {
    const all = Object.values(trails).flatMap((t) => t.units),
      done = all.filter((x) => s.course.done[x.id]).length;
    return {
      done,
      total: all.length,
      pct: Math.round((done / all.length) * 100),
    };
  }
  function renderTrails() {
    ensureEnergy();
    const switcher = $("#trailSwitch");
    if (!switcher) return;
    switcher.innerHTML = Object.entries(trails)
      .map(
        ([k, t]) =>
          '<button class="' +
          (s.course.track === k ? "on" : "") +
          '" data-track="' +
          k +
          '">' +
          t.icon +
          " " +
          t.title +
          "</button>",
      )
      .join("");
    $$("[data-track]", switcher).forEach(
      (b) =>
        (b.onclick = () => {
          s.course.track = b.dataset.track;
          save();
          trailSession = null;
          renderTrails();
        }),
    );
    const list = trailList(),
      prog = trailProgress(),
      energy = ensureEnergy();
    $("#energy").textContent = energy;
    $("#energy").parentElement.classList.toggle("energy-low", energy <= 1);
    $("#trailDone").textContent = prog.done;
    $("#trailMastery").textContent = prog.pct;
    const next = list.findIndex(
      (x, i) => !s.course.done[x.id] && trailUnlocked(i, list),
    );
    const nextIndex = next < 0 ? list.length - 1 : next;
    $("#trailHeadline").textContent = prog.done
      ? prog.done + " de " + prog.total + " lições concluídas"
      : "Escolha uma área e comece";
    $("#trailSub").textContent = energy
      ? "Complete uma lição curta e ganhe XP."
      : "Revise um flashcard com acerto para recuperar energia e continuar.";
    $("#trailMap").innerHTML =
      '<div class="unit-head"><span>TRILHA · ' +
      areaNames[s.course.track].toUpperCase() +
      '</span><h3>Fundamentos que mais destravam questões</h3></div><div class="lesson-path">' +
      list
        .map((l, i) => {
          const done = !!s.course.done[l.id],
            unlocked = trailUnlocked(i, list),
            current = i === nextIndex && !done;
          return (
            '<button class="lesson-node ' +
            (l.boss ? "boss " : "") +
            (done
              ? "done "
              : current
                ? "current "
                : !unlocked
                  ? "locked "
                  : "") +
            '" data-lesson="' +
            l.id +
            '" ' +
            (!unlocked ? "disabled" : "") +
            ' aria-label="' +
            escapeHTML(l.title) +
            '"><b>' +
            (done ? "✓" : l.boss ? "★" : i + 1) +
            "</b><small>" +
            escapeHTML(l.title) +
            "</small></button>"
          );
        })
        .join("") +
      "</div>";
    $$("[data-lesson]", $("#trailMap")).forEach(
      (b) => (b.onclick = () => selectLesson(b.dataset.lesson)),
    );
    const selected =
      (trailSession?.lessonId &&
        list.find((x) => x.id === trailSession.lessonId)) ||
      list[nextIndex];
    if (selected) selectLesson(selected.id, false);
  }
  function renderTrailProgress() {
    const prog = trailProgress();
    $("#energy").textContent = ensureEnergy();
    $("#trailDone").textContent = prog.done;
    $("#trailMastery").textContent = prog.pct;
    $("#trailHeadline").textContent =
      prog.done + " de " + prog.total + " lições concluídas";
    $$("[data-lesson]").forEach((b) => {
      if (s.course.done[b.dataset.lesson]) {
        b.classList.add("done");
        b.querySelector("b").textContent = "✓";
      }
    });
  }
  function selectLesson(id, reset = true) {
    const lesson = trailList().find((x) => x.id === id);
    if (!lesson) return;
    if (reset || !trailSession || trailSession.lessonId !== id)
      trailSession = { lessonId: id, answered: false };
    $("#lessonTitle").textContent = lesson.title;
    $("#lessonDesc").textContent = lesson.desc;
    $("#lessonBody").innerHTML =
      '<div class="lesson-preview"><p><b>Ideia-chave:</b> ' +
      escapeHTML(lesson.concept) +
      "</p></div>" +
      (s.course.done[id]
        ? '<div class="trail-result"><strong>Concluída ✓</strong><br><span class="muted">Você pode repetir a lição sem perder o progresso.</span></div>'
        : "");
    const btn = $("#startLesson");
    btn.disabled = false;
    btn.textContent = s.course.done[id] ? "Repetir lição" : "Começar lição";
    btn.onclick = () => startTrailLesson(lesson);
  }
  function startTrailLesson(lesson) {
    if (ensureEnergy() <= 0 && !s.course.done[lesson.id]) {
      toast("Revise um flashcard com acerto para recuperar energia.");
      activateTab("flashcards");
      return;
    }
    trailSession = { lessonId: lesson.id, answered: false };
    $("#lessonBody").innerHTML =
      '<div class="lesson-preview"><p><b>Resumo:</b> ' +
      escapeHTML(lesson.concept) +
      '</p></div><div class="lesson-question"><span class="eyebrow">DESAFIO</span><h4>' +
      escapeHTML(lesson.q) +
      "</h4>" +
      lesson.o
        .map(
          (o, i) =>
            '<button class="lesson-option" data-lo="' +
            i +
            '">' +
            String.fromCharCode(65 + i) +
            ") " +
            escapeHTML(o) +
            "</button>",
        )
        .join("") +
      '<p class="muted" id="lessonExplain"></p></div>';
    $("#startLesson").disabled = true;
    $("#startLesson").textContent = "Resolva o desafio";
    $$("[data-lo]", $("#lessonBody")).forEach(
      (b) => (b.onclick = () => answerTrailLesson(lesson, +b.dataset.lo)),
    );
  }
  function answerTrailLesson(lesson, choice) {
    if (trailSession?.answered) return;
    trailSession.answered = true;
    const correct = choice === lesson.c;
    $$("[data-lo]", $("#lessonBody")).forEach((b, i) => {
      b.disabled = true;
      if (i === lesson.c) b.classList.add("ok");
      else if (i === choice) b.classList.add("no");
    });
    $("#lessonExplain").innerHTML =
      "<b>" + (correct ? "Boa! " : "Revise: ") + "</b>" + escapeHTML(lesson.e);
    if (!correct && !s.course.done[lesson.id])
      s.course.energy.value = Math.max(0, ensureEnergy() - 1);
    if (correct) {
      const first = !s.course.done[lesson.id];
      s.course.done[lesson.id] = true;
      s.area[s.course.track] = Math.min(
        100,
        (s.area[s.course.track] || 35) + (first ? 3 : 0),
      );
      save();
      addXP(
        first ? (lesson.boss ? 35 : 18) : 4,
        first
          ? lesson.boss
            ? "Chefe vencido"
            : "Lição concluída"
          : "Revisão concluída",
      );
      if (first) markDailyStep("trilhas");
      $("#startLesson").disabled = false;
      $("#startLesson").textContent = "Próxima lição";
      $("#startLesson").onclick = () => {
        const list = trailList(),
          i = list.findIndex((x) => x.id === lesson.id),
          n = list[i + 1];
        renderTrails();
        if (n) selectLesson(n.id);
      };
    } else {
      save();
      addXP(1, "Erro transformado em revisão");
      $("#startLesson").disabled = false;
      $("#startLesson").textContent = "Tentar novamente";
      $("#startLesson").onclick = () => startTrailLesson(lesson);
    }
    renderAreas();
    renderTrailProgress();
    const ls = trailList();
    $$("[data-lesson]").forEach((b) => {
      const i = ls.findIndex((l) => l.id === b.dataset.lesson);
      if (trailUnlocked(i, ls)) {
        b.disabled = false;
        b.classList.remove("locked");
      }
    });
    renderBadges();
  }

  function renderAreas() {
    $("#areas").innerHTML = Object.keys(areaNames)
      .map((k) => {
        const list = trails[k].units,
          v = Math.round(
            (list.filter((l) => s.course.done[l.id]).length / list.length) *
              100,
          );
        return (
          '<div class="area-row"><span>' +
          areaNames[k] +
          '</span><div class="progress"><i style="width:' +
          v +
          '%"></i></div><b>' +
          v +
          "%</b></div>"
        );
      })
      .join("");
  }
  renderAreas();
  function renderHeatmap() {
    const box = $("#heatmap");
    let out = "";
    for (let i = 20; i >= 0; i--) {
      let d = new Date();
      d.setDate(d.getDate() - i);
      let n = s.activity[dayKey(d)] || 0,
        cl = n >= 4 ? "a3" : n >= 2 ? "a2" : n ? "a1" : "";
      out +=
        '<i class="' +
        cl +
        '" title="' +
        dayKey(d) +
        " · " +
        n +
        ' atividade(s)"></i>';
    }
    box.innerHTML = out;
  }
  renderHeatmap();
  const badges = [
    [
      "first",
      "Primeiro passo",
      () =>
        Object.values(s.tasks).some(Boolean) || s.answers > 0 || s.focus > 0,
    ],
    ["essay", "Redator", () => s.essays.length >= 1],
    ["focus", "Foco 100", () => s.focus >= 100],
    ["quiz", "50 questões", () => s.answers >= 50],
    ["streak", "7 dias", () => streak() >= 7],
    ["planner", "Plano pronto", () => s.plan.length > 0],
    [
      "review",
      "Revisor",
      () => cards.filter((c) => flashMeta(c.id).stage >= 3).length >= 10,
    ],
    [
      "trail",
      "Explorador",
      () => Object.values(s.course?.done || {}).filter(Boolean).length >= 5,
    ],
  ];
  function renderBadges() {
    $("#badges").innerHTML = badges
      .map(
        ([id, n, ok]) =>
          '<span class="badge ' +
          (ok() ? "on" : "") +
          '">' +
          (ok() ? "◆" : "◇") +
          " " +
          n +
          "</span>",
      )
      .join("");
  }

  function weakestArea() {
    return (
      Object.keys(areaNames).sort(
        (a, b) =>
          (s.profile["d_" + b] || 2) - (s.profile["d_" + a] || 2) ||
          s.area[a] - s.area[b],
      )[0] || "mat"
    );
  }
  function sprintPlan() {
    const k = dayKey();
    let entry = s.daily[k];
    if (!entry?.steps?.length) {
      const steps = [];
      if (s.errors.some((e) => !e.reviewed)) steps.push("erros");
      steps.push("flashcards", "trilhas", "questoes");
      entry = { steps: steps.slice(0, 3), completed: entry?.completed || [] };
      s.daily[k] = entry;
      save();
    }
    const names = {
      erros: ["Revisar um erro", "entenda o raciocínio da resposta"],
      flashcards: [
        "Revisar um flashcard",
        "recupere a resposta antes de virar",
      ],
      trilhas: [
        "Fazer uma lição de " + areaNames[weakestArea()],
        "avance no seu próprio ritmo",
      ],
      questoes: ["Concluir um bloco de questões", "corrija todas as respostas"],
    };
    return entry.steps.map((tab) => ({
      tab,
      label: names[tab][0],
      why: names[tab][1],
      done: entry.completed.includes(tab),
    }));
  }
  function renderSprint() {
    if (!$("#sprintSteps")) return;
    const plan = sprintPlan(),
      done = plan.filter((x) => x.done).length,
      pct = Math.round((done / plan.length) * 100);
    $("#sprintSteps").innerHTML = plan
      .map(
        (x, i) =>
          '<div class="sprint-step ' +
          (x.done ? "complete" : "") +
          '"><span>' +
          (x.done ? "✓" : i + 1) +
          "</span><div><b>" +
          x.label +
          "</b><br>" +
          x.why +
          "</div></div>",
      )
      .join("");
    $("#dailyPct").textContent = pct + "%";
    $("#dailyRing").style.setProperty("--p", pct + "%");
    const next = plan.find((x) => !x.done);
    $("#sprintWhy").textContent = next
      ? "Seu próximo passo: " + next.label.toLowerCase() + "."
      : "Rota concluída! Você pode continuar estudando no seu ritmo.";
    $("#startSprint").textContent = next
      ? "Continuar minha rota"
      : "Revisar flashcards";
    $("#startSprint").onclick = () => {
      if (next?.tab === "trilhas") {
        s.course.track = weakestArea();
        save();
        renderTrails();
      }
      activateTab(next?.tab || "flashcards");
    };
    $("#refreshSprint").onclick = () => {
      const old = s.daily[dayKey()];
      s.daily[dayKey()] = { steps: [], completed: old.completed };
      save();
      renderSprint();
      toast("Rota atualizada com seu progresso preservado.");
    };
  }
  function markDailyStep(tab) {
    if (!tab) return;
    const k = dayKey();
    sprintPlan();
    const entry = s.daily[k];
    if (entry.steps.includes(tab) && !entry.completed.includes(tab)) {
      entry.completed.push(tab);
      save();
      renderSprint();
    }
  }
  function openDiagnostic() {
    const m = $("#diagnosticModal");
    if (!m) return;
    $("#diagMinutes").value = String(s.onboarding.minutes || 20);
    $("#diagGoal").value = s.profile.goal || "";
    $$("[data-diag-area]").forEach(
      (x) => (x.checked = (s.profile["d_" + x.value] || 2) === 3),
    );
    m.classList.add("on");
  }
  function closeDiagnostic() {
    const m = $("#diagnosticModal");
    if (m) m.classList.remove("on");
  }
  $("#openDiagnostic").onclick = openDiagnostic;
  $("#skipDiagnostic").onclick = () => {
    s.onboarding.done = true;
    save();
    closeDiagnostic();
  };
  $("#finishDiagnostic").onclick = () => {
    const mins = +$("#diagMinutes").value,
      weak = $$("[data-diag-area]:checked").map((x) => x.value);
    s.onboarding = { done: true, minutes: mins };
    s.profile.goal = $("#diagGoal").value.trim().slice(0, 80);
    s.profile.hours = Math.max(3, Math.round((mins * 7) / 60));
    Object.keys(areaNames).forEach(
      (k) => (s.profile["d_" + k] = weak.includes(k) ? 3 : 2),
    );
    s.course.track = weak[0] || "mat";
    save();
    $("#hours").value = s.profile.hours;
    $("#hoursOut").textContent = s.profile.hours + "h";
    renderGreeting();
    renderAreas();
    renderTrails();
    renderSprint();
    closeDiagnostic();
    toast("Rota criada. Comece pela trilha recomendada.");
    activateTab("trilhas");
  };
  renderSprint();
  function missionIndex() {
    const d = new Date();
    return (d.getDate() + d.getMonth() * 31) % missions.length;
  }
  const missions = [
    [
      "12 questões + correção",
      "Resolva 12 questões e transforme cada erro em uma frase do tipo “eu errei porque…”.",
      "questoes",
    ],
    [
      "1 desenvolvimento de redação",
      "Escreva um parágrafo com tópico frasal, argumento, repertório e fechamento.",
      "redacao",
    ],
    [
      "Revisão de 20 minutos",
      "Recupere um conteúdo sem olhar, confira e registre o que esqueceu.",
      "flashcards",
    ],
    [
      "Matemática cronometrada",
      "Faça um bloco curto de porcentagem, razão, função ou estatística.",
      "questoes",
    ],
    [
      "Repertório útil",
      "Escolha um repertório e escreva duas formas de conectá-lo a temas diferentes.",
      "redacao",
    ],
  ];
  function renderMission() {
    const m = missions[missionIndex()],
      done = !!s.tasks["mission-" + dayKey()];
    $("#mission").textContent = m[0];
    $("#missionText").textContent = m[1];
    const b = $("#finishMission");
    b.disabled = done;
    b.textContent = done ? "Concluída ✓" : "Marcar como feita";
    $("#openMission").onclick = () => activateTab(m[2]);
  }
  renderMission();
  $("#finishMission").onclick = () => {
    if (s.tasks["mission-" + dayKey()]) return;
    s.tasks["mission-" + dayKey()] = true;
    save();
    addXP(20, "Missão concluída");
    markDailyStep();
    renderMission();
  };
  $("#profileName").value = s.profile.name || "";
  $("#profileGoal").value = s.profile.goal || "";
  $("#hours").value = s.profile.hours || 12;
  $("#hoursOut").textContent = (s.profile.hours || 12) + "h";
  $("#saveProfile").onclick = () => {
    s.profile.name = $("#profileName").value.trim().slice(0, 40);
    s.profile.goal = $("#profileGoal").value.trim().slice(0, 80);
    s.profile.hours = +$(" #hours".trim()).value;
    save();
    toast("Meta salva neste navegador.");
    renderGreeting();
  };
  function renderGreeting() {
    const name = s.profile.name ? `, ${s.profile.name}` : "";
    $("#greeting").textContent = "Bora" + name + "?";
    $("#goalLabel").textContent =
      s.profile.goal ||
      "Defina uma meta de curso ou nota para deixar seu estudo mais concreto.";
  }
  renderGreeting();
  $("#hours").oninput = (e) =>
    ($("#hoursOut").textContent = e.target.value + "h");
  const diffIds = ["ling", "hum", "nat", "mat", "red"];
  diffIds.forEach((k) => {
    const el = $('[data-d="' + k + '"]');
    if (el && s.profile["d_" + k]) el.value = s.profile["d_" + k];
  });
  function renderPlan() {
    const days = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
    if (!s.plan.length) {
      $("#week").innerHTML =
        '<div class="panel empty" style="grid-column:1/-1">Gere seu plano para começar. Ele ficará salvo neste dispositivo.</div>';
      return;
    }
    $("#week").innerHTML = days
      .map(
        (d, di) =>
          '<div class="day-card"><h4>' +
          d +
          "</h4>" +
          s.plan
            .filter((_, i) => i % 7 === di)
            .map(
              (t) =>
                '<label class="task"><input type="checkbox" data-task="' +
                t.id +
                '" ' +
                (t.done ? "checked" : "") +
                "><span><b>" +
                escapeHTML(t.name) +
                "</b><br>" +
                escapeHTML(t.type) +
                " · " +
                t.minutes +
                " min</span></label>",
            )
            .join("") +
          "</div>",
      )
      .join("");
    $$("[data-task]").forEach(
      (c) =>
        (c.onchange = () => {
          const t = s.plan.find((x) => x.id === c.dataset.task);
          if (!t) return;
          t.done = c.checked;
          s.tasks["plan-" + t.id] = c.checked;
          if (c.checked && !t.rewarded) {
            t.rewarded = true;
            s.area[t.a] = Math.min(100, (s.area[t.a] || 35) + 2);
            addXP(8, "Sessão concluída");
            markDailyStep();
          }
          save();
          renderAreas();
          renderMetrics();
        }),
    );
  }
  $("#generatePlan").onclick = () => {
    const h = +$("#hours").value,
      d = {};
    diffIds.forEach((k) => {
      d[k] = +$('[data-d="' + k + '"]').value;
      s.profile["d_" + k] = d[k];
    });
    s.profile.hours = h;
    const types = ["Questões", "Teoria ativa", "Revisão de erros"];
    s.plan = KaloreCore.planAreas(h, d).map((a, i) => ({
      id: crypto.randomUUID(),
      a,
      name: areaNames[a],
      type:
        a === "red"
          ? i % 2
            ? "Planejamento + repertório"
            : "Escrita e revisão"
          : types[i % 3],
      minutes: 30,
      done: false,
      rewarded: false,
    }));
    save();
    renderPlan();
    renderBadges();
    toast("Plano criado: " + h + " horas em " + s.plan.length + " sessões.");
  };
  $("#clearPlan").onclick = () => {
    if (confirm("Apagar o plano semanal atual?")) {
      s.plan = [];
      save();
      renderPlan();
      toast("Plano apagado.");
    }
  };
  renderPlan();
  const themes = [
    [
      "Desafios para combater a desinformação científica no Brasil",
      "Discuta alfabetização científica, responsabilidade de plataformas, educação e acesso a fontes confiáveis.",
    ],
    [
      "Caminhos para reduzir a exclusão digital entre brasileiros",
      "Considere acesso, qualidade da conexão, formação digital e desigualdades regionais e socioeconômicas.",
    ],
    [
      "Desafios para valorizar o trabalho de cuidado no Brasil",
      "Analise reconhecimento social, divisão desigual do cuidado e políticas de apoio.",
    ],
    [
      "Estratégias para enfrentar a insegurança alimentar no Brasil",
      "Relacione renda, acesso, desperdício, produção de alimentos e políticas públicas.",
    ],
    [
      "O papel da educação midiática na formação cidadã de jovens",
      "Discuta leitura crítica, redes sociais, participação pública e responsabilidade informacional.",
    ],
    [
      "Caminhos para ampliar o acesso à leitura no Brasil",
      "Considere bibliotecas, formação de leitores, desigualdade territorial e mediação de leitura.",
    ],
    [
      "Desafios para promover mobilidade urbana sustentável nas cidades brasileiras",
      "Relacione transporte público, planejamento urbano, acessibilidade e impactos ambientais.",
    ],
    [
      "Estratégias para combater o abandono escolar entre jovens brasileiros",
      "Considere renda, trabalho, acolhimento escolar, saúde, território e políticas de permanência.",
    ],
  ];
  $("#theme").innerHTML = themes
    .map((x, i) => '<option value="' + i + '">' + x[0] + "</option>")
    .join("");
  function showTheme(i) {
    i = Math.min(themes.length - 1, Math.max(0, i));
    s.themeIndex = i;
    s.draftTheme = themes[i][0];
    save();
    $("#theme").value = String(i);
    $("#prompt").innerHTML =
      "<b>" + escapeHTML(themes[i][0]) + "</b><br>" + escapeHTML(themes[i][1]);
  }
  if (s.draftTheme && !themes.some((x) => x[0] === s.draftTheme)) {
    themes.push([
      s.draftTheme,
      "Tema escolhido no Radar. Desenvolva uma tese e consulte as fontes para fundamentar o texto.",
    ]);
    const option = document.createElement("option");
    option.value = themes.length - 1;
    option.textContent = s.draftTheme;
    $("#theme").append(option);
  }
  showTheme(
    s.draftTheme
      ? Math.max(
          0,
          themes.findIndex((x) => x[0] === s.draftTheme),
        )
      : s.themeIndex || 0,
  );
  $("#theme").onchange = (e) => showTheme(+e.target.value);
  $("#randomTheme").onclick = () =>
    showTheme(Math.floor(Math.random() * themes.length));
  $("#essay").value = s.draft || "";
  function essayStats() {
    const t = $("#essay").value.trim(),
      words = t ? t.split(/\s+/).filter(Boolean) : [],
      paras = t ? t.split(/\n+/).filter(Boolean) : [];
    $("#wordCount").textContent = words.length;
    $("#paraCount").textContent = paras.length;
    s.draft = $("#essay").value;
    save();
  }
  $("#essay").addEventListener("input", essayStats);
  essayStats();
  function analyzeEssay() {
    if (!$("#essay").value.trim()) {
      toast("Escreva seu texto antes de diagnosticar.");
      return { score: 0, checks: [], words: 0, paras: 0 };
    }
    const t = $("#essay").value.trim(),
      low = t.toLowerCase(),
      words = t ? t.split(/\s+/) : [],
      paras = t ? t.split(/\n+/).filter(Boolean) : [];
    const connectives = [
      "além disso",
      "contudo",
      "porém",
      "portanto",
      "assim",
      "desse modo",
      "dessa forma",
      "nesse sentido",
      "em contrapartida",
      "consequentemente",
    ].filter((x) => low.includes(x));
    const formal =
      !/\b(vc|pq|tipo assim|mano|kkk|tbm)\b/i.test(t) &&
      !/!{3,}|\?{3,}/.test(t);
    const repertoire = [
      "constituição",
      "ibge",
      "onu",
      "unesco",
      "paulo freire",
      "milton santos",
      "machado de assis",
      "declaração universal",
      "estatuto",
      "lei nº",
      "segundo o",
    ].some((x) => low.includes(x));
    const thesis =
      /(é necessário|é preciso|torna-se|deve-se|é fundamental|desafio|problema|diante desse cenário)/i.test(
        t,
      );
    const agent =
      /(governo|estado|ministério|secretaria|escola|sociedade|empresas|mídia|prefeitura|poder público)/i.test(
        t,
      );
    const action =
      /(deve|precisa|pode|promover|criar|implementar|ampliar|garantir|fiscalizar|oferecer)/i.test(
        t,
      );
    const means =
      /(por meio de|mediante|através de|com a criação|com o objetivo|a fim de|para que)/i.test(
        t,
      );
    const checks = [
      [
        "Estrutura",
        words.length >= 230 && paras.length >= 4,
        "Há extensão e divisão suficientes para uma revisão estrutural.",
        "Tente chegar a uma estrutura completa, com introdução, desenvolvimento(s) e conclusão.",
      ],
      [
        "Tese",
        thesis,
        "Há sinal de posicionamento/tese explícita.",
        "Deixe seu posicionamento mais explícito na introdução.",
      ],
      [
        "Argumentação",
        paras.length >= 4 && repertoire,
        "Há indícios de desenvolvimento com repertório.",
        "Inclua repertório pertinente e explique a ligação dele com seu argumento.",
      ],
      [
        "Coesão",
        connectives.length >= 3,
        "Há variedade mínima de conectores.",
        "Use conectores para explicitar causa, contraste, consequência e conclusão.",
      ],
      [
        "Intervenção",
        agent && action && means,
        "Há sinais de agente, ação e meio/finalidade.",
        "Revise a proposta: agente + ação + meio/modo + finalidade + detalhamento.",
      ],
      [
        "Registro formal",
        formal,
        "Não detectei marcas informais óbvias.",
        "Revise abreviações, oralidade e pontuação excessiva.",
      ],
    ];
    let passed = checks.filter((x) => x[1]).length,
      score = Math.round((passed / checks.length) * 100);
    $("#coachScore").innerHTML =
      passed + "<small> de " + checks.length + " sinais encontrados</small>";
    $("#feedback").innerHTML = checks
      .map(
        (x) =>
          '<div class="feedback ' +
          (x[1] ? "good" : "warn") +
          '"><b>' +
          (x[1] ? "✓ " : "△ ") +
          x[0] +
          "</b><br>" +
          (x[1] ? x[2] : x[3]) +
          "</div>",
      )
      .join("");
    $("#competencies").innerHTML =
      '<p class="muted small-copy">Esta checagem usa palavras e estrutura. Ela não avalia profundidade, pertinência do repertório nem atribui pontos às competências. Revise com a cartilha oficial.</p>';
    toast("Diagnóstico local concluído. Ele não é uma nota oficial do ENEM.");
    return { score, checks, words: words.length, paras: paras.length };
  }
  $("#analyzeEssay").onclick = analyzeEssay;
  $("#saveEssay").onclick = () => {
    const text = $("#essay").value.trim();
    if (!text) {
      toast("Escreva algo antes de salvar.");
      return;
    }
    const themeTitle = themes[+$("#theme").value][0];
    if (s.essays[0]?.text === text && s.essays[0]?.theme === themeTitle) {
      toast("Esta versão já foi salva. Edite o texto para criar uma nova.");
      return;
    }
    const repeated = s.essays.some((e) => e.text === text);
    const a = analyzeEssay();
    s.essays.unshift({
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      theme: themes[+$("#theme").value][0],
      themeIndex: +$("#theme").value,
      text,
      diagnostic: a.score,
    });
    s.essays = s.essays.slice(0, 30);
    save();
    addXP(repeated ? 0 : 40, "Redação salva");
    markDailyStep();
    renderEssayHistory();
    renderBadges();
  };
  function renderEssayHistory() {
    const box = $("#essayHistory");
    if (!s.essays.length) {
      box.innerHTML = '<p class="muted">Nenhuma versão salva ainda.</p>';
      return;
    }
    box.innerHTML = s.essays
      .slice(0, 8)
      .map(
        (e) =>
          '<div class="history-item"><strong>' +
          escapeHTML(e.theme) +
          "</strong><small>" +
          fmtDate(e.date) +
          " · checagem estrutural " +
          (e.diagnostic ?? "—") +
          '/100</small><div class="history-actions"><button class="btn tiny" data-load-essay="' +
          e.id +
          '">Abrir</button><button class="btn tiny danger" data-delete-essay="' +
          e.id +
          '">Excluir</button></div></div>',
      )
      .join("");
    $$("[data-load-essay]").forEach(
      (b) =>
        (b.onclick = () => {
          const e = s.essays.find((x) => x.id === b.dataset.loadEssay);
          if (!e) return;
          $("#essay").value = e.text;
          (() => {
            let i = themes.findIndex((t) => t[0] === e.theme);
            if (i < 0) {
              themes.push([e.theme, "Tema salvo no seu histórico de treino."]);
              i = themes.length - 1;
              const o = document.createElement("option");
              o.value = i;
              o.textContent = e.theme;
              $("#theme").append(o);
            }
            showTheme(i);
          })();
          essayStats();
          toast("Versão carregada.");
          window.scrollTo({
            top: $("#redacao").offsetTop - 80,
            behavior: "smooth",
          });
        }),
    );
    $$("[data-delete-essay]").forEach(
      (b) =>
        (b.onclick = () => {
          s.essays = s.essays.filter((x) => x.id !== b.dataset.deleteEssay);
          save();
          renderEssayHistory();
          renderMetrics();
        }),
    );
  }
  renderEssayHistory();
  $("#exportEssay").onclick = () =>
    download(
      "redacao-enem-" + dayKey() + ".txt",
      themes[+$("#theme").value][0] + "\n\n" + $("#essay").value,
      "text/plain",
    );
  $("#copyAIPrompt").onclick = async () => {
    const text = $("#essay").value.trim();
    if (!text) {
      toast("Escreva a redação primeiro.");
      return;
    }
    const prompt =
      "Atue como revisor pedagógico de redação no modelo ENEM. Tema: " +
      themes[+$("#theme").value][0] +
      ". Analise meu texto pelas cinco competências oficiais, aponte evidências concretas, problemas e uma prioridade de revisão por competência. Não invente dados nem trate a avaliação como nota oficial. Texto:\n\n" +
      text;
    try {
      await navigator.clipboard.writeText(prompt);
      toast("Prompt de revisão copiado. Cole na IA que você preferir.");
    } catch (e) {
      download("prompt-correcao.txt", prompt, "text/plain");
    }
  };
  const questions = [
    {
      id: "m1",
      a: "mat",
      q: "Um produto de R$ 250 recebe desconto de 20%. Qual é o preço final?",
      o: ["R$ 180", "R$ 190", "R$ 200", "R$ 210"],
      c: 2,
      e: "20% de 250 = 50. Então 250 − 50 = R$ 200.",
    },
    {
      id: "m2",
      a: "mat",
      q: "Se f(x)=2x+3, qual é o valor de f(5)?",
      o: ["8", "10", "11", "13"],
      c: 3,
      e: "Substituindo x por 5: 2·5+3=13.",
    },
    {
      id: "m3",
      a: "mat",
      q: "Uma turma tem 18 meninas e 12 meninos. A fração de meninas na turma é:",
      o: ["2/5", "3/5", "3/4", "5/6"],
      c: 1,
      e: "São 30 estudantes; 18/30 simplifica para 3/5.",
    },
    {
      id: "m4",
      a: "mat",
      q: "A média de 6, 8, 9 e 7 é:",
      o: ["7", "7,5", "8", "8,5"],
      c: 1,
      e: "(6+8+9+7)/4 = 30/4 = 7,5.",
    },
    {
      id: "m5",
      a: "mat",
      q: "Uma escala 1:50.000 indica que 2 cm no mapa correspondem a:",
      o: ["100 m", "500 m", "1 km", "10 km"],
      c: 2,
      e: "2×50.000 cm = 100.000 cm = 1 km.",
    },
    {
      id: "n1",
      a: "nat",
      q: "Na fotossíntese, a energia luminosa é convertida principalmente em energia:",
      o: ["química", "nuclear", "sonora", "gravitacional"],
      c: 0,
      e: "A energia é armazenada em ligações químicas de moléculas orgânicas.",
    },
    {
      id: "n2",
      a: "nat",
      q: "Pela lei de Ohm, dobrando a resistência e mantendo a tensão constante, a corrente:",
      o: ["dobra", "cai pela metade", "não muda", "quadruplica"],
      c: 1,
      e: "I=V/R; com R duas vezes maior, I cai à metade.",
    },
    {
      id: "n3",
      a: "nat",
      q: "A principal função das hemácias está relacionada ao transporte de:",
      o: ["oxigênio", "hormônios", "anticorpos", "enzimas digestivas"],
      c: 0,
      e: "A hemoglobina das hemácias participa do transporte de oxigênio.",
    },
    {
      id: "n4",
      a: "nat",
      q: "Em uma cadeia alimentar, organismos que produzem matéria orgânica a partir de fontes inorgânicas são:",
      o: ["decompositores", "consumidores", "produtores", "parasitas"],
      c: 2,
      e: "Produtores, como plantas e algas, formam a base de muitas cadeias alimentares.",
    },
    {
      id: "n5",
      a: "nat",
      q: "Uma solução com pH 3 é, em relação a uma solução de pH 5:",
      o: ["menos ácida", "mais ácida", "neutra", "necessariamente básica"],
      c: 1,
      e: "Quanto menor o pH, maior a acidez; a escala é logarítmica.",
    },
    {
      id: "h1",
      a: "hum",
      q: "A urbanização brasileira no século XX esteve fortemente associada a:",
      o: [
        "êxodo rural e industrialização",
        "fim das migrações",
        "retorno generalizado ao campo",
        "redução do setor de serviços",
      ],
      c: 0,
      e: "Industrialização e transformações no campo estimularam a migração para cidades.",
    },
    {
      id: "h2",
      a: "hum",
      q: "Cidadania envolve, em sentido amplo:",
      o: [
        "somente votar",
        "direitos e deveres sociais e políticos",
        "apenas nacionalidade",
        "somente deveres fiscais",
      ],
      c: 1,
      e: "Cidadania articula direitos civis, políticos e sociais, além de responsabilidades.",
    },
    {
      id: "h3",
      a: "hum",
      q: "A divisão internacional do trabalho descreve principalmente:",
      o: [
        "a separação de bairros de uma cidade",
        "a distribuição de funções produtivas entre países",
        "a divisão de poderes do Estado",
        "a separação de disciplinas escolares",
      ],
      c: 1,
      e: "O conceito trata da especialização e da distribuição da produção entre economias.",
    },
    {
      id: "h4",
      a: "hum",
      q: "Em uma democracia representativa, eleições periódicas servem, entre outras funções, para:",
      o: [
        "eliminar conflitos sociais",
        "renovar a representação política",
        "substituir todas as leis",
        "impedir participação civil",
      ],
      c: 1,
      e: "Eleições renovam mandatos e representantes; não eliminam conflitos nem outras formas de participação.",
    },
    {
      id: "h5",
      a: "hum",
      q: "A globalização contemporânea é marcada por:",
      o: [
        "isolamento crescente de fluxos",
        "intensificação de fluxos de capitais, informações e mercadorias",
        "fim das desigualdades",
        "desaparecimento de fronteiras jurídicas",
      ],
      c: 1,
      e: "A intensificação de fluxos é uma característica central, embora fronteiras e desigualdades persistam.",
    },
    {
      id: "l1",
      a: "ling",
      q: "Em um texto argumentativo, a tese é:",
      o: [
        "uma lista de fontes",
        "a posição central defendida",
        "o título obrigatório",
        "uma descrição neutra",
      ],
      c: 1,
      e: "A tese é o ponto de vista que será sustentado pelos argumentos.",
    },
    {
      id: "l2",
      a: "ling",
      q: "A expressão “por outro lado” introduz normalmente uma relação de:",
      o: ["contraste", "causa", "conclusão", "exemplificação"],
      c: 0,
      e: "É um articulador usado para contraste ou contraponto.",
    },
    {
      id: "l3",
      a: "ling",
      q: "Quando uma propaganda usa humor para aproximar uma marca do público, predomina uma função de linguagem ligada a:",
      o: [
        "efeito persuasivo sobre o receptor",
        "descrição científica",
        "definição metalinguística obrigatória",
        "registro documental neutro",
      ],
      c: 0,
      e: "A publicidade tende a organizar recursos para influenciar ou engajar o receptor.",
    },
    {
      id: "l4",
      a: "ling",
      q: "Em “A cidade acordou nervosa”, atribuir estado humano à cidade é exemplo de:",
      o: ["personificação", "eufemismo", "onomatopeia", "pleonasmo"],
      c: 0,
      e: "A personificação atribui características ou ações humanas a seres não humanos.",
    },
    {
      id: "l5",
      a: "ling",
      q: "Uma informação explícita em um texto é aquela que:",
      o: [
        "depende apenas de conhecimento externo",
        "está declarada diretamente",
        "só pode ser inferida por ironia",
        "não aparece no texto",
      ],
      c: 1,
      e: "Informação explícita é expressa diretamente; inferências dependem de pistas e relações.",
    },
  ];
  questions.push(...KaloreContent.questions);
  function shuffle(a) {
    return KaloreCore.shuffle(a);
  }
  function renderQuiz() {
    const box = $("#quiz");
    if (!currentQuiz.length) {
      box.innerHTML =
        '<div class="panel empty">Escolha uma área e comece um bloco de questões autorais.</div>';
      return;
    }
    box.innerHTML = currentQuiz
      .map(
        (q, i) =>
          '<article class="panel question" data-q="' +
          q.id +
          '"><span class="eyebrow">' +
          areaNames[q.a].toUpperCase() +
          " · " +
          String(i + 1).padStart(2, "0") +
          "</span><h3>" +
          escapeHTML(q.q) +
          "</h3>" +
          q.o
            .map(
              (o, j) =>
                '<button class="option" data-j="' +
                j +
                '">' +
                String.fromCharCode(65 + j) +
                ") " +
                escapeHTML(o) +
                "</button>",
            )
            .join("") +
          '<div class="question-explain"><b>Comentário</b><br>' +
          escapeHTML(q.e) +
          "</div></article>",
      )
      .join("");
    $$(".question", box).forEach((card) => {
      $$(".option", card).forEach(
        (btn) => (btn.onclick = () => answerQuestion(card, +btn.dataset.j)),
      );
    });
  }
  function answerQuestion(card, j) {
    if (card.classList.contains("done")) return;
    const q = questions.find((x) => x.id === card.dataset.q);
    card.classList.add("done");
    $$(".option", card).forEach((b, i) => {
      if (i === q.c) b.classList.add("ok");
      else if (i === j) b.classList.add("no");
      b.disabled = true;
    });
    s.answers = (s.answers || 0) + 1;
    quizBlock.answered++;
    if (j === q.c) {
      s.correct = (s.correct || 0) + 1;
      quizBlock.correct++;
      addXP(5, "Resposta correta");
    } else {
      if (!s.errors.some((e) => e.qid === q.id && !e.reviewed))
        s.errors.unshift({
          id: crypto.randomUUID(),
          qid: q.id,
          selected: j,
          date: new Date().toISOString(),
          reviewed: false,
        });
      addXP(2, "Questão revisada");
      renderErrors();
    }
    s.area[q.a] = Math.min(100, (s.area[q.a] || 35) + (j === q.c ? 1 : 0));
    save();
    renderMetrics();
    renderAreas();
    $("#quizScore").textContent = quizBlock.answered
      ? quizBlock.correct +
        "/" +
        quizBlock.answered +
        " · " +
        Math.round((quizBlock.correct / quizBlock.answered) * 100) +
        "%"
      : "—";
    if (quizBlock.answered === currentQuiz.length) {
      markDailyStep("questoes");
      toast(
        "Bloco concluído: " +
          quizBlock.correct +
          "/" +
          quizBlock.answered +
          " acertos.",
      );
    }
  }
  $("#startQuiz").onclick = () => {
    const area = $("#quizArea").value,
      qty = +$("#quizQty").value;
    quizBlock = { answered: 0, correct: 0 };
    $("#quizScore").textContent = "—";
    currentQuiz = shuffle(
      questions.filter((q) => area === "all" || q.a === area),
    ).slice(0, qty);
    renderQuiz();
    toast(
      "Bloco iniciado com " +
        currentQuiz.length +
        " questões. Corrija cada resposta antes de seguir.",
    );
  };
  renderQuiz();
  function renderErrors() {
    const box = $("#errorList"),
      active = s.errors.filter((e) => !e.reviewed);
    $("#errorCount").textContent = active.length;
    if (!active.length) {
      box.innerHTML =
        '<div class="panel empty">Seu caderno de erros está vazio. Quando errar uma questão do Hub, ela aparece aqui para revisão.</div>';
      return;
    }
    box.innerHTML = active
      .map((e) => {
        const q = questions.find((x) => x.id === e.qid);
        if (!q) return "";
        return (
          '<article class="panel error-card"><div><span class="eyebrow">' +
          areaNames[q.a].toUpperCase() +
          "</span><h3>" +
          escapeHTML(q.q) +
          "</h3><p><b>Sua resposta:</b> " +
          escapeHTML(q.o[e.selected] || "—") +
          "<br><b>Correta:</b> " +
          escapeHTML(q.o[q.c]) +
          "<br><b>Por quê:</b> " +
          escapeHTML(q.e) +
          '</p></div><button class="btn tiny" data-review-error="' +
          e.id +
          '">Revisei ✓</button></article>'
        );
      })
      .join("");
    $$("[data-review-error]").forEach(
      (b) =>
        (b.onclick = () => {
          const e = s.errors.find((x) => x.id === b.dataset.reviewError);
          if (!e || e.reviewed) return;
          e.reviewed = true;
          markDailyStep("erros");
          save();
          addXP(4, "Erro revisado");
          renderErrors();
        }),
    );
  }
  renderErrors();
  const cards = [
    [
      "mat",
      "Porcentagem",
      "x% de N = (x/100)·N. Variação percentual compara a diferença com o valor inicial.",
    ],
    [
      "mat",
      "Média aritmética",
      "Some os valores e divida pela quantidade. Em problemas, confira se existe peso diferente.",
    ],
    [
      "mat",
      "Escala",
      "1:n significa 1 unidade no mapa para n unidades reais. Converta as unidades no fim.",
    ],
    [
      "mat",
      "Função afim",
      "f(x)=ax+b. O coeficiente a indica a taxa de variação; b é o valor quando x=0.",
    ],
    ["nat", "Lei de Ohm", "V=R·I. Se V é constante, aumentar R reduz I."],
    [
      "nat",
      "pH",
      "Quanto menor o pH, mais ácida a solução. Cada unidade representa fator 10 na concentração de H⁺.",
    ],
    [
      "nat",
      "Fotossíntese",
      "Converte energia luminosa em energia química armazenada em moléculas orgânicas.",
    ],
    [
      "nat",
      "Cadeia alimentar",
      "Produtores → consumidores → decompositores. Energia diminui ao longo dos níveis tróficos.",
    ],
    [
      "hum",
      "Cidadania",
      "Envolve direitos civis, políticos e sociais e formas de participação na vida coletiva.",
    ],
    [
      "hum",
      "Urbanização brasileira",
      "Industrialização, êxodo rural e crescimento metropolitano marcaram fortemente o século XX.",
    ],
    [
      "hum",
      "Globalização",
      "Intensificação de fluxos de capital, mercadorias, pessoas e informações, com efeitos desiguais.",
    ],
    [
      "hum",
      "Divisão internacional do trabalho",
      "Distribuição de atividades produtivas e especializações entre diferentes economias.",
    ],
    [
      "ling",
      "Tese",
      "É o posicionamento central do texto argumentativo, sustentado pelos argumentos.",
    ],
    [
      "ling",
      "Coesão",
      "Conectivos e retomadas estabelecem relações como causa, contraste, consequência e conclusão.",
    ],
    [
      "ling",
      "Inferência",
      "É uma conclusão construída a partir de pistas do texto, não uma informação declarada literalmente.",
    ],
    [
      "ling",
      "Personificação",
      "Figura de linguagem que atribui características humanas a seres não humanos.",
    ],
    [
      "red",
      "Competência 1",
      "Observa domínio da modalidade escrita formal da língua portuguesa.",
    ],
    [
      "red",
      "Competência 2",
      "Exige compreender a proposta, manter o tema e desenvolver texto dissertativo-argumentativo.",
    ],
    [
      "red",
      "Competência 3",
      "Relaciona seleção, organização e interpretação de informações e argumentos para defender um ponto de vista.",
    ],
    [
      "red",
      "Competência 4",
      "Observa mecanismos linguísticos que articulam as partes da argumentação.",
    ],
    [
      "red",
      "Competência 5",
      "Exige proposta de intervenção relacionada ao problema e que respeite os direitos humanos.",
    ],
    [
      "red",
      "Intervenção completa",
      "Uma boa revisão procura agente, ação, meio/modo, finalidade e detalhamento coerentes com o texto.",
    ],
  ].map((x, i) => ({ id: "f" + i, a: x[0], front: x[1], back: x[2] }));
  function flashMeta(id) {
    const raw = s.flash[id];
    if (raw && typeof raw === "object")
      return {
        stage: raw.stage || 0,
        due: raw.due || dayKey(),
        last: raw.last || "",
        energyDay: raw.energyDay || "",
      };
    if (raw === "mastered") return { stage: 4, due: "2999-12-31", last: "" };
    return { stage: 0, due: dayKey(), last: "" };
  }
  function setFlashReview(id, grade) {
    const m = flashMeta(id),
      days =
        grade === "again"
          ? 0
          : grade === "good"
            ? [1, 3, 7, 14][Math.min(m.stage, 3)]
            : [3, 7, 14, 30][Math.min(m.stage, 3)],
      stage =
        grade === "again"
          ? Math.max(0, m.stage - 1)
          : Math.min(6, m.stage + (grade === "easy" ? 2 : 1));
    const recover = grade !== "again" && m.energyDay !== dayKey();
    s.flash[id] = {
      stage,
      due: KaloreCore.addDays(dayKey(), days),
      last: dayKey(),
      energyDay: recover ? dayKey() : m.energyDay || "",
    };
    if (recover) {
      s.course.energy.value = Math.min(5, ensureEnergy() + 1);
      $("#energy").textContent = s.course.energy.value;
    }
    save();
    addXP(
      grade === "again" ? 1 : grade === "good" ? 3 : 5,
      grade === "easy"
        ? "Revisão fácil concluída"
        : grade === "good"
          ? "Flashcard revisado"
          : undefined,
    );
  }
  function renderFlash() {
    const area = $("#flashArea").value || "all",
      mode = $("#flashMode").value || "due",
      todayKey = dayKey();
    let list = cards.filter((c) => area === "all" || c.a === area);
    if (mode === "due")
      list = list.filter((c) => flashMeta(c.id).due <= todayKey);
    if (mode === "mastered")
      list = list.filter((c) => flashMeta(c.id).stage >= 3);
    list = list
      .sort((x, y) => flashMeta(x.id).due.localeCompare(flashMeta(y.id).due))
      .slice(0, 12);
    $("#flashGrid").innerHTML = list.length
      ? list
          .map((c) => {
            const m = flashMeta(c.id);
            return (
              '<article class="flashcard" tabindex="0" role="button" aria-expanded="false" aria-label="Virar cartão" data-card="' +
              c.id +
              '"><div class="flash-inner"><div class="flash-face"><small>' +
              areaNames[c.a].toUpperCase() +
              "</small><h3>" +
              escapeHTML(c.front) +
              '</h3><span class="muted">Toque para virar</span><span class="flash-due">nível ' +
              m.stage +
              " · revisão " +
              (m.due <= todayKey ? "hoje" : m.due) +
              '</span></div><div class="flash-face flash-back"><small>RESPOSTA</small><p>' +
              escapeHTML(c.back) +
              '</p><div class="flash-actions three"><button class="btn tiny" data-grade="again" data-cardid="' +
              c.id +
              '">Errei</button><button class="btn tiny" data-grade="good" data-cardid="' +
              c.id +
              '">Bom</button><button class="btn tiny primary" data-grade="easy" data-cardid="' +
              c.id +
              '">Fácil</button></div></div></div></article>'
            );
          })
          .join("")
      : '<div class="panel empty" style="grid-column:1/-1">Nada para revisar agora. Você pode abrir “Todos” ou seguir para outra atividade.</div>';
    $$(".flashcard").forEach(
      (card) =>
        (card.onclick = (e) => {
          if (e.target.closest("button")) return;
          card.classList.toggle("flip");
          card.setAttribute("aria-expanded", card.classList.contains("flip"));
        }),
    );
    $$(".flashcard").forEach(
      (card) =>
        (card.onkeydown = (e) => {
          if (e.target !== card) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            card.click();
          }
        }),
    );
    $$("[data-grade]").forEach(
      (btn) =>
        (btn.onclick = () => {
          setFlashReview(btn.dataset.cardid, btn.dataset.grade);
          markDailyStep("flashcards");
          renderFlash();
          renderBadges();
          renderSprint();
        }),
    );
    const mastered = cards.filter((c) => flashMeta(c.id).stage >= 3).length,
      due = cards.filter((c) => flashMeta(c.id).due <= todayKey).length;
    $("#flashStats").textContent =
      due + " hoje · " + mastered + "/" + cards.length + " consolidados";
  }
  $("#flashArea").onchange = renderFlash;
  $("#flashMode").onchange = renderFlash;
  renderFlash();
  function persistTimer() {
    s.focusTimer = {
      seconds: timer.seconds,
      total: timer.total,
      running: timer.running,
      end: timer.end,
    };
    s.focusGoal = $("#focusGoal").value;
    s.focusNote = $("#focusNote").value;
    save();
  }
  function updateClock() {
    const m = Math.floor(timer.seconds / 60),
      ss = timer.seconds % 60;
    $("#clock").textContent =
      String(m).padStart(2, "0") + ":" + String(ss).padStart(2, "0");
    document.title =
      (timer.running ? $("#clock").textContent + " · " : "") +
      "Kaloré ENEM Hub 2026";
  }
  function tick() {
    if (!timer.running) return;
    timer.seconds = Math.max(0, Math.ceil((timer.end - Date.now()) / 1000));
    updateClock();
    if (timer.seconds <= 0) {
      clearInterval(timer.id);
      timer.running = false;
      const mins = Math.round(timer.total / 60);
      s.focus = (s.focus || 0) + mins;
      s.notes.unshift({
        date: new Date().toISOString(),
        goal: $("#focusGoal").value.trim(),
        note: $("#focusNote").value.trim(),
        minutes: mins,
      });
      s.notes = s.notes.slice(0, 30);
      save();
      addXP(Math.max(10, Math.round(mins / 2)), "Sessão de foco concluída");
      timer.seconds = timer.total;
      $("#timerBtn").textContent = "Iniciar";
      updateClock();
      renderFocusHistory();
      persistTimer();
    }
  }
  $("#timerBtn").onclick = () => {
    if (timer.running) {
      clearInterval(timer.id);
      timer.running = false;
      timer.seconds = Math.max(0, Math.ceil((timer.end - Date.now()) / 1000));
      $("#timerBtn").textContent = "Continuar";
      updateClock();
      persistTimer();
      return;
    }
    timer.running = true;
    timer.end = Date.now() + timer.seconds * 1000;
    timer.id = setInterval(tick, 250);
    $("#timerBtn").textContent = "Pausar";
    updateClock();
    persistTimer();
  };
  $("#timerReset").onclick = () => {
    clearInterval(timer.id);
    timer.running = false;
    timer.seconds = timer.total;
    $("#timerBtn").textContent = "Iniciar";
    updateClock();
    persistTimer();
  };
  $$("[data-min]").forEach(
    (b) =>
      (b.onclick = () => {
        if (timer.running) return;
        timer.total = timer.seconds = +b.dataset.min * 60;
        updateClock();
        persistTimer();
      }),
  );
  function renderFocusHistory() {
    $("#focusHistory").innerHTML = s.notes.length
      ? s.notes
          .slice(0, 6)
          .map(
            (n) =>
              '<div class="history-item"><strong>' +
              escapeHTML(n.goal || "Sessão de estudo") +
              "</strong><small>" +
              fmtDate(n.date) +
              " · " +
              n.minutes +
              ' min</small><span class="muted">' +
              escapeHTML(n.note || "") +
              "</span></div>",
          )
          .join("")
      : '<p class="muted">Suas sessões concluídas aparecerão aqui.</p>';
  }
  $("#focusGoal").value = s.focusGoal || "";
  $("#focusNote").value = s.focusNote || "";
  $("#focusGoal").oninput = persistTimer;
  $("#focusNote").oninput = persistTimer;
  Object.assign(timer, s.focusTimer);
  if (timer.running) {
    timer.id = setInterval(tick, 250);
    $("#timerBtn").textContent = "Pausar";
    tick();
  }
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) tick();
  });
  renderFocusHistory();
  updateClock();
  const resources = [
    {
      cat: "oficial",
      title: "Cartilha da Redação ENEM 2026",
      desc: "Documento oficial com as cinco competências, orientações e redações comentadas.",
      url: "https://www.gov.br/inep/pt-br/centrais-de-conteudo/acervo-linha-editorial/publicacoes-institucionais/avaliacoes-e-exames-da-educacao-basica/a-redacao-do-enem-2026-cartilha-do-a-participante",
      tag: "Inep · 2026",
    },
    {
      cat: "oficial",
      title: "Provas e gabaritos do ENEM",
      desc: "Acervo oficial de edições anteriores, incluindo os cadernos por ano.",
      url: "https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem/provas-e-gabaritos",
      tag: "Inep",
    },
    {
      cat: "oficial",
      title: "Matrizes de Referência",
      desc: "Competências e habilidades das áreas avaliadas no ENEM.",
      url: "https://www.gov.br/inep/pt-br/centrais-de-conteudo/acervo-linha-editorial/publicacoes-institucionais/avaliacoes-e-exames-da-educacao-basica/matrizes-de-referencia-enem/",
      tag: "Inep · 2026",
    },
    {
      cat: "oficial",
      title: "Cronograma ENEM 2026",
      desc: "Datas oficiais da aplicação e demais etapas divulgadas pelo Inep.",
      url: "https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem/orientacoes/cronograma",
      tag: "Inep · oficial",
    },
    {
      cat: "oficial",
      title: "Outros documentos do ENEM",
      desc: "Guias, cartilhas e matriz reunidos no portal oficial.",
      url: "https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem/outros-documentos",
      tag: "Inep",
    },
    {
      cat: "livros",
      title: "Portal Domínio Público",
      desc: "Obras literárias e documentos disponibilizados legalmente pelo Governo Federal.",
      url: "https://www.dominiopublico.gov.br/",
      tag: "Acervo público",
    },
    {
      cat: "livros",
      title: "Biblioteca Brasiliana USP",
      desc: "Livros, periódicos, mapas e documentos históricos digitalizados pela USP.",
      url: "https://digital.bbm.usp.br/",
      tag: "USP",
    },
    {
      cat: "livros",
      title: "Wikisource em português",
      desc: "Textos de domínio público e documentos históricos em formato pesquisável.",
      url: "https://pt.wikisource.org/",
      tag: "Domínio público",
    },
    {
      cat: "estudo",
      title: "Khan Academy Brasil",
      desc: "Conteúdos e exercícios gratuitos de matemática e ciências para revisão.",
      url: "https://pt.khanacademy.org/",
      tag: "Gratuito",
    },
  ];
  function renderLibrary() {
    const q = $("#librarySearch").value.toLowerCase().trim(),
      cat = $("#libraryCat").value;
    const list = resources.filter(
      (r) =>
        (cat === "all" || r.cat === cat) &&
        (!q ||
          (r.title + " " + r.desc + " " + r.tag).toLowerCase().includes(q)),
    );
    $("#libraryGrid").innerHTML =
      list
        .map(
          (r) =>
            '<article class="panel resource"><div class="resource-meta"><span class="chip">' +
            escapeHTML(r.tag) +
            "</span></div><h3>" +
            escapeHTML(r.title) +
            "</h3><p>" +
            escapeHTML(r.desc) +
            '</p><a href="' +
            r.url +
            '" target="_blank" rel="noopener noreferrer">Abrir recurso ↗</a></article>',
        )
        .join("") ||
      '<div class="panel empty" style="grid-column:1/-1">Nenhum material neste filtro.</div>';
  }
  $("#librarySearch").oninput = renderLibrary;
  $("#libraryCat").onchange = renderLibrary;
  renderLibrary();
  const checks = {
    before: [
      "Conferir local de prova, horário e rota com antecedência",
      "Separar documento aceito conforme as regras vigentes",
      "Separar canetas permitidas conforme o edital/orientações",
      "Planejar água e alimentação para o período",
      "Ler o cartão de confirmação e as orientações oficiais",
    ],
    during: [
      "Ler as instruções do caderno antes de começar",
      "Controlar o tempo em blocos",
      "Marcar questões demoradas para retornar depois",
      "Reservar tempo suficiente para preencher o gabarito",
      "No primeiro dia, proteger tempo para planejar e revisar a redação",
    ],
  };
  function renderChecks() {
    for (const group of ["before", "during"]) {
      $("#" + group).innerHTML = checks[group]
        .map(
          (x, i) =>
            '<label><input type="checkbox" data-check="' +
            group +
            "-" +
            i +
            '" ' +
            (s.checks[group + "-" + i] ? "checked" : "") +
            "><span>" +
            escapeHTML(x) +
            "</span></label>",
        )
        .join("");
    }
    $$("[data-check]").forEach(
      (c) =>
        (c.onchange = () => {
          s.checks[c.dataset.check] = c.checked;
          save();
          if (c.checked && !s.checkRewards[c.dataset.check]) {
            s.checkRewards[c.dataset.check] = true;
            addXP(2);
            save();
          }
          renderMetrics();
        }),
    );
  }
  renderChecks();
  function download(name, content, type = "application/json") {
    const u = URL.createObjectURL(new Blob([content], { type })),
      a = document.createElement("a");
    a.href = u;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(u), 1000);
  }
  $("#exportData").onclick = () =>
    download(
      "kalore-enem-hub-" + dayKey() + ".json",
      JSON.stringify(
        { version: 4, exportedAt: new Date().toISOString(), state: s },
        null,
        2,
      ),
    );
  $("#importData").onclick = () => $("#importFile").click();
  $("#importFile").onchange = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      if (f.size > 2_000_000) throw new Error("Arquivo muito grande.");
      const d = JSON.parse(await f.text());
      if (
        ![3, 4].includes(d.version) ||
        !d.state ||
        typeof d.state !== "object" ||
        Array.isArray(d.state)
      )
        throw new Error("Use um backup v3 ou v4 do ENEM Hub.");
      s = merge(d.state);
      save();
      location.reload();
    } catch (err) {
      toast(err.message || "Não foi possível importar.");
    } finally {
      e.target.value = "";
    }
  };
  $("#shareBtn").onclick = async () => {
    const data = {
      title: "Kaloré ENEM Hub 2026",
      text: "Plano, redação, questões, flashcards e materiais oficiais para o ENEM 2026.",
      url: location.origin + location.pathname,
    };
    try {
      if (navigator.share) await navigator.share(data);
      else {
        await navigator.clipboard.writeText(data.url);
        toast("Link copiado.");
      }
    } catch (e) {}
  };
  $("#themeToggle").onclick = () => {
    s.theme = s.theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = s.theme;
    save();
  };
  document.documentElement.dataset.theme = s.theme || "dark";
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () =>
      navigator.serviceWorker.register("./sw.js").catch(() => {}),
    );
  }
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    installPrompt = e;
    $("#installBanner").classList.add("on");
  });
  $("#installBtn").onclick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice;
    installPrompt = null;
    $("#installBanner").classList.remove("on");
  };
  $("#dismissInstall").onclick = () =>
    $("#installBanner").classList.remove("on");

  function escapeHTML(x) {
    return String(x ?? "").replace(
      /[&<>'"]/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          "'": "&#39;",
          '"': "&quot;",
        })[c],
    );
  }
  // The blueprint is independent from the draft: exporting it never overwrites the essay.
  $$("[data-blueprint]").forEach((el) => {
    el.value = s.blueprint[el.dataset.blueprint] || "";
    el.oninput = () => {
      s.blueprint[el.dataset.blueprint] = el.value.slice(0, 2000);
      save();
    };
  });
  $("#exportBlueprint").onclick = () =>
    download(
      "roteiro-redacao.txt",
      themes[+$("#theme").value][0] +
        "\n\n" +
        $$("[data-blueprint]")
          .map(
            (el) =>
              el.closest("label").querySelector("span").textContent +
              "\n" +
              el.value,
          )
          .join("\n\n"),
      "text/plain",
    );
  const incoming = new URLSearchParams(location.search).get("tema");
  if (incoming) {
    const clean = incoming.slice(0, 400);
    let index = themes.findIndex((x) => x[0] === clean);
    if (index < 0) {
      themes.push([
        clean,
        "Tema de treino escolhido no Radar. Consulte as fontes, formule sua tese e desenvolva uma proposta de intervenção.",
      ]);
      index = themes.length - 1;
      const option = document.createElement("option");
      option.value = index;
      option.textContent = clean;
      $("#theme").append(option);
    }
    showTheme(index);
    activateTab("redacao", false);
  }
  function renderGuide() {
    const norm = (x) =>
        x
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase(),
      q = norm($("#formulaSearch").value),
      area = $("#formulaArea").value;
    const list = KaloreContent.formulas.filter(
      (x) =>
        (area === "all" || x.a === area) &&
        norm(x.title + " " + x.desc + " " + x.formula).includes(q),
    );
    $("#formulaGrid").innerHTML =
      list
        .map(
          (x) =>
            '<article class="panel formula-card"><span class="eyebrow">' +
            areaNames[x.a] +
            "</span><h3>" +
            escapeHTML(x.title) +
            '</h3><div class="formula-expression">' +
            escapeHTML(x.formula) +
            '</div><p class="muted">' +
            escapeHTML(x.desc) +
            "</p></article>",
        )
        .join("") ||
      '<div class="panel empty">Nenhum item encontrado. Experimente outra palavra.</div>';
  }
  $("#formulaSearch").oninput = renderGuide;
  $("#formulaArea").onchange = renderGuide;
  renderGuide();

  let simRun = null,
    simTick = null;
  try {
    const raw = JSON.parse(sessionStorage.getItem("kalore-sim-run") || "null");
    if (
      raw &&
      Array.isArray(raw.ids) &&
      raw.ids.length &&
      raw.ids.length <= 60 &&
      raw.ids.every((id) => questions.some((q) => q.id === id)) &&
      Array.isArray(raw.choices) &&
      raw.choices.length === raw.ids.length &&
      raw.choices.every(
        (x) => x === null || (Number.isInteger(x) && x >= 0 && x < 4),
      ) &&
      Number.isFinite(raw.end) &&
      Number.isFinite(raw.started) &&
      raw.end > raw.started &&
      raw.end - raw.started <= 10800000
    ) {
      simRun = {
        ids: raw.ids,
        choices: raw.choices,
        flags: Array.isArray(raw.flags)
          ? raw.flags.filter(
              (x) => Number.isInteger(x) && x >= 0 && x < raw.ids.length,
            )
          : [],
        index: Math.min(
          raw.ids.length - 1,
          Math.max(0, Number.isInteger(raw.index) ? raw.index : 0),
        ),
        end: raw.end,
        started: raw.started,
      };
    }
  } catch (e) {}
  function persistSim() {
    try {
      if (simRun)
        sessionStorage.setItem("kalore-sim-run", JSON.stringify(simRun));
      else sessionStorage.removeItem("kalore-sim-run");
    } catch (e) {}
  }
  function simClock() {
    if (!simRun) return;
    const seconds = Math.max(0, Math.ceil((simRun.end - Date.now()) / 1000));
    const el = $("#simClock");
    if (el)
      el.textContent =
        String(Math.floor(seconds / 60)).padStart(2, "0") +
        ":" +
        String(seconds % 60).padStart(2, "0");
    if (seconds === 0) finishSim();
  }
  function renderSim() {
    if (!simRun) return;
    const index = simRun.index,
      q = questions.find((x) => x.id === simRun.ids[index]),
      answered = simRun.choices.filter((x) => x !== null).length;
    $("#startSim").disabled = true;
    $("#simContent").classList.remove("empty");
    $("#simContent").innerHTML =
      '<div class="sim-status"><span>' +
      answered +
      "/" +
      simRun.ids.length +
      ' respondidas</span><b id="simClock" role="timer"></b><button class="btn tiny" id="finishSim">Finalizar</button></div><div class="sim-map">' +
      simRun.ids
        .map(
          (id, i) =>
            '<button class="' +
            (i === index ? "current " : "") +
            (simRun.choices[i] !== null ? "answered " : "") +
            (simRun.flags.includes(i) ? "flagged" : "") +
            '" data-sim-index="' +
            i +
            '" aria-label="Questão ' +
            (i + 1) +
            (simRun.flags.includes(i) ? ", marcada para revisar" : "") +
            '" aria-current="' +
            (i === index ? "step" : "false") +
            '">' +
            (i + 1) +
            "</button>",
        )
        .join("") +
      '</div><article class="sim-question"><span class="eyebrow">' +
      areaNames[q.a] +
      " · QUESTÃO " +
      (index + 1) +
      "</span><h3>" +
      escapeHTML(q.q) +
      "</h3>" +
      q.o
        .map(
          (o, i) =>
            '<button class="option ' +
            (simRun.choices[index] === i ? "selected" : "") +
            '" data-sim-choice="' +
            i +
            '" aria-pressed="' +
            (simRun.choices[index] === i) +
            '">' +
            String.fromCharCode(65 + i) +
            ") " +
            escapeHTML(o) +
            "</button>",
        )
        .join("") +
      '</article><div class="sim-actions"><button class="btn" id="simPrev" ' +
      (index === 0 ? "disabled" : "") +
      '>← Anterior</button><button class="btn" id="simFlag">' +
      (simRun.flags.includes(index)
        ? "Remover marcação"
        : "Marcar para revisar") +
      '</button><button class="btn primary" id="simNext">' +
      (index === simRun.ids.length - 1 ? "Finalizar treino" : "Próxima →") +
      "</button></div>";
    $$("[data-sim-choice]").forEach(
      (b) =>
        (b.onclick = () => {
          simRun.choices[index] = +b.dataset.simChoice;
          persistSim();
          renderSim();
        }),
    );
    $$("[data-sim-index]").forEach(
      (b) =>
        (b.onclick = () => {
          simRun.index = +b.dataset.simIndex;
          persistSim();
          renderSim();
        }),
    );
    $("#simPrev").onclick = () => {
      simRun.index--;
      persistSim();
      renderSim();
    };
    $("#simNext").onclick = () => {
      if (index === simRun.ids.length - 1) {
        finishSim();
        return;
      }
      simRun.index++;
      persistSim();
      renderSim();
    };
    $("#simFlag").onclick = () => {
      simRun.flags = simRun.flags.includes(index)
        ? simRun.flags.filter((x) => x !== index)
        : [...simRun.flags, index];
      persistSim();
      renderSim();
    };
    $("#finishSim").onclick = finishSim;
    simClock();
  }
  function renderSimHistory() {
    $("#simHistory").innerHTML = s.simHistory.length
      ? s.simHistory
          .map(
            (x) =>
              '<div class="history-item"><strong>' +
              x.correct +
              "/" +
              x.total +
              " acertos · " +
              Math.round((x.correct / Math.max(1, x.total)) * 100) +
              "%</strong><small>" +
              fmtDate(x.date) +
              " · " +
              Math.floor(x.seconds / 60) +
              "min " +
              (x.seconds % 60) +
              "s</small></div>",
          )
          .join("")
      : '<p class="muted">Seu primeiro resultado aparecerá aqui.</p>';
  }
  function finishSim() {
    if (!simRun) return;
    clearInterval(simTick);
    const run = simRun;
    simRun = null;
    persistSim();
    const qs = run.ids.map((id) => questions.find((q) => q.id === id)),
      correct = qs.filter((q, i) => q.c === run.choices[i]).length,
      seconds = Math.max(
        0,
        Math.round((Math.min(Date.now(), run.end) - run.started) / 1000),
      );
    s.simHistory.unshift({
      date: new Date().toISOString(),
      correct,
      total: qs.length,
      seconds,
    });
    s.simHistory = s.simHistory.slice(0, 20);
    s.answers += qs.length;
    s.correct += correct;
    qs.forEach((q, i) => {
      if (
        run.choices[i] !== q.c &&
        !s.errors.some((e) => e.qid === q.id && !e.reviewed)
      )
        s.errors.unshift({
          id: crypto.randomUUID(),
          qid: q.id,
          selected: run.choices[i] ?? -1,
          date: new Date().toISOString(),
          reviewed: false,
        });
    });
    save();
    addXP(correct * 5 + (qs.length - correct) * 2, "Simulado concluído");
    markDailyStep("questoes");
    renderErrors();
    renderSimHistory();
    $("#startSim").disabled = false;
    $("#simContent").innerHTML =
      '<div class="sim-result"><span class="eyebrow">TREINO CONCLUÍDO</span><h3>' +
      correct +
      " de " +
      qs.length +
      " acertos</h3><p>" +
      Math.round((correct / qs.length) * 100) +
      "% de aproveitamento · " +
      Math.floor(seconds / 60) +
      "min " +
      (seconds % 60) +
      "s. Este resultado não estima nota TRI.</p></div>" +
      qs
        .map(
          (q, i) =>
            '<details class="sim-review"><summary><span class="answer-state ' +
            (run.choices[i] === q.c ? "right" : "wrong") +
            '">' +
            (run.choices[i] === q.c ? "✓" : "×") +
            "</span> " +
            (i + 1) +
            ". " +
            escapeHTML(q.q) +
            "</summary><p><b>Sua resposta:</b> " +
            escapeHTML(q.o[run.choices[i]] || "Em branco") +
            "<br><b>Resposta correta:</b> " +
            escapeHTML(q.o[q.c]) +
            '</p><p class="muted">' +
            escapeHTML(q.e) +
            "</p></details>",
        )
        .join("");
    toast("Os itens errados ou em branco estão no caderno de erros.");
  }
  $("#startSim").onclick = () => {
    if (simRun) return;
    const area = $("#simArea").value,
      qs = shuffle(
        questions.filter((q) => area === "all" || q.a === area),
      ).slice(0, +$("#simQty").value);
    const started = Date.now();
    simRun = {
      ids: qs.map((q) => q.id),
      choices: qs.map(() => null),
      flags: [],
      index: 0,
      started,
      end: started + Number($("#simMinutes").value) * 60000,
    };
    persistSim();
    renderSim();
    simTick = setInterval(simClock, 500);
  };
  renderSimHistory();
  if (simRun) {
    renderSim();
    if (simRun) simTick = setInterval(simClock, 500);
  }
  // Modal keyboard behavior: explicit opening, escape to close, focus kept in the dialog.
  let diagReturn = null;
  const oldOpen = openDiagnostic;
  openDiagnostic = function () {
    diagReturn = document.activeElement;
    oldOpen();
    $("#diagMinutes").focus();
  };
  $("#openDiagnostic").onclick = openDiagnostic;
  const oldClose = closeDiagnostic;
  closeDiagnostic = function () {
    oldClose();
    diagReturn?.focus();
  };
  $("#diagnosticModal").addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeDiagnostic();
      return;
    }
    if (e.key === "Tab") {
      const nodes = $$("button,input,select", $("#diagnosticModal")),
        first = nodes[0],
        last = nodes.at(-1);
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  renderMetrics();
  renderAreas();
  renderBadges();
  renderGreeting();
  renderTrails();
  renderPlan();
  renderEssayHistory();
  renderErrors();
  renderFlash();
  renderLibrary();
  renderChecks();
  window.addEventListener("load", () =>
    requestAnimationFrame(() => {
      if (location.hash) activateTab(location.hash.slice(1), false);
      else if (incoming) activateTab("redacao", false);
    }),
  );
})();
