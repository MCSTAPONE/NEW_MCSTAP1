import sys
import os

sys.path.append(
    os.path.dirname(
        os.path.dirname(__file__)
    )
)

from sap.sap_client import SAPClient
from sap.sap_login import SAPLogin

from services.sap_flows import (
    run_iw31_create_order
)

print("Starting SAP...")

client = SAPClient()

session = client.attach_to_sap()

print("SAP attached")

login = SAPLogin(session)

login.login()

print("Running IW31 Flow...")

result = run_iw31_create_order(
    session
)

print(result)