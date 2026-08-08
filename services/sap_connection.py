# -*- coding: utf-8 -*-
try:
    from sap.sap_client import SAPClient
    from sap.sap_login import SAPLogin
    SAP_AVAILABLE = True
except (ImportError, ModuleNotFoundError):
    SAPClient = None
    SAPLogin = None
    SAP_AVAILABLE = False


def get_sap_session():
    if not SAP_AVAILABLE:
        raise RuntimeError("SAP dependencies not available. Running on non-Windows system or missing win32com library.")

    try:
        # Step 1 - Attach to SAP
        client = SAPClient()
        session = client.attach_to_sap()

        if not session:
            print("Failed to attach to SAP")
            return None

        # Step 2 - Login automatically
        login = SAPLogin(session)
        login.login()

        return session

    except Exception as e:
        print("SAP connection error:", e)
        return None