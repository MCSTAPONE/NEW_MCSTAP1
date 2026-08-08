import { NextResponse } from "next/server";

import { ensureSchema, getPool } from "@/lib/db";
import { TRIAL_DAYS, maskLicenseKey } from "@/lib/license";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export async function GET() {
  try {
    await ensureSchema();
    const pool = getPool();
    const result = await pool.query(
      `SELECT install_date, license_key, activated, activated_at FROM license_status WHERE id = 1`
    );
    const row = result.rows[0];

    const installDate: Date = row.install_date;
    const daysElapsed = Math.floor((Date.now() - new Date(installDate).getTime()) / MS_PER_DAY);
    const daysRemaining = Math.max(0, TRIAL_DAYS - daysElapsed);
    const trialExpired = daysElapsed >= TRIAL_DAYS;

    return NextResponse.json({
      status: "ok",
      installDate,
      trialDays: TRIAL_DAYS,
      daysElapsed: Math.min(daysElapsed, TRIAL_DAYS),
      daysRemaining,
      trialExpired,
      activated: row.activated,
      activatedAt: row.activated_at,
      licenseKeyMasked: row.license_key ? maskLicenseKey(row.license_key) : null,
      requiresLicenseKey: trialExpired && !row.activated
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown database error";
    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}
