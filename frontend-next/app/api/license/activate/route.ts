import { NextResponse } from "next/server";

import { ensureSchema, getPool } from "@/lib/db";
import { isValidLicenseKey, isValidLicenseKeyFormat } from "@/lib/license";

export async function POST(request: Request) {
  try {
    await ensureSchema();
    const body = (await request.json()) as { licenseKey?: string };
    const licenseKey = (body.licenseKey ?? "").trim().toUpperCase();

    if (!licenseKey) {
      return NextResponse.json(
        { status: "error", message: "License key is required." },
        { status: 400 }
      );
    }

    if (!isValidLicenseKeyFormat(licenseKey)) {
      return NextResponse.json(
        { status: "error", message: "License key must look like XXXXX-XXXXX-XXXXX-XXXXX." },
        { status: 400 }
      );
    }

    if (!isValidLicenseKey(licenseKey)) {
      return NextResponse.json(
        { status: "error", message: "License key is invalid." },
        { status: 400 }
      );
    }

    const pool = getPool();
    await pool.query(
      `UPDATE license_status
       SET activated = TRUE, license_key = $1, activated_at = CURRENT_TIMESTAMP
       WHERE id = 1`,
      [licenseKey]
    );

    return NextResponse.json({ status: "ok", message: "License activated." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown database error";
    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}
