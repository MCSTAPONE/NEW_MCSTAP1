# -*- coding: utf-8 -*-

import time
import re
import os
import datetime
import allure

from sap.sap_login import SAPLogin
from services.context import execution_context

def take_screenshot(session, name="Screenshot"):
    try:
        base_dir = r"C:\Users\bndas\SAP_Test\Test_Business_Logic\reports\screenshots"

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
# ===============================
# MAIN TEST
# ===============================

@allure.feature("Create order maintenance Lifecycle")
@allure.story("Create → Modify → Dsiplay")
@allure.title("Full SAP Maintenance Lifecycle")

def run_iw31_create_order(session):

    try:

        with allure.step("Open IW31"):

            session.findById("wnd[0]").maximize()

            session.findById(
                "wnd[0]/tbar[0]/okcd"
            ).text = "IW31"

            session.findById("wnd[0]").sendVKey(0)

            time.sleep(1)

        with allure.step("Select Order Type"):

            session.findById("wnd[0]").sendVKey(4)

            time.sleep(1)

            session.findById("wnd[1]").sendVKey(0)

            time.sleep(1)

        with allure.step("Set Priority"):

            session.findById(
                "wnd[0]/usr/cmbCAUFVD-PRIOK"
            ).key = "3"

        with allure.step("Select Functional Location"):

            session.findById(
                "wnd[0]/usr/subOBJECT:SAPLCOIH:7100/ctxtCAUFVD-TPLNR"
            ).setFocus()

            session.findById("wnd[0]").sendVKey(4)

            time.sleep(1)

            session.findById("wnd[1]").sendVKey(0)

            session.findById(
                "wnd[1]/usr/lbl[1,9]"
            ).setFocus()

            session.findById("wnd[1]").sendVKey(0)

            time.sleep(1)

        with allure.step("Continue"):

            session.findById(
                "wnd[0]/tbar[1]/btn[16]"
            ).press()

            time.sleep(1)

        with allure.step("Enter Header Text"):

            session.findById(
                "wnd[0]/usr/subSUB_ALL:SAPLCOIH:3001/"
                "ssubSUB_LEVEL:SAPLCOIH:1100/"
                "subSUB_KOPF:SAPLCOIH:1102/"
                "txtCAUFVD-KTEXT"
            ).text = "Nalog za test"

        with allure.step("Enter Operation Text"):

            session.findById(
                "wnd[0]/usr/subSUB_ALL:SAPLCOIH:3001/"
                "ssubSUB_LEVEL:SAPLCOIH:1100/"
                "tabsTS_1100/tabpIHKZ/"
                "ssubSUB_AUFTRAG:SAPLCOIH:1120/"
                "subAVO:SAPLCOI0:0310/"
                "txtAFVGD-LTXA1"
            ).text = "Nalog za test"

        with allure.step("Prepare Save"):

            session.findById(
                "wnd[0]/tbar[1]/btn[25]"
            ).press()

            time.sleep(2)

        with allure.step("Save Order"):

            session.findById(
                "wnd[0]/tbar[0]/btn[11]"
            ).press()

            time.sleep(3)

        status_text = ""

        try:
            status_text = session.findById(
                "wnd[0]/sbar"
            ).text
        except:
            pass

        print(f"Status Text: {status_text}")

        order_number = None

        match = re.search(r"\d{6,}", status_text)

        if match:
            order_number = match.group(0)

        if not order_number:

            for field_id in [

                "wnd[0]/usr/ctxtCAUFVD-AUFNR",
                "wnd[0]/usr/txtCAUFVD-AUFNR",
                "wnd[0]/usr/ctxtAUFNR"

            ]:

                try:

                    value = session.findById(
                        field_id
                    ).text.strip()

                    if value:
                        order_number = value
                        break

                except:
                    continue

        execution_context["order_number"] = order_number

        print(f"Created Order = {order_number}")

        take_screenshot(
            session,
            "IW31_Order_Created"
        )

        with allure.step("Exit IW31"):

            session.findById(
                "wnd[0]/tbar[0]/btn[12]"
            ).press()

            time.sleep(1)

        return {
            "status": "PASSED",
            "order_number": order_number
        }

    except Exception as e:

        take_screenshot(
            session,
            "IW31_ERROR"
        )

        print("❌ IW31 error:", e)

        return {
            "status": "FAILED",
            "order_number": None
        }

