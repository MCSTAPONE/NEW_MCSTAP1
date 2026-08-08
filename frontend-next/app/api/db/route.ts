import { NextResponse } from "next/server";

import { ensureSchema, getPool } from "@/lib/db";

export async function GET() {
  try {
    await ensureSchema();
    const pool = getPool();
    const result = await pool.query("SELECT NOW() AS server_time, current_database() AS database_name");

    return NextResponse.json({
      status: "ok",
      database: result.rows[0]?.database_name ?? null,
      serverTime: result.rows[0]?.server_time ?? null
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown database error";

    return NextResponse.json(
      {
        status: "error",
        message
      },
      { status: 500 }
    );
  }
}
