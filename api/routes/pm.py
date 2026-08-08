from fastapi import APIRouter, Depends, HTTPException, status

import subprocess
from api.dependencies.jwt_auth import get_current_user, require_permission
from services.user_service import User

router = APIRouter(prefix="/api", tags=["Plant Maintenance"])


@router.post("/pm/run")
async def run_pm_flow(current_user: User = Depends(require_permission("run_flows"))):
    """
    Run PM flow - requires run_flows permission.
    
    Args:
        current_user: Authenticated user with run_flows permission
        
    Returns:
        Execution result
    """
    try:
        result = subprocess.run(
            [
                "python",
                "-m",
                "tests.test_iw_flow"
            ],
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace"
        )

        return {
            "status": "SUCCESS",
            "return_code": result.returncode,
            "output": result.stdout,
            "errors": result.stderr,
            "executed_by": current_user.username
        }

    except Exception as e:

        return {
            "status": "FAILED",
            "error": str(e)
        }
