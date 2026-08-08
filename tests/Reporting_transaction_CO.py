# -*- coding: utf-8 -*-# allure


import time
import allure
import os
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
    

def take_screenshot(session, name="Screenshot"):

    try:
        # ? your custom directory
        base_dir = r"C:\Users\bndas\SAP_Test\SAP_Automation_CO\reports\screenshots"

        # ? create folder if it doesn't exist
        if not os.path.exists(base_dir):
            os.makedirs(base_dir)

        # ? clean filename
        safe_name = name.replace(" ", "_")

        # ? full file path
        file_path = os.path.join(base_dir, f"{safe_name}.png")

        # ? take screenshot
        session.findById("wnd[0]").HardCopy(file_path)

        # ? wait for SAP to write file
        time.sleep(0.5)

        # ? attach to Allure
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

@allure.feature("Reporting")
@allure.title("SAP Reporting Execution")
def test_reporting_flow(sap_session):

    login = SAPLogin(sap_session)
    login.login()

    session = sap_session
    session.findById("wnd[0]").maximize()
    

    # =========================================================
    # S_ALR_87013611
    # =========================================================
    with allure.step("S_ALR_87013611"):

        session.findById("wnd[0]/tbar[0]/okcd").text = "S_ALR_87013611"
        session.findById("wnd[0]").sendVKey(0)

        try:
            session.findById("wnd[0]/tbar[1]/btn[8]").press()
        except:
            pass


        # ? tree navigation (KEEP EXACT - this is stable)
        tree = None
        for _ in range(10):
            try:
                tree = session.findById("wnd[0]/shellcont/shell/shellcont[2]/shell")
                break
            except:
                time.sleep(0.5)

        if tree:
            try:
                tree.expandNode("000001")
                tree.topNode = "000001"

                # ? EXACT sequence from recorder
                tree.selectedNode = "000007"
                tree.selectedNode = "000005"
                tree.selectedNode = "000004"
                tree.selectedNode = "000003"
                tree.selectedNode = "000002"
                tree.selectedNode = "000018"
                tree.selectedNode = "000019"
                take_screenshot(session, "S_ALR_87013611 Completed")
            except:
                pass

        # ? exit
        session.findById("wnd[0]/tbar[0]/btn[12]").press()

        # ? popup confirmation
        popup = wait_for_window(session, "wnd[1]")
        if popup:
            try:
                session.findById("wnd[1]/usr/btnBUTTON_YES").press()
            except:
                pass

        session.findById("wnd[0]/tbar[0]/btn[3]").press() 
        
    
    # =========================================================
    # OKEON
    # =========================================================
    with allure.step("OKEON"):

        session.findById("wnd[0]/tbar[0]/okcd").text = "OKEON"
        session.findById("wnd[0]").sendVKey(0)

        # ? ensure tree container ready
        tree = None
        for _ in range(10):
            try:
                tree = session.findById(
                    "wnd[0]/usr/subMAINSCREEN:SAPLOM_NAVFRAMEWORK_OO_OBJ:1200/"
                    "subWORKSPACE:SAPLOM_NAVFRAMEWORK_OO_OBJ:0200/"
                    "subOVERVIEW:SAPLOM_GEN_OVERVIEW:1000/"
                    "cntlTREE_CONTAINER/shellcont/shell"
                )
                break
            except:
                time.sleep(0.5)

        if tree:
            try:
                # ? EXACT recorded steps
                session.findById(
                    "wnd[0]/shellcont/shell/shellcont[0]/shell/shellcont[1]/shell[1]"
                ).topNode = "          1"

                tree.selectItem("          4", "KEO_KEY")
                tree.ensureVisibleHorizontalItem("          4", "KEO_KEY")
                tree.expandNode("          4")

                tree.topNode = "          1"

                tree.selectItem("         27", "KEO_KEY")
                tree.ensureVisibleHorizontalItem("         27", "KEO_KEY")
                tree.expandNode("         28")

                tree.topNode = "          1"

                tree.selectItem("         32", "KEO_KEY")
                tree.ensureVisibleHorizontalItem("         32", "KEO_KEY")
                tree.doubleClickItem("         32", "KEO_KEY")
                take_screenshot(session, "OKEON Completed")

            except:
                pass

        # ? exit
        try:
            session.findById("wnd[0]/tbar[0]/btn[12]").press()
        except:
            pass
        

    # =========================================================
    # OKENN
    # =========================================================
    with allure.step("OKENN"):

        session.findById("wnd[0]/tbar[0]/okcd").text = "OKENN"
        session.findById("wnd[0]").sendVKey(0)

        # ? wait for tree
        tree = None
        for _ in range(10):
            try:
                tree = session.findById(
                    "wnd[0]/usr/subMAINSCREEN:SAPLOM_NAVFRAMEWORK_OO_OBJ:1200/"
                    "subWORKSPACE:SAPLOM_NAVFRAMEWORK_OO_OBJ:0200/"
                    "subOVERVIEW:SAPLOM_GEN_OVERVIEW:1000/"
                    "cntlTREE_CONTAINER/shellcont/shell"
                )
                break
            except:
                time.sleep(0.5)

        if tree:
            try:
                # ? EXACT recorder logic
                session.findById(
                    "wnd[0]/shellcont/shell/shellcont[0]/shell/shellcont[1]/shell[1]"
                ).topNode = "          1"

                tree.expandNode("          7")
                tree.topNode = "          1"

                tree.expandNode("         28")
                tree.topNode = "          1"

                tree.selectItem("        112", "KEO_KEY")
                tree.ensureVisibleHorizontalItem("        112", "KEO_KEY")
                tree.doubleClickItem("        112", "KEO_KEY")
                take_screenshot(session, "OKENN Completed")

            except:
                pass

        # ? exit
        try:
            session.findById("wnd[0]/tbar[0]/btn[12]").press()
        except:
            pass
        
    # =========================================================
    # S_ALR_87013634
    # =========================================================
    with allure.step("S_ALR_87013634"):

        session.findById("wnd[0]/tbar[0]/okcd").text = "S_ALR_87013634"
        session.findById("wnd[0]").sendVKey(0)

        session.findById("wnd[0]").sendVKey(4)

        # ? SAFE selection instead of fixed [1,10]
        label = None
        for i in range(1, 20):
            try:
                label = session.findById(f"wnd[1]/usr/lbl[1,{i}]")
                break
            except:
                continue

        if label:
            label.setFocus()
            label.caretPosition = 0
            session.findById("wnd[1]").sendVKey(0)

        session.findById("wnd[0]/tbar[1]/btn[8]").press()

        session.findById("wnd[0]").sendVKey(0)

        session.findById("wnd[0]").sendVKey(4)

        # ? SAFE detection instead of hardcoded [1,35]
        label = None
        for i in range(10, 50):
            try:
                label = session.findById(f"wnd[1]/usr/lbl[1,{i}]")
                break
            except:
                continue

        if label:
            label.setFocus()
            label.caretPosition = 0

        # ? SAFE SCROLL
        for i in range(1, 27):
            try:
                session.findById("wnd[1]/usr").verticalScrollbar.position = i
            except:
                break

            try:
                if label:
                    label.setFocus()
                    label.caretPosition = 0
                    
            except:
                pass

        session.findById("wnd[1]").sendVKey(0)

        session.findById("wnd[0]/tbar[1]/btn[8]").press()

        session.findById("wnd[0]").sendVKey(4)

        # ? SAFE AGAIN for [1,4]
        label = None
        for i in range(1, 10):
            try:
                label = session.findById(f"wnd[1]/usr/lbl[1,{i}]")
                break
            except:
                continue

        if label:
            label.setFocus()
            label.caretPosition = 0
            session.findById("wnd[1]").sendVKey(0)

        session.findById("wnd[0]/tbar[1]/btn[8]").press()
        take_screenshot(session, "S_ALR_87013634 Completed")

        session.findById("wnd[0]/tbar[0]/btn[12]").press()

        popup = wait_for_window(session, "wnd[1]")
        if popup:
            try:
                session.findById("wnd[1]/usr/btnBUTTON_YES").press()
            except:
                pass

        session.findById("wnd[0]/tbar[0]/btn[3]").press()
        
    # =========================================================
    # S_ALR_87013613
    # =========================================================
    with allure.step("S_ALR_87013613"):

        session.findById("wnd[0]/tbar[0]/okcd").text = "S_ALR_87013613"
        session.findById("wnd[0]").sendVKey(0)

        session.findById("wnd[0]").sendVKey(4)
        session.findById("wnd[1]/usr/lbl[1,10]").setFocus()
        session.findById("wnd[1]").sendVKey(0)

        session.findById("wnd[0]/tbar[1]/btn[8]").press()

        # scroll (from recording)
        session.findById("wnd[0]/usr").verticalScrollbar.position = 30
        session.findById("wnd[0]/usr").verticalScrollbar.position = 0
        take_screenshot(session, "S_ALR_87013613 Completed")

        session.findById("wnd[0]/tbar[0]/btn[3]").press()

        popup = wait_for_window(session, "wnd[1]")
        if popup:
            session.findById("wnd[1]/usr/btnBUTTON_YES").press()

        session.findById("wnd[0]/tbar[0]/btn[12]").press()
        
    # =========================================================
    # S_ALR_87013617
    # =========================================================
    with allure.step("S_ALR_87013617"):

        session.findById("wnd[0]/tbar[0]/okcd").text = "S_ALR_87013617"
        session.findById("wnd[0]").sendVKey(0)

        session.findById("wnd[0]").sendVKey(4)
        session.findById("wnd[1]/usr/lbl[1,10]").setFocus()
        session.findById("wnd[1]").sendVKey(0)

        session.findById("wnd[0]").sendVKey(0)
        session.findById("wnd[0]/tbar[1]/btn[8]").press()
        take_screenshot(session, "S_ALR_87013617 Completed")

        session.findById("wnd[0]/tbar[0]/btn[12]").press()

        popup = wait_for_window(session, "wnd[1]")
        if popup:
            session.findById("wnd[1]/usr/btnBUTTON_YES").press()

        session.findById("wnd[0]/tbar[0]/btn[3]").press()
        
    # =========================================================
    # S_ALR_87013612
    # =========================================================
    with allure.step("S_ALR_87013612"):
        session.findById("wnd[0]/tbar[0]/okcd").text = "S_ALR_87013612"
        session.findById("wnd[0]").sendVKey(0)

        session.findById("wnd[0]").sendVKey(4)
        session.findById("wnd[1]/usr/lbl[1,10]").setFocus()
        session.findById("wnd[1]").sendVKey(0)

        session.findById("wnd[0]/tbar[1]/btn[8]").press()

        # scroll (from recording)
