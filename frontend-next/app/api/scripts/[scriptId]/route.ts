import { NextResponse } from "next/server";

import { ensureSchema, getPool } from "@/lib/db";

type RouteContext = {
  params: Promise<{
    scriptId: string;
  }>;
};

type ScriptPayload = {
  name: string;
  module: string;
  transaction: string;
  description: string;
  status: "Draft" | "Ready" | "Active";
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    await ensureSchema();
    const { scriptId } = await context.params;
    const pool = getPool();

    const scriptResult = await pool.query(
      `
        SELECT
          script_id::text AS id,
          script_name AS name,
          module,
          COALESCE(transaction_code, '') AS transaction,
          COALESCE(description, '') AS description,
          status
        FROM script_master
        WHERE script_id = $1
      `,
      [Number(scriptId)]
    );

    if (!scriptResult.rows.length) {
      return NextResponse.json({ status: "error", message: "Script not found." }, { status: 404 });
    }

    const stepResult = await pool.query(
      `
        SELECT
          step_sequence AS sequence,
          action_type AS action,
          parameter_name AS "parameterName",
          parameter_value AS "parameterValue"
        FROM script_steps
        WHERE script_id = $1
        ORDER BY step_sequence ASC
      `,
      [Number(scriptId)]
    );

    return NextResponse.json({
      status: "ok",
      item: scriptResult.rows[0],
      steps: stepResult.rows
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown database error";
    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    await ensureSchema();
    const { scriptId } = await context.params;
    const payload = (await request.json()) as Partial<ScriptPayload>;

    if (!payload.name || !payload.module || !payload.status) {
      return NextResponse.json({ status: "error", message: "name, module, and status are required." }, { status: 400 });
    }

    const pool = getPool();
    const result = await pool.query(
      `
        UPDATE script_master
        SET
          script_name = $1,
          module = $2,
          transaction_code = $3,
          description = $4,
          status = $5
        WHERE script_id = $6
        RETURNING
          script_id::text AS id,
          script_name AS name,
          module,
          COALESCE(transaction_code, '') AS transaction,
          COALESCE(description, '') AS description,
          status
      `,
      [
        payload.name,
        payload.module,
        payload.transaction ?? "",
        payload.description ?? "",
        payload.status,
        Number(scriptId)
      ]
    );

    if (!result.rows.length) {
      return NextResponse.json({ status: "error", message: "Script not found." }, { status: 404 });
    }

    return NextResponse.json({ status: "ok", item: result.rows[0] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown database error";
    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    await ensureSchema();
    const { scriptId } = await context.params;
    const pool = getPool();
    const result = await pool.query(`DELETE FROM script_master WHERE script_id = $1 RETURNING script_id`, [Number(scriptId)]);

    if (!result.rows.length) {
      return NextResponse.json({ status: "error", message: "Script not found." }, { status: 404 });
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown database error";
    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}
