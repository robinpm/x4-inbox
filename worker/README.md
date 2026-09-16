# Private OPDS for the X4

The reader talks to this Worker. The Worker talks to the private GitHub repo.

## You do once

1. GitHub → Settings → Fine-grained PAT, contents:read on `robinpm/x4-inbox`.
2. Repo → Settings → Change repository visibility → **Private**.
3. Cloudflare account → Workers.
4. From `worker/`:

```bash
npx wrangler login
npx wrangler secret put GITHUB_TOKEN
npx wrangler secret put OPDS_PASS
npx wrangler deploy
```

`OPDS_USER` defaults to `x4`. Override with `npx wrangler secret put OPDS_USER` if you want.

## X4

Settings → OPDS Servers:

- URL: `https://x4-inbox.<your-subdomain>.workers.dev/opds.xml`
- User: `x4`
- Pass: whatever you set as `OPDS_PASS`
