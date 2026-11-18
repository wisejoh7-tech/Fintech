# Reallapp Import Checklist

## Import the existing repository

- [x] Import the existing Reallapp repository from `https://github.com/idemuosa/Reallapp` into the managed project.
- [x] Retain the current project structure and configuration, including the React, Vite, TypeScript, Express, Prisma, Firebase, Capacitor, Docker, Render, and Railway files.

## Preserve the application behavior

- [x] Preserve the React/Vite/TypeScript frontend implementation, including the existing authentication gate, dashboard, routed pages, modals, UI components, and user-facing behavior.
- [x] Preserve the Express server and its existing `/api` behavior, Socket.IO setup, middleware, workers, services, and monitoring hooks.
- [x] Preserve the existing Prisma models and database-related configuration, adapting the provider from PostgreSQL to the managed MySQL-compatible runtime.
- [x] Preserve the existing Firebase integration and environment-based setup.

## Initialize and verify the managed project

- [x] Add the required `public/manus-routes.json` manifest for the routes declared in `src/App.tsx`.
- [x] Register TypeScript diagnostics for the imported project.
- [x] Install dependencies and resolve the incompatible Windows-only Rollup package so the Linux runtime can install the existing dependency graph.
- [x] Start the existing development server on the managed runtime port and verify `/` and `/manus-routes.json` respond with HTTP 200.
- [x] Save the imported project as a managed checkpoint on `main`.

## Complete environment setup

- [x] Confirm the managed `DATABASE_URL` is available and uses the MySQL-compatible connection expected by this project.
- [x] Align `prisma/schema.prisma` and `.env.example` with the managed MySQL-compatible database.
- [x] Configure `GEMINI_API_KEY`, `PAYSTACK_SECRET_KEY`, and `ENCRYPTION_KEY` in protected project secrets.
- [x] Remove the server-only Gemini key injection from the Vite browser bundle.
- [x] Verify Prisma validation, TypeScript checks, production build, server response, and browser-bundle secret scan.
- [x] Add strict TLS normalization for the managed TiDB/MySQL connection in Prisma runtime and production startup.
- [x] Initialize the Prisma schema in the managed database and verify a read-only database query succeeds.
- [ ] Replace the currently configured `FIREBASE_SERVICE_ACCOUNT` value with the complete Firebase Admin service-account JSON object; the current value contains only a PEM private-key string, so the server cannot initialize Firebase Admin. The secure replacement card was completed with that incomplete value and must be explicitly reopened for correction.

## Deployment configurations

- [x] Add an AWS ECS/Fargate deployment guide and task-definition template using the existing Dockerfile, RDS MySQL, ElastiCache Redis, ALB health checks, and Secrets Manager.
- [x] Correct the Render Blueprint to use an external MySQL-compatible `DATABASE_URL`, `npm ci`, and `/api/health` instead of provisioning incompatible PostgreSQL.
- [x] Add a Vercel static Vite frontend configuration with SPA fallback and `VITE_API_URL` documentation for an AWS or Render backend.
- [x] Align local Docker Compose and deployment documentation with the MySQL-compatible Prisma schema.
