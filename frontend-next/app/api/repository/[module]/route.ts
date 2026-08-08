import { NextResponse } from "next/server";

import { repositoryModules } from "@/data/app-data";
import { ensureSchema, getPool } from "@/lib/db";

type RouteContext = {
  params: Promise<{
    module: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    await ensureSchema();
    const { module } = await context.params;
    const normalizedModule = module.toUpperCase();

    if (!repositoryModules.includes(normalizedModule)) {
      return NextResponse.json({ status: "error", message: "Module not found." }, { status: 404 });
    }

    const pool = getPool();
    const result = await pool.query(
      `
        SELECT
          asset_id::text AS id,
          asset_name AS name,
          module,
          COALESCE(transaction_code, '') AS transaction,
          COALESCE(script_name, '') AS "scriptName",
          COALESCE(description, '') AS description,
          status
        FROM repository_assets
        WHERE module = $1
        ORDER BY asset_name ASC, asset_id ASC
      `,
      [normalizedModule]
    );

    return NextResponse.json({
      status: "ok",
      module: normalizedModule,
      items: result.rows
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown database error";
    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}