#        session.findById("wnd[0]/usr").verticalScrollbar.position = 30
#        session.findById("wnd[0]/usr").verticalScrollbar.position = 0
        take_screenshot(session, "S_ALR_87013612 Completed")

        session.findById("wnd[0]/tbar[0]/btn[3]").press()

        popup = wait_for_window(session, "wnd[1]")
        if popup:
            session.findById("wnd[1]/usr/btnBUTTON_YES").press()

        session.findById("wnd[0]/tbar[0]/btn[12]").press()
        
    # =========================================================
    # S_ALR_87013614
    # =========================================================
    with allure.step("S_ALR_87013614"):
        session.findById("wnd[0]/tbar[0]/okcd").text = "S_ALR_87013614"
        session.findById("wnd[0]").sendVKey(0)

        session.findById("wnd[0]").sendVKey(4)
        session.findById("wnd[1]/usr/lbl[1,10]").setFocus()
        session.findById("wnd[1]").sendVKey(0)

        session.findById("wnd[0]/tbar[1]/btn[8]").press()
        take_screenshot(session, "S_ALR_87013614 Completed")

        # scroll (from recording)
#        session.findById("wnd[0]/usr").verticalScrollbar.position = 30
#        session.findById("wnd[0]/usr").verticalScrollbar.position = 0

        session.findById("wnd[0]/tbar[0]/btn[3]").press()

        popup = wait_for_window(session, "wnd[1]")
        if popup:
            session.findById("wnd[1]/usr/btnBUTTON_YES").press()

        session.findById("wnd[0]/tbar[0]/btn[12]").press()
        
    # =========================================================
    # S_ALR_87013616
    # =========================================================
    with allure.step("S_ALR_87013616"):
        session.findById("wnd[0]/tbar[0]/okcd").text = "S_ALR_87013616"
        session.findById("wnd[0]").sendVKey(0)

        session.findById("wnd[0]").sendVKey(4)
        session.findById("wnd[1]/usr/lbl[1,10]").setFocus()
        session.findById("wnd[1]").sendVKey(0)

        session.findById("wnd[0]/tbar[1]/btn[8]").press()
        
        take_screenshot(session, "S_ALR_87013616 Completed")

        # scroll (from recording)
