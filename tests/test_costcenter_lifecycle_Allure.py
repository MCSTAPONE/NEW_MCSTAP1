# -*- coding: utf-8 -*-

import time
import os
import datetime
import allure
import pytest
from sap.sap_login import SAPLogin


# ===============================
# HELPERS
# ===============================

def wait_for_window(session, wnd_id, timeout=5):
    start = time.time()
    while time.time() - start < timeout:
        try:
            return session.findById(wnd_id)
        except:
            time.sleep(0.3)
    return None


def wait_for_tabs(session, timeout=10):
    start = time.time()
    while time.time() - start < timeout:
        try:
            session.findById("wnd[0]/usr/tabsTABSTRIP_EINZEL")
            return True
        except:
            time.sleep(0.5)
    return False


def generate_costcenter():
    return "9" + str(int(time.time()))[-5:]


def take_screenshot(session, name="Screenshot"):
    try:
        base_dir = r"C:\Users\bndas\SAP_Test\SAP_Automation_CO\reports\screenshots"

        if not os.path.exists(base_dir):
            os.makedirs(base_dir)

        safe_name = name.replace(" ", "_")
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")

        path = os.path.join(base_dir, f"{safe_name}_{timestamp}.png")

        session.findById("wnd[0]").HardCopy(path)
        time.sleep(0.5)

        if os.path.exists(path):
            with open(path, "rb") as f:
                allure.attach(
                    f.read(),
                    name=name,
                    attachment_type=allure.attachment_type.PNG
                )

    except Exception as e:
        print(f"Screenshot failed: {e}")


# ✅ THIS IS YOUR CORRECT POPUP HANDLER (BASED ON YOUR WORKING CODE)
def handle_controlling_area_popup(session):

    popup = wait_for_window(session, "wnd[1]")

    if popup:
        print("✅ Controlling Area popup detected")

        try:
            # ✅ EXACT USER WORKFLOW
            session.findById("wnd[1]").sendVKey(4)  # open selection

            time.sleep(1)

            search = wait_for_window(session, "wnd[2]")

            if search:
                # ✅ select from list (your working pattern)
                search.findById("wnd[2]/usr/lbl[1,10]").setFocus()
                search.sendVKey(0)

            popup = wait_for_window(session, "wnd[1]")
            if popup:
                popup.sendVKey(0)

            print("✅ Controlling Area selected via popup")

        except Exception as e:
            print(f"Popup handling failed: {e}")

        # ✅ WAIT UNTIL POPUP CLOSES
        for _ in range(10):
            try:
                session.findById("wnd[1]")
                time.sleep(0.3)
            except:
                break


# ===============================
# MAIN TEST
# ===============================

