# Runs the FastAPI backend natively on Windows (not in Docker) so it has
# real access to SAP GUI Scripting (win32com/pyautogui), which only works
# on a Windows host with SAP GUI for Windows installed and a logged-in
# desktop session. The Dockerized `backend` service (Dockerfile.backend)
# is a Linux container and can never drive real SAP GUI automation.
#
# Requires a Windows-native venv with both requirement files installed:
#   python -m venv .venv-fastapi
#   .venv-fastapi\Scripts\pip install -r requirements.txt -r requirements-windows.txt
#
# Run this INSTEAD OF the Docker `backend` service, not alongside it —
# both bind port 8000. Keep `postgres` and `frontend` running via
# `docker compose up postgres frontend`; the frontend reaches whichever
# backend is listening on port 8000 via host.docker.internal.

$ProjectRoot = $PSScriptRoot
Set-Location $ProjectRoot

$VenvPython = Join-Path $ProjectRoot ".venv-fastapi\Scripts\python.exe"
$LogDir = $ProjectRoot

if (-not (Test-Path $VenvPython)) {
    Write-Error "Python venv not found at $VenvPython. Create it first (see script header)."
    exit 1
}

Add-Content "$LogDir\launcher.log" "launcher started $(Get-Date -Format o)"
Add-Content "$LogDir\launcher.log" "cwd $(Get-Location)"

# api/main.py loads ./.env itself via python-dotenv, so DATABASE_URL,
# JWT_SECRET_KEY, CORS_ORIGINS, etc. come from the repo-root .env file —
# no need to set them here.
& $VenvPython -m uvicorn api.main:app --host 127.0.0.1 --port 8000 *> "$LogDir\uvicorn.combined.log"

Add-Content "$LogDir\launcher.log" "uvicorn exited $(Get-Date -Format o) exit=$LASTEXITCODE"