#        session.findById("wnd[0]/usr").verticalScrollbar.position = 30
#        session.findById("wnd[0]/usr").verticalScrollbar.position = 0

        session.findById("wnd[0]/tbar[0]/btn[3]").press()

        popup = wait_for_window(session, "wnd[1]")
        if popup:
            session.findById("wnd[1]/usr/btnBUTTON_YES").press()

        session.findById("wnd[0]/tbar[0]/btn[12]").press()
        
    # =========================================================
    # S_ALR_87013623
    # =========================================================
    with allure.step("S_ALR_87013623"):
        session.findById("wnd[0]/tbar[0]/okcd").text = "S_ALR_87013623"
        session.findById("wnd[0]").sendVKey(0)

        session.findById("wnd[0]").sendVKey(4)
        session.findById("wnd[1]/usr/lbl[1,10]").setFocus()
        session.findById("wnd[1]").sendVKey(0)

        session.findById("wnd[0]/tbar[1]/btn[8]").press()
        
        take_screenshot(session, "S_ALR_87013623 Completed")

        # scroll (from recording)
#        session.findById("wnd[0]/usr").verticalScrollbar.position = 30
#        session.findById("wnd[0]/usr").verticalScrollbar.position = 0

        session.findById("wnd[0]/tbar[0]/btn[3]").press()

        popup = wait_for_window(session, "wnd[1]")
        if popup:
            session.findById("wnd[1]/usr/btnBUTTON_YES").press()

        session.findById("wnd[0]/tbar[0]/btn[12]").press()
        
    # =========================================================
    # S_ALR_87013624
    # =========================================================
    with allure.step("S_ALR_87013624"):
        session.findById("wnd[0]/tbar[0]/okcd").text = "S_ALR_87013624"
        session.findById("wnd[0]").sendVKey(0)

        session.findById("wnd[0]").sendVKey(4)
        session.findById("wnd[1]/usr/lbl[1,10]").setFocus()
        session.findById("wnd[1]").sendVKey(0)

        session.findById("wnd[0]/tbar[1]/btn[8]").press()
        
        take_screenshot(session, "S_ALR_87013624 Completed")

        # scroll (from recording)
