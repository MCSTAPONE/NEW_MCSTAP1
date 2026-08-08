import { NextResponse } from "next/server";

import { ensureSchema, getPool } from "@/lib/db";

type RouteContext = {
  params: Promise<{
    stepId: string;
  }>;
};

type StepPayload = {
  sequence: number;
  transaction: string;
  description: string;
};

export async function PUT(request: Request, context: RouteContext) {
  try {
    await ensureSchema();
    const { stepId } = await context.params;
    const payload = (await request.json()) as Partial<StepPayload>;

    if (!payload.sequence || !payload.transaction) {
      return NextResponse.json(
        { status: "error", message: "sequence and transaction are required." },
        { status: 400 }
      );
    }

    const pool = getPool();
    const result = await pool.query(
      `
        UPDATE flow_steps
        SET
          sequence_no = $1,
          transaction_code = $2,
          description = $3
        WHERE step_id = $4
        RETURNING
          step_id AS id,
          flow_id AS "flowId",
          sequence_no AS sequence,
          transaction_code AS transaction,
          COALESCE(description, '') AS description
      `,
      [payload.sequence, payload.transaction, payload.description ?? "", Number(stepId)]
    );

    if (!result.rows.length) {
      return NextResponse.json({ status: "error", message: "Flow step not found." }, { status: 404 });
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
    const { stepId } = await context.params;
    const pool = getPool();
    const result = await pool.query(`DELETE FROM flow_steps WHERE step_id = $1 RETURNING step_id`, [Number(stepId)]);

    if (!result.rows.length) {
      return NextResponse.json({ status: "error", message: "Flow step not found." }, { status: 404 });
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown database error";
    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}
