# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/3bb8ef21-9891-4d5e-b81e-127910106be2

# Flash SMS Dashboard

Lightweight admin dashboard built with Vite, React, and TypeScript. Tailwind CSS and shadcn-style components power the UI. This repository contains the dashboard app used to manage messages, offers, QA pages and other admin features.

## Quick summary

- Framework: Vite + React + TypeScript
- Styling: Tailwind CSS
- UI primitives: Radix + shadcn-style components
- State & data: react-query (TanStack Query), Appwrite integration

## Requirements

- Node.js 18+ (recommended)
- npm (or a compatible package manager)

## Setup (local development)

1. Install dependencies

```powershell
npm install
```

2. Start development server

```powershell
npm run dev
```

Open http://localhost:5173 (Vite default) in your browser.

## Available scripts

- `npm run dev` — Start the Vite development server
- `npm run build` — Typecheck (tsc) then build for production with Vite
- `npm run preview` — Preview the production build locally
- `npm run lint` — Run ESLint across the codebase

## Environment variables

This project may require environment variables for integrations (for example Appwrite). Create a `.env` file at the project root and add values as needed. Example keys (adjust names to match your code):

```
VITE_APPWRITE_ENDPOINT=
VITE_APPWRITE_PROJECT=
VITE_API_URL=
```

Note: Vite exposes variables prefixed with `VITE_` to the client bundle.

## Project structure (high level)

- `src/` — application source code
	- `components/` — reusable UI components and layout
	- `pages/` — route pages (Dashboard, Login, Countries, etc.)
	- `integrations/` — Appwrite client and API wrappers
	- `lib/` — small utilities
	- `types/` — shared TypeScript types

## Contributing

- Follow the existing code style.
- Run `npm run lint` before creating PRs.
- For UI changes, prefer existing component primitives under `src/components/ui/`.

## Deployment

Build the app and deploy the `dist/` output to any static hosting (Netlify, Vercel, S3, etc.):

```powershell
npm run build
```

Then serve or upload the `dist/` directory.

## Notes

- The project uses Appwrite for some backend interactions; check `src/integrations/appwrite` for usage details.
- If you rely on external secrets, keep them out of the repo and provide them via CI or deployment platform.

---

If you'd like, I can also:
- Add a `.env.example` with detected keys from the repo
- Run `npm run lint` and show results
- Add a brief developer setup script

Tell me which of those you'd like next.
