from sap.sap_client import SAPClient
from sap.sap_login import SAPLogin

print("Starting SAP...")

client = SAPClient()

session = client.attach_to_sap()

print("Session attached")

login = SAPLogin(session)

print("Executing login")

login.login()

print("Finished")