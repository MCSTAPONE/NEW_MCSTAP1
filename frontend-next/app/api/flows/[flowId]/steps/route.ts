import { NextResponse } from "next/server";

import { ensureSchema, getPool } from "@/lib/db";

type RouteContext = {
  params: Promise<{
    flowId: string;
  }>;
};

type StepPayload = {
  sequence: number;
  transaction: string;
  description: string;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    await ensureSchema();
    const { flowId } = await context.params;
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
        INSERT INTO flow_steps (flow_id, sequence_no, transaction_code, description)
        VALUES ($1, $2, $3, $4)
        RETURNING
          step_id AS id,
          flow_id AS "flowId",
          sequence_no AS sequence,
          transaction_code AS transaction,
          COALESCE(description, '') AS description
      `,
      [flowId, payload.sequence, payload.transaction, payload.description ?? ""]
    );

    return NextResponse.json({ status: "ok", item: result.rows[0] }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown database error";
    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}
