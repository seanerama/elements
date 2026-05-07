# Deploy Runbook

> Operator-facing playbook for shipping changes to **https://elements.seanmahoney.ai**.

## What ships and how

- Source of truth: GitHub `main` branch.
- Deploy is triggered by **push to `main`** via `.github/workflows/deploy.yml`.
- The workflow runs all gates (typecheck → lint → format → unit → build → E2E) and
  only proceeds to ship if every gate passes.
- The deployable artifact is `dist/` plus committed `data/`, `package.json`,
  `package-lock.json`, and `ecosystem.config.cjs`.

## Pre-flight (one-time)

### EC2

```bash
sudo mkdir -p /var/www/elements
sudo chown $USER:$USER /var/www/elements

# Runtime env (PM2 reads via env_file)
cat > /var/www/elements/.env <<'EOF'
HOST=127.0.0.1
PORT=8011
NODE_ENV=production
EOF
chmod 600 /var/www/elements/.env

# Logs directory
sudo mkdir -p /var/log/pm2
sudo chown $USER:$USER /var/log/pm2
```

### Cloudflare Tunnel

Add to your existing `cloudflared` config (typically `/etc/cloudflared/config.yml`):

```yaml
ingress:
  # ... existing routes above ...
  - hostname: elements.seanmahoney.ai
    service: http://localhost:8011
  # ... catch-all stays last ...
```

Add the DNS record:

```bash
cloudflared tunnel route dns <your-tunnel-name> elements.seanmahoney.ai
```

Reload:

```bash
sudo systemctl reload cloudflared
```

### GitHub repository secrets

In `Settings → Secrets and variables → Actions → Repository secrets`:

| Secret | Value |
|--------|-------|
| `EC2_HOST` | EC2 hostname or IP |
| `EC2_USER` | SSH user (e.g. `ubuntu`) |
| `EC2_SSH_KEY` | private key (paste full PEM contents) |
| `EC2_DEPLOY_PATH` | `/var/www/elements` |

The matching public key must be present in `~/.ssh/authorized_keys` of the deploy user on EC2.

## Routine deploy

```bash
git push origin main
```

Then watch the GitHub Actions run. Successful run = live site updated.

Manual trigger (for hotfix without a code change):

```bash
gh workflow run deploy.yml
```

## Smoke verification

```bash
bash scripts/post-deploy-smoke.sh https://elements.seanmahoney.ai
```

Checks `/`, `/elements/h`, `/elements/og`, `/games`, `/games/element`.

## Rollback

### Quickest — re-run an older commit

In GitHub Actions UI: re-run the deploy workflow against the last known-good
commit/tag. Or:

```bash
gh workflow run deploy.yml --ref <commit-sha>
```

### Manual — SSH to EC2

If a deploy left the server broken and CI itself can't recover:

```bash
ssh ${EC2_USER}@${EC2_HOST}
cd /var/www/elements

# Restart with last successfully-installed code
pm2 restart elements

# OR explicitly redeploy a prior dist/ snapshot you've kept
# (no automated rollback snapshot is kept yet — manual only)
```

### Tunnel-level — disable ingress

If the issue is CDN / DNS / tunnel routing, comment out the
`elements.seanmahoney.ai` ingress entry in `cloudflared` config and
reload. Other apps on the tunnel are unaffected.

## Incident triage checklist

- [ ] `pm2 status elements` — process online?
- [ ] `pm2 logs elements --lines 50` — recent errors?
- [ ] `curl -sf http://127.0.0.1:8011/` — does the local server respond?
- [ ] `curl -sf https://elements.seanmahoney.ai/` — does Cloudflare reach it?
- [ ] Cloudflare dashboard → DNS, Workers → Tunnel: any red flags?

## Cost / footprint

- EC2: shared with other PM2-managed apps; this one adds ~80 MB resident
  memory + minimal CPU.
- Cloudflare Tunnel: free tier sufficient.
- No outbound network on boot. Static asset serving only.

## Things this runbook does NOT cover

- Bumping the data pipeline (sub-agents, image sourcing) — see
  `pipelines/README.md`. Those scripts are dev-only and never run in CI.
- SRE concerns (alerting, structured logging, on-call) — handled in the
  SRE phase of the SDD workflow.
