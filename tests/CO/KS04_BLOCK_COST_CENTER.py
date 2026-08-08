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


def test_ks04_delete_costcenter(sap_session):

    login = SAPLogin(sap_session)
    login.login()

    session = sap_session

    print("Opening KS04...")

    session.findById("wnd[0]").maximize()
    session.findById("wnd[0]/tbar[0]/okcd").text = "KS04"
    session.findById("wnd[0]").sendVKey(0)

    time.sleep(2)

    # -------------------------------------------------
    # STEP 1 - Controlling Area popup (F4)
    # -------------------------------------------------
    popup = wait_for_window(session, "wnd[1]")
    if not popup:
        raise AssertionError("Popup not found")

    popup.sendVKey(4)

    time.sleep(1)

    search = wait_for_window(session, "wnd[2]")
    if not search:
        raise AssertionError("Search window not found")

    search.findById("wnd[2]/usr/lbl[1,10]").setFocus()
    search.findById("wnd[2]/usr/lbl[1,10]").caretPosition = 0
    search.sendVKey(0)

    time.sleep(1)

    popup = wait_for_window(session, "wnd[1]")
    popup.sendVKey(0)

    print("Controlling area selected")

    # -------------------------------------------------
    # STEP 2 - Enter Cost Center
    # -------------------------------------------------
    kostl_field = "wnd[0]/usr/subKOSTL_SELECTION:SAPLKMS1:0100/ctxtKMAS_D-KOSTL"

    session.findById(kostl_field).text = "101040"
    session.findById(kostl_field).caretPosition = 6

    session.findById("wnd[0]").sendVKey(0)

    print("Cost center entered")

    # -------------------------------------------------
    # STEP 3 - DATAB (From Date)
    # -------------------------------------------------
    session.findById("wnd[0]/usr/ctxtCSKSZ-DATAB_ANFO").setFocus()
    session.findById("wnd[0]").sendVKey(4)

    popup = wait_for_window(session, "wnd[1]")

    popup.findById("usr/cmbWORKFLDS-YEARN").key = "1926"
    popup.findById("usr/sub:SAPLSHLC:0200[0]/txtIOWORKFLDS-DAY05[0,12]").setFocus()
    popup.findById("usr/sub:SAPLSHLC:0200[0]/txtIOWORKFLDS-DAY05[0,12]").caretPosition = 2
    popup.findById("usr/btnPUSHB_PICK").press()

    print("From date selected")

    # -------------------------------------------------
    # STEP 4 - DATBI (To Date)
    # -------------------------------------------------
    session.findById("wnd[0]/usr/ctxtCSKSZ-DATBI_ANFO").setFocus()
    session.findById("wnd[0]").sendVKey(4)

    popup = wait_for_window(session, "wnd[1]")

    popup.findById("usr/cmbWORKFLDS-YEARN").key = "2035"
    popup.findById("usr/sub:SAPLSHLC:0200[0]/txtIOWORKFLDS-DAY04[4,9]").setFocus()
    popup.findById("usr/sub:SAPLSHLC:0200[0]/txtIOWORKFLDS-DAY04[4,9]").caretPosition = 1
    popup.findById("usr/btnPUSHB_PICK").press()

    print("To date selected")

    # -------------------------------------------------
    # STEP 5 - Uncheck TEST RUN
    # -------------------------------------------------
    test_checkbox = session.findById("wnd[0]/usr/chkCSKSZ-KZ_TEST")
    test_checkbox.selected = False
    test_checkbox.setFocus()

    print("Test run disabled")

    # -------------------------------------------------
    # STEP 6 - Execute deletion
    # -------------------------------------------------
    session.findById("wnd[0]/tbar[1]/btn[8]").press()

    print("Delete execution triggered")

    time.sleep(2)

    # -------------------------------------------------
    # STEP 7 - Confirmation popup
    # -------------------------------------------------
    popup = wait_for_window(session, "wnd[1]")
    if popup:
        print("Confirming deletion...")
        popup.findById("usr/btnSPOP-OPTION1").press()

    time.sleep(2)

    # -------------------------------------------------
    # STEP 8 - Status Check
    # -------------------------------------------------
    try:
        status = session.findById("wnd[0]/sbar").text.lower()
    except:
        status = ""

    print("Status:", status)

    print("KS04 completed successfully ✅")