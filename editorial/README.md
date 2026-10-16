# Revisão pedagógica

A revisão independente permanece **pendente**. Não há um professor identificado que tenha aprovado todas as 123 aplicações de repertório. Testes de formato, extensão e presença de fontes não substituem esse parecer.

O [caderno de revisão](./review-packet.md) apresenta cada referência no contexto de seu argumento. O [registro de pareceres](./reviews.json) mantém um hash por aplicação: se o conteúdo mudar, uma aprovação anterior deixa de valer.

O revisor deve conferir autoria e créditos, sentido da obra, pertinência ao recorte, precisão jurídica e temporal, diferença entre analogia e evidência, linguagem não discriminatória e viabilidade da intervenção. Deve registrar seu nome, data, fontes consultadas e observações. Marque `changes-requested` para uma aplicação inadequada e `approved` somente após avaliação independente real.

Comandos:

```sh
npm run editorial:prepare
npm run check:editorial
```

Em 16/10/2026, a revisão técnica corrigiu o emprego de “capital simbólico” em uma aplicação de Debord, esclareceu o alcance do Tratado do Espaço Exterior, incluiu robustez entre os quatro princípios das WCAG e identificou como intérpretes os créditos musicais que não especificavam composição. Acrescentou fontes primárias em aplicações jurídicas e institucionais. A MP 1.394/2026 e a retenção de receitas para GLP-1 foram consultadas nas fontes oficiais; a vigência deve ser novamente conferida quando o aluno usar o repertório.

Fontes consultadas para essas verificações pontuais:

- [MP 1.394/2026 — texto oficial](https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2026/mpv/mpv1394.htm)
- [Ministério da Fazenda — esclarecimentos de outubro de 2026](https://www.gov.br/fazenda/pt-br/composicao/orgaos/secretaria-de-premios-e-apostas/medida-provisoria-ndeg-1-394-2026-entenda-as-novas-regras-para-as-apostas-de-quota-fixa)
- [Anvisa — retenção de receitas para GLP-1](https://www.gov.br/anvisa/pt-br/assuntos/noticias-anvisa/2025/canetas-emagrecedoras-so-poderao-ser-vendidas-com-retencao-de-receita)
- [W3C — WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- [ONU — Tratado do Espaço Exterior](https://www.unoosa.org/oosa/en/ourwork/spacelaw/treaties/outerspacetreaty.html)
- [Gilberto Gil — créditos do álbum Quanta](https://gilbertogil.com.br/discografia/quanta/)
