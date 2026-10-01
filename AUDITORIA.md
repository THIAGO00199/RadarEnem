# Radar ENEM + ENEM Hub: diagnóstico e plano de evolução

Data: 01/10/2026. Base de comparação: commit `0f7a4e8` (Radar 3.0 / Hub 5.0). Esta entrega evolui o Hub para 6.0 e o pacote para 3.1. O diagnóstico usa o código, testes de navegador, inspeção visual, auditoria automatizada de acessibilidade e uma comparação de carregamento em laboratório.

## 1. Diagnóstico atual: cinco pontos fracos

| Problema observado | Evidência concreta | Consequência para o aluno | Resposta nesta entrega |
|---|---|---|---|
| Biblioteca pouco utilizável | O Hub reunia nove links gerais. Não havia catálogo de PDFs por matéria, ano e tipo, nem cadernos próprios. | O aluno saía do produto e ainda precisava procurar o arquivo. | 68 PDFs catalogados, busca sem depender de acentos, filtros, favoritos, marcação de estudo e paginação. Quatro PDFs próprios, com 21 páginas. |
| Navegação com demasiadas escolhas e introdução repetida | Havia 12 ferramentas no mesmo nível; a apresentação e as métricas permaneciam antes das telas de trabalho, sobretudo no celular. | O aluno precisava se orientar de novo ao mudar de tarefa. | Busca rápida com Ctrl/Cmd+K, atalhos diretos, apresentação concentrada na tela Hoje e navegação móvel que revela a seção ativa. Recomendações desaparecem quando o aluno filtra a biblioteca. |
| Problemas reais de acessibilidade | Seletores de questões e flashcards não tinham nome acessível. O flashcard inteiro era um botão contendo outros botões. Botões do tema claro tinham combinações de baixo contraste. | Algumas funções eram difíceis de reconhecer ou operar com tecnologias assistivas; a leitura no tema claro era prejudicada. | Nomes acessíveis, controles nativos nos flashcards, faces ocultas fora da navegação por teclado, cores corrigidas e foco preservado. Varredura final: 36 telas, zero violações nas regras automatizadas testadas. |
| Prática oficial sem ciclo de acompanhamento | O Hub tinha simulado autoral, mas os cadernos oficiais estavam apenas em um portal externo. | Resolver uma prova não alimentava um histórico nem indicava a próxima revisão. | 18 provas regulares de 2017–2025, cada uma ligada ao gabarito azul correspondente; cronômetro recuperável, acertos por área, histórico, exportação CSV e indicação da área a revisar. A correção é manual, sem conversão em TRI. |
| Conteúdo pouco distribuído para busca e qualidade pouco mensurada | O conteúdo se concentrava em duas páginas de aplicativo, com várias telas acessadas por fragmentos. Não havia dados de usuários reais sobre conversão, retenção ou Web Vitals. O worker dependia de uma etapa posterior ao Vite. | Menos entradas por intenção de busca; decisões de produto sem dados; risco de publicar um build sem cache offline completo. | Cinco páginas de conteúdo em HTML, títulos próprios, canonical, dados estruturados e sitemap com sete URLs. Testes de acessibilidade e desempenho reproduzíveis. A geração dos materiais e do worker faz parte do pipeline do Vite. Medição real de uso permanece no roadmap. |

O gargalo principal era a conexão entre encontrar, praticar e revisar. Expandir o catálogo resolve apenas a primeira parte. O fluxo desta entrega permite sair de uma prova, registrar a dificuldade e abrir os materiais correspondentes.

### O que continua limitado

- O progresso é local ao navegador. Backup existe, mas sincronização entre aparelhos ainda exige uma camada de conta e armazenamento.
- O Radar continua carregando um bundle principal de aproximadamente 131 kB comprimidos. Telas e diálogos secundários podem ser divididos para reduzir trabalho inicial em celulares modestos.
- O menu ainda reúne 13 seções. A busca rápida reduz o esforço imediato; o próximo redesign deve testar agrupamento por intenção.
- Não há medição em campo de INP, retenção D7 ou conversão. Os números de laboratório não demonstram crescimento de usuários.
- O catálogo identifica 64 URLs externas. 24 responderam com assinatura PDF na conferência direta; 40 URLs do Inep retornaram 502 neste ambiente, embora os links tenham sido encontrados nas fontes oficiais. A instituição controla sua disponibilidade. Cada recurso tem acesso à fonte como alternativa.

## 2. Quick wins: execução em 48 horas

