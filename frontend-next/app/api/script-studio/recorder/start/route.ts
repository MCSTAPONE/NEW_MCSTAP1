import { NextResponse } from "next/server";

const backendBaseUrl = process.env.BACKEND_URL ?? "http://host.docker.internal:8000";

export async function POST() {
  try {
    const response = await fetch(`${backendBaseUrl}/script-studio/start-recorder`, {
      method: "GET",
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
        status: "ERROR",
        message: `Could not reach backend recorder endpoint: ${message}`
      },
      { status: 502 }
    );
  }
}
