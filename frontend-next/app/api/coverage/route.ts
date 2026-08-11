import { NextResponse } from "next/server";

import { repositoryModules } from "@/data/app-data";
import { ensureSchema, getPool } from "@/lib/db";

type ModuleCoverage = {
  module: string;
  assetCount: number;
  automatedCount: number;
  coveragePercent: number;
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
          COUNT(*) FILTER (WHERE COALESCE(script_name, '') <> '')::int AS "automatedCount"
        FROM repository_assets
        GROUP BY module
      `
    );

    const byModule = new Map<string, { assetCount: number; automatedCount: number }>(
      result.rows.map((row) => [
        row.module as string,
        { assetCount: Number(row.assetCount ?? 0), automatedCount: Number(row.automatedCount ?? 0) }
      ])
    );

    const modules: ModuleCoverage[] = repositoryModules.map((module) => {
      const row = byModule.get(module) ?? { assetCount: 0, automatedCount: 0 };
      return {
        module,
        assetCount: row.assetCount,
        automatedCount: row.automatedCount,
        coveragePercent: row.assetCount ? Math.round((row.automatedCount / row.assetCount) * 100) : 0
      };
    });

    const totalAssets = modules.reduce((sum, item) => sum + item.assetCount, 0);
    const totalAutomated = modules.reduce((sum, item) => sum + item.automatedCount, 0);
    const overallCoveragePercent = totalAssets ? Math.round((totalAutomated / totalAssets) * 100) : 0;

    return NextResponse.json({
      status: "ok",
      totalAssets,
      totalAutomated,
      overallCoveragePercent,
      modules
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown database error";
    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}
