import { NextResponse } from "next/server";

import { ensureSchema, getPool } from "@/lib/db";

type ScriptPayload = {
  name: string;
  module: string;
  transaction: string;
  description: string;
  status: "Draft" | "Ready" | "Active";
};

export async function GET() {
  try {
    await ensureSchema();
    const pool = getPool();
    const result = await pool.query(
      `
        SELECT
          script_id::text AS id,
          script_name AS name,
          module,
          COALESCE(transaction_code, '') AS transaction,
          COALESCE(description, '') AS description,
          status
        FROM script_master
        ORDER BY script_id ASC
      `
    );

    return NextResponse.json({ status: "ok", items: result.rows });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown database error";
    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await ensureSchema();
    const payload = (await request.json()) as Partial<ScriptPayload>;

    if (!payload.name || !payload.module) {
      return NextResponse.json({ status: "error", message: "name and module are required." }, { status: 400 });
    }

    const pool = getPool();
    const result = await pool.query(
      `
        INSERT INTO script_master
          (script_name, module, transaction_code, description, status, created_by)
        VALUES
          ($1, $2, $3, $4, $5, $6)
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
        payload.status ?? "Draft",
        "Next.js"
      ]
    );

    const scriptId = Number(result.rows[0]?.id);
    if (scriptId) {
      await pool.query(
        `
          INSERT INTO script_steps
            (script_id, step_sequence, action_type, parameter_name, parameter_value)
          VALUES
            ($1, 1, 'LOGIN', '', ''),
            ($1, 2, 'START_TRANSACTION', 'TCODE', $2),
            ($1, 3, 'LOGOUT', '', '')
          ON CONFLICT (script_id, step_sequence) DO NOTHING
        `,
        [scriptId, payload.transaction ?? ""]
      );
    }

    return NextResponse.json({ status: "ok", item: result.rows[0] }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown database error";
    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}
