(function (root) {
  "use strict";
  const KEY = "atena-workspace-v1";
  const read = () => {
    try {
      return root.AtenaModel.sanitize(
        JSON.parse(localStorage.getItem(KEY) || "null"),
      );
    } catch {
      return root.AtenaModel.sanitize(null);
    }
  };
  function write(value) {
    try {
      localStorage.setItem(
        KEY,
        JSON.stringify(root.AtenaModel.sanitize(value)),
      );
      return true;
    } catch {
      return false;
    }
  }
  function init() {
    const form = document.getElementById("atenaCardForm");
    if (!form) return;
    const $ = (id) => document.getElementById(id),
      escape = (v) =>
        String(v)
          .replaceAll("&", "&amp;")
          .replaceAll("<", "&lt;")
          .replaceAll(">", "&gt;")
          .replaceAll('"', "&quot;");
    function render() {
      const state = read(),
        all = state.cards,
        filter = $("atenaPersonalFilter").value,
        cards = all.filter(
          (c) => filter === "all" || c.due <= root.AtenaModel.day(),
        );
      $("atenaCardCount").textContent =
        all.length + " cartões próprios · " + cards.length + " neste filtro";
      $("atenaCardList").innerHTML = cards.length
        ? cards
            .map(
              (card) =>
                '<article class="atena-personal-card"><small>' +
                escape(root.AtenaModel.names[card.area]) +
                " · " +
                (card.due === "1970-01-01"
                  ? "primeira revisão"
                  : "revisão: " + escape(card.due)) +
                "</small><h4>" +
                escape(card.front) +
                '</h4><button class="btn" data-atena-reveal="' +
                card.id +
                '">Mostrar resposta</button><div hidden data-atena-answer="' +
                card.id +
                '"><p>' +
                escape(card.back) +
                '</p><div class="atena-card-actions"><button class="btn" data-atena-grade="again" data-card="' +
                card.id +
                '">Preciso rever</button><button class="btn primary" data-atena-grade="good" data-card="' +
                card.id +
                '">Lembrei</button></div></div><button class="atena-delete" data-atena-delete="' +
                card.id +
                '">Excluir cartão</button></article>',
            )
            .join("")
        : '<p class="atena-form-note">' +
          (all.length
            ? "Sua fila está em dia. Você pode mudar para “Todos os meus cartões” e revisar quando quiser."
            : "Crie seu primeiro cartão. As revisões ficam salvas e entram no backup do Hub.") +
          "</p>";
    }
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const front = $("atenaCardFront").value.trim(),
        back = $("atenaCardBack").value.trim(),
        state = read();
      if (!front || !back) return;
      if (state.cards.length >= 100) {
        $("atenaCardStatus").textContent =
          "Você chegou a 100 cartões próprios. Exporte um backup e remova os que não usa.";
        return;
      }
      state.cards.unshift({
        id: "card-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
        front,
        back,
        area: $("atenaCardArea").value,
        stage: 0,
        due: "1970-01-01",
      });
      if (write(state)) {
        form.reset();
        $("atenaCardStatus").textContent =
          "Cartão salvo. Tente lembrar antes de revelar a resposta.";
        render();
      } else
        $("atenaCardStatus").textContent =
          "O navegador não permitiu salvar. Não feche a página antes de guardar o texto.";
    });
    $("atenaPersonalFilter").addEventListener("change", render);
    $("atenaCardList").addEventListener("click", (event) => {
      const button = event.target.closest("button");
      if (!button) return;
      if (button.dataset.atenaReveal) {
        const answer = document.querySelector(
          '[data-atena-answer="' + button.dataset.atenaReveal + '"]',
        );
        answer.hidden = false;
        button.hidden = true;
      }
      if (button.dataset.atenaGrade) {
        const state = read();
        state.cards = state.cards.map((card) =>
          card.id === button.dataset.card
            ? root.AtenaModel.review(card, button.dataset.atenaGrade)
            : card,
        );
        if (write(state)) {
          $("atenaCardStatus").textContent =
            button.dataset.atenaGrade === "good"
              ? "Revisão registrada. O próximo intervalo está agendado."
              : "O cartão continua disponível para uma nova tentativa.";
          render();
        } else
          $("atenaCardStatus").textContent =
            "Não consegui salvar essa revisão.";
      }
      if (button.dataset.atenaDelete) {
        const state = read();
        state.cards = state.cards.filter(
          (card) => card.id !== button.dataset.atenaDelete,
        );
        if (write(state)) {
          $("atenaCardStatus").textContent = "Cartão removido.";
          render();
        }
      }
    });
    window.addEventListener("storage", (event) => {
      if (event.key === KEY) render();
    });
    render();
  }
  root.AtenaTools = { read, write, init };
})(globalThis);
