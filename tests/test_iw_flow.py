# -*- coding: utf-8 -*-

import sys
import os
import allure
from sap.sap_login import SAPLogin

sys.path.append(os.path.dirname(os.path.dirname(__file__)))
sys.stdout.reconfigure(encoding="utf-8")

from services.sap_connection import get_sap_session
from services.sap_flows import (
    run_iw31_create_order,
    run_iw32_change_order,
    run_iw33_display_order,
    run_iw23_display_notification,
    run_iw39_order_list,
    run_iw40_mass_processing,
    run_iw41_confirm_order,
    run_me51n_create_pr
)

session = get_sap_session()

if not session:
    print("❌ SAP NOT CONNECTED")
    exit()

print("✅ SAP CONNECTED")

# ✅ Step 1 — IW31
res1 = run_iw31_create_order(session)
print("IW31:", res1)

# ✅ Step 2 — IW32
res2 = run_iw32_change_order(session)
print("IW32:", res2)

# ✅ Step 3 — IW33
res3 = run_iw33_display_order(session)
print("IW33:", res3)

# ✅ Step 4 — IW23
res4 = run_iw23_display_notification(session)
print("IW23:", res4)

# ✅ Step 5 — IW39
res5 = run_iw39_order_list(session)
print("IW39:", res5)

# ✅ Step 6 — IW40
res6 = run_iw40_mass_processing(session)
print("IW40:", res6)

# ✅ Step 7 — IW41
res7 = run_iw41_confirm_order(session)
print("IW41:", res7)

# ✅ Step 8 — ME51N
res8 = run_me51n_create_pr(session)
print("ME51N:", res8)

# =========================================================
# LOGOFF
# =========================================================

session.findById("wnd[0]/tbar[0]/okcd").text = "/nex"
session.findById("wnd[0]").sendVKey(0)
