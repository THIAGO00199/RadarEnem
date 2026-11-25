# ATENA — Knowledge is power

A free, open-source study platform for Brazil's ENEM university entrance exam. ATENA combines topic monitoring, study tools, essay planning, practice materials, and local progress tracking in a static-first application.

**Built in Brazil, for everyone.**

- Website: https://atena.dev.br/
- Study academy: https://atena.dev.br/estudos.html
- Essay studio: https://atena.dev.br/redacao.html
- Argument and reference guide: https://atena.dev.br/guia-estrategico.html
- Score and university catalogue: https://atena.dev.br/minha-nota.html
- Topic radar: https://atena.dev.br/radar.html
- Offline single-file app: https://atena.dev.br/estudar-offline.html

## Current release

The repository documents ATENA 5.3. The platform includes:

- A learning academy with 40 original lessons across five areas.
- An essay studio with 17 practice themes, argument paths, planning tools, checklists, and local draft history.
- A topic radar that organizes relative study priorities from public sources. It does not predict exam questions or probabilities.
- A university and course catalogue based on the official SiSU 2026 data, with weighted-score comparison and explicit modality caveats.
- Practice questions, timed simulations, review cards, a mistake notebook, a Pomodoro timer, and a reference library.
- Progressive Web App caching and a standalone offline HTML edition.
- Local-first student progress, complete backup and restore, and no mandatory account.
- A Python collector that gathers public-source updates without a paid AI API.

The content is for study and practice. It does not provide official essay grading, TRI estimates, admission predictions, or eligibility decisions for affirmative-action modalities.

## Architecture

ATENA uses Next.js, React, TypeScript, and Tailwind for a statically exported front end. Python is used for scheduled data collection and validation. GitHub Actions builds and publishes the static output to GitHub Pages with a custom domain.

The browser stores personal progress locally. Opening the platform does not trigger server-side essay processing or a paid AI call. The architecture is designed to keep operational complexity and per-visitor compute low; it is not a claim of unlimited hosting capacity.

## Development

Requirements: Node.js 22.13+, Python 3.10+, and pnpm 11.25.0.

```sh
npm install --global pnpm@11.25.0
pnpm install --frozen-lockfile
pnpm dev
```

Build and preview the static site:

```sh
pnpm build:pages
pnpm preview:pages
```

Useful validation commands:

```sh
pnpm typecheck
pnpm check:atena
pnpm check:scores
pnpm check:backup
pnpm check:editorial
pnpm check:radar
pnpm check:hub
python3 -m unittest backend.test_radar_collect
```

See [DEPLOYMENT.md](./DEPLOYMENT.md), [RELIABILITY.md](./RELIABILITY.md), and [ATENA.md](./ATENA.md) for deployment, reliability, product strategy, and current limitations.

## Data and editorial standards

Public datasets and external references retain their original provenance and attribution. Editorial interpretations are distinguished from source facts. Official admission data must be checked against the current institution notice and modality rules; historical cutoffs are not admission guarantees.

The project is not affiliated with Brazil's Ministry of Education or the institutions listed in the catalogue.

## License

Original code is distributed under the MIT License. External content, source datasets, images, and linked PDFs may have separate terms. See [LICENSE](./LICENSE) and the relevant source notices.

---

[Português](./README.md) · [Español](./README.es.md)
