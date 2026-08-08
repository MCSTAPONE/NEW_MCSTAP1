import { NextResponse } from "next/server";

import { ensureSchema, getPool } from "@/lib/db";

type RouteContext = {
  params: Promise<{
    scriptId: string;
  }>;
};

type StepPayload = {
  action: string;
  parameterName: string;
  parameterValue: string;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    await ensureSchema();
    const { scriptId } = await context.params;
    const payload = (await request.json()) as Partial<StepPayload>;

    if (!payload.action) {
      return NextResponse.json({ status: "error", message: "action is required." }, { status: 400 });
    }

    const pool = getPool();
    const nextSeqResult = await pool.query(
      `SELECT COALESCE(MAX(step_sequence), 0) + 1 AS next_sequence FROM script_steps WHERE script_id = $1`,
      [Number(scriptId)]
    );
    const nextSequence = Number(nextSeqResult.rows[0]?.next_sequence ?? 1);

    const result = await pool.query(
      `
        INSERT INTO script_steps
          (script_id, step_sequence, action_type, parameter_name, parameter_value)
        VALUES
          ($1, $2, $3, $4, $5)
        RETURNING
          step_sequence AS sequence,
          action_type AS action,
          parameter_name AS "parameterName",
          parameter_value AS "parameterValue"
      `,
      [Number(scriptId), nextSequence, payload.action, payload.parameterName ?? "", payload.parameterValue ?? ""]
    );

    return NextResponse.json({ status: "ok", item: result.rows[0] }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown database error";
    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}
