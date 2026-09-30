# Kaloré · Radar de redação ENEM 2026

**Feito por Kaloré, para todos.** Um aplicativo de pesquisa e preparação com visual de terminal, radar animado, verde e ciano, e fontes que você pode conferir.

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

Verificações automatizadas: tipos, build estático e regras de soma, comparação PND, limites, datas, URLs, duplicatas e feed. A coleta foi exercitada com fontes reais. Não foi possível realizar inspeção visual em navegador nesta sessão.

Na versão original hospedada com servidor, mantenha os scripts e a configuração de hospedagem existentes; a versão independente do GitHub contém apenas a aplicação estática e o coletor de linha de comando.

## Créditos

Interface e identidade do projeto: **Kaloré**. Documentos e conteúdos externos pertencem a seus respectivos autores e instituições; o projeto apenas referencia as fontes. Não há vínculo oficial com o Inep.
