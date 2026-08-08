from fastapi import APIRouter, Depends
from services.sap_connection import get_sap_session
from api.dependencies.jwt_auth import get_current_user
from services.user_service import User

router = APIRouter(prefix="/api", tags=["SAP"])


@router.get("/sap/status")
async def sap_status(current_user: User = Depends(get_current_user)):
    """
    Get SAP connection status - requires authentication.
    
    Args:
        current_user: Authenticated user
        
    Returns:
        SAP status information
    """
    return {
        "sap_framework": "available",
        "module": "Plant Maintenance",
        "accessed_by": current_user.username
    }


@router.post("/sap/login")
async def sap_login(current_user: User = Depends(get_current_user)):
    """
    Login to SAP system - requires authentication.
    
    Args:
        current_user: Authenticated user
        
    Returns:
        Login status
    """
    session = get_sap_session()

    if session:
        return {
            "status": "SUCCESS",
            "message": "SAP Connected",
            "initiated_by": current_user.username
        }

    return {
        "status": "FAILED",
        "message": "SAP Session Not Available",
    }


@router.get("/sap/test-com")
async def test_com(current_user: User = Depends(get_current_user)):
    """
    Test SAP COM connection - requires authentication.
    
    Args:
        current_user: Authenticated user
        
    Returns:
        Connection test result
    """
    import win32com.client

    try:
        win32com.client.GetObject("SAPGUI")
        return {
            "status": "OK",
            "tested_by": current_user.username
        }
    except Exception as exc:
        return {
            "status": "FAILED",
            "error": str(exc),
        }
