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

export async function POST(request: Request, context: RouteContext) {
  try {
    await ensureSchema();
    const { module } = await context.params;
    const normalizedModule = module.toUpperCase();

    if (!repositoryModules.includes(normalizedModule)) {
      return NextResponse.json({ status: "error", message: "Module not found." }, { status: 404 });
    }

    const body = (await request.json()) as {
      assetName?: string;
      transactionCode?: string;
      scriptName?: string;
      description?: string;
    };

    if (!body.assetName || !body.transactionCode) {
      return NextResponse.json(
        { status: "error", message: "Asset name and transaction code are required." },
        { status: 400 }
      );
    }

    const pool = getPool();
    const result = await pool.query(
      `
        INSERT INTO repository_assets (asset_name, module, transaction_code, script_name, description, status)
        VALUES ($1, $2, $3, $4, $5, 'Draft')
        RETURNING
          asset_id::text AS id,
          asset_name AS name,
          module,
          COALESCE(transaction_code, '') AS transaction,
          COALESCE(script_name, '') AS "scriptName",
          COALESCE(description, '') AS description,
          status
      `,
      [body.assetName, normalizedModule, body.transactionCode, body.scriptName ?? "", body.description ?? ""]
    );

    return NextResponse.json({ status: "ok", item: result.rows[0] }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown database error";
    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    await ensureSchema();
    const { module } = await context.params;
    const normalizedModule = module.toUpperCase();

    const body = (await request.json()) as { assetIds?: string[] };
    const assetIds = (body.assetIds ?? []).filter(Boolean);

    if (!assetIds.length) {
      return NextResponse.json({ status: "error", message: "No assets selected." }, { status: 400 });
    }

    const pool = getPool();
    await pool.query(
      `DELETE FROM repository_assets WHERE module = $1 AND asset_id::text = ANY($2::text[])`,
      [normalizedModule, assetIds]
    );

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown database error";
    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}
