# Reallapp Import Checklist

## Import the existing repository

- [x] Import the existing Reallapp repository from `https://github.com/idemuosa/Reallapp` into the managed project.
- [x] Retain the current project structure and configuration, including the React, Vite, TypeScript, Express, Prisma, Firebase, Capacitor, Docker, Render, and Railway files.

## Preserve the application behavior

- [x] Preserve the React/Vite/TypeScript frontend implementation, including the existing authentication gate, dashboard, routed pages, modals, UI components, and user-facing behavior.
- [x] Preserve the Express server and its existing `/api` behavior, Socket.IO setup, middleware, workers, services, and monitoring hooks.
- [x] Preserve the existing Prisma schema and database-related configuration.
- [x] Preserve the existing Firebase integration and environment-based setup.

## Initialize and verify the managed project

- [x] Add the required `public/manus-routes.json` manifest for the routes declared in `src/App.tsx`.
- [x] Register TypeScript diagnostics for the imported project.
- [x] Install dependencies and resolve the incompatible Windows-only Rollup package so the Linux runtime can install the existing dependency graph.
- [x] Start the existing development server on the managed runtime port and verify `/` and `/manus-routes.json` respond with HTTP 200.
- [ ] Save the imported project as a managed checkpoint on `main`.
