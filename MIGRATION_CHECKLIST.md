# Migration Checklist

This file tracks the current migration status from the legacy FastAPI template UI to the Next.js frontend.

## Current Runtime Model

- `frontend-next/` runs in Docker on port `3000`
- `postgres` runs in Docker on port `5432`
- FastAPI backend runs on Windows on port `8000`
- Next.js can reach the backend through `BACKEND_URL=http://host.docker.internal:8000`

## Already Migrated To Next.js

These routes now exist in `frontend-next/app/`:

- `/` dashboard
- `/login`
- `/coverage`
- `/ai`
- `/pm`
- `/pm/execution`
- `/reports`
- `/risk`
- `/repository`
- `/repository/[module]`
- `/flow-library`
- `/flow-library/[flowId]`
- `/script-studio`
- `/script-studio/login`
- `/script-studio/transaction`
- `/script-studio/logout`
- `/script-studio/builder`
- `/script-studio/recorder`
- `/script-studio/library`
- `/script-studio/library/[scriptId]`
- `/script-studio/library/[scriptId]/steps/[sequence]/edit`
- `/test-cases`
- `/test-cases/[testCaseId]`
- `/test-cases/[testCaseId]/edit`

## Partially Migrated Areas

These areas exist in Next.js and still have a few remaining legacy or placeholder behaviors:

- `test-cases`
  - create, edit, detail, and delete are now backed by Next.js API routes
  - legacy FastAPI template routes still exist and can be retired later
- `flow-library`
  - list, detail, create, edit, delete, add step, edit step, and delete step are migrated to Next.js API routes
  - execute flow now runs through a Next.js proxy to the Windows backend
- `script-studio`
  - templates, builder, recorder handshake, library, script detail, create script, add step, edit step, delete step, and run script are migrated
  - legacy FastAPI script-studio template routes still exist and can be retired later
- `reports`
  - page exists in Next.js
  - Allure still opens from backend
- `pm/execution`
  - UI exists in Next.js
  - execution still proxies the backend `/pm/run`

## Still Served By Legacy FastAPI Templates

These routes are still wired in `api/main.py` and use `templates/*.html`:

- `/dashboard`
- `/pm`
- `/pm/execution`
- `/reports`
- `/Coverage`
- `/risk`
- `/test-cases`
- `/test-cases/edit/{test_case_id}`
- `/test-cases/view/{test_case_id}`
- `/repository`
- `/repository/{module}`
- `/test-scripts`
- `/script-studio`
- `/script-studio/login`
- `/script-studio/transaction`
- `/script-studio/logout`
- `/script-studio/builder`
- `/script-studio/recorder`
- `/script-studio/library`
- `/script-studio/script/{script_id}`
- `/script-studio/edit-step/{script_id}/{step_sequence}`
- `/script-studio/run/{script_id}`
- `/flow-library`
- `/flow-library/new`
- `/flow-library/{flow_id}`
- `/flow-library/edit/{flow_id}`
- `/flow-library/{flow_id}/add-step`
- `/flow-library/{flow_id}/execute`
- `/flow-step/edit/{step_id}`

## Remaining Backend Actions To Migrate

These backend endpoints or behaviors still need a Next.js replacement or integration path:

- `GET /flow-library/{flow_id}/execute`

## Recommended Next Steps

1. Once each route family is fully replaced, remove its template route from `api/main.py`.
2. Decide whether to retire or keep backend-served Allure and execution proxy flows.

## Safe Removal Rule

Do not delete a legacy template route until both are true:

- a matching Next.js page exists
- the related create/edit/run/delete behavior is migrated or intentionally retired
