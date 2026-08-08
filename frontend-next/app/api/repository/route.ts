import { NextResponse } from "next/server";

import { repositoryModules } from "@/data/app-data";
import { ensureSchema, getPool } from "@/lib/db";

type RepositoryModuleSummary = {
  module: string;
  assetCount: number;
  transactionCount: number;
  scriptCount: number;
};

export async function GET() {
  try {
    await ensureSchema();
    const pool = getPool();
    const result = await pool.query(
      `
        SELECT
          module,
          COUNT(*)::int AS "assetCount",
          COUNT(DISTINCT transaction_code)::int AS "transactionCount",
          COUNT(*) FILTER (WHERE COALESCE(script_name, '') <> '')::int AS "scriptCount"
        FROM repository_assets
        GROUP BY module
      `
    );

    const summaryByModule = new Map<string, RepositoryModuleSummary>(
      result.rows.map((row) => [
        row.module as string,
        {
          module: row.module as string,
          assetCount: Number(row.assetCount ?? 0),
          transactionCount: Number(row.transactionCount ?? 0),
          scriptCount: Number(row.scriptCount ?? 0)
        }
      ])
    );

    const items = repositoryModules.map((module) => {
      return (
        summaryByModule.get(module) ?? {
          module,
          assetCount: 0,
          transactionCount: 0,
          scriptCount: 0
        }
      );
    });

    return NextResponse.json({ status: "ok", items });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown database error";
    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}
