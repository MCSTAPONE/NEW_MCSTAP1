import { NextResponse } from "next/server";

import { ensureSchema, getPool } from "@/lib/db";

type RouteContext = {
  params: Promise<{
    flowId: string;
  }>;
};

type FlowPayload = {
  name: string;
  description: string;
  module: string;
  status: "Draft" | "Ready" | "Active";
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    await ensureSchema();
    const { flowId } = await context.params;
    const pool = getPool();

    const flowResult = await pool.query(
      `
        SELECT
          flow_id AS id,
          flow_name AS name,
          COALESCE(description, '') AS description,
          module,
          status
        FROM flow_master
        WHERE flow_id = $1
      `,
      [flowId]
    );

    if (!flowResult.rows.length) {
      return NextResponse.json({ status: "error", message: "Flow not found." }, { status: 404 });
    }

    const stepsResult = await pool.query(
      `
        SELECT
          step_id AS id,
          flow_id AS "flowId",
          sequence_no AS sequence,
          transaction_code AS transaction,
          COALESCE(description, '') AS description
        FROM flow_steps
        WHERE flow_id = $1
        ORDER BY sequence_no ASC, step_id ASC
      `,
      [flowId]
    );

    return NextResponse.json({
      status: "ok",
      item: flowResult.rows[0],
      steps: stepsResult.rows
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown database error";
    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    await ensureSchema();
    const { flowId } = await context.params;
    const payload = (await request.json()) as Partial<FlowPayload>;

    if (!payload.name || !payload.module || !payload.status) {
      return NextResponse.json(
        { status: "error", message: "name, module, and status are required." },
        { status: 400 }
      );
    }

    const pool = getPool();
    const result = await pool.query(
      `
        UPDATE flow_master
        SET
          flow_name = $1,
          description = $2,
          module = $3,
          status = $4
        WHERE flow_id = $5
        RETURNING
          flow_id AS id,
          flow_name AS name,
          COALESCE(description, '') AS description,
          module,
          status
      `,
      [payload.name, payload.description ?? "", payload.module, payload.status, flowId]
    );

    if (!result.rows.length) {
      return NextResponse.json({ status: "error", message: "Flow not found." }, { status: 404 });
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
    const { flowId } = await context.params;
    const pool = getPool();
    const result = await pool.query(`DELETE FROM flow_master WHERE flow_id = $1 RETURNING flow_id`, [flowId]);

    if (!result.rows.length) {
      return NextResponse.json({ status: "error", message: "Flow not found." }, { status: 404 });
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown database error";
    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}