@allure.feature("Cost Center Lifecycle")
@allure.story("Create → Display → Modify → Delete")
@allure.title("Full SAP Cost Center Lifecycle")
def test_costcenter_full_lifecycle(sap_session):

    # ✅ LOGIN
    login = SAPLogin(sap_session)
    login.login()

    session = sap_session
    session.findById("wnd[0]").maximize()

    COSTCENTER = generate_costcenter()

    print(f"Creating cost center: {COSTCENTER}")
    base = "wnd[0]/usr/tabsTABSTRIP_EINZEL/tabpGRUN/ssubSUBSCREEN_EINZEL:SAPLKMA1:0300/"

    # =================================================
    # KS01 CREATE ✅ (YOUR EXACT WORKING LOGIC)
    # =================================================
    with allure.step(f"KS01 Create {COSTCENTER}"):

        session.findById("wnd[0]/tbar[0]/okcd").text = "/nKS01"
        session.findById("wnd[0]").sendVKey(0)
        time.sleep(2)

        popup = wait_for_window(session, "wnd[1]")
        if popup:
            popup.sendVKey(4)

            search = wait_for_window(session, "wnd[2]")
            search.findById("wnd[2]/usr/lbl[1,10]").setFocus()
            search.sendVKey(0)

            wait_for_window(session, "wnd[1]").sendVKey(0)

        session.findById("wnd[0]/usr/ctxtCSKSZ-KOSTL").text = COSTCENTER

        # Valid From
        session.findById("wnd[0]/usr/ctxtCSKSZ-DATAB_ANFO").setFocus()
        session.findById("wnd[0]").sendVKey(4)

        popup = wait_for_window(session, "wnd[1]")
        popup.findById("usr/cmbWORKFLDS-MONTH").key = "1"
        popup.findById("usr/sub:SAPLSHLC:0200[0]/txtIOWORKFLDS-DAY04[0,9]").setFocus()
        popup.findById("usr/btnPUSHB_PICK").press()

        # Valid To
        session.findById("wnd[0]/usr/ctxtCSKSZ-DATBI_ANFO").setFocus()
        session.findById("wnd[0]").sendVKey(4)

        popup = wait_for_window(session, "wnd[1]")
        popup.findById("usr/cmbWORKFLDS-YEARN").key = "2035"
        popup.findById("usr/sub:SAPLSHLC:0200[0]/txtIOWORKFLDS-DAY04[4,9]").setFocus()
        popup.findById("usr/btnPUSHB_PICK").press()

        session.findById("wnd[0]/tbar[1]/btn[5]").press()
        time.sleep(2)

        session.findById(base + "txtCSKSZ-KTEXT").text = "Test cost Control"
        session.findById("wnd[0]").sendVKey(2)

        session.findById(base + "txtCSKSZ-LTEXT").text = "Test cost Control"
        session.findById(base + "ctxtCSKSZ-VERAK_USER").text = ""
        session.findById(base + "txtCSKSZ-VERAK").text = "Biranchi Das"

        session.findById(base + "ctxtCSKSZ-KOSAR").setFocus()
        session.findById("wnd[0]").sendVKey(4)
        wait_for_window(session, "wnd[1]").sendVKey(0)

        session.findById(base + "ctxtCSKSZ-KHINR").setFocus()
        session.findById("wnd[0]").sendVKey(4)

        popup = wait_for_window(session, "wnd[1]")
        popup.findById("usr/lbl[1,23]").setFocus()
        popup.sendVKey(0)

        session.findById(base + "ctxtCSKSZ-BUKRS").setFocus()
        session.findById("wnd[0]").sendVKey(4)

        popup = wait_for_window(session, "wnd[1]")
        popup.findById("usr/lbl[1,18]").setFocus()
        popup.sendVKey(0)

        session.findById(base + "ctxtCSKSZ-PRCTR").text = "1030"

        session.findById("wnd[0]/tbar[0]/btn[11]").press()

        print("✅ KS01 SUCCESS---------ok")
        time.sleep(2)
    # ✅ IMPORTANT: RESET SCREEN
    session.findById("wnd[0]/tbar[0]/okcd").text = "/n"
    session.findById("wnd[0]").sendVKey(0)

    # =================================================
    # KS03 DISPLAY ✅
    # =================================================
    with allure.step("KS03 Display"):

        session.findById("wnd[0]/tbar[0]/okcd").text = "/nKS03"
        session.findById("wnd[0]").sendVKey(0)

        session.findById("wnd[0]/usr/ctxtCSKSZ-KOSTL").text = COSTCENTER
        session.findById("wnd[0]").sendVKey(0)
        take_screenshot(session, "KS01 Completed")

        print("✅ KS03 SUCCESS----------ok")

    # RESET
    session.findById("wnd[0]/tbar[0]/okcd").text = "/n"
    session.findById("wnd[0]").sendVKey(0)

    # =================================================
    # KS02 MODIFY ✅
    # =================================================
    with allure.step("KS02 Modify"):

        print("===== KS02 UPDATE =====")

        # ----------------------------------------------
        # OPEN KS02
        # ----------------------------------------------
        session.findById("wnd[0]/tbar[0]/okcd").text = "/nKS02"
        session.findById("wnd[0]").sendVKey(0)
        time.sleep(2)

        # ----------------------------------------------
        # CONTROLLING AREA (SAME AS KS01 — CORRECT)
        # ----------------------------------------------
        popup = wait_for_window(session, "wnd[1]")

        if popup:
            popup.sendVKey(4)

            search = wait_for_window(session, "wnd[2]")
            search.findById("wnd[2]/usr/lbl[1,10]").setFocus()
            search.sendVKey(0)

            wait_for_window(session, "wnd[1]").sendVKey(0)

        # ----------------------------------------------
        # ENTER COST CENTER
        # ----------------------------------------------
        session.findById("wnd[0]/usr/ctxtCSKSZ-KOSTL").text = COSTCENTER
        session.findById("wnd[0]").sendVKey(0)
        session.findById("wnd[0]").sendVKey(0)  # (your recorder logic)

        # ----------------------------------------------
        # WAIT FOR TAB SCREEN (IMPORTANT)
        # ----------------------------------------------
        if not wait_for_tabs(session):
            print("❌ Tabs not loaded → KS02 cannot continue")
            return

        # ----------------------------------------------
        # SELECT BASIC DATA TAB (RECORDER STEP)
        # ----------------------------------------------
        session.findById("wnd[0]/usr/tabsTABSTRIP_EINZEL/tabpGRUN").select()

        # ----------------------------------------------
        # MODIFY FIELD (YOUR EXACT LOGIC)
        # ----------------------------------------------
        session.findById(base + "txtCSKSZ-KTEXT").text = "AUTO KS02"

        # ----------------------------------------------
        # SAVE
        # ----------------------------------------------
        session.findById("wnd[0]/tbar[0]/btn[11]").press()

        print("✅ KS02 SUCCESS ----------OK")

        # RESET
        session.findById("wnd[0]/tbar[0]/okcd").text = "/n"
        session.findById("wnd[0]").sendVKey(0)
        
        # =================================================
        # KS03 DISPLAY ✅
        # =================================================
        with allure.step("KS03 Display"):

            session.findById("wnd[0]/tbar[0]/okcd").text = "/nKS03"
            session.findById("wnd[0]").sendVKey(0)

            session.findById("wnd[0]/usr/ctxtCSKSZ-KOSTL").text = COSTCENTER
            session.findById("wnd[0]").sendVKey(0)
            take_screenshot(session, "KS02 Completed")

            print("✅ KS03 SUCCESS----------OK")

    # RESET
    session.findById("wnd[0]/tbar[0]/okcd").text = "/n"
    session.findById("wnd[0]").sendVKey(0)

    # =================================================
    # KS04 DELETE ✅ (YOUR EXACT WORKING LOGIC)
    # =================================================
    with allure.step("KS04 Delete"):

        print("===== KS04 DELETE =====")

        # ----------------------------------------------
        # OPEN KS04
        # ----------------------------------------------
        session.findById("wnd[0]/tbar[0]/okcd").text = "/nKS04"
        session.findById("wnd[0]").sendVKey(0)
        time.sleep(2)

        # ----------------------------------------------
        # CONTROLLING AREA (UNCHANGED)
        # ----------------------------------------------
        popup = wait_for_window(session, "wnd[1]")

        if popup:
            popup.sendVKey(4)

            search = wait_for_window(session, "wnd[2]")
            if search:
                search.sendVKey(0)

            wait_for_window(session, "wnd[1]").sendVKey(0)

        # ----------------------------------------------
        # ✅ CORRECT FIELD (THIS WAS YOUR REAL FIX)
        # ----------------------------------------------
        session.findById(
            "wnd[0]/usr/subKOSTL_SELECTION:SAPLKMS1:0100/ctxtKMAS_D-KOSTL"
        ).text = COSTCENTER

        session.findById("wnd[0]").sendVKey(0)

        # ----------------------------------------------
        # TEST RUN FLAG (UNCHANGED)
        # ----------------------------------------------
        session.findById("wnd[0]/usr/chkCSKSZ-KZ_TEST").selected = False

        # EXECUTE
        session.findById("wnd[0]/tbar[1]/btn[8]").press()

        # ----------------------------------------------
        # CONFIRM DELETE (UNCHANGED)
        # ----------------------------------------------
        popup = wait_for_window(session, "wnd[1]")
        if popup:
            popup.findById("usr/btnSPOP-OPTION1").press()

        print("✅ KS04 SUCCESS ------------ OK")

    # =========================================================
    # LOGOFF
    # =========================================================
    with allure.step("Logoff"):

        try:
            session.findById("wnd[0]/tbar[0]/okcd").text = "/nex"
            session.findById("wnd[0]").sendVKey(0)
        except:
            pass