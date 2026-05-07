# Deploy Runbook — Elements

> Operator-facing playbook for shipping changes to **https://elements.seanmahoney.ai**.
> Built on the existing `seanmahoney-ai` infrastructure (see `~/seanmahoneyai/seanmahoney-ai-setup-guide.md`).

## Stack at a glance

- **Host**: shared EC2 `t4g.small` (the same instance running the MCP server, auth server, etc.)
- **App location on the box**: `/home/ubuntu/apps/elements/`
- **Process manager**: PM2 (system-wide, runs as `ubuntu`, hooked into systemd)
- **Process name**: `elements`
- **Port**: `8011` (binds to `127.0.0.1` only — Cloudflare Tunnel is the only ingress)
- **Public URL**: `https://elements.seanmahoney.ai`
- **Source of truth**: `main` branch of `github.com/seanerama/elements`

## Pre-flight (one-time)

### 1. Cloudflare Tunnel route — Cloudflare Zero Trust dashboard

In **Zero Trust → Networks → Tunnels → `seanmahoney-primary` → Configure → Public Hostname**, click `Add a public hostname`:

| Field | Value |
|-------|-------|
| Subdomain | `elements` |
| Domain | `seanmahoney.ai` |
| Type | `HTTP` |
| URL | `localhost:8011` |

Save. Cloudflare provisions the TLS cert automatically; no nginx, no certbot.

### 2. GitHub repo secrets

Open **https://github.com/seanerama/elements/settings/secrets/actions** and add:

| Secret name | Value |
|-------------|-------|
| `EC2_HOST` | The EC2 public IP or hostname (the same one used to SSH from your laptop) |
| `EC2_USER` | `ubuntu` |
| `EC2_SSH_KEY` | Full contents of `~/.ssh/id_ed25519` (the private key — paste the whole PEM, including BEGIN/END lines) |
| `EC2_DEPLOY_PATH` | `/home/ubuntu/apps/elements` |

The matching public key is already in `~ubuntu/.ssh/authorized_keys` on the VM (set up during initial provisioning), so no extra work on the EC2 side.

### 3. (First deploy only) directory + .env on the VM

The deploy workflow's first step now creates the deploy directory and seeds `.env` automatically — but if you want to verify or override:

```bash
ssh ubuntu@<EC2_HOST>

# These are also created by the workflow if missing:
mkdir -p /home/ubuntu/apps/elements
cat > /home/ubuntu/apps/elements/.env <<'EOF'
HOST=127.0.0.1
PORT=8011
NODE_ENV=production
EOF
chmod 600 /home/ubuntu/apps/elements/.env
```

## Routine deploy

Push to `main`. That's it.

```bash
git push origin main
```

The deploy workflow runs end-to-end: gates → build → rsync `dist/` + manifest files → `npm ci --omit=dev` → `pm2 reload elements` (or `pm2 start ecosystem.config.cjs` on first run) → `pm2 save` → smoke checks against the live URL.

Manual trigger without a code change (e.g., re-run after fixing a transient infra issue):

```bash
gh workflow run deploy.yml --repo seanerama/elements
```

## Smoke verification

The deploy workflow runs this automatically as its last step. Run it manually any time:

```bash
bash scripts/post-deploy-smoke.sh https://elements.seanmahoney.ai
```

Checks `/`, `/elements/h`, `/elements/og`, `/games`, `/games/element`. Exits non-zero on any failure.

## Rollback

### Quickest — re-deploy a previous green commit

```bash
gh workflow run deploy.yml --repo seanerama/elements --ref <commit-sha>
```

The workflow re-runs against that SHA and replaces `dist/` on the server.

### Manual — SSH to EC2

```bash
ssh ubuntu@<EC2_HOST>
cd /home/ubuntu/apps/elements
pm2 restart elements           # if the running process just got into a bad state
# or, to fully roll back: rsync a prior dist/ snapshot back over and `pm2 reload elements`
```

### Tunnel-level — disable ingress

If the issue is at the Cloudflare layer (bad route, wrong target), edit the tunnel's Public Hostname entry in the Zero Trust dashboard. No `cloudflared` config file edits needed since this VM uses the dashboard for tunnel routing.

## Incident triage checklist

- [ ] `pm2 status elements` — process online, memory reasonable?
- [ ] `pm2 logs elements --lines 100` — recent errors?
- [ ] `curl -sf http://127.0.0.1:8011/` (from EC2) — does the local server respond?
- [ ] `curl -sf https://elements.seanmahoney.ai/` (from anywhere) — does Cloudflare reach it?
- [ ] Cloudflare dashboard → Zero Trust → Networks → Tunnels → `seanmahoney-primary` health check
- [ ] `df -h && free -h` on EC2 — disk + memory headroom?
- [ ] GitHub Actions → most recent Deploy run — any step failed?

## What this app adds to the shared VM

| Resource | Footprint |
|----------|-----------|
| Disk | ~50 MB committed (`dist/` + node_modules omit-dev) |
| RAM | ~80 MB resident (single Astro Node process, max 300 MB cap via PM2 `max_memory_restart`) |
| CPU | Negligible at idle; spikes briefly on each request to render pre-cached pages |
| Outbound network | None at boot or runtime; static-only serving |
| Tunnel routes | One: `elements.seanmahoney.ai → http://localhost:8011` |
| PM2 processes | One: `elements` |
| Cron | None |

## Things this runbook does NOT cover

- **Bumping the data pipeline** — sub-agent research + image sourcing. See `pipelines/README.md`. Those scripts are dev-only and never run in CI; `data/elements/` and `data/trivia/` are committed in the repo.
- **Adding a new theme** — drop a stylesheet at `src/styles/themes/<name>.css`, register in `src/components/ThemeToggle.tsx`. No deploy concerns.
- **SRE concerns** — alerting, structured logging, on-call rotation. Future SRE phase.
