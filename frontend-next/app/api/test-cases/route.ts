import { NextResponse } from "next/server";

import { ensureSchema, getPool } from "@/lib/db";

type TestCasePayload = {
  title: string;
  module: string;
  transaction: string;
  processStep: string;
  status: "Manual" | "Automated";
  scriptPath: string;
};

export async function GET() {
  try {
    await ensureSchema();
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
        ORDER BY id ASC
      `
    );

    return NextResponse.json({
      status: "ok",
      items: result.rows
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown database error";
    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await ensureSchema();
    const payload = (await request.json()) as Partial<TestCasePayload>;

    if (!payload.title || !payload.module || !payload.processStep || !payload.status) {
      return NextResponse.json(
        { status: "error", message: "title, module, processStep, and status are required." },
        { status: 400 }
      );
    }

    const pool = getPool();
    const nextIdResult = await pool.query(`SELECT COUNT(*)::int AS count FROM test_cases`);
    const nextId = (nextIdResult.rows[0]?.count ?? 0) + 1;
    const testCaseId = `TC-${String(nextId).padStart(4, "0")}`;

    const insertResult = await pool.query(
      `
        INSERT INTO test_cases
          (test_case_id, title, module, transaction_code, process_step, automation_status, script_path)
        VALUES
          ($1, $2, $3, $4, $5, $6, $7)
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
        testCaseId,
        payload.title,
        payload.module,
        payload.transaction ?? "",
        payload.processStep,
        payload.status,
        payload.scriptPath ?? ""
      ]
    );

    if (payload.transaction) {
      await pool.query(
        `
          INSERT INTO repository_assets (asset_name, module, transaction_code, script_name, description)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (transaction_code) DO NOTHING
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

    return NextResponse.json(
      {
        status: "ok",
        item: insertResult.rows[0]
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown database error";
    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}
