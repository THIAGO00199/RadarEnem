# Kaloré Glow — Radar ENEM + ENEM Hub

A identidade compartilha a mesma linguagem entre investigação de temas e prática. A home passa a organizar o estudo pela próxima ação, com bento grid, superfícies arredondadas, menus translúcidos e feedback contextual.

## 1. Moodboard técnico

| Papel | Escuro | Claro | Aplicação |
| --- | --- | --- | --- |
| Fundo | `#0B0D17` | `#F6F5F0` | Grafite e creme, sem branco ou preto puros |
| Superfície | `#171B2A` | `#FFFFFF` | Cards e áreas de leitura |
| Superfície elevada | `#202538` | `#EEEDF6` | Seleção, campos e navegação |
| Texto | `#F4F5FB` | `#252839` | Conteúdo principal |
| Texto secundário | `#ADB5CC` | `#596078` | Contexto e metadados |
| Ação | `#D4F87A` | `#D4F87A` | CTA com texto `#18220C` |
| Lima para texto | `#D4F87A` | `#42611B` | Progresso e destaques legíveis |
| Lilás | `#B6A6FF` | `#6650B7` | Trilhas, navegação e Radar |
| Azul-gelo | `#9DEAF1` | `#116C77` | Links e contexto |
| Coral | `#FFB0A1` | `#A73F30` | Revisão de erros |
| Borda | `#323A51` | `#D8D9E3` | Separação sem excesso de linhas |

**Tipografia:** Manrope variável, pesos 400–800, servida pelo próprio site em WOFF2. Títulos em 800, botões em 750 e leitura com entrelinha de 1,65–1,8. A licença SIL OFL está em `portable/public/shared/fonts/OFL-Manrope.txt`. Fallback: Inter e fonte de sistema.

**Composição:** cards de 24 px, ícones de traço, CTAs lima, painéis com gradientes discretos e ilustração orbital feita em CSS. O glassmorphism fica em navegação e busca, com fundos suficientes para leitura. Áreas de texto evitam blur.

**Referências visuais entregues:** [capturas reais do navegador](./design/previews/). As homes mostram a mesma marca em duas composições: o Radar destaca ideias e suas evidências; o Hub destaca a sessão recomendada e o progresso real. As imagens não são mockups nem capturas de usuários fictícios.

## 2. Guia de estilo CSS

A fonte de verdade está em `portable/public/shared/tokens.css`. As primitivas vivem em `shared/glow.css`; `hub/glow.css` e `app/glow.css` cuidam da composição de cada produto.

```css
:root {
  --kalore-bg: #0b0d17;
  --kalore-surface: #171b2a;
  --kalore-text: #f4f5fb;
  --kalore-border: #323a51;
  --glow-action: #d4f87a;
  --glow-action-text: #18220c;
  --glow-glass: #101422eb;
  --glow-ease: cubic-bezier(.22, 1, .36, 1);
}
.glow-card {
  background: linear-gradient(150deg, #b6a6ff13, transparent 48%),
              var(--kalore-surface);
  border: 1px solid var(--kalore-border);
  border-radius: 24px;
  box-shadow: 0 16px 46px #00000024;
}
.button.primary {
  min-height: 44px;
  border-radius: 13px;
  background: linear-gradient(120deg, #e0ff98, #d4f87a 65%, #c8f36f);
  color: var(--glow-action-text);
  transition: transform 180ms var(--glow-ease);
}
.topbar {
  background: var(--glow-glass);
  border-bottom: 1px solid var(--kalore-border);
  backdrop-filter: blur(16px);
}
@media (hover: hover) and (pointer: fine) {
  .button.primary:hover { transform: translateY(-2px); }
}
:where(button, a, input, select, textarea):focus-visible {
  outline: 3px solid var(--kalore-violet);
  outline-offset: 4px;
}
```

O tema claro troca os tokens sem alterar a estrutura. A preferência `kalore-color-theme` acompanha o aluno entre Radar e Hub e entre abas do navegador.

## 3. Biblioteca de animações

Implementação nativa em `portable/public/shared/motion.js`: CSS, Web Animations API e Intersection Observer. Os dois produtos usam a mesma biblioteca sem uma dependência adicional no bundle.

```js
// Entrada discreta ao trocar de ferramenta.
window.KaloreMotion?.enter(document.getElementById("questoes"));

// Feedback legível, com partículas apenas para um acerto.
window.KaloreMotion?.feedback(
  questionCard,
  isCorrect,
  isCorrect
    ? "Resposta certa. A explicação ajuda a guardar o raciocínio."
    : "Esta questão entrou no seu caderno de erros para a próxima revisão."
);

// Revelação de cards abaixo da dobra, com limpeza dos observadores.
const dispose = window.KaloreMotion?.init(document.querySelector("main"));
// Em uma desmontagem React, retorne dispose no useEffect.
```

- Hover: 180 ms e deslocamento de 2–3 px.
- Mudança de seção: 280 ms e deslocamento de 9 px.
- Revelação: 540 ms, aplicada apenas a cards abaixo da dobra.
- Acerto: oito partículas pequenas, removidas em até 1,1 segundo.
- Erro: coral, mensagem acolhedora e explicação preservada.
- Atualização de fontes: skeleton discreto associado ao estado real de carregamento.
- Movimento reduzido: respeita `prefers-reduced-motion` e o ajuste de animações do Radar.
- Leitura e LCP: os elementos nunca começam ocultos esperando JavaScript ou animação.
- Scroll: indicador decorativo atualizado por `requestAnimationFrame`, com listener passivo.

