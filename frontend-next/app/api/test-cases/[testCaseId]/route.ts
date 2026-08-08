import { NextResponse } from "next/server";

import { ensureSchema, getPool } from "@/lib/db";

type RouteContext = {
  params: Promise<{
    testCaseId: string;
  }>;
};

type TestCasePayload = {
  title: string;
  module: string;
  transaction: string;
  processStep: string;
  status: "Manual" | "Automated";
  scriptPath: string;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    await ensureSchema();
    const { testCaseId } = await context.params;
    const pool = getPool();
    const result = await pool.query(
      `
        SELECT
          test_case_id AS id,
          title,
          module,
          COALESCE(transaction_code, '') AS transaction,
          process_step AS "processStep",
          automation_status AS status,
          COALESCE(script_path, '') AS "scriptPath"
        FROM test_cases
        WHERE test_case_id = $1
      `,
      [testCaseId]
    );

    if (!result.rows.length) {
      return NextResponse.json({ status: "error", message: "Test case not found." }, { status: 404 });
    }

    return NextResponse.json({ status: "ok", item: result.rows[0] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown database error";
    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    await ensureSchema();
    const { testCaseId } = await context.params;
    const payload = (await request.json()) as Partial<TestCasePayload>;

    if (!payload.title || !payload.module || !payload.processStep || !payload.status) {
      return NextResponse.json(
        { status: "error", message: "title, module, processStep, and status are required." },
        { status: 400 }
      );
    }

    const pool = getPool();
    const existingResult = await pool.query(
      `SELECT transaction_code FROM test_cases WHERE test_case_id = $1`,
      [testCaseId]
    );

    if (!existingResult.rows.length) {
      return NextResponse.json({ status: "error", message: "Test case not found." }, { status: 404 });
    }

    const previousTransaction = existingResult.rows[0]?.transaction_code ?? "";

    const updateResult = await pool.query(
      `
        UPDATE test_cases
        SET
          title = $1,
          module = $2,
          transaction_code = $3,
          process_step = $4,
          automation_status = $5,
          script_path = $6
        WHERE test_case_id = $7
        RETURNING
          test_case_id AS id,
          title,
          module,
          COALESCE(transaction_code, '') AS transaction,
          process_step AS "processStep",
          automation_status AS status,
          COALESCE(script_path, '') AS "scriptPath"
      `,
      [
        payload.title,
        payload.module,
        payload.transaction ?? "",
        payload.processStep,
        payload.status,
        payload.scriptPath ?? "",
        testCaseId
      ]
    );

    if (previousTransaction) {
      await pool.query(`DELETE FROM repository_assets WHERE transaction_code = $1`, [previousTransaction]);
    }

    if (payload.transaction) {
      await pool.query(
        `
          INSERT INTO repository_assets (asset_name, module, transaction_code, script_name, description)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (transaction_code)
          DO UPDATE SET
            asset_name = EXCLUDED.asset_name,
            module = EXCLUDED.module,
            script_name = EXCLUDED.script_name,
            description = EXCLUDED.description
        `,
        [
          payload.title,
          payload.module,
          payload.transaction,
          payload.scriptPath ?? "",
          payload.processStep
        ]
      );
    }

    return NextResponse.json({ status: "ok", item: updateResult.rows[0] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown database error";
    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    await ensureSchema();
    const { testCaseId } = await context.params;
    const pool = getPool();

    const existingResult = await pool.query(
      `SELECT transaction_code FROM test_cases WHERE test_case_id = $1`,
      [testCaseId]
    );

    if (!existingResult.rows.length) {
      return NextResponse.json({ status: "error", message: "Test case not found." }, { status: 404 });
    }

    const transaction = existingResult.rows[0]?.transaction_code ?? "";

    await pool.query(`DELETE FROM test_cases WHERE test_case_id = $1`, [testCaseId]);

    if (transaction) {
      await pool.query(`DELETE FROM repository_assets WHERE transaction_code = $1`, [transaction]);
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown database error";
    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}
