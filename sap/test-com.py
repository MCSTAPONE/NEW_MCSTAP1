from fastapi import FastAPI

@router.get("/sap/test-com")
def test_com():

    import win32com.client

    try:

        sap = win32com.client.GetObject("SAPGUI")

        return {
            "status": "OK"
        }

    except Exception as e:

        return {
            "status": "FAILED",
            "error": str(e)
        }