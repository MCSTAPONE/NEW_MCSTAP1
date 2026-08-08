# -*- coding: utf-8 -*-
import os
import json
from services.db import get_connection

# ===============================
# ✅ CREATE COVERAGE STRUCTURE
# ===============================
def create_coverage_structure(module, process, test_type):

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO test_coverage_structure (module, process, test_type)
        VALUES (%s, %s, %s)
        ON CONFLICT DO NOTHING
    """, (module, process, test_type))

    conn.commit()
    cursor.close()
    conn.close()


# ===============================
# ✅ ASSIGN TESTS TO COVERAGE
# ===============================
def assign_tests_to_coverage(module, process, test_type):

    conn = get_connection()
    cursor = conn.cursor()

    if test_type == "E2E":

        # ✅ full flow
        cursor.execute("""
            INSERT INTO test_coverage_mapping (module, process, test_type, test_id)
            SELECT %s, %s, %s, id
            FROM test_steps
            WHERE module = %s
        """, (module, process, test_type, module))

    elif test_type == "Functional":

        # ✅ remove duplicate process steps
        cursor.execute("""
            INSERT INTO test_coverage_mapping (module, process, test_type, test_id)
            SELECT DISTINCT ON (process_step)
                %s, %s, %s, id
            FROM test_steps
            WHERE module = %s
            ORDER BY process_step, id
        """, (module, process, test_type, module))

    elif test_type == "Standalone":

        # ✅ one test per transaction
        cursor.execute("""
            INSERT INTO test_coverage_mapping (module, process, test_type, test_id)
            SELECT DISTINCT ON (transaction_code)
                %s, %s, %s, id
            FROM test_steps
            WHERE module = %s
            ORDER BY transaction_code, id
        """, (module, process, test_type, module))

    conn.commit()
    cursor.close()
    conn.close()



# ===============================
# ✅ GET COVERAGE DATA
# ===============================
def get_coverage_with_tests():

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT module, process, test_type, test_id
        FROM test_coverage_mapping
        ORDER BY module, process, test_type
    """)

    data = cursor.fetchall()

    cursor.close()
    conn.close()

    return data


# ===============================
# ✅ DELETE COVERAGE
# ===============================
def delete_coverage(module, process):

    conn = get_connection()
    cursor = conn.cursor()

    # ✅ Get test_ids first
    cursor.execute("""
        SELECT test_id FROM test_coverage_mapping
        WHERE module=%s AND process=%s
    """, (module, process))

    test_ids = cursor.fetchall()

    # ✅ Delete mapping
    cursor.execute("""
        DELETE FROM test_coverage_mapping
        WHERE module=%s AND process=%s
    """, (module, process))

    # ✅ Delete structure
    cursor.execute("""
        DELETE FROM test_coverage_structure
        WHERE module=%s AND process=%s
    """, (module, process))

    # ✅ Delete actual test steps
    for (test_id,) in test_ids:
        cursor.execute("""
            DELETE FROM test_steps
            WHERE id=%s
        """, (test_id,))

    conn.commit()
    cursor.close()
    conn.close()



# ===============================
# ✅ GET TEST STEPS
# ===============================
def get_test_steps(test_id):

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT step_number, step_description, expected_result, execution_status, transaction_code
        FROM test_steps
        WHERE id = %s
        ORDER BY step_number
    """, (test_id,))

    steps = cursor.fetchall()

    cursor.close()
    conn.close()

    return steps


# ===============================
# ✅ UPDATE STEP STATUS
# ===============================
def update_step_status(test_id, step_number, status):

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        UPDATE test_steps
        SET execution_status = %s
        WHERE id = %s AND step_number = %s
    """, (status, test_id, step_number))

    conn.commit()
    cursor.close()
    conn.close()
    
# ===============================
# ✅ EXECUTION SUMMERY
# ===============================
def get_execution_summary():

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT 
            COUNT(*) AS total,
            SUM(CASE WHEN status='PASSED' THEN 1 ELSE 0 END) AS passed,
            SUM(CASE WHEN status='FAILED' THEN 1 ELSE 0 END) AS failed
        FROM test_execution_steps
    """)

    result = cursor.fetchone()

    cursor.close()
    conn.close()

    return result

# ===============================
# ✅ FAILURE BY TCODE
# ===============================    
def get_failures_by_tcode():

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT transaction_code, COUNT(*) as failures
        FROM test_execution_steps
        WHERE status='FAILED'
        GROUP BY transaction_code
        ORDER BY failures DESC
    """)

    data = cursor.fetchall()

    cursor.close()
    conn.close()

    return data


# ===============================
# ✅ EXECUTION HISTORY
# ===============================    
def get_execution_history():

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT execution_id, test_id, execution_time
        FROM test_execution
        ORDER BY execution_time DESC
        LIMIT 10
    """)

    data = cursor.fetchall()

    cursor.close()
    conn.close()

    return data