| Ação | Situação | Critério de aceite |
|---|---|---|
| Abrir PDFs diretamente e oferecer a publicação de origem | Implementada | Cada recurso apresenta arquivo, instituição, ano e link da fonte. |
| Buscar matéria sem acento e combinar termos | Implementada | “redacao 2026” encontra a cartilha atual e o caderno autoral. |
| Reduzir o caminho até o material | Implementada | Pelo Hub: biblioteca → arquivo. Pela busca rápida: abrir busca → escolher material → baixar. Sem cadastro. |
| Guardar favoritos e leitura sem inflar XP | Implementada | Marcações sobrevivem a recarga e entram no backup v5; marcar leitura não gera XP. |
| Concentrar apresentação na tela Hoje | Implementada | Redação, biblioteca e demais ferramentas abrem no conteúdo de trabalho. |
| Melhorar contraste e operação por teclado | Implementada | Seletores identificados, flashcards operáveis com Enter, busca com atalho, foco visível e varredura automatizada sem violações nas telas testadas. |
| Separar prova autoral de prova oficial | Implementada | A aplicação, dia, cor e caderno ficam identificados. O histórico oficial não atribui nota TRI. |
| Criar entradas de conteúdo para busca | Implementada | Cinco páginas completas em HTML, acessíveis sem JavaScript, ligadas à prática no Hub. |
| Tornar o build offline obrigatório | Implementada | O Vite gera os materiais antes do build e o manifesto offline ao concluí-lo. Os PDFs próprios carregam sem internet nos testes. |
| Implantar medição de uso e erros em produção | Próxima ação | Definir eventos e coleta antes de instalar uma ferramenta. Não enviar texto de redações, notas pessoais ou conteúdo de backups. |

### Percursos com até três cliques

- **PDF conhecido:** buscar ferramenta/PDF → selecionar resultado → baixar.
- **Explorar uma matéria:** biblioteca → coleção → abrir PDF.
- **Redação a partir do Radar:** escolher tema → escrever sobre o tema. O editor recebe a proposta.
- **Prova oficial:** atalho “Provas” no Radar → selecionar edição/dia → abrir o caderno.

O critério deve ser validado também com estudantes em testes curtos: solicitar um material específico, observar hesitações e medir tempo até a tarefa. Contar cliques, isoladamente, não demonstra compreensão.

## 3. Roadmap de evolução

### Prioridade alta: melhorar aprendizagem e confiabilidade

| Entrega | Implementação específica | Resultado a medir |
|---|---|---|
| Navegação organizada por objetivo | Testar três grupos: Hoje, Praticar e Materiais. Dentro de Praticar, colocar questões, provas, redação e erros. Preservar URLs diretas e busca global. | Tempo para localizar uma tarefa, taxa de conclusão e erros de navegação. |
| Revisão baseada no erro | Vincular questões erradas a assunto e habilidade, gerar uma sessão curta e permitir refazer sem consultar a resposta anterior. O treino oficial já sugere a área mais fraca; o próximo passo é identificar o conteúdo. | Redução da reincidência por assunto, além da quantidade de exercícios. |
| Recuperação de progresso entre aparelhos | Conta opcional após a primeira sessão útil; armazenamento por usuário e fila local para uso offline. Resolver conflitos de rascunhos com versões e datas, preservando ambas as versões quando necessário. | Adoção voluntária da sincronização e taxa de recuperação bem-sucedida. |
| Qualidade editorial do banco | Cada questão deve ter autoria, área, assunto, habilidade, explicação, revisão e versão. Distinguir item autoral de item oficial; manter referência da edição e licença quando aplicável. | Itens revisados, dúvidas reportadas e correções necessárias. |
| Desempenho em aparelhos modestos | Carregar diálogos e telas secundárias do Radar sob demanda; limitar renderização de listas; estabelecer orçamento de JS e medir navegação com estados reais. | LCP ≤ 2,5 s, INP ≤ 200 ms e CLS ≤ 0,1 no p75 por dispositivo em produção. |
| Confiabilidade de materiais e publicação | Auditar links externos, registrar disponibilidade e oferecer fonte alternativa verificada. Bloquear publicação quando build, testes de persistência, integridade offline ou fluxos essenciais falharem. | Links utilizáveis, falhas por versão e tempo de recuperação. |

### Prioridade média: retenção, clareza e descoberta

