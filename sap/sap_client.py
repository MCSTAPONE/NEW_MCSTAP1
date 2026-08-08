import win32com.client
import subprocess
import time
import pyautogui
import pythoncom

class SAPClient:

    def attach_to_sap(self, timeout=60):
        pythoncom.CoInitialize()

        print("👉 Starting SAP Logon...")

        subprocess.Popen(
            r"C:\Program Files\SAP\FrontEnd\SAPgui\saplogon.exe"
        )

        time.sleep(6)

        print("👉 Selecting system (by name)...")

        pyautogui.write("S4Q")

        time.sleep(1)

        pyautogui.press("enter")

        print("✅ System launch triggered")

        start = time.time()

        # --------------------------------------------------
        # Wait for SAP GUI Scripting Engine
        # --------------------------------------------------

        application = None

        while True:

            try:

                print("⏳ Waiting for SAP GUI Scripting...")

                sap_gui = win32com.client.GetObject("SAPGUI")

                application = sap_gui.GetScriptingEngine

                print(
                    f"✅ Connections found: "
                    f"{application.Children.Count}"
                )

                if application.Children.Count > 0:
                    break

            except Exception as e:

                print(
                    f"EXCEPTION TYPE: {type(e)}"
                )

                print(
                    f"EXCEPTION VALUE: {repr(e)}"
                )

            if time.time() - start > timeout:

                raise Exception(
                    "❌ SAP GUI scripting not ready"
                )

            time.sleep(1)

        # --------------------------------------------------
        # Get latest connection
        # --------------------------------------------------

        connection = application.Children(
            application.Children.Count - 1
        )

        print("✅ Connection found")

        # --------------------------------------------------
        # Wait for session creation
        # --------------------------------------------------

        while connection.Children.Count == 0:

            print(
                "⏳ Waiting for SAP session..."
            )

            if time.time() - start > timeout:

                raise Exception(
                    "❌ No session created"
                )

            time.sleep(1)

        session = connection.Children(0)

        print("✅ Session ready")

        return session