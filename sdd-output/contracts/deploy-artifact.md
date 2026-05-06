# Interface Contract: Deploy Artifact

**Between**: Stage 8 (Polish/Build) → Stage 9 (Deploy)
**Created**: 2026-05-06

## Provider (Stage 8)

### Build Command

```bash
npm ci
npm run build
```

Produces a deployable artifact in `dist/` with a precise structure that Stage 9's deploy workflow expects.

### Artifact Structure

```
dist/
├── server/
│   └── entry.mjs           # Astro Node standalone entrypoint
├── client/
│   ├── _astro/             # hashed JS/CSS bundles
│   ├── _astro/<name>.<hash>.css
│   ├── _astro/<name>.<hash>.js
│   └── ...                 # any client-side assets
└── _data/                  # static element data passthrough (optional — see below)
    └── elements/
        └── <symbol>/...
```

### Files Required at Deploy Target

The deploy target on EC2 (`/var/www/elements/`) must contain:

| Path                                | Source                       | Notes |
|-------------------------------------|------------------------------|-------|
| `dist/`                             | build output                 | Full directory |
| `data/`                             | committed in repo            | Static element data (read at runtime by SSG'd pages or served as static asset) |
| `package.json`, `package-lock.json` | committed in repo            | For `npm ci --omit=dev` on EC2 |
| `ecosystem.config.cjs`              | committed in repo            | PM2 config |
| `.env`                              | one-time placement on EC2    | Runtime env, NOT in repo |
| `node_modules/`                     | produced on EC2 via `npm ci --omit=dev` | Runtime deps |

### Build Requirements (gates)

Stage 8 is "complete" only when the following are met. Stage 9 should not deploy a build that fails any of these:

- [ ] `npm run build` exits 0
- [ ] No TypeScript errors (`tsc --noEmit` exits 0)
- [ ] No ESLint errors (`eslint .` exits 0)
- [ ] All Vitest unit tests pass (`vitest run`)
- [ ] All Playwright E2E tests pass against the production build (`playwright test`)
- [ ] Lighthouse desktop score: Performance ≥ 90, Accessibility ≥ 95, SEO ≥ 90 — verified locally and recorded in `sdd-output/tests/lighthouse-baseline.json`
- [ ] Total client JS shipped on the periodic table landing page is < 80 KB gzipped (excludes Three.js, which must be dynamically imported)
- [ ] Three.js bundle is in a separate chunk and is **not** loaded on initial element-detail page render (only on "View 3D" toggle)

### Runtime Requirements

The Node server will be started by PM2 as:

```bash
node dist/server/entry.mjs
```

with environment:

```
HOST=127.0.0.1
PORT=8011
NODE_ENV=production
```

The server must:

- Bind only to `127.0.0.1`, never `0.0.0.0`
- Serve all routes with `< 200ms` p50 response time on a t4g.nano-equivalent instance (cached)
- Serve static assets with proper `Content-Type` headers
- Not require any outbound network on boot

## Consumer (Stage 9)

### Deploy Pipeline (GitHub Actions)

```yaml
- npm ci
- npm run build         # gated by Stage 8's build-requirement checks
- rsync -az --delete dist/ data/ package.json package-lock.json ecosystem.config.cjs $EC2_USER@$EC2_HOST:$EC2_DEPLOY_PATH/
- ssh $EC2_USER@$EC2_HOST 'cd /var/www/elements && npm ci --omit=dev && pm2 reload elements'
```

### Smoke Verification (post-deploy)

Stage 9 must run, against the deployed `https://elements.seanmahoney.ai`, the following checks (all must return HTTP 200 with the expected content):

- `GET /` → contains `Periodic Table` and `<table>` (or grid container)
- `GET /elements/h` → contains `Hydrogen` and `1.008`
- `GET /games/element` → contains `Guess the Element`

## Validation

- [ ] Stage 8 produces a `dist/` directory with the documented structure
- [ ] All build-requirement gates pass before Stage 9 is unblocked
- [ ] Stage 9 deploy script consumes only files documented above (no implicit dependencies)
- [ ] Post-deploy smoke checks pass on first deploy and on every subsequent deploy
- [ ] If smoke checks fail, deploy workflow fails the build (does not auto-rollback — manual rollback via `pm2 reload elements` after rsyncing prior dist)
