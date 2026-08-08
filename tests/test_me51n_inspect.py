import sys
import os

sys.path.append(
    os.path.dirname(
        os.path.dirname(__file__)
    )
)

from sap.sap_client import SAPClient
from sap.sap_login import SAPLogin

client = SAPClient()

session = client.attach_to_sap()

login = SAPLogin(session)

login.login()

session.findById(
    "wnd[0]/tbar[0]/okcd"
).text = "ME51N"

session.findById(
    "wnd[0]"
).sendVKey(0)

print("ME51N opened")

for child in range(
    session.findById("wnd[0]/usr").Children.Count
):

    try:

        obj = session.findById(
            "wnd[0]/usr"
        ).Children(child)

        print(
            child,
            obj.Id
        )

    except Exception as e:

        print(e)