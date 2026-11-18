# Reallapp deployment guide

Reallapp contains an Express/Socket.IO backend, a Vite React frontend, Prisma models, Firebase authentication, Paystack webhooks, and a MySQL-compatible database. Choose one backend host and optionally deploy the frontend separately to Vercel.

## Required production variables

Configure these as protected environment variables. Never commit them, place them in `VITE_*`, or paste them into GitHub:

- `DATABASE_URL` — MySQL-compatible URL. Include `sslaccept=strict` when the provider requires it.
- `GEMINI_API_KEY`
- `PAYSTACK_SECRET_KEY`
- `ENCRYPTION_KEY`
- `FIREBASE_SERVICE_ACCOUNT` — complete Firebase Admin service-account JSON object.
- `REDIS_URL` — optional but required for Redis-backed queues or multi-instance Socket.IO.
- `NODE_ENV=production`
- `PORT=3000` when the provider does not inject it.

The frontend only needs `VITE_API_URL` when it is hosted separately from the backend. Do not put private keys in `VITE_*` variables.

## Option 1: AWS ECS/Fargate (recommended for production)

Use the existing root `Dockerfile` with ECR, ECS/Fargate, RDS MySQL, ElastiCache Redis, an Application Load Balancer, and Secrets Manager. Detailed commands and a task-definition template are in [`aws/README.md`](aws/README.md) and [`aws/ecs-task-definition.example.json`](aws/ecs-task-definition.example.json).

The ALB health check is:

```text
GET /api/health
```

The target group should forward to container port `3000`. Keep ECS tasks private and expose only the ALB. Store all private variables in Secrets Manager and grant the task role read access to those secret ARNs.

## Option 2: Render backend

1. Push the repository to GitHub and create a Render Blueprint from `render.yaml`.
2. Set `DATABASE_URL` to an external MySQL-compatible database; the Blueprint intentionally does not create Render PostgreSQL because the Prisma schema uses MySQL.
3. Add the protected variables listed above in the Render service settings.
4. Render runs `npm ci && npm run build`, then `./start.sh`.
5. Confirm Render's health check at `/api/health` returns HTTP 200.
6. Configure Paystack's webhook URL as `https://YOUR-RENDER-HOST/api/webhooks/paystack`.

## Option 3: Vercel frontend with an external backend

Vercel should host the static Vite frontend, while AWS or Render hosts the Express backend. The committed `vercel.json` runs `npm ci && npm run build` and publishes `dist`.

In Vercel Project Settings → Environment Variables, set:

```text
VITE_API_URL=https://YOUR-BACKEND-HOST
```

Use the backend's HTTPS origin without a trailing slash. Firebase Web configuration remains in `firebase-applet-config.json`; private Admin credentials stay on the backend host only. Configure Firebase Authorized Domains and CORS for the Vercel domain and backend domain before testing login.

## Local production rehearsal

For a local MySQL/Redis stack, the corrected `docker-compose.yml` can be used after creating a local `.env` with the private variables:

```bash
docker compose up -d --build
curl http://localhost:3000/api/health
```

Do not use production credentials in local Compose. The development server remains:

```bash
npm ci
npm run dev
```

## Post-deployment smoke checks

Verify `/api/health`, registration/login, an authenticated profile request, database reads/writes, Firebase token verification, Paystack webhook signature handling, and Socket.IO connectivity. Confirm database backups and alerting before enabling live payments.
