import time
import os
from dotenv import load_dotenv

load_dotenv()


class SAPLogin:

    def __init__(self, session):
        self.session = session

    def login(self):

        session = self.session

        print("Starting login...")

        try:
            title = session.findById("wnd[0]").Text
            print("Current screen:", title)
        except:
            print("Session not ready")
            return

        # ✅ Already logged in
        if any(x in title for x in ["SAP Easy Access", "Easy Access", "User Menu"]):
            print("Already logged in")
            return

        # ✅ Check if login screen exists
        try:
            session.findById("wnd[0]/usr/txtRSYST-BNAME")
        except:
            print("Login screen not available → skipping login")
            return

        user = os.getenv("SAP_USER")
        password = os.getenv("SAP_PASS")
        lang = os.getenv("SAP_LANG") or "EN"

        if not user or not password:
            raise Exception("Missing credentials")

        print("Filling credentials...")

        session.findById("wnd[0]/usr/txtRSYST-BNAME").text = user
        session.findById("wnd[0]/usr/pwdRSYST-BCODE").text = password
        session.findById("wnd[0]/usr/txtRSYST-LANGU").text = lang

        session.findById("wnd[0]").sendVKey(0)

        time.sleep(3)

        print("Login done")