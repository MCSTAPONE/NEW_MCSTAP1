# SAP Automation Runner (Simulation Version)
from services.sap_connection import get_sap_session

from services.sap_connection import get_sap_session
from services.sap_flows import (
    run_iw31_create_order,
    run_iw32_change_order,
    run_iw33_display_order
)


def run_transaction(tcode, step):

    session = get_sap_session()

    if not session:
        return "FAILED"

    try:
        # ✅ FULL FLOW CONTROLLED HERE

        if tcode == "IW31":
            result = run_iw31_create_order(session)

        elif tcode == "IW32":
            result = run_iw32_change_order(session)

        elif tcode == "IW33":
            result = run_iw33_display_order(session)

        else:
            return "PASSED"

        return result.get("status", "FAILED")

    except Exception as e:
        print("Execution error:", e)
        return "FAILED"