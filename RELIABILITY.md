# ATENA 5.1 · Confiabilidade e pendências

Verificação de 16/10/2026. As conclusões distinguem implementação, evidência automática e dependências externas.

| Prioridade | Item | Resultado |
|---|---|---|
| Alta | Contraste do Radar | Controles da comparação usam um par de cores explícito no portal, preservado em hover e foco. A suíte também inspeciona esses estados. |
| Alta | Qualidade antes de publicar | `main` protegida, inclusive para administradores: PR obrigatório, check do GitHub Actions aprovado, branch atualizada e conversas resolvidas. Build, regras, regressões, acessibilidade e desempenho precedem o deploy do mesmo artefato. Teste negativo bloqueou o merge e ignorou a publicação; evidências na [issue #4](https://github.com/THIAGO00199/RadarEnem/issues/4). |
| Alta | Revisão pedagógica independente | Revisão técnica pontual e fontes primárias adicionadas; 123 aplicações inventariadas por conteúdo. O parecer independente permanece pendente na [issue #5](https://github.com/THIAGO00199/RadarEnem/issues/5). |
| Alta | Preservação de dados | Backup completo, importação validada antes da escrita, recuperação em falha de quota, cópia anterior à restauração e opção de desfazer. Compatibilidade com v3/v4/v5 preservada. |
| Média | Documentação | README, publicação, notas de versão, inventário editorial e este relatório atualizados. |
| Média | Desempenho atual | `check:performance` mede sete páginas em três execuções por página; o relatório JSON identifica método e data. A medição é de laboratório, não tráfego real. |
| Média | Gestão de bugs | Issues com prioridade e critérios de aceite, template reproduzível e vínculo com a entrega. |
| Média | Domínio | `https://atena.dev.br/` respondeu 200 com verificação TLS concluída. HTTPS obrigatório e DNS válido confirmados no Pages. A publicação valida os hashes dos recursos no domínio antes de criar a release. A consulta DNS por HTTPS confirmou os quatro registros A do GitHub Pages (`185.199.108.153` a `185.199.111.153`); `www` chegou ao domínio principal por HTTPS. |
| Baixa | Release versionada | CI cria a release correspondente ao pacote depois da suíte e da conferência da publicação, anexando o aplicativo offline. A execução do workflow é a evidência de publicação. |
| Baixa | Contas, assinaturas e sincronização | Ainda não implementadas. Dependem de backend e contas dos provedores; critérios na [issue #6](https://github.com/THIAGO00199/RadarEnem/issues/6). |

## Evidências reproduzíveis

- `npm run check:backup`: restauração exata, Unicode, anotações, cartões, isolamento de outras chaves, arquivo inválido, desfazer e falha de quota.
- `npm run check:backup-ui`: baixa pelo botão real, importa em outro contexto do navegador, reabre o rascunho no editor, conserva notas do Radar, rejeita arquivo inválido e desfaz a importação.
- `npm run check:atena-ui`, `check:ui`, `check:offline-app`, `check:experience`, `check:clarity` e `scripts/check-glow.cjs`: fluxos existentes, migração e uso offline.
- `npm run check:accessibility`: Hub, Radar, estados de hover da comparação, 18 mapas nos dois temas e materiais. Zero violações automáticas não constitui certificação de acessibilidade.
- `npm run check:performance`: viewport 390×844, CPU 4×, latência de 150 ms, 1,6 Mbps, gzip e cache frio; mediana de três execuções. Relatório em `portable/public/data/performance-audit.json` e no artefato publicado.
- `npm run check:editorial`: valida os hashes e requisitos dos pareceres. A contagem atual é zero aprovações independentes; essa checagem não comprova precisão pedagógica.
- `docs/data/build-info.json`: versão, revisão de origem e data da geração do artefato.

## Preservação e limites

O site continua a armazenar o estudo no navegador. Backup permite transferência; ele não é sincronização automática. Limpar os dados do navegador pode apagar o estudo. O arquivo exportado contém textos pessoais e deve ser guardado pelo próprio estudante. Dados de domínios diferentes e do arquivo offline ficam separados até a importação.

## Proteção administrativa

A proteção foi ativada em 16/10/2026. A regra para `main` exige PR, `check` do GitHub Actions, branch atualizada e conversas resolvidas; proíbe force-push e exclusão e não permite bypass por administradores. Aprovação de outra pessoa não é obrigatória. A API confirmou `protected: true`.

O Pages foi migrado para **GitHub Actions**, com HTTPS obrigatório. O publicador entrega o artefato validado sem escrever em `main`. A política revisável está em `.github/branch-protection.json`; `scripts/configure-protection.sh` permite reaplicá-la em uma sessão administrativa.

O [PR #9](https://github.com/THIAGO00199/RadarEnem/pull/9) foi usado exclusivamente como teste negativo e fechado sem merge. Na [execução 38910114359](https://github.com/THIAGO00199/RadarEnem/actions/runs/38910114359), uma falha intencional resultou em `check: failure`, `publish: skipped` e merge bloqueado. A [issue #4](https://github.com/THIAGO00199/RadarEnem/issues/4) reúne também a conferência do deploy no modo workflow.
