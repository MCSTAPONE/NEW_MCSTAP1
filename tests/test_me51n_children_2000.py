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
).text = "/nME51N"

session.findById(
    "wnd[0]"
).sendVKey(0)

root = session.findById(
    "wnd[0]/usr/"
    "subSUB0:SAPLMEGUI:0016/"
    "subSUB2:SAPLMEVIEWS:1100/"
    "subSUB2:SAPLMEVIEWS:1200/"
    "subSUB1:SAPLMEVIEWS:2000"
)

print(
    "Children:",
    root.Children.Count
)

for i in range(root.Children.Count):

    try:

        child = root.Children(i)

        print(
            i,
            child.Id
        )

    except Exception as e:

        print(e)