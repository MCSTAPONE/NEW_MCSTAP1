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


def test_ks03_display_costcenter(sap_session):

    login = SAPLogin(sap_session)
    login.login()

    session = sap_session

    print("Opening KS03...")

    session.findById("wnd[0]").maximize()
    session.findById("wnd[0]/tbar[0]/okcd").text = "KS03"
    session.findById("wnd[0]").sendVKey(0)

    time.sleep(2)

    # ✅ STEP 1 — WAIT FOR POPUP
    popup = wait_for_window(session, "wnd[1]")
    if not popup:
        raise AssertionError("Popup not found")

    print("Popup detected → opening F4 help")

    # ✅ STEP 2 — OPEN F4 VIA SAP (CORRECT)
    popup.sendVKey(4)  # F4

    time.sleep(1)

    # ✅ STEP 3 — HANDLE SEARCH RESULT WINDOW
    search = wait_for_window(session, "wnd[2]")
    if not search:
        raise AssertionError("Search window did not open")

    print("Selecting controlling area row")

    # ✅ EXACTLY LIKE RECORDING (ROW SELECTION)
    search.findById("wnd[2]/usr/lbl[1,10]").setFocus()
    search.findById("wnd[2]/usr/lbl[1,10]").caretPosition = 0

    search.sendVKey(0)

    time.sleep(1)

    # ✅ STEP 4 — CONFIRM POPUP
    popup = wait_for_window(session, "wnd[1]")
    if popup:
        popup.sendVKey(0)

    print("Controlling area selected")

    time.sleep(1)

    # ✅ STEP 5 — ENTER COST CENTER
    print("Entering cost center...")

    session.findById("wnd[0]/usr/ctxtCSKSZ-KOSTL").text = "101025"
    session.findById("wnd[0]/usr/ctxtCSKSZ-KOSTL").caretPosition = 6

    session.findById("wnd[0]").sendVKey(0)

    time.sleep(2)

    # ✅ STEP 6 — WAIT FOR MAIN SCREEN
    print("Waiting for KS03 screen...")

    if not wait_for_tabs(session):
        raise AssertionError("Still on initial screen")

    print("Main screen loaded")

    # ✅ STEP 7 — VALIDATE
    title = session.findById("wnd[0]").Text
    print("Screen title:", title)

    assert "cost center" in title.lower()

    # ✅ STEP 8 — NAVIGATE TABS
    tabs = ["KZEI", "TMPT", "ADRE", "KOMM", "INFO", "GRUN"]

    for tab in tabs:
        print("Opening tab:", tab)
        session.findById(
            f"wnd[0]/usr/tabsTABSTRIP_EINZEL/tabp{tab}"
        ).select()
        time.sleep(0.8)

    print("KS03 completed successfully ✅")