#        session.findById("wnd[0]/usr").verticalScrollbar.position = 30
#        session.findById("wnd[0]/usr").verticalScrollbar.position = 0

        session.findById("wnd[0]/tbar[0]/btn[3]").press()

        popup = wait_for_window(session, "wnd[1]")
        if popup:
            session.findById("wnd[1]/usr/btnBUTTON_YES").press()

        session.findById("wnd[0]/tbar[0]/btn[12]").press()
        
    # =========================================================
    # S_ALR_87013633
    # =========================================================
    with allure.step("S_ALR_87013633"):
        session.findById("wnd[0]/tbar[0]/okcd").text = "S_ALR_87013633"
        session.findById("wnd[0]").sendVKey(0)

        session.findById("wnd[0]").sendVKey(4)
        session.findById("wnd[1]/usr/lbl[1,10]").setFocus()
        session.findById("wnd[1]").sendVKey(0)

        session.findById("wnd[0]/tbar[1]/btn[8]").press()
        take_screenshot(session, "S_ALR_87013633 Completed")

        # scroll (from recording)
#        session.findById("wnd[0]/usr").verticalScrollbar.position = 30
#        session.findById("wnd[0]/usr").verticalScrollbar.position = 0

        session.findById("wnd[0]/tbar[0]/btn[3]").press()

        popup = wait_for_window(session, "wnd[1]")
        if popup:
            session.findById("wnd[1]/usr/btnBUTTON_YES").press()

        session.findById("wnd[0]/tbar[0]/btn[12]").press()
        
    # =========================================================
    # S_ALR_87013636
    # =========================================================
    with allure.step("S_ALR_87013636"):
        session.findById("wnd[0]/tbar[0]/okcd").text = "S_ALR_87013636"
        session.findById("wnd[0]").sendVKey(0)

        session.findById("wnd[0]").sendVKey(4)
        session.findById("wnd[1]/usr/lbl[1,10]").setFocus()
        session.findById("wnd[1]").sendVKey(0)

        session.findById("wnd[0]/tbar[1]/btn[8]").press()
        
        take_screenshot(session, "S_ALR_87013636 Completed")

        # scroll (from recording)
#        session.findById("wnd[0]/usr").verticalScrollbar.position = 30
#        session.findById("wnd[0]/usr").verticalScrollbar.position = 0

        session.findById("wnd[0]/tbar[0]/btn[3]").press()

        popup = wait_for_window(session, "wnd[1]")
        if popup:
            session.findById("wnd[1]/usr/btnBUTTON_YES").press()

        session.findById("wnd[0]/tbar[0]/btn[12]").press() 
        take_screenshot(session, "S_ALR_87013636 Completed")
    
    # =========================================================
    # LOGOFF
    # =========================================================
    with allure.step("Log off"):
        try:
            session.findById("wnd[0]/tbar[0]/okcd").text = "/nex"
            session.findById("wnd[0]").sendVKey(0)
        except:
            pass

