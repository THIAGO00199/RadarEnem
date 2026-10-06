# ATENA · versão 5 e próximos passos

A migração transforma o conjunto Radar ENEM + ENEM Hub em uma plataforma Next/React, mantendo o progresso local e as ferramentas existentes. A prioridade desta entrega é permitir que um aluno entre, pratique, escreva e continue estudando sem uma trava artificial depois de cinco lições.

## Decisões concretas

| Necessidade | Implementação | Limite real |
|---|---|---|
| Identidade da imagem | Obsidiana `#0B0D12`, creme `#F1EDE4`, ouro `#E5C158`, azul `#75C9E2`; imagem original, símbolo A com estrela, fonte Manrope local | A imagem é conceitual; os percentuais desenhados no tablet não são dados do aluno |
| Interface de aplicativo | Sidebar fixa, dock móvel, cards, busca e preferências | Algumas ferramentas preservam a implementação existente no Hub |
| Aprender continuamente | 40 lições, oito por área; nova tentativa e próxima trilha | Conteúdo de fundamentos autoral, sem equivalência a uma prova oficial |
| Redação organizada | 17 eixos, 34 caminhos, editor e roteiro, retomada de versões preservando o rascunho e checklist C1–C5 | Sem IA, nota ou julgamento automático de qualidade; até 30 versões locais |
| Custo de operação | Exportação estática, progresso local, Python no Actions | Domínio e uso além das políticas gratuitas podem gerar custos |
| Offline | Cache versionado do site e arquivo independente com quatro PDFs | Fontes externas e sincronização entre aparelhos exigem conexão/backup |
| Atualização | Coleta diária e download do JSON no acesso | Sem promessa de atualização em tempo real; cron pode atrasar |

O Next foi escolhido para estrutura tipada, rotas, componentes e pré-renderização. O Python concentra a coleta de fontes. Não há um backend Python por visita: isso mantém a experiência compatível com GitHub Pages e com o objetivo de custo baixo.

## Meta de 190 mil visitas mensais

A meta é tratada como **visitas**, e não receita ou usuários existentes. O prazo de planejamento é de 90 dias após o lançamento, sujeito aos resultados reais. As faixas abaixo são checkpoints de aquisição, não uma previsão de crescimento.

| Período | Trabalho | Critério para avançar |
|---|---|---|
| Dias 1–7 | Apresentação para a turma, testar celular e offline, registrar cinco dificuldades mais frequentes | Alunos conseguem abrir uma lição, salvar uma redação e encontrar um PDF; erros de uso corrigidos |
| Dias 8–30 | Conteúdo útil compartilhável: guias de tema, explicações de questões e páginas dos cadernos; contato do autor com professores e escolas | Tráfego medido, retorno de estudantes e uso repetido das ferramentas; hipótese de 5–15 mil visitas/mês |
| Dias 31–60 | Melhorar os assuntos com maior procura; revisar o banco autoral; permitir contribuição com revisão pedagógica | Retenção em 7 dias e conclusões de prática aumentam; hipótese de 30–60 mil visitas/mês |
| Dias 61–90 | Distribuição pelas escolas, páginas orgânicas de qualidade e revisão dos gargalos de dispositivo/rede | Decidir com dados se 190 mil visitas/mês é alcançável ou se prazo/canal precisam mudar |

Antes de usar números de aquisição para decidir, será necessário configurar uma medição de visitas com política de privacidade clara. Nesta entrega, a ATENA não coleta nomes, redações ou respostas em um servidor de analytics. O painel mostra somente o progresso local do próprio estudante.

Não enviar mensagens em massa nem prometer aprovação ou nota. Cada guia deve dar valor concreto: recorte, duas relações causais, referência verificável, pergunta crítica e proposta de intervenção coerente.

## Prioridades seguintes

**Alta — próximas duas semanas**

1. Teste presencial com a turma e correção de problemas observados, priorizando perda de rascunho, botões sem próximo passo e leitura móvel.
2. Revisão pedagógica das 40 lições e das 84 questões por professores; registrar autor, revisão e data em cada conjunto.
3. Tratar importação entre endereço antigo, domínio e aplicativo independente como parte do primeiro uso.
4. Medir LCP/CLS/INP em dispositivos reais e rede móvel; definir orçamentos antes de adicionar gráficos ou bibliotecas pesadas.
5. Estruturar páginas estáticas por tema e assunto com conteúdo próprio, fontes e datas; evitar páginas vazias geradas só para SEO.

**Média — semanas 3–6**

1. Migrar as ferramentas restantes do Hub por fluxo completo, começando por questões e simulados. A migração deve manter os formatos de backup e o arquivo independente.
2. Acrescentar objetivos por assunto e intervalos de revisão baseados no histórico de tentativas. Explicar por que um assunto foi sugerido.
3. Criar revisão por pares ou professor com autorização do autor do texto, critérios visíveis e moderação. O atual botão Comunidade é um convite e um canal de contribuição, sem sala compartilhada.
4. Organizar contribuições por pull request, com verificação automática e revisão de conteúdo humano.

**Baixa — quando houver demanda e capacidade**

1. Conta opcional e sincronização; manter a jornada sem cadastro e definir regras de conflitos antes de ligar um banco.
2. Pacotes de conteúdo offline selecionáveis e exportação com histórico de versões.
3. Dashboards institucionais somente com escopo de acesso, consentimento e necessidade claros.

## Capacidade e publicação

Cada rota principal é pré-renderizada uma vez no build. O CDN entrega o mesmo HTML/CSS/JS, e cálculos de progresso, escrita e revisão acontecem no aparelho. O custo de processamento de aplicação por visita é zero nesta arquitetura.

Isso não demonstra que o provedor suportará 100 mil acessos simultâneos. O repositório não contém esse teste de carga. Para crescer, monitore tamanho transferido, taxa de erros, disponibilidade, limites de transferência e tempo em rede móvel. Se o tráfego ultrapassar as políticas do Pages, o mesmo export estático pode ser movido para outro CDN sem reescrever as ferramentas locais.

A CI recompila, valida estado e conteúdo, testa navegação e offline e audita acessibilidade. O smoke check público compara hashes de cada arquivo com o commit. Cada atualização preserva `CNAME`; um push concorrente no coletor deve falhar com conflito em vez de sobrescrever o trabalho de outra pessoa.
