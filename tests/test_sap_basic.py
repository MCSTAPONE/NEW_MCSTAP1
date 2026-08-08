import os

def test_sap_execution():

    test_id = os.getenv("TEST_ID")

    print(f"Running test: {test_id}")

    # ✅ simulate failure for some tests
    if int(test_id) % 2 == 0:
        assert True
    else:
        assert False
