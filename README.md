# ATENA · Conhecimento é poder

Plataforma gratuita e de código aberto para estudar para o ENEM. A ATENA reúne o Radar de Temas e o ENEM Hub em um painel com identidade própria: mármore, ouro, uma interface escura e a imagem de Atena fornecida para o projeto.

**Feito por Kaloré, para todos.**

Código original sob [licença MIT](./LICENSE). Consulte o [guia de contribuição](./CONTRIBUTING.md) para participar e conhecer o tratamento de conteúdo, fontes e materiais externos.

- [Abrir a ATENA](https://atena.dev.br/)
- [Academia de estudos](https://atena.dev.br/estudos.html)
- [Estúdio de redação](https://atena.dev.br/redacao.html)
- [Radar de temas](https://atena.dev.br/radar.html)
- [Simulados, PDFs e outras ferramentas](https://atena.dev.br/estudar.html)
- [Aplicativo offline de um arquivo](https://atena.dev.br/estudar-offline.html)

## O que foi entregue na versão 5

- **Next.js 15, React 19, TypeScript e Tailwind 4**, com exportação estática para GitHub Pages. Home, academia, estúdio e Radar são rotas React; o Hub mantém as ferramentas existentes e o arquivo independente offline.
- Sidebar no computador, menu móvel com foco contido e Escape, busca por Ctrl/⌘+K, temas claro/escuro, animações discretas e respeito ao movimento reduzido.
- **40 lições autorais em cinco áreas**, com resolução, nova tentativa, revisão e transição entre trilhas. O estudante continua depois da quinta lição; energia não bloqueia o aprendizado.
- Progresso real do aparelho, sequência diária, atividade semanal e um plano personalizável de 3, 5 ou 7 blocos. A conclusão registra o dia em que a atividade aconteceu, mesmo quando o bloco estava previsto para outra data.
- **17 temas de prática, 34 caminhos de argumentação e 51 recortes** para desenvolver teses, argumentos e intervenções. O estúdio salva rascunho, roteiro, checklist das cinco competências e até 30 versões. Permite retomar uma versão guardando antes o rascunho em andamento, além de exportar texto, roteiro e revisão.
- **Cartões pessoais**, com pergunta, resposta, área, fila de revisão e intervalos de 1, 3, 7, 14, 30 e 60 dias. São incluídos no backup v5 do Hub junto do planejamento ATENA.
- **84 questões autorais**, simulados cronometrados, sessões guiadas, confiança e anotações por questão, caderno de erros, Pomodoro e histórico de provas oficiais preservados.
- **68 referências de PDF** com fonte identificada, busca, filtros, favoritos e marcação de estudo. Quatro cadernos próprios estão hospedados no projeto e incluídos no arquivo offline; os demais são links para as instituições de origem.
- Coletor **Python sem API de IA**, com consultas concorrentes a fontes públicas, limites de tempo/tamanho e preservação dos dados em falhas parciais. O Radar busca o JSON publicado quando é aberto.

As questões, os argumentos e as propostas locais são materiais de treino. O Radar apresenta prioridades relativas de estudo, não probabilidades do tema da prova. Checagens de texto e checklists não atribuem nota oficial, correção de competências ou estimativa TRI.

## Executar e construir

Requer Node.js 22.13+ e Python 3.10+. O projeto fixa pnpm 11.25.0.

```sh
npm install --global pnpm@11.25.0
pnpm install --frozen-lockfile
pnpm dev
```

O servidor de desenvolvimento Next abre em `http://localhost:3000`. Os destinos usam `.html` para funcionar tanto na raiz do domínio como em `/RadarEnem/`; reescritas somente de desenvolvimento mantêm esses mesmos links funcionando no Next local.

```sh
pnpm build:pages
pnpm preview:pages
```

O build gera as rotas em `out/`, copia a versão final para `docs/`, preserva `docs/CNAME`, resolve os caminhos relativos de CSS/fontes, gera o aplicativo independente e cria o service worker a partir dos arquivos efetivamente publicados. Nenhuma chave ou processo de servidor é necessário para os alunos abrirem a plataforma.

## Estrutura

```text
app/                    Rotas App Router, layout, tokens e estilos do painel
components/             Home, academia, redação, navegação e componentes acessíveis
lib/                    Conteúdo tipado, regras do Radar e acesso ao progresso local
backend/                Coletor Python, fontes e testes determinísticos
portable/public/hub/    Ferramentas existentes, questões, simulados e biblioteca
portable/public/shared/ Regras compartilhadas de redação, planejamento e revisão
portable/public/atena/   Imagem de referência e símbolo vetorial
scripts/                Build, geração offline, validação e conferência do CDN
docs/                   Exportação pronta para GitHub Pages
.github/workflows/      Qualidade, coleta diária e conferência da publicação
```

A academia tem uma fonte tipada em `lib/academy-data.ts`. O build gera `hub/academy-data.js` para disponibilizar as mesmas 40 lições no Hub e no aplicativo offline.

## Atualização de fontes e hospedagem

[Guia de publicação, DNS, HTTPS e apresentação offline](./DEPLOYMENT.md).

```sh
python3 backend/radar_collect.py
pnpm build:pages
```

O workflow `radar-daily.yml` roda diariamente com `0 0 * * *` UTC e também pode ser acionado manualmente. Consulta páginas públicas e RSS, valida os dados, recompila os arquivos estáticos e solicita uma nova publicação do Pages. Horários de cron do GitHub são aproximados e podem sofrer atrasos.

O navegador lê `data/latest.json`; acessar a plataforma não dispara scraping, processamento remoto de redações ou uma API paga. Sem rede, a última base disponível continua acessível pelo cache.

GitHub Pages serve `main` → `/docs`. O domínio personalizado fica em `docs/CNAME`. A compilação é SSG e a atualização é feita por reconstrução agendada: Pages não executa ISR, Next Server, Python ou banco em produção. Há uma cópia pré-renderizada de cada rota, compartilhada entre os visitantes.

## Progresso e uso offline

A conta é dispensável. Rascunhos, respostas, plano, cartões e preferências ficam no armazenamento local do navegador. `kalore-hub-v3` mantém a identidade do progresso anterior; `atena-workspace-v1` guarda os novos cartões, plano e checklist. Use **Dados → Exportar** no Hub antes de trocar de aparelho, limpar o navegador ou mudar de domínio.

Armazenamento de `github.io` e `atena.dev.br` é separado pelo navegador. Exporte no endereço antigo e importe no novo para transferir o estudo. O arquivo independente também usa seu próprio armazenamento.

- **PWA:** depois de uma visita conectada e do cache concluído, os arquivos do site podem abrir sem rede, incluindo as rotas React e os PDFs próprios.
- **Arquivo offline:** baixe `estudar-offline.html` e abra no navegador. Funciona desde a primeira abertura sem conexão; contém Hub, 40 lições, redação, revisão, cartões pessoais, simulados e quatro PDFs. Seu editor é o do Hub, preservado para essa distribuição independente.
- Links de fontes e provas oficiais externas exigem conexão. O cache pode ser removido pelo navegador; mantenha o arquivo e um backup do progresso.

## Validação

```sh
pnpm build:pages
pnpm typecheck
pnpm check:atena
python3 -m unittest backend.test_radar_collect
pnpm check:radar
pnpm check:session
pnpm check:insights
pnpm check:essay
pnpm check:hub
```

Para os testes de navegador, instale Playwright e axe-core em um diretório de ferramentas, defina `NODE_PATH` para esse diretório e instale Chromium. `CHROMIUM_PATH` permite selecionar um binário existente.

```sh
pnpm check:atena-ui
pnpm check:ui
pnpm check:offline-app
pnpm check:experience
pnpm check:clarity
pnpm check:accessibility
node scripts/check-glow.cjs
```

A CI testa as mesmas funções. Auditorias automatizadas não substituem avaliação manual, tecnologias assistivas ou medições de tráfego real. `scripts/check-published.py` compara cada recurso servido publicamente com o build validado.

## Evolução e limites

[Plano de evolução, capacidade e meta de 190 mil visitas mensais](./ATENA.md).

O site estático reduz trabalho por visitante e dispensa servidor de aplicação. Não foi realizado teste de 100 mil acessos simultâneos; isso não é uma capacidade garantida. Limites e políticas da hospedagem continuam aplicáveis. Sincronização de conta, sala de comunidade e avaliação humana de redação ainda não são serviços implementados.

Histórico de decisões: [Auditoria](./AUDITORIA.md), [Experiência](./EXPERIENCIA.md) e [Clareza](./CLAREZA.md).
