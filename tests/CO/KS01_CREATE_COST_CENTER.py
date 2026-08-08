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


def test_ks01_create_costcenter(sap_session):

    login = SAPLogin(sap_session)
    login.login()

    session = sap_session

    print("Opening KS01...")

    session.findById("wnd[0]").maximize()
    session.findById("wnd[0]/tbar[0]/okcd").text = "KS01"
    session.findById("wnd[0]").sendVKey(0)

    time.sleep(2)

    # -------------------------------------------------
    # STEP 1 - Controlling Area (F4)
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
    # STEP 2 - Cost center
    # -------------------------------------------------
    session.findById("wnd[0]/usr/ctxtCSKSZ-KOSTL").text = "101025"

    # -------------------------------------------------
    # STEP 3 - DATAB (DATE FROM) via calendar
    # -------------------------------------------------
    session.findById("wnd[0]/usr/ctxtCSKSZ-DATAB_ANFO").setFocus()
    session.findById("wnd[0]").sendVKey(4)

    popup = wait_for_window(session, "wnd[1]")
    popup.findById("usr/cmbWORKFLDS-MONTH").key = "1"
    popup.findById("usr/sub:SAPLSHLC:0200[0]/txtIOWORKFLDS-DAY04[0,9]").setFocus()
    popup.findById("usr/btnPUSHB_PICK").press()

    # -------------------------------------------------
    # STEP 4 - DATBI (DATE TO)
    # -------------------------------------------------
    session.findById("wnd[0]/usr/ctxtCSKSZ-DATBI_ANFO").setFocus()
    session.findById("wnd[0]").sendVKey(4)

    popup = wait_for_window(session, "wnd[1]")
    popup.findById("usr/cmbWORKFLDS-YEARN").key = "2035"
    popup.findById("usr/sub:SAPLSHLC:0200[0]/txtIOWORKFLDS-DAY04[4,9]").setFocus()
    popup.findById("usr/btnPUSHB_PICK").press()

    # -------------------------------------------------
    # STEP 5 - Reference fields
    # -------------------------------------------------
    session.findById("wnd[0]/usr/ctxtCSKSZ-RKOSTL").text = "101022"

    session.findById("wnd[0]/usr/ctxtCSKSZ-RKOKRS").setFocus()
    session.findById("wnd[0]").sendVKey(4)

    popup = wait_for_window(session, "wnd[1]")
    popup.findById("usr/lbl[1,10]").setFocus()
    popup.findById("usr/lbl[1,10]").caretPosition = 0
    popup.sendVKey(0)

    # -------------------------------------------------
    # STEP 6 - ENTER (CRITICAL DIFFERENCE)
    # -------------------------------------------------
    session.findById("wnd[0]").sendVKey(5)

    time.sleep(2)

    # -------------------------------------------------
    # STEP 7 - GRUN TAB DATA
    # -------------------------------------------------
    base = "wnd[0]/usr/tabsTABSTRIP_EINZEL/tabpGRUN/ssubSUBSCREEN_EINZEL:SAPLKMA1:0300/"

    session.findById(base + "txtCSKSZ-KTEXT").text = "Test Cont Au1"
    session.findById(base + "txtCSKSZ-LTEXT").text = "Test Cont Au1"
    session.findById(base + "txtCSKSZ-VERAK").text = "Biranchi Das1"

    # -------------------------------------------------
    # STEP 8 - KOSAR (F4)
    # -------------------------------------------------
    session.findById(base + "ctxtCSKSZ-KOSAR").setFocus()
    session.findById("wnd[0]").sendVKey(4)

    popup = wait_for_window(session, "wnd[1]")
    popup.sendVKey(0)

    # -------------------------------------------------
    # STEP 9 - KHINR (F4)
    # -------------------------------------------------
    session.findById(base + "ctxtCSKSZ-KHINR").setFocus()
    session.findById("wnd[0]").sendVKey(4)

    popup = wait_for_window(session, "wnd[1]")
    popup.findById("usr/lbl[1,23]").setFocus()
    popup.findById("usr/lbl[1,23]").caretPosition = 0
    popup.sendVKey(0)

    # -------------------------------------------------
    # STEP 10 - BUKRS (F4)
    # -------------------------------------------------
    session.findById(base + "ctxtCSKSZ-BUKRS").setFocus()
    session.findById("wnd[0]").sendVKey(4)

    popup = wait_for_window(session, "wnd[1]")
    popup.findById("usr/lbl[1,18]").setFocus()
    popup.findById("usr/lbl[1,18]").caretPosition = 0
    popup.sendVKey(0)

    # -------------------------------------------------
    # STEP 11 - PRCTR
    # -------------------------------------------------
    session.findById(base + "ctxtCSKSZ-PRCTR").text = "1030"

    # -------------------------------------------------
    # STEP 12 - SAVE
    # -------------------------------------------------
    session.findById("wnd[0]/tbar[0]/btn[11]").press()

    time.sleep(2)

    try:
        status = session.findById("wnd[0]/sbar").text.lower()
    except:
        status = ""

    print("Status:", status)

    print("KS01 completed successfully ✅")