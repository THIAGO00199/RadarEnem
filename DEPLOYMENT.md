# Publicação da ATENA

O código fica no GitHub e o Pages usa **GitHub Actions** como origem. O job `publish` recebe o artefato aprovado pela suíte e o publica com `actions/deploy-pages`, sem escrever na `main` protegida. O domínio é `atena.dev.br`, com **Enforce HTTPS** ativo. O build preserva `docs/CNAME`.

## DNS do domínio

Na zona DNS responsável por `atena.dev.br`, estes são os destinos do GitHub Pages:

| Tipo | Nome | Destino |
|---|---|---|
| A | Raiz: `atena.dev.br` | `185.199.108.153` |
| A | Raiz: `atena.dev.br` | `185.199.109.153` |
| A | Raiz: `atena.dev.br` | `185.199.110.153` |
| A | Raiz: `atena.dev.br` | `185.199.111.153` |
| CNAME | `www` | `thiago00199.github.io` |

O destino do CNAME de `www` não leva `https://`, barras ou `RadarEnem`. O campo que representa a raiz pode ser vazio ou `@`, conforme o provedor; use a indicação da interface. Confira a configuração existente antes de alterar registros e preserve entradas de e-mail ou outros serviços.

No GitHub, em **Settings → Pages**, o domínio personalizado deve ser `atena.dev.br`. Depois que a checagem de DNS e a emissão do certificado concluírem, ative **Enforce HTTPS**. O GitHub informa que propagação DNS e disponibilidade dessa opção podem levar até 24 horas.

Referência: [documentação oficial de domínios personalizados do GitHub Pages](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site).

## Conferir uma publicação

1. **Product quality** compila e executa as regras, regressões, backup entre navegadores, acessibilidade e desempenho.
2. A suíte salva o artefato aprovado, incluindo versão e revisão de origem em `data/build-info.json`.
3. O job `publish` confere se a revisão aprovada ainda é a atual. Se houver uma revisão mais recente, o build antigo não é publicado.
4. No modo **workflow**, ativo neste repositório, `actions/deploy-pages` publica diretamente o artefato da mesma execução, sem commits em `main`. A compatibilidade **legacy** permanece no publicador para outros ambientes; ela exige escrita do bot e não deve ser selecionada neste repositório protegido.
5. A conferência do domínio compara os hashes dos recursos públicos com o artefato. Depois disso, o CI cria a release da versão do pacote e anexa o aplicativo offline.

`published-smoke.yml` continua disponível para auditoria manual. A coleta diária reutiliza `quality.yml`, parte da última base publicada e passa pelas mesmas verificações; falhas preservam a publicação existente.

Para conferir outro endereço, execute `PUBLISHED_URL=https://atena.dev.br/ python3 scripts/check-published.py` a partir do build efetivamente publicado. Uma recompilação independente pode gerar outros identificadores Next.

## Proteção de main

Ativada em 16/10/2026 pela interface administrativa. A regra exige pull request, check `check` emitido pelo GitHub Actions, branch atualizada e conversas resolvidas; inclui administradores e bloqueia force-push e exclusão. Não exige aprovação de outra pessoa: o repositório pode manter o fluxo de um único mantenedor sem liberar alterações que falhem na suíte.

O [PR de teste #9](https://github.com/THIAGO00199/RadarEnem/pull/9) introduziu uma falha intencional no início da suíte: `check` falhou, `publish` foi ignorado e o GitHub desabilitou o merge. O PR foi fechado sem incorporação. Evidência: [execução 38910114359](https://github.com/THIAGO00199/RadarEnem/actions/runs/38910114359). A [issue #4](https://github.com/THIAGO00199/RadarEnem/issues/4) registra a conferência da publicação após a migração.

Para reaplicar a política em uma sessão administrativa `gh`, revise `.github/branch-protection.json` e execute `bash scripts/configure-protection.sh`. O script seleciona Pages por workflow, ativa HTTPS e configura a proteção. Na interface, as configurações ficam em Settings → Pages e Settings → Branches. Depois de uma alteração administrativa, confirme um deploy por artefato e repita o teste negativo em uma branch descartável, fechando o PR sem merge.

O `docs/` versionado pode conter um build anterior. A revisão efetivamente publicada está em `https://atena.dev.br/data/build-info.json`; use o artefato dessa execução para conferir os hashes, em vez de comparar com uma recompilação independente.

## Apresentação sem rede

Baixe `docs/estudar-offline.html` e abra o arquivo no navegador. Ele inclui o Hub, 40 lições, ferramentas de redação e quatro PDFs autorais, sem exigir uma primeira visita conectada. PDFs institucionais externos continuam exigindo internet.

Faça backup dos dados antes de mudar de domínio ou navegador. O armazenamento local de `github.io` é separado de `atena.dev.br`; uma mudança de endereço não transfere rascunhos automaticamente.