def run_iw32_change_order(session):

    try:
        session.findById("wnd[0]").maximize()

        # ✅ STEP 1: Open IW32
        session.findById("wnd[0]/tbar[0]/okcd").text = "IW32"
        session.findById("wnd[0]").sendVKey(0)

        time.sleep(1)

        # ✅ STEP 2: Get order number from IW31
        order_number = execution_context.get("order_number")

        if not order_number:
            print("No order number found in context")
            return {"status": "FAILED"}

        # ✅ STEP 3: Enter order number
        session.findById("wnd[0]/usr/ctxtCAUFVD-AUFNR").text = order_number
        session.findById("wnd[0]").sendVKey(0)

        time.sleep(1)

        # ✅ STEP 4: Change description
        session.findById(
            "wnd[0]/usr/subSUB_ALL:SAPLCOIH:3001/"
            "ssubSUB_LEVEL:SAPLCOIH:1100/"
            "subSUB_KOPF:SAPLCOIH:1102/"
            "txtCAUFVD-KTEXT"
        ).text = "Nalog za test - promjena IW32"

        # ✅ STEP 5: SAVE
        session.findById("wnd[0]/tbar[0]/btn[11]").press()
        # ✅ IMPORTANT: RESET SCREEN
        session.findById("wnd[0]/tbar[0]/okcd").text = "/n"
        session.findById("wnd[0]").sendVKey(0)
        return {"status": "PASSED"}

    except Exception as e:
        print("IW32 error:", e)
        return {"status": "FAILED"}

def run_iw33_display_order(session):

    try:
        session.findById("wnd[0]").maximize()

        # ✅ STEP 1: Open IW33
        session.findById("wnd[0]/tbar[0]/okcd").text = "IW33"
        session.findById("wnd[0]").sendVKey(0)

        time.sleep(1)

        # ✅ STEP 2: get order
        order_number = execution_context.get("order_number")

        if not order_number:
            print("No order number for IW33")
            return {"status": "FAILED"}

        # ✅ STEP 3: enter order
        session.findById("wnd[0]/usr/ctxtCAUFVD-AUFNR").text = order_number
        session.findById("wnd[0]").sendVKey(0)

        time.sleep(1)

        # ✅ Optional navigation (your recording)
        session.findById(
            "wnd[0]/usr/subSUB_ALL:SAPLCOIH:3001/"
            "ssubSUB_LEVEL:SAPLCOIH:1100/tabsTS_1100/tabpVGUE"
        ).select()

        session.findById(
            "wnd[0]/usr/subSUB_ALL:SAPLCOIH:3001/"
            "ssubSUB_LEVEL:SAPLCOIH:1107/tabsTS_1100/tabpMUEB"
        ).select()
        # ✅ IMPORTANT: RESET SCREEN
        session.findById("wnd[0]/tbar[0]/okcd").text = "/n"
        session.findById("wnd[0]").sendVKey(0)
        return {"status": "PASSED"}

    except Exception as e:
        print("IW33 error:", e)
        return {"status": "FAILED"}


@allure.feature("Maintenance Lifecycle")
@allure.story("Display Notification")
@allure.title("IW23 Display Notification")
def run_iw23_display_notification(session):

    try:

        with allure.step("Open IW23"):

            session.findById("wnd[0]").maximize()

            session.findById(
                "wnd[0]/tbar[0]/okcd"
            ).text = "IW23"

            session.findById("wnd[0]").sendVKey(0)

            time.sleep(1)

        with allure.step("Open Notification"):

            session.findById("wnd[0]").sendVKey(0)

            time.sleep(1)

        with allure.step("Open Notification Tab"):

            session.findById(
                "wnd[0]/usr/tabsTAB_GROUP_10/tabp10\\TAB02"
            ).select()

            time.sleep(1)

        take_screenshot(
            session,
            "IW23_Notification"
        )

        with allure.step("Exit IW23"):

            session.findById(
                "wnd[0]/tbar[0]/btn[3]"
            ).press()

            session.findById(
                "wnd[0]/tbar[0]/btn[12]"
            ).press()

        return {
            "status": "PASSED"
        }

    except Exception as e:

        print("IW23 error:", e)

        return {
            "status": "FAILED"
        }

        
