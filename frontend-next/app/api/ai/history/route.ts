import { NextResponse } from "next/server";

import { ensureSchema } from "@/lib/db";
import { getRecentCommands } from "@/lib/ai-skills";

export async function GET() {
  try {
    await ensureSchema();
    const history = await getRecentCommands();
    return NextResponse.json({ status: "ok", history });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown database error";
    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}
