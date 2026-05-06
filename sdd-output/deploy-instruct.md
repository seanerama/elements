# Deployment Instructions: Elements

**Version**: 0.1.0
**Created**: 2026-05-06
**Target Platform**: AWS EC2 + Cloudflare Tunnel
**Public URL**: https://elements.seanmahoney.ai
**Local port**: 8011 (Node server bound to `127.0.0.1:8011`)

## Prerequisites

### On the EC2 host (already in place per existing infra)

- Node.js 20 LTS or later
- PM2 installed globally (`npm i -g pm2`)
- `cloudflared` running with an existing tunnel that this app's route will be added to
- A deploy directory: `/var/www/elements/` (created on first deploy)
- A non-root deploy user with SSH access from GitHub Actions

### On developer machine (one-time)

- Node.js 20 LTS or later
- Access to:
  - Nano Banana Pro API (for image generation fallback)
  - Wikimedia Commons (no auth required, but a project User-Agent is mandatory)

### In GitHub repo settings

- Secrets:
  - `EC2_HOST` — EC2 hostname or IP reachable from GitHub Actions
  - `EC2_USER` — deploy user
  - `EC2_SSH_KEY` — private key for the deploy user (matched by an authorized public key on EC2)
  - `EC2_DEPLOY_PATH` — e.g. `/var/www/elements`

## Environment Variables

### Runtime (`.env` on EC2, sourced by PM2)

| Variable    | Description                                | Required | Default        |
|-------------|--------------------------------------------|----------|----------------|
| `HOST`      | Bind address for the Node server           | Yes      | `127.0.0.1`    |
| `PORT`      | Bind port for the Node server              | Yes      | `8011`         |
| `NODE_ENV`  | Runtime mode                               | Yes      | `production`   |

### Build-time / Pipeline (developer machine only — never on EC2)

| Variable                | Description                              | Required |
|-------------------------|------------------------------------------|----------|
| `NANO_BANANA_API_KEY`   | Image generation fallback                | Yes (pipeline) |
| `WIKIMEDIA_USER_AGENT`  | Wikimedia API User-Agent string          | Yes (pipeline) |

## One-Time EC2 Setup

1. **Create deploy directory**:
   ```bash
   sudo mkdir -p /var/www/elements
   sudo chown $USER:$USER /var/www/elements
   ```

2. **Place runtime `.env`** at `/var/www/elements/.env`:
   ```bash
   HOST=127.0.0.1
   PORT=8011
   NODE_ENV=production
   ```
   Permissions: `chmod 600 .env`

3. **Add Cloudflare Tunnel route** to existing `cloudflared` config (typically `/etc/cloudflared/config.yml` or `~/.cloudflared/config.yml`):
   ```yaml
   ingress:
     # ... existing routes above ...
     - hostname: elements.seanmahoney.ai
       service: http://localhost:8011
     # ... catch-all route remains last ...
   ```

4. **Add DNS record in Cloudflare dashboard** (or via `cloudflared tunnel route dns <tunnel-name> elements.seanmahoney.ai`).

5. **Reload `cloudflared`**:
   ```bash
   sudo systemctl reload cloudflared
   # or, if running directly:
   # cloudflared tunnel <name> --reload
   ```

6. **Verify tunnel routes the hostname** (will return tunnel error until first deploy — expected):
   ```bash
   curl -I https://elements.seanmahoney.ai
   ```

## Deployment Steps

### 1. Build (CI: GitHub Actions)

```bash
npm ci
npm run build           # Astro build → dist/
```

The build produces `dist/server/entry.mjs` (Node entry) and `dist/client/` (static assets).

### 2. Configure (one-time, on EC2)

`ecosystem.config.cjs` (committed to repo, deployed alongside `dist/`):

```js
module.exports = {
  apps: [{
    name: 'elements',
    script: 'dist/server/entry.mjs',
    cwd: '/var/www/elements',
    instances: 1,
    autorestart: true,
    max_memory_restart: '300M',
    env_file: '.env',
    error_file: '/var/log/pm2/elements.error.log',
    out_file: '/var/log/pm2/elements.out.log',
    time: true
  }]
};
```

First-time process register:
```bash
cd /var/www/elements
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup    # follow printed instruction once to enable boot-time start
```

### 3. Deploy (CI: GitHub Actions, after build)

```bash
# rsync build artifacts and runtime deps to EC2
rsync -az --delete \
  dist/ \
  package.json package-lock.json \
  ecosystem.config.cjs \
  data/ \
  $EC2_USER@$EC2_HOST:$EC2_DEPLOY_PATH/

# install production deps on EC2 and reload PM2 (zero-downtime)
ssh $EC2_USER@$EC2_HOST <<'EOF'
  cd /var/www/elements
  npm ci --omit=dev
  pm2 reload elements
EOF
```

### 4. Verify

```bash
# from EC2
curl -sf http://127.0.0.1:8011/ | head -20

# from anywhere
curl -sf https://elements.seanmahoney.ai/ | head -20
curl -sf https://elements.seanmahoney.ai/elements/h | grep -i hydrogen
```

PM2 status:
```bash
pm2 status elements
pm2 logs elements --lines 50
```

## Rollback

Two layers of rollback available — pick the appropriate one for the failure mode.

### Quick: revert PM2 to previous git tag

```bash
ssh $EC2_USER@$EC2_HOST
cd /var/www/elements
# If you keep a snapshot directory of the prior dist (recommended):
rsync -az --delete prev-dist/ dist/
pm2 reload elements
```

### Full: redeploy a prior commit

1. In GitHub Actions, re-run the deploy workflow against the last known good commit/tag.
2. Or locally: check out the prior tag, `npm ci && npm run build`, then run the deploy steps in section 3 manually.

### Tunnel/DNS rollback

If the issue is at the Cloudflare layer (bad tunnel route, DNS), comment out the `elements.seanmahoney.ai` ingress entry and reload `cloudflared`. The hostname will return a Cloudflare error page; the rest of the apps on the tunnel are unaffected.

## Notes

- **Bind to localhost only.** The Node server must listen on `127.0.0.1:8011`, never `0.0.0.0`. Cloudflare Tunnel is the only ingress; an open port would defeat the security model.
- **Port 8011** chosen from the user's stated available range (8009+). If reassignment needed, update both `.env` (`PORT`) and the `cloudflared` config in lockstep, then `pm2 reload elements && systemctl reload cloudflared`.
- **Static asset caching** is handled at Cloudflare's edge automatically (default rules cache `dist/client/*` aggressively by file extension). No custom Cache-Control headers required for MVP.
- **Logs** ship to `/var/log/pm2/elements.{out,error}.log`. Existing log-rotation strategy applies.
- **No nginx involvement** — the Astro Node server serves both pre-rendered HTML and the `dist/client/` static assets. Cloudflare Tunnel proxies straight to it.
- **Data freshness**: `data/elements/` is committed and only changes when the developer re-runs `npm run data:build` locally and commits results. CI does not regenerate data.
