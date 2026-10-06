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

1. O workflow **Product quality** recompila e verifica os fluxos principais.
2. O workflow **pages build and deployment** publica o conteúdo de `/docs`.
3. **Published site smoke check** compara o conteúdo público de cada recurso com o commit. Falha de resolução do domínio indica que a etapa de DNS precisa ser verificada; falha de hash pode indicar uma versão ainda não propagada.

O build de qualidade pode ter identificadores Next diferentes por ser uma nova compilação. O smoke check compara com os arquivos efetivamente commitados, e não com essa recompilação independente.

Para conferir outro endereço publicado, execute `PUBLISHED_URL=https://atena.dev.br/ python3 scripts/check-published.py`.

## Apresentação sem rede

Baixe `docs/estudar-offline.html` e abra o arquivo no navegador. Ele inclui o Hub, 40 lições, ferramentas de redação e quatro PDFs autorais, sem exigir uma primeira visita conectada. PDFs institucionais externos continuam exigindo internet.

Faça backup dos dados antes de mudar de domínio ou navegador. O armazenamento local de `github.io` é separado de `atena.dev.br`; uma mudança de endereço não transfere rascunhos automaticamente.
