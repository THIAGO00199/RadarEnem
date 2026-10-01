# Kaloré · Radar de Temas + ENEM Hub 2026

**Feito por Kaloré, para todos.** Uma plataforma gratuita de preparação, com Radar de Temas e um espaço completo de prática no ENEM Hub.

- [Radar de Temas](https://thiago00199.github.io/RadarEnem/)
- [ENEM Hub](https://thiago00199.github.io/RadarEnem/estudar.html)

## ENEM Hub · atualização 5.0

- Interface com navegação lateral no computador, atalhos no celular e temas claro/escuro.
- 25 lições em cinco áreas, desbloqueio por progresso, XP e recuperação de energia por revisão de flashcards.
- 60 questões autorais com explicações; blocos por área e caderno de erros.
- Simulado cronometrado, navegação entre itens, marcação para revisão, correção ao finalizar e histórico. A sessão continua após recarregar a página na mesma aba.
- 22 fórmulas e conceitos pesquisáveis, com significado e exemplos.
- 22 flashcards com revisão espaçada e operação por teclado.
- Editor de redação com rascunho automático, tema persistente, versões, roteiro de argumentação e exportação de texto. Um tema selecionado no Radar abre diretamente no editor.
- Checagem local de estrutura e prompt para levar a uma IA externa. Não há IA conectada nem atribuição de nota oficial ou TRI.
- Planejamento semanal que respeita a quantidade de horas escolhida; rota diária que avança quando suas atividades são realizadas.
- Pomodoro com recuperação de tempo e anotações após recarregar a página.
- Backup compatível com versões 3 e 4, validação de dados e preservação do progresso existente.
- Disponibilidade offline de ambos os aplicativos após uma visita com internet. Os materiais externos da biblioteca exigem conexão.

Questões e propostas são autorais e servem para prática. Os cadernos oficiais estão na biblioteca do Inep. O Radar mostra prioridade relativa de estudo; seus percentuais não são probabilidades de um tema cair.

## O que você encontra

- Ranking de 17 temas com índice relativo e contribuição de cada sinal.
- Dossiê PND 2026 / leitura, com comparação entre os cenários com e sem provas relacionadas.
- Biblioteca do Inep: cartilha 2026, acervo do Enem e materiais da PND.
- Histórico de 28 aplicações regulares, de 1998 a 2025, com busca.
- Busca de fontes, inclusão de matérias e pistas públicas, pesos ajustáveis.
- Plano de escrita com temas salvos, acompanhamento e download em Markdown.
- Importação e exportação da análise em JSON; ajustes salvos no navegador.
- Layout responsivo, navegação por teclado, animações opcionais e respeito ao movimento reduzido.

## Rodar a versão estática

Requer Node.js 22.13 ou superior.

```sh
npm install
npm run dev:pages
npm run check:radar
npm run build:pages
npm run check:hub
```

O build estático fica em `docs/`. Essa versão não exige chaves, conta de IA ou servidor próprio. Pode ser hospedada no GitHub Pages e em serviços que publicam arquivos estáticos.

## GitHub Pages

No repositório `THIAGO00199/RadarEnem`:

1. Abra **Settings → Pages**.
2. Em **Build and deployment**, escolha **Deploy from a branch**.
3. Selecione **main** e **/docs**, depois **Save**.
4. Aguarde o GitHub informar a URL publicada nessa mesma tela.

Os arquivos em `docs/` já estão compilados. Caminhos relativos permitem publicar na subpasta do repositório. Não é necessário configurar um domínio para começar.

## Atualizar matérias

```sh
npm run data:update
npm run build:pages
```

O script consulta as fontes públicas fixadas em `lib/radar-data.ts` e grava `portable/public/data/latest.json`. Depois do build, publique as mudanças em `docs/` também. Não há tarefa agendada neste projeto.

No GitHub Pages, **Atualizar base** lê o arquivo publicado; o navegador não faz scraping de sites externos. Na versão hospedada com servidor, **Atualizar fontes** usa `GET /api/collect`, com cache em memória de até 15 minutos e consultas limitadas por tempo e tamanho.

A coleta não cobre toda a internet. Uma página pode bloquear o acesso ou mudar de estrutura. Falhas individuais aparecem no status e não removem a curadoria inicial. Na consulta de 30/09/2026, seis das oito fontes responderam; Planejamento retornou 401 e IBGE, 403.

## Como ler os números

Os percentuais são **prioridades de estudo entre os temas desta seleção**, não probabilidades de cair. A soma é 100,0%. Não há calibração preditiva, promessa de acerto ou informação reservada do Inep.

```
Pontos = 10 + 50E + 25A + 10H + 10D + 0P
Índice (%) = pontos / soma dos pontos de todos os temas × 100
```

- **E**: apostas docentes; **A**: atualidades; **D**: provas relacionadas; **P**: pistas não verificadas. Por categoria e tema, usa-se a maior contribuição de cada grupo de domínio, somada, dividida por três e limitada a um.
- O peso de uma publicação cai pela metade em 180 dias. Sem data, a contribuição é 0,5. Publicações futuras ou com mais de dois anos ficam fora.
- **H**: frequência editorial do eixo nas edições regulares anteriores ao ano da análise, com suavização. Não existe bônus por um tema estar “atrasado”.
- Provas relacionadas podem ser desligadas e têm peso máximo de 15. Pistas não verificadas começam desligadas e têm limite de cinco pontos.
- A curadoria precede a classificação automática de uma URL repetida. URLs com parâmetros de rastreamento são deduplicadas.
- Cartilhas e acervos oficiais são referências de preparação e não pontuam automaticamente.

A análise sobre leitura na PND 2026 está atribuída ao **Instituto Dering**, publicação de 21/09/2026. O **Inep** confirmou a publicação dos cadernos e da grade em 24/09. Os links dos PDFs foram localizados no acervo oficial; o download retornou 502 durante a preparação deste projeto, portanto o conteúdo não foi conferido diretamente no PDF. Uma aproximação temática entre PND e Enem em 2025 não demonstra um padrão de previsão.

## Fontes e manutenção

Fontes iniciais: FGV, Brasil Escola, CNN Brasil, Instituto Dering, MDH, ANPD, Ministério do Planejamento, IBGE e Agência Brasil. Os links, datas, notas de curadoria e relações com temas estão em `lib/radar-data.ts` e na interface. Histórico: compilação Quero Bolsa e referência oficial do Inep para 2025. A série não inclui PPL, reaplicações, edições digitais e regionais. Títulos antigos são resumos, não transcrições integrais.

Altere temas, palavras-chave e fontes no arquivo de dados. O modelo compartilhado fica em `lib/radar-model.ts`; a coleta em `lib/collector.ts`. Evite usar páginas genéricas como indícios de um assunto específico. Contribuições pessoais não se tornam oficiais ao receber uma categoria.

## Privacidade e verificação

Pistas, favoritos e ajustes ficam em `localStorage`. Não há rastreador, cadastro ou sincronização de dados pessoais. Os botões de atualização fazem requisições de dados; links de fontes abrem os sites correspondentes. Exportações podem conter as notas que você digitou: revise antes de compartilhar.

Verificações automatizadas: tipos, build, regras do Radar, validação de backups, datas, quantidade exata de sessões e integridade dos arquivos offline. Testes de navegador cobrem lições, flashcards, redação, roteiro, simulado, recuperação do timer, integração Radar/Hub, hashes inválidos, modo offline e layouts de 360, 390, 768 e 1440 px. Foram inspecionados os temas claro/escuro em desktop e celular.

Para repetir os testes de navegador:

```sh
npm install --no-save playwright
npx playwright install chromium
npm run check:ui
```

O teste inicia e encerra seu próprio servidor local. `CHROMIUM_PATH` permite usar um Chromium já instalado; `SCREENSHOT_DIR` salva imagens de verificação.

## Estrutura e publicação reproduzível

O Hub é editado em `portable/public/estudar.html` e `portable/public/hub/`. Sua interface, regras de persistência e conteúdo ficam em arquivos separados. **Não edite o Hub diretamente em `docs/`.**

O build copia todos os arquivos públicos para `docs/` e gera um service worker com a lista completa de scripts e estilos da versão. A atualização limpa apenas caches com o prefixo do projeto. Requisições a scripts indisponíveis retornam erro apropriado, sem substituir JavaScript por HTML.

Depois de qualquer mudança, rode `npm run build:pages` e publique tanto os fontes quanto `docs/`. A publicação usa a configuração existente do GitHub Pages (`main`, `/docs`).

Na versão original hospedada com servidor, mantenha os scripts e a configuração de hospedagem existentes; a versão independente do GitHub contém apenas a aplicação estática e o coletor de linha de comando.

## Créditos

Interface e identidade do projeto: **Kaloré**. Documentos e conteúdos externos pertencem a seus respectivos autores e instituições; o projeto apenas referencia as fontes. Não há vínculo oficial com o Inep.
