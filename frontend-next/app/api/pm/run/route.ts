import { NextResponse } from "next/server";

const backendBaseUrl = process.env.BACKEND_URL ?? "http://host.docker.internal:8000";

export async function POST() {
  try {
    const response = await fetch(`${backendBaseUrl}/pm/run`, {
      method: "POST",
      cache: "no-store"
    });

    const data = (await response.json()) as Record<string, unknown>;

    return NextResponse.json(data, {
      status: response.status
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown backend error";

    return NextResponse.json(
      {
        status: "FAILED",
        error: `Could not reach backend PM execution endpoint: ${message}`
      },
      { status: 502 }
    );
  }
}