| Entrega | Implementação específica | Resultado a medir |
|---|---|---|
| Missão diária baseada no tempo | Usar 10, 20 ou 40 minutos para propor uma ação de prática e uma de revisão. Mostrar uma próxima tarefa, com estimativa de tempo e retomada do ponto anterior. | Primeira sessão concluída, retorno D1 e D7. |
| Gamificação orientada ao esforço útil | Manter sequência e progresso. Dar badges por revisar erros, concluir uma redação revisada e retornar ao estudo. Evitar recompensa por apenas abrir ou favoritar arquivos. Permitir retomar a rotina após uma pausa. | Revisões realizadas e continuidade de estudo; não só XP acumulado. |
| Redação com comparação de versões | Comparar rascunho e revisão, guardar comentários por competência e permitir feedback de professor. Se houver IA, identificar suas limitações e apresentar critérios e exemplos verificáveis. | Tempo entre escrita e revisão, mudanças feitas e qualidade do feedback. |
| Design system completo | Consolidar tokens, componentes de formulário, estados vazios, alertas, cabeçalhos e progresso. Hoje as cores são compartilhadas; ainda há estilos herdados e o Radar usa tema escuro. | Consistência entre produtos e menos defeitos visuais por release. |
| Silos de conteúdo com prática relacionada | Expandir Redação, Matemática e Provas oficiais em páginas por competência, assunto e edição. Incluir explicações originais, exemplos, fontes e próxima atividade. | Páginas indexadas, consultas relevantes e sessões de estudo vindas da busca. |
| Observabilidade do funil | Definir eventos: entrada, início da prática, primeira conclusão, revisão do erro e retorno. Segmentar por aparelho e origem. Usar apenas metadados necessários. | Ativação e retenção medidas com denominadores claros. |

### Prioridade baixa: expansão após validar a base

| Entrega | Condição para avançar | Escopo proposto |
|---|---|---|
| Grupos de estudo | Confirmar que alunos retornam e desejam colaboração. | Metas de grupo e compartilhamento voluntário de materiais, sem ranking público de notas individuais. |
| Painel de professor | Validar uso por turmas e fluxo de correção. | Tarefas, comentários e acompanhamento de entregas com acesso por turma. |
| Correção assistida por IA | Ter critérios, corpus revisado, avaliação de qualidade e orçamento definidos. | Comentários explicados e revisão humana; sem prometer equivalência à nota oficial. |
| Notificações | Mostrar benefício e permitir escolha de horário e frequência. | Lembretes de revisão e retomada, respeitando pausas. |
| Personalização avançada | Ter histórico suficiente e questões bem classificadas. | Dificuldade adaptativa e recomendações por habilidade, com explicação da escolha. |

### Design system e microinterações

| Elemento | Especificação |
|---|---|
| Fundo escuro / superfície | `#0C1115` / `#141D24`; superfície discreta para sessões longas. |
| Texto / texto secundário | `#EDF4F4` / `#A0B0B6`; contraste revisto nas telas auditadas. |
| Ação principal | Verde `#B8EF83` no escuro; `#365E1E` com texto branco no claro. |
| Links | `#8FD9CA` no escuro; links dentro de texto também usam sublinhado. |
| Tipografia | Fonte de sistema com fallback Inter; leitura de conteúdo em 16–18 px, entrelinha confortável; monoespaçada para números e tempos. |
| Componentes | Controles rotulados, foco visível, estados selecionados com texto e forma, botões de material com área de toque ampla. |
| Movimento | Feedback curto em acerto/erro e progresso, preservando a explicação. Conteúdo principal aparece imediatamente; preferência por movimento reduzido é respeitada. |

Animações de CSS são suficientes para estes feedbacks. Lottie só deve entrar quando uma animação instrucional demonstrar benefício que compense o arquivo e a dependência adicionais.

### Funil e SEO

Hoje não existe área de membros: o Hub é gratuito e funciona sem cadastro. O objetivo inicial do funil é **visita → primeira prática concluída → revisão → retorno**, com conta opcional somente quando trouxer um benefício concreto.

As principais entradas devem corresponder a intenções diferentes: “cartilha redação ENEM”, “porcentagem ENEM exercícios”, “prova ENEM 2025 PDF”, “plano de estudo ENEM” e “caderno de erros”. Estes são exemplos de intenção editorial, não uma análise de volume de busca. As cinco páginas novas usam conteúdo próprio em HTML e apontam para a tarefa correspondente. Expandir exige pesquisa de consultas e dados do Search Console; publicar centenas de páginas semelhantes não garante posicionamento.

## 4. Especificações técnicas e preparo para picos

