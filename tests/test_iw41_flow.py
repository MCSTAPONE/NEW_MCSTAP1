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
    run_iw31_create_order,
    run_iw41_confirm_order
)

print("Starting SAP...")

client = SAPClient()

session = client.attach_to_sap()

print("SAP attached")

login = SAPLogin(session)

login.login()

print("Creating Order...")

iw31_result = run_iw31_create_order(
    session
)

print(
    "IW31 RESULT:",
    iw31_result
)

print("Running IW41...")

iw41_result = run_iw41_confirm_order(
    session
)

print(
    "IW41 RESULT:",
    iw41_result
)