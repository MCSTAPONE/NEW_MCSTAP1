import { NextResponse } from "next/server";

import { ensureSchema, getPool } from "@/lib/db";

type RouteContext = {
  params: Promise<{
    scriptId: string;
    sequence: string;
  }>;
};

type StepPayload = {
  action: string;
  parameterName: string;
  parameterValue: string;
};

export async function PUT(request: Request, context: RouteContext) {
  try {
    await ensureSchema();
    const { scriptId, sequence } = await context.params;
    const payload = (await request.json()) as Partial<StepPayload>;

    if (!payload.action) {
      return NextResponse.json({ status: "error", message: "action is required." }, { status: 400 });
    }

    const pool = getPool();
    const result = await pool.query(
      `
        UPDATE script_steps
        SET
          action_type = $1,
          parameter_name = $2,
          parameter_value = $3
        WHERE script_id = $4
        AND step_sequence = $5
        RETURNING
          step_sequence AS sequence,
          action_type AS action,
          parameter_name AS "parameterName",
          parameter_value AS "parameterValue"
      `,
      [payload.action, payload.parameterName ?? "", payload.parameterValue ?? "", Number(scriptId), Number(sequence)]
    );

    if (!result.rows.length) {
      return NextResponse.json({ status: "error", message: "Script step not found." }, { status: 404 });
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
    const { scriptId, sequence } = await context.params;
    const pool = getPool();
    const result = await pool.query(
      `DELETE FROM script_steps WHERE script_id = $1 AND step_sequence = $2 RETURNING step_sequence`,
      [Number(scriptId), Number(sequence)]
    );

    if (!result.rows.length) {
      return NextResponse.json({ status: "error", message: "Script step not found." }, { status: 404 });
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown database error";
    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}
