import { NextResponse } from "next/server";

import { ensureSchema, getPool } from "@/lib/db";

type FlowPayload = {
  name: string;
  description: string;
  module: string;
  status: "Draft" | "Ready" | "Active";
};

export async function GET() {
  try {
    await ensureSchema();
    const pool = getPool();
    const result = await pool.query(
      `
        SELECT
          flow_id AS id,
          flow_name AS name,
          COALESCE(description, '') AS description,
          module,
          status
        FROM flow_master
        ORDER BY created_at ASC, id ASC
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
    const payload = (await request.json()) as Partial<FlowPayload>;

    if (!payload.name || !payload.module) {
      return NextResponse.json(
        { status: "error", message: "name and module are required." },
        { status: 400 }
      );
    }

    const pool = getPool();
    const nextIdResult = await pool.query(`SELECT COUNT(*)::int AS count FROM flow_master`);
    const nextId = (nextIdResult.rows[0]?.count ?? 0) + 1;
    const flowId = `FL-${String(nextId).padStart(3, "0")}`;

    const result = await pool.query(
      `
        INSERT INTO flow_master (flow_id, flow_name, description, module, status)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING
          flow_id AS id,
          flow_name AS name,
          COALESCE(description, '') AS description,
          module,
          status
      `,
      [flowId, payload.name, payload.description ?? "", payload.module, payload.status ?? "Draft"]
    );

    return NextResponse.json({ status: "ok", item: result.rows[0] }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown database error";
    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}
