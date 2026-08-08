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


def test_ksh2_change_costcenter_group(sap_session):
    login = SAPLogin(sap_session)
    login.login()
    
    session = sap_session

    # Maximize
    session.findById("wnd[0]").maximize()
    
    print("Opening KSH2...")
    # Start transaction KSH2
    session.findById("wnd[0]/tbar[0]/okcd").text = "KSH2"
    session.findById("wnd[0]").sendVKey(0)

    # Handle popup sequence (same as KSH1)
    session.findById("wnd[1]").sendVKey(4)
    session.findById("wnd[2]/usr/lbl[1,10]").setFocus()
    session.findById("wnd[2]").sendVKey(0)
    session.findById("wnd[1]").sendVKey(0)

    # Enter group name
    session.findById("wnd[0]/usr/ctxtGRPDYNP-NAME_COALL").text = "POKO-Test1"
    session.findById("wnd[0]").sendVKey(0)

    # Switch to change mode and maintain values
    session.findById("wnd[0]/tbar[1]/btn[19]").press()  # Change mode
    session.findById("wnd[0]/tbar[1]/btn[16]").press()  # Maintain values

    # Update cost centers
    cost_centers = ["101026", "101025", "101024"]

    for i, cc in enumerate(cost_centers):
        field_id = f"wnd[0]/usr/txt[4,{i+2}]"
        session.findById(field_id).text = cc
        session.findById("wnd[0]").sendVKey(0)

    # Clear one entry (recording shows deletion)
    session.findById("wnd[0]/usr/txt[4,4]").text = ""
    session.findById("wnd[0]").sendVKey(0)

    # Save
    session.findById("wnd[0]/tbar[0]/btn[11]").press()

    # Optional validation
    status = session.findById("wnd[0]/sbar").text
    assert status != "", "No status returned after save"