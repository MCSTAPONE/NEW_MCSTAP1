import pytest
from sap.sap_client import SAPClient
from sap.sap_login import SAPLogin


@pytest.fixture(scope="session")
def sap_session():

    # ? Step 1: open SAP & attach
    client = SAPClient()
    session = client.attach_to_sap()

    # ? Step 2: perform login (CRITICAL FIX)
    login = SAPLogin(session)
    login.login()

    return session