<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/b55e514e-8c61-4011-b458-119c84e3abfc

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Deployment (Render & Railway)

This project is configured to deploy to both **Render** and **Railway**.

### Render Deployment
- Uses `render.yaml` (Render Blueprint).
- Connect repository in Render, select Blueprint, and configure environment variables (`GEMINI_API_KEY`, `PAYSTACK_SECRET_KEY`, `FIREBASE_SERVICE_ACCOUNT`, `ENCRYPTION_KEY`).

### Railway Deployment
- Uses `railway.json` and `Procfile`.
- Connect repository in Railway, add a PostgreSQL plugin service, set `DATABASE_URL` to `${{Postgres.DATABASE_URL}}`, and configure environment variables.
- Runs `./start.sh` automatically to sync Prisma schema (`npx prisma db push`) and launch the app.
