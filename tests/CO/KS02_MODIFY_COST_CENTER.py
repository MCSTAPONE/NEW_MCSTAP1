# -*- coding: utf-8 -*-

import time
from sap.sap_login import SAPLogin


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


def test_ks02_change_costcenter(sap_session):

    login = SAPLogin(sap_session)
    login.login()

    session = sap_session

    print("Opening KS02...")

    session.findById("wnd[0]").maximize()
    session.findById("wnd[0]/tbar[0]/okcd").text = "KS02"
    session.findById("wnd[0]").sendVKey(0)

    time.sleep(2)

    # -------------------------------------------------
    # STEP 1 - Controlling Area popup
    # -------------------------------------------------
    popup = wait_for_window(session, "wnd[1]")
    popup.sendVKey(4)

    time.sleep(1)

    search = wait_for_window(session, "wnd[2]")
    search.findById("wnd[2]/usr/lbl[1,10]").setFocus()
    search.findById("wnd[2]/usr/lbl[1,10]").caretPosition = 0
    search.sendVKey(0)

    time.sleep(1)

    popup = wait_for_window(session, "wnd[1]")
    popup.sendVKey(0)

    print("Controlling area selected")

    # -------------------------------------------------
    # STEP 2 - Enter cost center
    # -------------------------------------------------
    session.findById("wnd[0]/usr/ctxtCSKSZ-KOSTL").text = "101024"
    session.findById("wnd[0]/usr/ctxtCSKSZ-KOSTL").caretPosition = 6
    session.findById("wnd[0]").sendVKey(0)

    print("Cost center entered")

    # -------------------------------------------------
    # STEP 3 - Wait for main screen
    # -------------------------------------------------
    if not wait_for_tabs(session):
        raise AssertionError("Main screen did not load")

    print("Main screen ready")

    # -------------------------------------------------
    # STEP 4 - GRUN tab operations
    # -------------------------------------------------
    base = "wnd[0]/usr/tabsTABSTRIP_EINZEL/tabpGRUN/ssubSUBSCREEN_EINZEL:SAPLKMA1:0300/"

    # ? KTEXT first (triggers popup)
    session.findById(base + "txtCSKSZ-KTEXT").text = "Test Cont Au"

    # ? SAP validation step (IMPORTANT)
    session.findById("wnd[0]").sendVKey(2)

    time.sleep(1)

    # ? Close popup if appears
    popup = wait_for_window(session, "wnd[1]")
    if popup:
        print("Closing validation popup")
        popup.close()

    time.sleep(1)

    # ? Continue with fields
    session.findById(base + "txtCSKSZ-LTEXT").text = "Test Cont Au"
    session.findById(base + "txtCSKSZ-VERAK").text = "Biranchi Das"

    session.findById(base + "txtCSKSZ-VERAK").setFocus()
    session.findById(base + "txtCSKSZ-VERAK").caretPosition = 12

    print("GRUN tab updated")

    # -------------------------------------------------
    # STEP 5 - ADRE tab
    # -------------------------------------------------
    session.findById("wnd[0]/usr/tabsTABSTRIP_EINZEL/tabpADRE").select()
    time.sleep(1)

    base_adre = "wnd[0]/usr/tabsTABSTRIP_EINZEL/tabpADRE/ssubSUBSCREEN_EINZEL:SAPLKMA1:0320/"

    session.findById(base_adre + "txtCSKSZ-NAME1").text = "Antuna Mihanovica 52"

    session.findById(base_adre + "txtCSKSZ-NAME2").setFocus()
    session.findById(base_adre + "txtCSKSZ-NAME2").caretPosition = 0

    print("Address updated")

    # -------------------------------------------------
    # STEP 6 - SAVE
    # -------------------------------------------------
    session.findById("wnd[0]/tbar[0]/btn[11]").press()

    time.sleep(2)

    try:
        status = session.findById("wnd[0]/sbar").text.lower()
    except:
        status = ""

    print("Status:", status)

    print("KS02 completed successfully ?")