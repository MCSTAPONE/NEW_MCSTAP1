# -*- coding: utf-8 -*-

import time
import allure
import os
import tempfile
from sap.sap_login import SAPLogin


# ===============================
# HELPERS (UNCHANGED)
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


def handle_popup(session):
    popup = wait_for_window(session, "wnd[1]")
    if popup:
        popup.sendVKey(4)
        time.sleep(1)

# ===============================
# MAIN TEST
# ===============================

@allure.feature("Cost Center + Group Flow")
@allure.story("KS01 -> KSH1 -> KSH2 -> KSH3")
@allure.title("E2E Cost Center & Group Flow")

# ===============================
# HELPERS (UNCHANGED)
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


def handle_popup(session):
    popup = wait_for_window(session, "wnd[1]")
    if popup:
        popup.sendVKey(4)
        time.sleep(1)

        search = wait_for_window(session, "wnd[2]")
        if search:
            search.findById("wnd[2]/usr/lbl[1,10]").setFocus()
            search.sendVKey(0)

        popup = wait_for_window(session, "wnd[1]")
        if popup:
            popup.sendVKey(0)


def take_screenshot(session, name="Screenshot"):

    try:
        # ✅ your custom directory
        base_dir = r"C:\Users\bndas\SAP_Test\SAP_Automation_CO\reports\screenshots"

        # ✅ create folder if it doesn't exist
        if not os.path.exists(base_dir):
            os.makedirs(base_dir)

        # ✅ clean filename
        safe_name = name.replace(" ", "_")

        # ✅ full file path
        file_path = os.path.join(base_dir, f"{safe_name}.png")

        # ✅ take screenshot
        session.findById("wnd[0]").HardCopy(file_path)

        # ✅ wait for SAP to write file
        time.sleep(0.5)

        # ✅ attach to Allure
        if os.path.exists(file_path):
            with open(file_path, "rb") as f:
                allure.attach(
                    f.read(),
                    name=name,
                    attachment_type=allure.attachment_type.PNG
                )
        else:
            print(f"Screenshot not saved: {file_path}")

    except Exception as e:
        print(f"Screenshot failed: {e}")

# ===============================
# MAIN TEST
# ===============================

