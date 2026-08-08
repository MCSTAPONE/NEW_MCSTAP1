import os
from dotenv import load_dotenv

from fastapi import FastAPI, Request
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse
from fastapi import Form
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware

from api.database import get_connection
from api.routes.sap import router as sap_router
from api.routes.pm import router as pm_router
from api.routes.auth import router as auth_router

# Load environment variables
load_dotenv()

app = FastAPI(
    title="SAP Automation Platform",
    version="1.0.0",
    description="SAP Automation Platform with JWT Authentication"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:3000").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
# Include routers
app.include_router(auth_router)
app.include_router(sap_router)
app.include_router(pm_router)

# Mount static files only if they exist
template_dir = "templates"
static_dir = "static"
allure_dir = "allure-report"

try:
    if os.path.exists(template_dir):
        templates = Jinja2Templates(directory=template_dir)
    else:
        templates = None
except Exception:
    templates = None

if os.path.exists(static_dir):
    app.mount(
        "/static",
        StaticFiles(directory=static_dir),
        name="static"
    )

if os.path.exists(allure_dir):
    app.mount(
        "/allure",
        StaticFiles(directory=allure_dir),
        name="allure"
    )


@app.get("/dashboard")
def dashboard(request: Request):
    if templates is None:
        return {"message": "Dashboard templates not available"}
    
    return templates.TemplateResponse(
        request=request,
        name="dashboard.html",
        context={
            "title": "SAP Automation Platform"
        }
    )

@app.get("/")
def home():

    return {
        "status": "running",
        "application": "SAP Automation Platform"
    }


@app.get("/health")
def health():

    return {
        "framework": "OK"
    }


@app.get("/coverage")
def coverage():

    conn = get_connection()

    cur = conn.cursor()

    cur.execute(
        """
        SELECT *
        FROM test_steps
        LIMIT 20
        """
    )

    rows = cur.fetchall()

    cur.close()
    conn.close()

    return rows
    
@app.get("/pm")
def pm(request: Request):

    return templates.TemplateResponse(
        request=request,
        name="pm.html",
        context={}
    )
    
@app.get("/pm/execution")
def pm_execution(request: Request):

    return templates.TemplateResponse(
        request=request,
        name="pm_execution.html",
        context={}
    )
    
@app.get("/reports")
def reports(request: Request):

    return templates.TemplateResponse(
        request=request,
        name="reports.html",
        context={}
    )
    
@app.get("/reports/allure")
def allure_report():

    return RedirectResponse(
        url="/allure/index.html"
    )
    
@app.get("/Coverage")
def coverage_page(request: Request):

    return templates.TemplateResponse(
        request=request,
        name="coverage.html",
        context={}
    )

@app.get("/coverage/summary")
def coverage_summary():

    conn = get_connection()

    cur = conn.cursor()

    cur.execute("""
        SELECT COUNT(*)
        FROM test_steps
    """)

    total_steps = cur.fetchone()[0]

    cur.close()
    conn.close()

    return {
        "total_steps": total_steps,
        "automated": total_steps,
        "coverage_percent": 100,
        "modules": 12
    }
    
@app.get("/risk")
def risk_dashboard(request: Request):

    return templates.TemplateResponse(
        request=request,
        name="risk.html",
        context={}
    )

@app.get("/test-cases")
def test_cases(request: Request):

    conn = get_connection()

    cur = conn.cursor()

    
    cur.execute("""
        SELECT
            test_case_id,
            module,
            transaction_code,
            process_step,
            automation_status,
            script_path
        FROM test_cases
        ORDER BY id ASC
    """)


    rows = cur.fetchall()

    cur.close()
    conn.close()

    return templates.TemplateResponse(
        request=request,
        name="test_cases.html",
        context={
            "rows": rows
        }
    )
    
@app.post("/test-cases/save")
def save_test_case(
    title: str = Form(...),
    module: str = Form(...),
    transaction_code: str = Form(...),
    process_step: str = Form(...),
    automation_status: str = Form(...),
    script_path: str = Form(...)
):

    conn = get_connection()

    cur = conn.cursor()

    # Generate Test Case ID

    cur.execute(
        """
        SELECT COUNT(*)
        FROM test_cases
        """
    )

    next_id = cur.fetchone()[0] + 1

    test_case_id = f"TC{next_id:04d}"

    # Save Test Case

    cur.execute(
        """
        INSERT INTO test_cases
        (
            test_case_id,
            title,
            module,
            transaction_code,
            process_step,
            automation_status,
            script_path
        )
        VALUES
        (%s,%s,%s,%s,%s,%s,%s)
        """,
        (
            test_case_id,
            title,
            module,
            transaction_code,
            process_step,
            automation_status,
            script_path
        )
    )

    # Check if Repository Asset already exists

    cur.execute(
        """
        SELECT COUNT(*)
        FROM repository_assets
        WHERE transaction_code = %s
        """,
        (transaction_code,)
    )

    exists = cur.fetchone()[0]

    # Auto-register Repository Asset

    if exists == 0:

        cur.execute(
            """
            INSERT INTO repository_assets
            (
                asset_name,
                module,
                transaction_code,
                script_name,
                description
            )
            VALUES
            (%s,%s,%s,%s,%s)
            """,
            (
                title,
                module,
                transaction_code,
                script_path,
                process_step
            )
        )

    conn.commit()

    cur.close()
    conn.close()

    return RedirectResponse(
        url="/test-cases",
        status_code=303
    )

    return RedirectResponse(
        url="/test-cases",
        status_code=303
    )
@app.get("/test-cases/edit/{test_case_id}")
def edit_test_case(
    request: Request,
    test_case_id: str
):

    conn = get_connection()

    cur = conn.cursor()

    cur.execute(
        """
        SELECT
            test_case_id,
            title,
            module,
            transaction_code,
            process_step,
            automation_status,
            script_path
        FROM test_cases
        WHERE test_case_id = %s
        """,
        (test_case_id,)
    )

    row = cur.fetchone()

    cur.close()
    conn.close()

    return templates.TemplateResponse(
        request=request,
        name="edit_test_case.html",
        context={
            "row": row
        }
    )

@app.post("/test-cases/edit/{test_case_id}")
def update_test_case(
    test_case_id: str,
    title: str = Form(...),
    module: str = Form(...),
    transaction_code: str = Form(...),
    process_step: str = Form(...),
    automation_status: str = Form(...),
    script_path: str = Form(...)
):

    conn = get_connection()

    cur = conn.cursor()

    # Update Test Case

    cur.execute(
        """
        UPDATE test_cases
        SET
            title = %s,
            module = %s,
            transaction_code = %s,
            process_step = %s,
            automation_status = %s,
            script_path = %s
        WHERE test_case_id = %s
        """,
        (
            title,
            module,
            transaction_code,
            process_step,
            automation_status,
            script_path,
            test_case_id
        )
    )

    # Update Repository Asset

    cur.execute(
        """
        UPDATE repository_assets
        SET
            asset_name = %s,
            module = %s,
            script_name = %s,
            description = %s
        WHERE transaction_code = %s
        """,
        (
            title,
            module,
            script_path,
            process_step,
            transaction_code
        )
    )

    conn.commit()

    cur.close()
    conn.close()

    return RedirectResponse(
        url="/test-cases",
        status_code=303
    )

@app.get("/test-cases/view/{test_case_id}")
def view_test_case(
    request: Request,
    test_case_id: str
):

    conn = get_connection()

    cur = conn.cursor()

    cur.execute(
        """
        SELECT
            test_case_id,
            title,
            module,
            transaction_code,
            process_step,
            automation_status,
            script_path
        FROM test_cases
        WHERE test_case_id = %s
        """,
        (test_case_id,)
    )

    row = cur.fetchone()

    cur.close()
    conn.close()

    return templates.TemplateResponse(
        request=request,
        name="view_test_case.html",
        context={
            "row": row
        }
    )

@app.get("/test-cases/delete/{test_case_id}")
def delete_test_case(
    test_case_id: str
):

    conn = get_connection()

    cur = conn.cursor()

    cur.execute(
        """
        DELETE FROM test_cases
        WHERE test_case_id = %s
        """,
        (test_case_id,)
    )

    conn.commit()

    cur.close()
    conn.close()

    return RedirectResponse(
        url="/test-cases",
        status_code=303
    )
    
@app.get("/repository")
def repository(request: Request):

    modules = [
        "PM",
        "MM",
        "FI",
        "CO",
        "SD",
        "WM",
        "QM",
        "PP",
        "LO",
        "TR",
        "SCM",
        "PLM",
        "PROC"
    ]

    return templates.TemplateResponse(
        request=request,
        name="repository.html",
        context={
            "modules": modules
        }
    )
    
@app.get("/repository/{module}")
def repository_module(
    request: Request,
    module: str
):

    conn = get_connection()

    cur = conn.cursor()

    cur.execute(
        """
        SELECT
            test_case_id,
            title,
            transaction_code,
            automation_status,
            script_path
        FROM test_cases
        WHERE module = %s
        ORDER BY id ASC
        """,
        (module,)
    )

    rows = cur.fetchall()

    cur.close()
    conn.close()

    return templates.TemplateResponse(
        request=request,
        name="repository_module.html",
        context={
            "module": module,
            "rows": rows
        }
    )
    
@app.get("/test-scripts")
def test_scripts(request: Request):

    scripts = [
        ["test_iw31.py", "PM", "IW31", "Active"],
        ["test_iw32.py", "PM", "IW32", "Active"],
        ["test_iw33.py", "PM", "IW33", "Active"],
        ["test_iw39.py", "PM", "IW39", "Active"],
        ["test_iw40.py", "PM", "IW40", "Active"],
        ["test_iw41.py", "PM", "IW41", "Active"],
        ["test_iw23.py", "PM", "IW23", "Active"],
        ["test_me51n.py", "PM", "ME51N", "Active"],
        ["test_ko88.py", "PM", "KO88", "Active"]
    ]

    return templates.TemplateResponse(
        request=request,
        name="test_scripts.html",
        context={
            "scripts": scripts
        }
    )
    
@app.get("/script-studio")
def script_studio(request: Request):

    return templates.TemplateResponse(
        request=request,
        name="script_studio.html",
        context={}
    )
    
@app.get("/script-studio/login")
def script_login_template(request: Request):

    return templates.TemplateResponse(
        request=request,
        name="template_login.html",
        context={}
    )


@app.get("/script-studio/transaction")
def script_transaction_template(request: Request):

    return templates.TemplateResponse(
        request=request,
        name="template_transaction.html",
        context={}
    )


@app.get("/script-studio/logout")
def script_logout_template(request: Request):

    return templates.TemplateResponse(
        request=request,
        name="template_logout.html",
        context={}
    )
  
@app.get("/script-studio/builder")
def script_builder(request: Request):

    return templates.TemplateResponse(
        request=request,
        name="script_builder.html",
        context={}
    )

  
@app.get("/script-studio/start-recorder")
def start_recorder():
    try:
        from sap.sap_client import SAPClient
        from sap.sap_login import SAPLogin

        client = SAPClient()

        session = client.attach_to_sap()

        login = SAPLogin(session)

        login.login()

        return {
            "status": "SUCCESS",
            "message": "SAP connected and logged in",
            "system": "S4Q"
        }

    except Exception as e:

        return {
            "status": "ERROR",
            "message": str(e)
        }
        
@app.get("/script-studio/library")
def script_library(request: Request):

    conn = get_connection()
    cur = conn.cursor()

    cur.execute(
        """
        SELECT
            script_id,
            script_name,
            module,
            COALESCE(transaction_code,''),
            status
        FROM script_master
        ORDER BY script_id
        """
    )

    scripts = cur.fetchall()

    print("====== SCRIPT DATA ======")

    for row in scripts:
        print(row)

    print("=========================")


    cur.close()
    conn.close()

    return templates.TemplateResponse(
        request=request,
        name="script_library.html",
        context={
            "scripts": scripts
        }
    )
@app.post("/script-studio/add-step/{script_id}")
def add_step(
    script_id: int,
    action_type: str = Form(...),
    parameter_name: str = Form(""),
    parameter_value: str = Form("")
):

    conn = get_connection()
    cur = conn.cursor()

    cur.execute(
        """
        SELECT
            COALESCE(MAX(step_sequence),0)+1
        FROM script_steps
        WHERE script_id = %s
        """,
        (str(script_id),)
    )

    next_seq = cur.fetchone()[0]

    cur.execute(
        """
        INSERT INTO script_steps
        (
            script_id,
            step_sequence,
            action_type,
            parameter_name,
            parameter_value
        )
        VALUES
        (%s,%s,%s,%s,%s)
        """,
        (
            str(script_id),
            next_seq,
            action_type,
            parameter_name,
            parameter_value
        )
    )

    conn.commit()

    cur.close()
    conn.close()

    return RedirectResponse(
        url=f"/script-studio/script/{script_id}",
        status_code=303
    )
    
@app.post("/script-studio/save")
def save_script(
    script_name: str = Form(...),
    module: str = Form(...),
    transaction_code: str = Form(...),
    description: str = Form(...)
):

    conn = get_connection()
    cur = conn.cursor()

    cur.execute(
        """
        INSERT INTO script_master
        (
            script_name,
            module,
            transaction_code,
            description,
            status,
            created_by
        )
        VALUES
        (%s,%s,%s,%s,%s,%s)
        RETURNING script_id
        """,
        (
            script_name,
            module,
            transaction_code,
            description,
            "Draft",
            "Biranchi"
        )
    )

    new_script_id = cur.fetchone()[0]

    cur.execute(
        """
        INSERT INTO script_steps
        (
            script_id,
            step_sequence,
            action_type,
            parameter_name,
            parameter_value
        )
        VALUES
        (%s,1,'LOGIN','','')
        """,
        (str(new_script_id),)
    )

    cur.execute(
        """
        INSERT INTO script_steps
        (
            script_id,
            step_sequence,
            action_type,
            parameter_name,
            parameter_value
        )
        VALUES
        (%s,2,'START_TRANSACTION','TCODE',%s)
        """,
        (
            str(new_script_id),
            transaction_code
        )
    )

    cur.execute(
        """
        INSERT INTO script_steps
        (
            script_id,
            step_sequence,
            action_type,
            parameter_name,
            parameter_value
        )
        VALUES
        (%s,3,'LOGOUT','','')
        """,
        (str(new_script_id),)
    )

    conn.commit()

    cur.close()
    conn.close()

    return RedirectResponse(
        url="/script-studio/library",
        status_code=303
    )
    
@app.get("/script-studio/script/{script_id}")
def open_script(
    request: Request,
    script_id: int
):

    conn = get_connection()
    cur = conn.cursor()

    cur.execute(
        """
        SELECT
            script_name
        FROM script_master
        WHERE script_id = %s
        """,
        (script_id,)
    )

    result = cur.fetchone()

    if result is None:

        cur.close()
        conn.close()

        return RedirectResponse(
            url="/script-studio/library",
            status_code=303
        )

    script_name = result[0]

    cur.execute(
        """
        SELECT
            step_sequence,
            action_type,
            parameter_name,
            parameter_value
        FROM script_steps
        WHERE script_id = %s
        ORDER BY step_sequence
        """,
        (str(script_id),)
    )

    steps = cur.fetchall()

    cur.close()
    conn.close()

    return templates.TemplateResponse(
        request=request,
        name="script_steps.html",
        context={
            "script_id": script_id,
            "script_name": script_name,
            "steps": steps
        }
    )
    
@app.get("/script-studio/edit-step/{script_id}/{step_sequence}")
def edit_step(
    request: Request,
    script_id: int,
    step_sequence: int
):

    conn = get_connection()
    cur = conn.cursor()

    cur.execute(
        """
        SELECT
            action_type,
            parameter_name,
            parameter_value
        FROM script_steps
        WHERE script_id = %s
        AND step_sequence = %s
        """,
        (
            str(script_id),
            step_sequence
        )
    )

    row = cur.fetchone()

    cur.close()
    conn.close()

    if row is None:

        return RedirectResponse(
            url=f"/script-studio/script/{script_id}",
            status_code=303
        )

    return templates.TemplateResponse(
        request=request,
        name="edit_step.html",
        context={
            "script_id": script_id,
            "step_sequence": step_sequence,
            "action_type": row[0],
            "parameter_name": row[1],
            "parameter_value": row[2]
        }
    )
@app.post("/script-studio/edit-step/{script_id}/{step_sequence}")
def save_step_edit(
    script_id: int,
    step_sequence: int,

    action_type: str = Form(...),
    parameter_name: str = Form(""),
    parameter_value: str = Form("")
):

    conn = get_connection()
    cur = conn.cursor()

    cur.execute(
        """
        UPDATE script_steps
        SET
            action_type = %s,
            parameter_name = %s,
            parameter_value = %s
        WHERE script_id = %s
        AND step_sequence = %s
        """,
        (
            action_type,
            parameter_name,
            parameter_value,
            str(script_id),
            step_sequence
        )
    )

    conn.commit()

    cur.close()
    conn.close()

    return RedirectResponse(
        url=f"/script-studio/script/{script_id}",
        status_code=303
    )

    
@app.get("/script-studio/delete-step/{script_id}/{step_sequence}")
def delete_step(
    script_id: int,
    step_sequence: int
):

    conn = get_connection()
    cur = conn.cursor()

    cur.execute(
        """
        DELETE FROM script_steps
        WHERE script_id = %s
        AND step_sequence = %s
        """,
        (
            str(script_id),
            step_sequence
        )
    )

    conn.commit()

    cur.close()
    conn.close()

    return RedirectResponse(
        url=f"/script-studio/script/{script_id}",
        status_code=303
    )

    
@app.get("/script-studio/run/{script_id}")
def run_script(
    request: Request,
    script_id: int
):
    from services.script_executor import ScriptExecutor

    executor = ScriptExecutor()
    logs = executor.execute_script(
        script_id
    )

    return templates.TemplateResponse(
        request=request,
        name="script_execution_result.html",
        context={
            "script_id": script_id,
            "logs": logs
        }
    )


@app.post("/api/script-studio/{script_id}/run")
def run_script_api(
    script_id: int
):
    from services.script_executor import ScriptExecutor

    executor = ScriptExecutor()
    logs = executor.execute_script(
        script_id
    )

    return {
        "status": "SUCCESS",
        "script_id": script_id,
        "logs": logs
    }

    
@app.get("/flow-library")
def flow_library(
    request: Request,
    module: str = ""
):

    conn = get_connection()

    cur = conn.cursor()

    if module:

        cur.execute(
            """
            SELECT
                flow_id,
                flow_name,
                description,
                module,
                status
            FROM flow_master
            WHERE module = %s
            ORDER BY flow_name
            """,
            (module,)
        )

    else:

        cur.execute(
            """
            SELECT
                flow_id,
                flow_name,
                description,
                module,
                status
            FROM flow_master
            ORDER BY flow_name
            """
        )

    flows = cur.fetchall()
    print("FLOWS =", flows)

    cur.close()
    conn.close()

    return templates.TemplateResponse(
        request=request,
        name="flow_library.html",
        context={
            "flows": flows,
            "selected_module": module
        }
    )
    
@app.get("/flow-library/new")
def new_flow_page(
    request: Request
):

    return templates.TemplateResponse(
        request=request,
        name="new_flow.html",
        context={}
    )
    
@app.post("/flow-library/new")
def create_flow(
    request: Request,
    flow_name: str = Form(...),
    description: str = Form(""),
    module: str = Form("")
):

    conn = get_connection()

    cur = conn.cursor()

    cur.execute(
        """
        INSERT INTO flow_master
        (
            flow_name,
            description,
            module
        )
        VALUES
        (
            %s,
            %s,
            %s
        )
        """,
        (
            flow_name,
            description,
            module
        )
    )

    conn.commit()

    cur.close()
    conn.close()

    return RedirectResponse(
        url="/flow-library",
        status_code=303
    )
    
@app.get("/flow-library/{flow_id}")
def open_flow(
    request: Request,
    flow_id: int
):

    conn = get_connection()

    cur = conn.cursor()

    cur.execute(
        """
        SELECT
            flow_id,
            flow_name,
            description,
            module,
            status
        FROM flow_master
        WHERE flow_id = %s
        """,
        (flow_id,)
    )

    flow = cur.fetchone()
    
    cur.execute(
        """
        SELECT
            step_id,
            sequence_no,
            transaction_code,
            description
        FROM flow_steps
        WHERE flow_id = %s
        ORDER BY sequence_no
        """,
        (flow_id,)
    )

    steps = cur.fetchall()

    cur.close()
    conn.close()

    return templates.TemplateResponse(
        request=request,
        name="flow_details.html",
        context={
            "flow": flow,
            "steps": steps
        }
    )
    
@app.get("/flow-library/edit/{flow_id}")
def edit_flow_page(
    request: Request,
    flow_id: int
):

    conn = get_connection()

    cur = conn.cursor()

    cur.execute(
        """
        SELECT
            flow_id,
            flow_name,
            description,
            module,
            status
        FROM flow_master
        WHERE flow_id = %s
        """,
        (flow_id,)
    )

    flow = cur.fetchone()

    cur.close()
    conn.close()

    return templates.TemplateResponse(
        request=request,
        name="edit_flow.html",
        context={
            "flow": flow
        }
    )
    
@app.post("/flow-library/edit/{flow_id}")
def edit_flow(
    request: Request,
    flow_id: int,
    flow_name: str = Form(...),
    description: str = Form(""),
    module: str = Form("")
):

    conn = get_connection()

    cur = conn.cursor()

    cur.execute(
        """
        UPDATE flow_master
        SET
            flow_name = %s,
            description = %s,
            module = %s
        WHERE flow_id = %s
        """,
        (
            flow_name,
            description,
            module,
            flow_id
        )
    )

    conn.commit()

    cur.close()
    conn.close()

    return RedirectResponse(
        url="/flow-library",
        status_code=303
    )
    
@app.get("/flow-library/delete/{flow_id}")
def delete_flow(
    flow_id: int
):

    conn = get_connection()

    cur = conn.cursor()

    cur.execute(
        """
        DELETE
        FROM flow_master
        WHERE flow_id = %s
        """,
        (flow_id,)
    )

    conn.commit()

    cur.close()
    conn.close()

    return RedirectResponse(
        url="/flow-library",
        status_code=303
    )
    
@app.get("/flow-library/{flow_id}/add-step")
def add_step_page(
    request: Request,
    flow_id: int
):

    conn = get_connection()

    cur = conn.cursor()

    cur.execute(
        """
        SELECT
            asset_id,
            asset_name
        FROM repository_assets
        WHERE status = 'Active'
        ORDER BY asset_name
        """
    )

    assets = cur.fetchall()

    cur.close()
    conn.close()

    return templates.TemplateResponse(
        request=request,
        name="add_step.html",
        context={
            "flow_id": flow_id,
            "assets": assets
        }
    )
    
@app.post("/flow-library/{flow_id}/add-step")
def save_step(
    flow_id: int,
    sequence_no: int = Form(...),
    transaction_code: str = Form(...),
    description: str = Form("")
):

    conn = get_connection()

    cur = conn.cursor()

    cur.execute(
        """
        INSERT INTO flow_steps
        (
            flow_id,
            sequence_no,
            transaction_code,
            description
        )
        VALUES
        (
            %s,
            %s,
            %s,
            %s
        )
        """,
        (
            flow_id,
            sequence_no,
            transaction_code,
            description
        )
    )

    conn.commit()

    cur.close()
    conn.close()

    return RedirectResponse(
        url=f"/flow-library/{flow_id}",
        status_code=303
    )

@app.get("/flow-step/edit/{step_id}")
def edit_step_page(
    request: Request,
    step_id: int
):

    conn = get_connection()

    cur = conn.cursor()

    cur.execute(
        """
        SELECT
            step_id,
            flow_id,
            sequence_no,
            transaction_code,
            description
        FROM flow_steps
        WHERE step_id = %s
        """,
        (step_id,)
    )

    step = cur.fetchone()

    cur.close()
    conn.close()

    return templates.TemplateResponse(
        request=request,
        name="edit_flow_step.html",
        context={
            "step": step
        }
    )
    
@app.post("/flow-step/edit/{step_id}")
def edit_step(
    step_id: int,
    sequence_no: int = Form(...),
    transaction_code: str = Form(...),
    description: str = Form("")
):

    conn = get_connection()

    cur = conn.cursor()

    cur.execute(
        """
        UPDATE flow_steps
        SET
            sequence_no = %s,
            transaction_code = %s,
            description = %s
        WHERE step_id = %s
        """,
        (
            sequence_no,
            transaction_code,
            description,
            step_id
        )
    )

    conn.commit()

    cur.execute(
        """
        SELECT flow_id
        FROM flow_steps
        WHERE step_id = %s
        """,
        (step_id,)
    )

    flow = cur.fetchone()
    flow_id = flow[0]

    cur.close()
    conn.close()

    return RedirectResponse(
        url=f"/flow-library/{flow[0]}",
        status_code=303
    )
    
@app.get("/flow-step/delete/{step_id}")
def delete_step(
    step_id: int
):

    conn = get_connection()

    cur = conn.cursor()

    cur.execute(
        """
        SELECT flow_id
        FROM flow_steps
        WHERE step_id = %s
        """,
        (step_id,)
    )

    flow = cur.fetchone()

    flow_id = flow[0]

    cur.execute(
        """
        DELETE
        FROM flow_steps
        WHERE step_id = %s
        """,
        (step_id,)
    )

    conn.commit()

    cur.close()
    conn.close()

    return RedirectResponse(
        url=f"/flow-library/{flow_id}",
        status_code=303
    )

def build_flow_execution_result(flow_id: str):

    conn = get_connection()

    cur = conn.cursor()

    cur.execute(
        """
        SELECT
            flow_id,
            flow_name
        FROM flow_master
        WHERE flow_id = %s
        """,
        (str(flow_id),)
    )

    flow = cur.fetchone()

    if not flow:

        cur.close()
        conn.close()

        return {
            "status": "FAILED",
            "message": f"Flow {flow_id} not found",
            "flow": None,
            "logs": []
        }

    cur.execute(
        """
        SELECT
            fs.sequence_no,
            fs.transaction_code,
            ra.script_name
        FROM flow_steps fs
        LEFT JOIN repository_assets ra
            ON fs.transaction_code = ra.transaction_code
        WHERE fs.flow_id = %s
        ORDER BY fs.sequence_no
        """,
        (str(flow_id),)
    )

    steps = cur.fetchall()

    logs = []

    base_path = r"C:\Users\bndas\SAP_Test\Test_Business\tests\CO"

    for step in steps:

        script_name = step[2]

        if not script_name:

            logs.append(
                f"Step {step[0]} | {step[1]} | NO SCRIPT FOUND"
            )

            continue

        script_file = os.path.join(
            base_path,
            script_name
        )

        if os.path.exists(script_file):

            import subprocess

            result = subprocess.run(
                ["python", script_file],
                capture_output=True,
                text=True
            )

            status = (
                result.stdout.strip()
                if result.stdout.strip()
                else "EXECUTED"
            )

        else:

            status = "NOT FOUND"

        logs.append(
            f"Step {step[0]} | {step[1]} | {script_name} | {status}"
        )

    cur.close()
    conn.close()

    return {
        "status": "SUCCESS",
        "flow": {
            "id": flow[0],
            "name": flow[1]
        },
        "logs": logs
    }


@app.post("/api/flow-library/{flow_id}/execute")
def execute_flow_api(
    flow_id: str
):

    return build_flow_execution_result(flow_id)


@app.get("/flow-library/{flow_id}/execute")
def execute_flow(
    request: Request,
    flow_id: str
):

    result = build_flow_execution_result(flow_id)

    flow = result["flow"]
    logs = result["logs"]

    flow_tuple = None

    if flow:
        flow_tuple = (
            flow["id"],
            flow["name"]
        )

    return templates.TemplateResponse(
        request=request,
        name="flow_execution.html",
        context={
            "flow": flow_tuple,
            "logs": logs
        }
    )
