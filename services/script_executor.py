from api.database import get_connection
from services.sap_executor import SAPExecutor
import services.sap_executor

print(services.sap_executor.__file__)


class ScriptExecutor:

    def __init__(self):

        self.logs = []

        self.sap = SAPExecutor()

        
    def log(
        self,
        message
    ):

        self.logs.append(
            message
        )

    def execute_script(
        self,
        script_id
    ):

        conn = get_connection()

        cur = conn.cursor()

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

        for step in steps:

            print(f"STEP: {step}")

            action = step[1]

            parameter = step[3]

            try:

                if action == "LOGIN":

                    self.log(
                        "LOGIN started"
                    )

                    self.sap.connect()

                    self.sap.login()

                    self.log(
                        "LOGIN success"
                    )

                elif action == "START_TRANSACTION":

                    self.log(
                        f"START_TRANSACTION {parameter}"
                    )

                    self.sap.start_transaction(
                        parameter
                    )

                    self.log(
                        f"{parameter} opened"
                    )

                elif action == "EXECUTE_FLOW":

                    self.log(
                        f"FLOW {parameter} started"
                    )

                    self.sap.execute_flow(
                        parameter
                    )

                    self.log(
                        f"FLOW {parameter} completed"
                    )

                elif action == "LOGOUT":

                    self.log(
                        "LOGOUT started"
                    )

                    self.sap.logout()

                    self.log(
                        "LOGOUT success"
                    )

            except Exception as e:

                self.log(
                    f"ERROR: {str(e)}"
                )

                break

        return self.logs