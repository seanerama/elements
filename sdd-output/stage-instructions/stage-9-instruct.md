# Stage 9: Deployment & CI

**Created by**: Project Planner
**Date**: 2026-05-06

## Objectives

- Author the GitHub Actions deploy workflow per `deploy-instruct.md`
- Document one-time EC2 setup steps and execute them on the target instance
- Add the Cloudflare Tunnel route entry for `elements.seanmahoney.ai → http://localhost:8011`
- Run a successful first deploy and verify with smoke checks
- Document rollback procedure
- Verify the Project Deployer (next role) can pick this up and deploy with no surprises

## What to Build

### Files

- `.github/workflows/deploy.yml` — full deploy pipeline:
  1. Checkout
  2. Setup Node 20
  3. `npm ci`
  4. Run `scripts/stage-8-gate.sh` (re-runs all build/test gates)
  5. `npm run build`
  6. Configure SSH from secrets (`EC2_SSH_KEY`)
  7. `rsync -az --delete dist/ data/ package.json package-lock.json ecosystem.config.cjs $EC2_USER@$EC2_HOST:$EC2_DEPLOY_PATH/`
  8. SSH to EC2: `cd $EC2_DEPLOY_PATH && npm ci --omit=dev && pm2 reload elements`
  9. Smoke checks: `curl -sf https://elements.seanmahoney.ai/`, `/elements/h`, `/games/element` — fail workflow if any non-200 or missing expected content
- `.github/workflows/ci.yml` — non-deploying CI on every PR: `npm ci`, type-check, lint, unit tests, Playwright (production-build mode but no deploy)
- `scripts/stage-8-gate.sh` (already in Stage 8) — referenced by deploy workflow
- `scripts/post-deploy-smoke.sh` — small bash script that runs the three smoke curls; used by both CI and ad-hoc local verification
- `sdd-output/tests/deploy-runbook.md` — operator runbook documenting the full deploy flow + rollback steps in human-friendly form (Stage 9 produces this for the operator's reference)
- Optional: `.github/workflows/preview.yml` — on PR, build but don't deploy; comment a build-success message back to the PR (nice-to-have, not required)

### EC2 One-Time Setup (executed during this stage)

Per `deploy-instruct.md` § "One-Time EC2 Setup":

- [ ] Create `/var/www/elements` with correct ownership
- [ ] Place `/var/www/elements/.env` with `HOST=127.0.0.1`, `PORT=8011`, `NODE_ENV=production`, `chmod 600`
- [ ] Add the `elements.seanmahoney.ai → http://localhost:8011` route to existing `cloudflared` config
- [ ] Create DNS record (`cloudflared tunnel route dns <tunnel-name> elements.seanmahoney.ai` or via Cloudflare dashboard)
- [ ] Reload `cloudflared`
- [ ] Verify tunnel responds (will return tunnel error until first deploy — expected)

### GitHub Secrets

Add these to the repo's Actions secrets (one-time):

- [ ] `EC2_HOST`
- [ ] `EC2_USER`
- [ ] `EC2_SSH_KEY` (PEM, with matching public key in `~/.ssh/authorized_keys` of the deploy user on EC2)
- [ ] `EC2_DEPLOY_PATH=/var/www/elements`

### Components

None (Stage 9 is configuration + scripts).

## Interface Contracts

### Exposes

- A reproducible deployment process that produces a running site at `https://elements.seanmahoney.ai`

### Consumes

- **Deploy Artifact** (`contracts/deploy-artifact.md`) — Stage 8's `dist/`

## Testing Requirements

- [ ] On a feature branch, push a commit that intentionally breaks (e.g., type error). Confirm CI fails before deploy step
- [ ] On `main`, deploy workflow runs end-to-end on a clean push and produces a live site
- [ ] Post-deploy smoke checks pass: `/`, `/elements/h`, `/games/element` all return 200 with expected content
- [ ] Rollback: redeploy a prior commit (re-run workflow against an older SHA) — site reverts cleanly
- [ ] Manual rollback: SSH to EC2, `pm2 reload elements` after rsyncing the prior `dist/` snapshot — works

## Pipeline Test: YES

This is the live-deploy pipeline test:

1. Trigger the deploy workflow on `main`
2. Workflow runs all gates (Stage 8's gate script)
3. Workflow rsyncs to EC2, runs `npm ci --omit=dev`, runs `pm2 reload elements`
4. Workflow runs `scripts/post-deploy-smoke.sh` against `https://elements.seanmahoney.ai`
5. All three smoke curls return 200 with expected content
6. Workflow exits 0

## Acceptance Criteria

- [ ] `https://elements.seanmahoney.ai/` returns the periodic table landing
- [ ] `https://elements.seanmahoney.ai/elements/h` returns the Hydrogen detail page
- [ ] `https://elements.seanmahoney.ai/elements/og` returns the Oganesson detail page (synthetic, edge case)
- [ ] `https://elements.seanmahoney.ai/games/element` returns the Guess-the-Element game
- [ ] PM2 status on EC2 shows `elements` as online with reasonable memory footprint (< 200 MB resident)
- [ ] Cloudflare CDN is caching static assets (response includes `cf-cache-status: HIT` on second request to `/_astro/*` files)
- [ ] Site loads in < 2 seconds on Fast 3G simulated network (Chrome DevTools)
- [ ] Smoke check script can be run locally (`scripts/post-deploy-smoke.sh`) and passes
- [ ] Operator runbook (`sdd-output/tests/deploy-runbook.md`) is complete and accurate
- [ ] Deploy workflow is documented in `README.md` so a fresh contributor knows how to deploy

## Dependencies

- Depends on: Stage 8 (build artifact + all gates passing)
- Can parallel with: none (serialized)

## Notes

- **Production env is on `main` only.** PR builds run CI but never deploy. If a preview/staging environment is wanted later, add `staging.elements.seanmahoney.ai` as a separate Cloudflare Tunnel route + a separate PM2 app — out of MVP scope.
- **Don't expose the EC2 instance publicly.** The Node server binds to `127.0.0.1:8011`. Cloudflare Tunnel is the only ingress. Verify via `nmap` or `ss -tlnp` after deploy that no public port is open.
- **Rsync `--delete` flag** removes orphaned files on the target. This is intentional — keeps the EC2 deploy directory clean. The `.env` file lives at `/var/www/elements/.env` and is **not** in the rsync source, so it's never deleted (rsync only acts within `dist/`, `data/`, etc., not the parent directory's other files — but verify the rsync command doesn't accidentally include the parent `/var/www/elements/.env`).
- **First deploy gotcha**: PM2 needs to know the app exists before `pm2 reload` works. The first deploy's SSH command should check `pm2 describe elements` and `pm2 start ecosystem.config.cjs` if missing, otherwise `pm2 reload elements`. Document this in the runbook.
- **Cloudflare Tunnel restart**: adding the new route to the existing `cloudflared` config requires a `systemctl reload cloudflared` (or equivalent). The other apps on the tunnel are unaffected.
- **Cost**: this stage doesn't increase EC2 cost meaningfully — same instance, additional small process. Cloudflare Tunnel is free.
- **Monitoring**: not in MVP scope, but document where to add it in the runbook (Cloudflare Analytics for traffic; PM2 logs for app errors; SRE phase will formalize).
- This is the last stage. After it ships, the site is live and the build is done.