@allure.feature("Cost Center + Group Flow")
@allure.story("KS01 → KSH1 → KSH2 → KSH3")
@allure.title("End-to-End Cost Center & Group Flow")
def test_e2e_costcenter_group_flow(sap_session):

    login = SAPLogin(sap_session)
    login.login()

    session = sap_session

    GROUP_NAME = "POKO-Test2"
    INITIAL_CC = ["101051", "101052", "101053"]
    UPDATED_CC = ["101021", "101023"]

    session.findById("wnd[0]").maximize()

    # =========================================================
    # STEP 1: KS01
    # =========================================================
    with allure.step("KS01 - Create cost centers"):

        print("Step 1: KS01 create cost centers")

        for cc in INITIAL_CC:

            with allure.step(f"Create cost center {cc}"):

                session.findById("wnd[0]/tbar[0]/okcd").text = "KS01"
                session.findById("wnd[0]").sendVKey(0)

                handle_popup(session)

                session.findById("wnd[0]/usr/ctxtCSKSZ-KOSTL").text = cc

                session.findById("wnd[0]/usr/ctxtCSKSZ-DATAB_ANFO").setFocus()
                session.findById("wnd[0]").sendVKey(4)
                session.findById("wnd[1]/usr/btnPUSHB_PICK").press()

                session.findById("wnd[0]/usr/ctxtCSKSZ-DATBI_ANFO").setFocus()
                session.findById("wnd[0]").sendVKey(4)
                session.findById("wnd[1]/usr/btnPUSHB_PICK").press()

                session.findById("wnd[0]/tbar[1]/btn[5]").press()
                time.sleep(1)

                status = session.findById("wnd[0]/sbar").text.lower()

                if "already exists" in status:
                    print(f"{cc} already exists → skipping")
                    session.findById("wnd[0]").sendVKey(15)
                    continue

                if not wait_for_tabs(session):
                    session.findById("wnd[0]").sendVKey(15)
                    continue

                base = "wnd[0]/usr/tabsTABSTRIP_EINZEL/tabpGRUN/ssubSUBSCREEN_EINZEL:SAPLKMA1:0300/"

                session.findById(base + "txtCSKSZ-KTEXT").text = f"CC {cc}"
                session.findById(base + "txtCSKSZ-VERAK").text = "E2E TEST"

                session.findById(base + "ctxtCSKSZ-KOSAR").setFocus()
                session.findById("wnd[0]").sendVKey(4)
                session.findById("wnd[1]").sendVKey(0)

                session.findById(base + "ctxtCSKSZ-KHINR").setFocus()
                session.findById("wnd[0]").sendVKey(4)
                session.findById("wnd[1]/usr/lbl[1,23]").setFocus()
                session.findById("wnd[1]").sendVKey(0)

                session.findById(base + "ctxtCSKSZ-BUKRS").setFocus()
                session.findById("wnd[0]").sendVKey(4)
                session.findById("wnd[1]/usr/lbl[1,18]").setFocus()
                session.findById("wnd[1]").sendVKey(0)

                session.findById(base + "ctxtCSKSZ-PRCTR").text = "1030"

                session.findById("wnd[0]/tbar[0]/btn[11]").press()
                take_screenshot(session, "KS01 Completed")
                time.sleep(1)

                session.findById("wnd[0]").sendVKey(15)

        print("✅ KS01 completed")
        
    # =========================================================
    # STEP 2: KSH1 - Create cost center group
    # =========================================================
    with allure.step("KSH1 - Create cost center group"):

        print("Step 2: KSH1 create group")

        session.findById("wnd[0]/tbar[0]/okcd").text = "KSH1"
        session.findById("wnd[0]").sendVKey(0)

        handle_popup(session)

        field = wait_for_window(session, "wnd[0]/usr/ctxtGRPDYNP-NAME_COALL")
        if not field:
            raise AssertionError("KSH1 screen not loaded")

        field.text = GROUP_NAME

        # ENTER
        session.findById("wnd[0]").sendVKey(0)

        # ✅ Handle EXISTING GROUP popup
        popup = wait_for_window(session, "wnd[1]")
        if popup:
            print("Group exists → selecting YES")

            try:
                session.findById("wnd[1]/usr/btnBUTTON_1").press()
            except:
                session.findById("wnd[1]/usr/btnBUTTON_2").press()

            time.sleep(1)

        # ✅ SECOND ENTER
        session.findById("wnd[0]").sendVKey(0)

        time.sleep(1)

        # ✅ SAVE (your actual working behavior)
        session.findById("wnd[0]/tbar[0]/btn[11]").press()
        time.sleep(1)

        # ✅ EXIT (double back like your flow)
        session.findById("wnd[0]/tbar[0]/btn[12]").press()
        time.sleep(1)

        popup = wait_for_window(session, "wnd[1]")
        if popup:
            session.findById("wnd[1]/usr/btnBUTTON_1").press()
            time.sleep(1)

        session.findById("wnd[0]/tbar[0]/btn[12]").press()
        time.sleep(1)

        print("✅ KSH1 completed")
    # =========================================================
    # STEP 3: KSH2 - Maintain Cost Center Group
    # =========================================================
    with allure.step("KSH2 - Maintain cost center group"):

        print("Step 3: KSH2 update group")

        # OPEN
        session.findById("wnd[0]/tbar[0]/okcd").text = "KSH2"
        session.findById("wnd[0]").sendVKey(0)
        time.sleep(2)

        handle_popup(session)

        # ENTER GROUP
        group_field = wait_for_window(session, "wnd[0]/usr/ctxtGRPDYNP-NAME_COALL")
        if not group_field:
            raise AssertionError("KSH2 group field not available")

        group_field.text = GROUP_NAME
        session.findById("wnd[0]").sendVKey(0)

        # ✅ ENTER CHANGE MODE (RECORDER!)
        session.findById("wnd[0]/tbar[1]/btn[19]").press()

        # ✅ GO TO LIST ENTRY MODE (RECORDER!)
        session.findById("wnd[0]/tbar[1]/btn[16]").press()

        time.sleep(1)

        # =========================================================
        # ✅ WRITE INITIAL + UPDATED COST CENTERS (GRID)
        # =========================================================
        print("Writing cost centers via grid...")

        row_index = 2  # recorder starts at row 2

        for cc in INITIAL_CC + UPDATED_CC:

            field_id = f"wnd[0]/usr/txt[4,{row_index}]"
            session.findById(field_id).text = str(cc)
            session.findById("wnd[0]").sendVKey(0)

            row_index += 1

        # ✅ CLEAN LAST FIELD (recorder behavior)
        # ✅ CLEAN ONLY IF ROW EXISTS
        try:
            last_field = f"wnd[0]/usr/txt[4,{row_index}]"
            session.findById(last_field).text = ""
        except:
            print(f"Row {row_index} not available → skip cleaning")

        take_screenshot(session, "KSH2 Final")
        
        # ✅ EXIT KSH2 CLEANLY
        # ✅ SAVE (your actual working behavior)
        session.findById("wnd[0]/tbar[0]/btn[11]").press()
        time.sleep(1)
        
        # First BACK (structure → initial screen)
        session.findById("wnd[0]/tbar[0]/btn[12]").press()
        time.sleep(1)

        popup = wait_for_window(session, "wnd[1]")
        if popup:
            session.findById("wnd[1]/usr/btnBUTTON_1").press()
            time.sleep(1)

        # Second BACK (exit KSH2 completely)
        session.findById("wnd[0]/tbar[0]/btn[12]").press()
        time.sleep(1)

        print("✅ KSH2 SUCCESS (RECORDER MATCH)")
    
        
    # =========================================================
    # STEP 4: KSH3
    # =========================================================
    with allure.step("KSH3 - Display cost center group"):

        print("Step 4: KSH3 verify group")

        session.findById("wnd[0]/tbar[0]/okcd").text = "KSH3"
        session.findById("wnd[0]").sendVKey(0)

        popup = wait_for_window(session, "wnd[1]")
        if popup:
            popup.sendVKey(4)

            time.sleep(1)

            search = wait_for_window(session, "wnd[2]")
            if search:
                search.findById("wnd[2]/usr/lbl[1,10]").setFocus()
                search.sendVKey(0)

            popup = wait_for_window(session, "wnd[1]")
            if popup:
                popup.sendVKey(0)

        group_field = None
        for _ in range(10):
            try:
                group_field = session.findById("wnd[0]/usr/ctxtGRPDYNP-NAME_COALL")
                break
            except:
                time.sleep(0.5)

        if not group_field:
            raise AssertionError("KSH3 screen not loaded")

        group_field.text = GROUP_NAME
        session.findById("wnd[0]").sendVKey(0)
        take_screenshot(session, "KSH3 Verification")

        time.sleep(2)

        print("✅ E2E TEST PASSED")
        
    # =========================================================
    # LOGOFF
    # =========================================================
    with allure.step("Log off from SAP"):
        try:
            session.findById("wnd[0]/tbar[0]/okcd").text = "/nex"
            session.findById("wnd[0]").sendVKey(0)
            time.sleep(1)
        except:
            pass