Referências técnicas: [Intersection Observer / MDN](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API), [Web Animations API / MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API), [prefers-reduced-motion / MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion).

## 4. Implementação e proteção das funções

1. **Aplicar tokens compartilhados.** Paleta, tipografia e estados de foco vêm antes do layout. A camada de composição preserva os componentes funcionais e seus identificadores.
2. **Reorganizar a navegação e as homes.** O Hub agrupa Meu espaço, Praticar e Explorar. A sessão recomendada, as trilhas, a missão e os atalhos formam um bento. O Radar conecta investigação, biblioteca e prática.
3. **Ativar recomendações locais.** Ordem explícita: erros não revisados, flashcards vencidos, rascunho não salvo como versão, área com menos acertos no último treino oficial, dificuldade declarada e progresso. O motivo aparece junto do CTA. Os minutos são uma sugestão de sessão, não uma previsão de duração.
4. **Adicionar movimento com fallback.** Transições, partículas e observadores são opcionais; a navegação, as explicações e os controles continuam funcionando com movimento reduzido.
5. **Aprimorar o cache.** CSS, JavaScript, fontes, imagens e PDFs locais usam cache-first. HTML e dados consultam a rede, com fallback em 1,8 segundo quando há cache disponível. Requisições explícitas de atualização e respostas parciais de PDF têm tratamento próprio. A nova versão só ativa depois de preparar seu cache.
6. **Validar antes da publicação.** TypeScript, modelo de ranking, recomendações, fluxos do Hub, backups, rascunhos, simulados, cronômetros, busca, PDFs, navegação mobile, temas, movimento reduzido, cache e contraste.
7. **Publicar os arquivos gerados junto do código.** A branch de revisão executa o build e registra as capturas. A publicação em main só acontece após os checks passarem.

### Arquitetura e resposta da interface

A versão publicada em GitHub Pages executa React/Vite no Radar e JavaScript no Hub. O estudo é local: o navegador calcula recomendações, conserva o progresso e entrega arquivos pelo cache. Não há backend Python nessa jornada. Python prepara os materiais e a fonte durante o desenvolvimento; acrescentar um servidor de estudo exigiria outra arquitetura de hospedagem.

As recomendações não fazem chamadas externas. Atualizações consecutivas do estado são reunidas no próximo frame. A biblioteca de movimento limita os observadores aos cards novos e remove partículas e observações concluídas.

### Verificação reproduzível

```bash
pnpm install --frozen-lockfile
npm run typecheck
node scripts/check-recommend.mjs
npm run check:radar
npm run build:pages
npm run check:hub
npm run check:ui
npm run check:accessibility
node scripts/check-glow.cjs
```

Os checks de navegador precisam de Playwright e Chromium; acessibilidade precisa também de @axe-core/playwright. O workflow `.github/workflows/glow-up.yml` prepara esse ambiente.

O relatório `portable/public/data/glow-performance-audit.json` compara a versão anterior f8c1540 com o redesign sob viewport mobile, CPU 4×, latência de 150 ms, download de 1,6 Mbps, cache frio e três execuções. São medições de laboratório; retenção, conversão e p75 de usuários reais exigem dados de uso.

### Resultado desta entrega

[Validação completa no GitHub Actions](https://github.com/THIAGO00199/RadarEnem/actions/runs/36937213079): TypeScript, modelo do Radar, 15 checks de recomendações, regressão funcional, quatro larguras de viewport, preferências de tema, movimento reduzido, partículas, cache e falha real de rede passaram.

A auditoria automatizada verificou **49 telas e estados, com zero regras com violações**. Inclui as 13 seções do Hub e sete seções do Radar nos dois temas, flashcards virados, busca e cinco páginas de materiais. É um teste automatizado, não uma certificação de acessibilidade.

| Página | LCP anterior | LCP novo | CLS novo | Transferência inicial nova |
| --- | ---: | ---: | ---: | ---: |
| Radar | 1,472 s | 1,680 s | 0 | 188.840 bytes |
| Hub | 0,540 s | 0,804 s | 0,0148 | 117.558 bytes |
| Guia de redação | — | 0,396 s | 0,017 | 37.095 bytes |

O novo visual adiciona uma fonte de 31.148 bytes, estilos e interações. A transferência inicial cresceu em 38.922 bytes no Radar e 44.908 no Hub; o LCP de cache frio também aumentou nesta rodada. O cache-first melhora a entrega dos arquivos em visitas seguintes. Os números acima são medianas de laboratório sob a mesma limitação de rede e CPU, não dados de usuários reais.

As capturas de desktop e mobile estão em [design/previews](./design/previews/). O workflow de publicação confere por hash o HTML, o CSS, o JavaScript, a fonte e um PDF servidos publicamente depois do deploy.

### Próxima evolução de produto

Prioridade alta: acompanhar em produção LCP, CLS e INP; observar a conclusão da primeira sessão, o retorno em sete dias e a abertura das recomendações. Prioridade média: sincronização opcional entre dispositivos e uma visão de evolução por área. Prioridade baixa: animações complexas e efeitos adicionais, condicionados a melhorar compreensão e manter a fluidez em celulares modestos.
