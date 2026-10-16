# ATENA 5.1 · Confiabilidade e pendências

Verificação de 16/10/2026. As conclusões distinguem implementação, evidência automática e dependências externas.

| Prioridade | Item | Resultado |
|---|---|---|
| Alta | Contraste do Radar | Controles da comparação usam um par de cores explícito no portal, preservado em hover e foco. A suíte também inspeciona esses estados. |
| Alta | Qualidade antes de publicar | Build, regras, regressões, acessibilidade e medição de desempenho precedem a publicação do mesmo artefato. A coleta diária usa a suíte completa. A proteção administrativa de `main` ainda depende da [issue #4](https://github.com/THIAGO00199/RadarEnem/issues/4). |
| Alta | Revisão pedagógica independente | Revisão técnica pontual e fontes primárias adicionadas; 123 aplicações inventariadas por conteúdo. O parecer independente permanece pendente na [issue #5](https://github.com/THIAGO00199/RadarEnem/issues/5). |
| Alta | Preservação de dados | Backup completo, importação validada antes da escrita, recuperação em falha de quota, cópia anterior à restauração e opção de desfazer. Compatibilidade com v3/v4/v5 preservada. |
| Média | Documentação | README, publicação, notas de versão, inventário editorial e este relatório atualizados. |
| Média | Desempenho atual | `check:performance` mede sete páginas em três execuções por página; o relatório JSON identifica método e data. A medição é de laboratório, não tráfego real. |
| Média | Gestão de bugs | Issues com prioridade e critérios de aceite, template reproduzível e vínculo com a entrega. |
| Média | Domínio | `https://atena.dev.br/` respondeu 200 com verificação TLS concluída. A publicação valida os hashes dos recursos no domínio antes de criar a release. A resolução DNS direta do ambiente de execução é limitada; essa limitação não impede o acesso HTTPS verificado. |
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

A configuração revisável está em `.github/branch-protection.json`. `scripts/configure-protection.sh` migra o Pages para GitHub Actions e ativa a proteção em uma sessão `gh` com permissão administrativa. O workflow já distingue `legacy` e `workflow`: no segundo modo, publica por artefato e não escreve em `main`.

Até a ativação pelo administrador, a atualização normal de `docs/` está condicionada à suíte, mas a branch desprotegida ainda permite que um colaborador publique por um caminho externo ao fluxo. Essa dependência não está marcada como resolvida.
