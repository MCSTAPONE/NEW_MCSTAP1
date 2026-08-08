from sap.sap_client import SAPClient
from sap.sap_login import SAPLogin

from services.sap_flows import (
    run_iw31_create_order,
    run_iw32_change_order,
    run_iw33_display_order,
    run_iw41_confirm_order,
    run_me51n_create_pr
)


class SAPExecutor:

    def __init__(self):
        self.session = None

    def connect(self):

        client = SAPClient()

        self.session = client.attach_to_sap()

        return self.session

    def login(self):

        if self.session is None:
            raise Exception(
                "No SAP session available"
            )

        login = SAPLogin(
            self.session
        )

        login.login()

        return True

    def start_transaction(
        self,
        transaction_code
    ):

        if self.session is None:
            raise Exception(
                "No SAP session available"
            )

        self.session.findById(
            "wnd[0]/tbar[0]/okcd"
        ).text = f"/n{transaction_code}"

        self.session.findById(
            "wnd[0]"
        ).sendVKey(0)

        return True

    def execute_flow(
        self,
        flow_name
    ):

        if self.session is None:
            raise Exception(
                "No SAP session available"
            )

        flow_name = flow_name.upper()

        print(
            f"EXECUTE_FLOW CALLED: {flow_name}"
        )

        if flow_name == "IW31":

            result = run_iw31_create_order(
                self.session
            )

            print(
                f"IW31 RESULT = {result}"
            )

            return result

        elif flow_name == "IW32":

            result = run_iw32_change_order(
                self.session
            )

            print(
                f"IW32 RESULT = {result}"
            )

            return result

        elif flow_name == "IW33":

            result = run_iw33_display_order(
                self.session
            )

            print(
                f"IW33 RESULT = {result}"
            )

            return result
            
        elif flow_name == "IW41":

            result = run_iw41_confirm_order(
                self.session
            )

            print(
                f"IW41 RESULT = {result}"
            )

            return result
        
        elif flow_name == "ME51N":

            result = run_me51n_create_pr(
                self.session
            )

            print(
                f"ME51N RESULT = {result}"
            )

            return result
            

        else:

            raise Exception(
                f"Unknown flow: {flow_name}"
            )

    def logout(self):

        if self.session is None:
            raise Exception(
                "No SAP session available"
            )

        try:

            self.session.findById(
                "wnd[1]/usr/btnSPOP-OPTION1"
            ).press()

        except Exception:
            pass

        self.session.findById(
            "wnd[0]"
        ).close()

        return True