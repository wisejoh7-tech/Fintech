# Reallapp Import Plan

## Scope

Import the existing Reallapp repository from `https://github.com/idemuosa/Reallapp` into the managed Webdev project without changing its product scope, application behavior, or architecture. The imported app is a React 19 + Vite + TypeScript frontend served through an Express/Socket.IO server, with Firebase authentication/data integration, Prisma database configuration, and existing deployment files for container and hosted runtimes.

## Implementation approach

- Preserve the repository source tree and existing package lockfile.
- Run the existing `npm run dev` entrypoint through `server.ts`, which mounts `/api` routes and serves the Vite SPA in development.
- Use the managed project's existing server and database capabilities; do not replace Firebase or Prisma configuration with new application logic.
- Add the required static `public/manus-routes.json` manifest based on the routes declared in `src/App.tsx`.
- Keep the existing Vite, Tailwind, PWA, Capacitor, Prisma, Docker, Render, Railway, and Firebase configuration intact.
- Validate the import with dependency installation, TypeScript diagnostics, a production frontend build, and a development-server health check.

## Project structure

- `src/`: React application shell, authentication flow, routed pages, modals, services, and styling.
- `components/`: Reusable UI primitives and application layout components.
- `backend/`: Express API routes, middleware, services, workers, queues, and monitoring.
- `prisma/`: Prisma schema and database-facing definitions.
- `public/`: Static assets and the Webdev route manifest.
- Root configuration: Vite, TypeScript, Tailwind, PWA, Capacitor, Docker, and deployment manifests.

## Existing design

The imported product already defines its visual direction, so no new design system is introduced.

- **Design movement:** mobile-first fintech dashboard with glassy surfaces, soft gradients, and utility-focused navigation.
- **Core principles:** secure, dense but readable, touch-friendly, and responsive across mobile and desktop.
- **Color philosophy:** cyan-blue primary actions and violet secondary accents communicate trust plus modern financial tooling.
- **Layout paradigm:** authenticated app shell with a desktop navbar and a mobile bottom navigation bar, with modal-first task flows.
- **Signature elements:** Viva gradient mark, rounded cards, and high-contrast status badges.
- **Interaction philosophy:** short transitions, immediate toast feedback, and modal flows for money movement and account actions.
- **Animation:** restrained Motion transitions for loading, emphasis, and modal state changes.
- **Typography system:** Geist Variable for compact, legible UI text with bold uppercase micro-labels.
- **Brand essence:** a security-minded digital banking workspace for everyday payments and financial controls; confident, practical, responsive.
- **Brand voice:** concise and action-led, using labels such as “Fund”, “Rewards”, “Connection Issue”, and “Security Center”.
- **Wordmark & logo:** the existing gradient Viva mark with a bold “V” monogram.
- **Signature brand color:** cyan `#0ea5e9`, paired with violet `#7c3aed`.

## Required behavior

The imported app must retain its current authentication gate, dashboard, banking workflows, routed pages, modal actions, Firebase integration, backend API behavior, Prisma schema, and deployment configuration. No new user-facing features are added by this import.
