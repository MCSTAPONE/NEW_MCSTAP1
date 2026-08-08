from sap.sap_client import SAPClient

print("Starting SAP attach")

client = SAPClient()

session = client.attach_to_sap()

print("SESSION =", session)