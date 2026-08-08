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


def test_ksh3_display_costcenter_group(sap_session):    
    login = SAPLogin(sap_session)
    login.login()
    
    session = sap_session

    print("Opening KSH3...")
    session.findById("wnd[0]").maximize()

    # Start transaction
    session.findById("wnd[0]/tbar[0]/okcd").text = "KSH3"
    session.findById("wnd[0]").sendVKey(0)

    # ✅ Handle controlling area popup (same pattern as KS03 / KSH1 / KSH2)
    popup = wait_for_window(session, "wnd[1]")
    if not popup:
        raise AssertionError("Popup not found")

    print("Popup detected → opening F4 help")
    popup.sendVKey(4)  # F4 help

    time.sleep(1)

    # ✅ Handle search window
    search = wait_for_window(session, "wnd[2]")
    if not search:
        raise AssertionError("Search window not found")

    print("Selecting controlling area")
    search.findById("wnd[2]/usr/lbl[1,10]").setFocus()
    search.findById("wnd[2]/usr/lbl[1,10]").caretPosition = 0
    search.sendVKey(0)

    time.sleep(1)

    # ✅ Confirm popup
    popup = wait_for_window(session, "wnd[1]")
    if popup:
        popup.sendVKey(0)

    print("Controlling area selected")

    # ✅ Enter group name
    session.findById("wnd[0]/usr/ctxtGRPDYNP-NAME_COALL").text = "POKO-Test1"
    session.findById("wnd[0]").sendVKey(0)

    time.sleep(2)

    # ✅ Validation — ensure group opened
    title = session.findById("wnd[0]").Text
    print("Screen title:", title)

    assert "group" in title.lower() or "cost center" in title.lower(), \
        "KSH3 screen not loaded properly"

    print("KSH3 display executed successfully ✅")