| Camada | Decisão proposta | Motivo e condição |
|---|---|---|
| Aplicativo | Preservar React + TypeScript + Vite; dividir componentes secundários com carregamento sob demanda. | O projeto já funciona nesta stack. A divisão deve reduzir o trabalho inicial medido, preservando estados e rotas. |
| Conteúdo público | Manter HTML gerado no build. Avaliar Astro se houver muitos autores, coleções e páginas. | Texto e links ficam disponíveis para usuários e rastreadores sem executar o aplicativo. |
| Interface | Usar componentes acessíveis já presentes, como Radix no Radar, e elementos nativos nas telas estáticas. Unificar contratos visuais antes de adicionar outra biblioteca. | Evitar mais dependências para resolver problemas de rotulagem ou CSS. |
| Hospedagem atual | GitHub Pages para a aplicação estática gratuita. | Não há servidor de autenticação ou correção de IA na jornada atual. Os limites do serviço precisam ser monitorados. |
| CDN em uma etapa posterior | Avaliar Cloudflare para controle de cache, cabeçalhos e distribuição, sem migração automática nesta entrega. | Assets com hash podem usar cache longo; HTML precisa de estratégia de atualização. Qualquer teste de pico deve incluir a configuração realmente publicada. |
| Progresso local | Separar acesso ao armazenamento, validar schemas e considerar IndexedDB para um histórico maior. | `localStorage` é síncrono. O volume e a frequência de gravações devem ser medidos antes de migrar. |
| Sincronização opcional | API de conta e PostgreSQL, com isolamento por usuário. Supabase é uma opção a avaliar com Row Level Security. | Chaves privilegiadas ficam no servidor; persistência local continua útil no modo offline. |
| Cache offline | Cache versionado dos arquivos próprios, limpeza só dos caches do projeto, PDFs próprios leves; recursos externos fora do precache. | Evitar baixar dezenas de apostilas grandes na primeira visita e preservar funcionamento sem rede. |
| Serviços futuros de IA | Processamento em fila, limites de requisição, orçamento por usuário e estados de falha recuperáveis. | Picos de tráfego do conteúdo estático não devem bloquear exercícios ou progresso por depender da disponibilidade de uma IA. |
| Qualidade | Typecheck, regressões do Radar/Hub, E2E, axe, orçamento de performance e verificação de PDFs. | Reproduzir os fluxos essenciais antes de publicar e guardar evidência da versão. |

O GitHub Pages documenta limite de 1 GB por site publicado e limite flexível de 100 GB de banda por mês. Isso não é uma garantia de capacidade para a semana do ENEM. O plano de pico deve usar dados de acesso: estimar tráfego frio e com cache, separar arquivos grandes, monitorar erros e ensaiar o deploy com possibilidade de retorno à versão anterior. Hoje a jornada de estudo estática não depende de consultas a banco de dados.

### Medição de laboratório

| Versão | Página | LCP | CLS | Bloqueio de tarefas longas* | Transferência |
|---|---|---:|---:|---:|---:|
| Antes | index.html | 1.524 s | 0 | 276 ms | 149.5 kB |
| Antes | estudar.html | 0.568 s | 0 | 208 ms | 56.7 kB |
| Entrega atual | index.html | 1.536 s | 0 | 290 ms | 149.9 kB |
| Entrega atual | estudar.html | 0.572 s | 0 | 206 ms | 72.6 kB |
| Entrega atual | materiais/redacao.html | 0.420 s | 0 | 4 ms | 5.3 kB |

*Somatório da parcela acima de 50 ms nas tarefas longas observadas; não é INP.

Método: Chromium headless, viewport 390 × 844, CPU 4×, latência 150 ms, download de 1,6 Mbps, gzip, cache frio, service worker bloqueado, três execuções por página; mediana. Servidor local. O relatório completo está em `portable/public/data/performance-audit.json`.

O aumento de conteúdo adiciona tráfego ao Hub. A comparação permite avaliar esse custo; não demonstra aumento de conversão. Não foram medidos INP de usuários reais, tráfego do CDN ou retenção. Os objetivos oficiais de Core Web Vitals são avaliados no p75 de visitas reais por dispositivo.

### Evidência e repetição

- Catálogo e pareamento de cadernos: `portable/public/hub/library-data.js`.
- Auditoria de disponibilidade: `portable/public/data/library-audit.json`.
- Resultado de acessibilidade: `portable/public/data/accessibility-audit.json`.
- Geração dos cadernos: `scripts/create-guides.py`. PDFs renderizados e inspecionados em 21 páginas.
- Fluxos essenciais: `scripts/check-ui.cjs`, incluindo downloads, filtros, favoritos, backup v5, cronômetro/histórico oficial, CSV e uso offline.
- Build obrigatório: `vite.portable.config.ts` e `scripts/build-offline.mjs`.

Para repetir: `npm run typecheck`, `npm run check:radar`, `npm run build:pages`, `npm run check:hub` e `npm run check:ui`. Acessibilidade e performance têm comandos próprios; exigem Playwright, Chromium e, para axe, `@axe-core/playwright`. A verificação externa `npm run check:links` registra indisponibilidades sem confundi-las com ausência da fonte institucional.

### Referências técnicas

- [Google: Core Web Vitals e distinção entre laboratório e campo](https://web.dev/articles/vitals).
- [W3C: contraste mínimo](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) e [tamanho mínimo de alvo](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html).
- [Google Search Central: SEO de JavaScript](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics).
- [React: carregamento sob demanda com lazy](https://react.dev/reference/react/lazy).
- [GitHub: limites do Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits).
- [Cloudflare: limites do Pages](https://developers.cloudflare.com/pages/platform/limits/).
- [Supabase: Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security).
- [Astro: modos de renderização](https://docs.astro.build/en/guides/on-demand-rendering/).
