# ATENA 5.3 — 19/10/2026

- Reorganiza argumentos em quatro etapas, com favoritos, roteiro por mapa, exportação e transferência para os campos vazios do estúdio.
- Completa fontes das 123 aplicações culturais/conceituais e corrige ligações temáticas, contexto e limites de analogias.
- Adiciona catálogo oficial SiSU 2026 com busca, filtros, paginação, pesos, mínimos e cortes por curso/campus/turno/modalidade; mantém o cadastro manual.
- Preserva a ausência de corte e não aplica automaticamente bônus ou elegibilidade em cotas.
- Adiciona instalação PWA orientada para Android, iPhone/iPad e computador, com evento nativo e confirmação do cache principal.
- Amplia o backup para favoritos e roteiros e os testes de cálculos, catálogo, instalação e uso offline.

# ATENA 5.2 — 18/10/2026

- Início focado na próxima atividade e na semana, sem repetir o plano completo, a vitrine de ferramentas e os anúncios de recursos.
- Navegação compartilhada entre início, estudos, redação e Minha nota, com materiais e organização em grupos expansíveis. Atalho móvel de Argumentos preservado.
- Minha nota: média simples ou por pesos, até 12 objetivos, edição e remoção reversível. Referências de corte identificadas por ano, modalidade e fonte informada pelo estudante; sem catálogo automático ou promessa de aprovação.
- Notas e objetivos locais incluídos no backup completo. Testes de cálculo, persistência, navegação e acessibilidade adicionados à verificação do produto.

# Radar 3.1 + ENEM Hub 6.0 — 01/10/2026

- Biblioteca ampliada de nove portais para 68 referências de PDFs com matéria, ano, instituição e fonte; busca por múltiplos termos sem acentos, filtros, favoritos, leitura e paginação.
- Quatro PDFs autorais com 21 páginas: redação, 12 problemas de matemática comentados, desafios de Humanas/Natureza e planejamento/caderno de erros.
- Treino com 18 provas oficiais regulares de 2017–2025 e seus gabaritos azuis; cronômetro, recuperação na mesma aba, acertos por área, histórico, indicação de revisão e CSV.
- Busca rápida por Ctrl/Cmd+K, atalhos de PDF/prova no Radar, apresentação só na tela Hoje e navegação móvel que mostra a seção ativa.
- Tokens compartilhados, contraste corrigido no tema claro, seletores com nome acessível e flashcards sem controles interativos aninhados.
- Cinco páginas de conteúdo em HTML para descoberta, com canonical, dados estruturados e sitemap ampliado.
- Backup v5, com favoritos, leitura e histórico oficial; compatibilidade com v3/v4 preservada.
- Geração de conteúdo e cache offline incorporada ao pipeline do Vite; requisições parciais de PDF não são gravadas indevidamente no Cache API.
- Auditoria de acessibilidade em 36 telas, medição de laboratório, verificação externa dos links e diagnóstico/roadmap em AUDITORIA.md.

# Radar 3.0 + ENEM Hub 5.0 — 01/10/2026

O ENEM Hub agora inicializa por completo: a renderização das conquistas deixou de acessar os flashcards antes de sua declaração. A publicação pode ser reconstruída sem apagar o Hub ou seus arquivos de instalação.

Correções:

- Flashcards viram com clique e teclado; respostas ficam visíveis no verso.
- O feedback das lições permanece após responder, e a próxima lição é desbloqueada.
- Links com hashes desconhecidos não quebram seletores ou escondem todas as seções.
- Rascunho e tema de redação, anotações e timer de foco persistem após recarregar.
- Plano semanal respeita as horas escolhidas e deixa de dar XP por simplesmente gerar um plano.
- A rota diária registra atividades distintas e não reinicia na primeira ação concluída.
- Marcar/desmarcar repetidamente um checklist não dá XP adicional.
- Backups têm validação de tipos, limites e identificadores antes de entrar na interface.
- Cache offline inclui scripts e estilos dos dois aplicativos; falta de script retorna 503, não HTML.
- Menu e header deixam de causar rolagem lateral em celulares de 360 px.

Novidades:

- Visual compartilhado, navegação lateral e atalhos no celular, com claro/escuro.
- Simulado cronometrado com marcação de itens, retomada na mesma aba, correção final, histórico e integração ao caderno de erros.
- Banco ampliado de 20 para 60 questões autorais e guia de 22 fórmulas/conceitos pesquisáveis.
- Roteiro de tese, argumentos e intervenção com exportação independente.
- Tema do Radar enviado diretamente ao laboratório de redação.
- Recuperação de energia por revisão de flashcards, limitada a uma recuperação por cartão/dia.

Validação: typecheck, regras do Radar, testes do Hub e testes de navegador de fluxos, quatro larguras, temas claro/escuro e ambos os aplicativos offline. Questões e checagens de redação são recursos de treino; não estimam nota TRI nem nota oficial da redação.
