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
    run_me51n_create_pr
)

client = SAPClient()

session = client.attach_to_sap()

login = SAPLogin(session)

login.login()

result = run_me51n_create_pr(
    session
)

print(result)