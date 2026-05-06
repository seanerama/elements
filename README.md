# Elements

An interactive periodic table — a retro-science web encyclopedia with all 118 elements.
**Live at:** [elements.seanmahoney.ai](https://elements.seanmahoney.ai)

## Stack

- [Astro 5](https://astro.build) with `@astrojs/node` (standalone) — static-first SSG, Node server runtime
- [React 18](https://react.dev) for interactive islands (Bohr, 3D viz, trivia)
- TypeScript strict, ESLint, Prettier, Stylelint
- Vitest (unit) + Playwright (E2E)
- IBM Plex (Serif + Sans + Mono) typography
- Phosphor Icons
- Three.js + R3F for 3D orbital viz (lazy-loaded)

## Local Development

```bash
npm install
npm run dev                  # Astro dev on http://127.0.0.1:8011
```

## Tests & Gates

```bash
npm run typecheck            # astro check
npm run lint                 # eslint + stylelint
npm run format:check         # prettier
npm run test                 # vitest unit
npm run test:e2e:install     # one-time playwright browser install
npm run test:e2e             # playwright e2e
npm run build                # production build → dist/
```

## Production

The Astro Node standalone server is managed by **PM2** and fronted by **Cloudflare Tunnel**.
See [`sdd-output/deploy-instruct.md`](sdd-output/deploy-instruct.md) for full deployment.

```bash
npm run build
node dist/server/entry.mjs   # listens on 127.0.0.1:$PORT (default 8011)
```

## Project Structure

See [`sdd-output/project-plan.md`](sdd-output/project-plan.md) for the full architecture and
[`sdd-output/stage-instructions/`](sdd-output/stage-instructions/) for the per-stage build plan.
