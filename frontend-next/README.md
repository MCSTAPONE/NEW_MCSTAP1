# Next.js UI Conversion

This folder contains a standalone Next.js App Router frontend in TypeScript for the current SAP Automation Platform UI.

## Included routes

- `/`
- `/pm`
- `/coverage`
- `/reports`
- `/risk`
- `/repository`
- `/script-studio`
- `/flow-library`
- `/test-cases`

## Run locally

1. Install dependencies:

```bash
npm install
```

2. Start the frontend:

```bash
npm run dev
```

3. Open `http://localhost:3000`.

## Run with Docker

From the repo root:

```bash
docker compose up --build
```

This starts:

- `frontend`: Next.js app on `http://localhost:3000`
- `postgres`: PostgreSQL 16 on `localhost:5432`

API checks:

- `GET /api/health`
- `GET /api/db`

## Notes

- The current pages use seeded TypeScript data from [`data/app-data.ts`](./data/app-data.ts).
- This keeps the UI conversion separate from the existing FastAPI app so backend integration can happen incrementally.
- The Docker stack uses separate containers for Next.js and PostgreSQL, connected through `DATABASE_URL`.
