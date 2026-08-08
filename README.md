# MCSTAP1 Setup

This project runs in two parts:

- A Docker stack for `frontend` and `postgres`
- A Windows FastAPI backend for SAP and backend logic

## Architecture

- `frontend` runs the Next.js UI on port `3000`
- `postgres` runs the database on port `5432`
- `backend` runs on Windows on port `8000`

## Start The Docker Stack

From the project root:

```bash
docker compose up --build
```

Services:

- Frontend: `http://localhost:3000`
- Postgres: `localhost:5432`

The frontend container is configured to reach the Windows backend at:

`http://host.docker.internal:8000`

## Optional AI Assistant Setup

The migrated `/ai` page can call the OpenAI API through the frontend container.

Set these environment variables before starting Docker if you want live AI guidance:

```bash
export OPENAI_API_KEY=your_key_here
export OPENAI_MODEL=gpt-5.6-terra
```

Notes:

- `OPENAI_API_KEY` is required for live AI generation
- `OPENAI_MODEL` is optional
- if `OPENAI_MODEL` is not set, the app defaults to `gpt-5.6-terra`

## Start The Windows Backend

On the Windows machine that has SAP GUI installed, start the backend directly:

```powershell
.\run_app.ps1
```

The backend starts on:

`http://127.0.0.1:8000`

If the frontend is running in Docker, keep the backend listening on port `8000` on the Windows host so Next.js API routes can proxy requests to it.

## Important Notes

- SAP GUI automation depends on `pywin32`, `pythoncom`, and the local SAP GUI client.
- That means the backend should run on Windows, not inside Docker.
- The Docker stack does not start the backend anymore.

## Troubleshooting

- If the frontend is up but backend features fail, check that `run_app.ps1` is running on Windows.
- If database access fails from Windows, verify Postgres is running from `docker compose up`.
- If dependency install fails on Windows, make sure you are using the intended Python environment from `run_app.ps1`.
- If SAP login still fails, confirm SAP GUI scripting is enabled and the SAP client opens correctly on that machine.
