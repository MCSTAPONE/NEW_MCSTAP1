from services.sap_executor import SAPExecutor

print("CLASS =", SAPExecutor)

obj = SAPExecutor()

print("METHODS =")
print(dir(obj))

print("HAS execute_flow =", hasattr(obj, "execute_flow"))