@allure.feature("Maintenance Lifecycle")
@allure.story("Display Order List")
@allure.title("IW39 Display Order List")
def run_iw39_order_list(session):

    try:

        with allure.step("Open IW39"):

            session.findById("wnd[0]").maximize()

            session.findById(
                "wnd[0]/tbar[0]/okcd"
            ).text = "IW39"

            session.findById("wnd[0]").sendVKey(0)

            time.sleep(1)

        with allure.step("Select filters"):

            session.findById(
                "wnd[0]/usr/chkDY_MAB"
            ).selected = True

            session.findById(
                "wnd[0]/usr/chkDY_HIS"
            ).selected = True

        with allure.step("Execute report"):

            session.findById(
                "wnd[0]/tbar[1]/btn[8]"
            ).press()

            time.sleep(2)

        take_screenshot(session, "IW39_Result")

        session.findById(
            "wnd[0]/tbar[0]/btn[3]"
        ).press()

        session.findById(
            "wnd[0]/tbar[0]/btn[12]"
        ).press()

        return {"status": "PASSED"}

    except Exception as e:

        print("IW39 error:", e)

        return {"status": "FAILED"}

@allure.feature("Maintenance Lifecycle")
@allure.story("Mass Processing")
@allure.title("IW40 Mass Processing")
def run_iw40_mass_processing(session):

    try:

        session.findById("wnd[0]").maximize()

        session.findById(
            "wnd[0]/tbar[0]/okcd"
        ).text = "IW40"

        session.findById("wnd[0]").sendVKey(0)

        time.sleep(1)

        session.findById(
            "wnd[0]/usr/chkDY_MAB"
        ).selected = True

        session.findById(
            "wnd[0]/usr/chkDY_HIS"
        ).selected = True

        session.findById(
            "wnd[0]/tbar[1]/btn[8]"
        ).press()

        time.sleep(2)

        take_screenshot(session, "IW40_Result")

        session.findById(
            "wnd[0]/tbar[0]/btn[3]"
        ).press()

        session.findById(
            "wnd[0]/tbar[0]/btn[12]"
        ).press()

        return {"status": "PASSED"}

    except Exception as e:

        print("IW40 error:", e)

        return {"status": "FAILED"}
        
@allure.feature("Maintenance Lifecycle")
@allure.story("Order Confirmation")
@allure.title("IW41 Confirm Order")
def run_iw41_confirm_order(session):

    try:

        order_number = execution_context.get(
            "order_number"
        )

        print(
            f"Order Number = {order_number}"
        )

        session.findById(
            "wnd[0]"
        ).maximize()

        # Open IW41

        session.findById(
            "wnd[0]/tbar[0]/okcd"
        ).text = "IW41"

        session.findById(
            "wnd[0]"
        ).sendVKey(0)

        time.sleep(1)

        # Follow recorded script

        session.findById(
            "wnd[0]"
        ).sendVKey(0)

        time.sleep(1)

        session.findById(
            "wnd[0]/usr/chkAFRUD-AUERU"
        ).selected = True

        session.findById(
            "wnd[0]/usr/txtAFRUD-IDAUR"
        ).text = "60"

        session.findById(
            "wnd[0]/usr/chkAFRUD-AUERU"
        ).setFocus()

        session.findById(
            "wnd[0]"
        ).sendVKey(0)

        time.sleep(1)

        session.findById(
            "wnd[0]/tbar[0]/btn[11]"
        ).press()

        time.sleep(2)

        take_screenshot(
            session,
            "IW41_Save"
        )

        session.findById(
            "wnd[0]/tbar[0]/btn[12]"
        ).press()

        return {
            "status": "PASSED"
        }

    except Exception as e:

        print(
            f"IW41 error: {e}"
        )

        take_screenshot(
            session,
            "IW41_ERROR"
        )

        return {
            "status": "FAILED"
        }
        
@allure.feature("Maintenance Lifecycle")
@allure.story("Purchase Requisition")
@allure.title("ME51N Create PR")
def run_me51n_create_pr(session):

    try:

        print("Opening ME51N")

        session.findById(
            "wnd[0]"
        ).maximize()

        session.findById(
            "wnd[0]/tbar[0]/okcd"
        ).text = "ME51N"

        session.findById(
            "wnd[0]"
        ).sendVKey(0)

        time.sleep(5)

        print("ME51N opened")

        take_screenshot(
            session,
            "ME51N_INITIAL_SCREEN"
        )

        return {
            "status": "PASSED"
        }

    except Exception as e:

        print(
            f"ME51N error: {e}"
        )

        return {
            "status": "FAILED"
        }
            
