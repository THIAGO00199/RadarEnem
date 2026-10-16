# Publicação da ATENA

O código e o build estático são publicados no GitHub. O Pages deve servir a branch `main`, pasta `/docs`. O arquivo `docs/CNAME` contém `atena.dev.br`; o build preserva esse arquivo.

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
4. No modo **legacy**, o bot atualiza `docs/` com o artefato aprovado e solicita o build do Pages. No modo **workflow**, `actions/deploy-pages` publica diretamente o artefato da mesma execução, sem commits em `main`.
5. A conferência do domínio compara os hashes dos recursos públicos com o artefato. Depois disso, o CI cria a release da versão do pacote e anexa o aplicativo offline.

`published-smoke.yml` continua disponível para auditoria manual. A coleta diária reutiliza `quality.yml`, parte da última base publicada e passa pelas mesmas verificações; falhas preservam a publicação existente.

Para conferir outro endereço, execute `PUBLISHED_URL=https://atena.dev.br/ python3 scripts/check-published.py` a partir do build efetivamente publicado. Uma recompilação independente pode gerar outros identificadores Next.

## Ativar a proteção de main

A ativação requer permissão administrativa no GitHub, indisponível no conector usado nesta entrega. A [issue #4](https://github.com/THIAGO00199/RadarEnem/issues/4) acompanha a conclusão.

O workflow já aceita o modo **GitHub Actions** do Pages. Em uma sessão administrativa `gh`, revise `.github/branch-protection.json` e execute `bash scripts/configure-protection.sh`. O script seleciona Pages por workflow, ativa HTTPS e configura PR, check `check`, branch atualizada e bloqueio de force-push/exclusão, inclusive para administradores. Na interface, as configurações equivalentes ficam em Settings → Pages e Settings → Branches.

Após a ativação, acione **Product quality** e confirme o deploy por artefato. Demonstre com um PR de teste que um check reprovado impede a incorporação. O publicador no modo workflow não depende de push do bot em `main`.

## Apresentação sem rede

Baixe `docs/estudar-offline.html` e abra o arquivo no navegador. Ele inclui o Hub, 40 lições, ferramentas de redação e quatro PDFs autorais, sem exigir uma primeira visita conectada. PDFs institucionais externos continuam exigindo internet.

Faça backup dos dados antes de mudar de domínio ou navegador. O armazenamento local de `github.io` é separado de `atena.dev.br`; uma mudança de endereço não transfere rascunhos automaticamente.
