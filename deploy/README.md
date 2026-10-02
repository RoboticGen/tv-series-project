# Deployment

```
PR → main      ci.yml       lint + test + build, docker build (no push)
merge → main   deploy.yml   checks → push image to GHCR → SSH to EC2 → pull + restart
```

Image: `ghcr.io/roboticgen/tv-series-project-frontend:{latest,<commit sha>}`

## GitHub setup (once)

**Settings → Secrets and variables → Actions → Repository secrets**

| Secret | Example | Notes |
|---|---|---|
| `EC2_HOST` | `13.233.10.20` | Public IP or DNS of the instance |
| `EC2_USER` | `ubuntu` | SSH user, must be able to run `docker` |
| `EC2_SSH_KEY` | contents of `key.pem` | Whole private key, including the `BEGIN`/`END` lines |
| `EC2_SSH_PORT` | `22` | Optional, defaults to 22 |

GHCR login uses the built-in `GITHUB_TOKEN`; no extra secret needed.

**Settings → Branches → add rule for `main`**: require a pull request, require
status checks `Lint, test, build` and `Docker build`, require branch to be up
to date.

The deploy job runs in the `production` environment (created automatically on
first run). Add required reviewers there if you want a manual approval step.

## EC2 setup (once)

1. Docker + Compose plugin installed; `EC2_USER` in the `docker` group.
2. Security group allows SSH (22) from GitHub Actions runners.
3. `mkdir ~/tv-series-frontend` and create `~/tv-series-frontend/.env` from
   `frontend/.env.example`. If Postgres/Mongo run on the same host, replace
   `127.0.0.1` with `host.docker.internal` in `DATABASE_URL` and `MONGODB_URI`.
4. nginx:

   ```nginx
   location / {
       proxy_pass http://127.0.0.1:3000;
       proxy_set_header Host $host;
       proxy_set_header X-Forwarded-Proto $scheme;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       client_max_body_size 6m;   # matches serverActions.bodySizeLimit
   }
   ```

`docker-compose.yml` is copied over by the workflow on every deploy.

## Rollback

```bash
cd ~/tv-series-frontend
IMAGE_TAG=<older commit sha> docker compose up -d
```

## Local pre-commit hook

`npm install` in `frontend/` installs a husky hook that runs `eslint --fix` on
staged files. Skip once with `git commit --no-verify`; CI still runs.
