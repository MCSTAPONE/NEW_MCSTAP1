import { NextResponse } from "next/server";

const backendBaseUrl = process.env.BACKEND_URL ?? "http://host.docker.internal:8000";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const response = await fetch(`${backendBaseUrl}/script-studio/analyze`, {
      method: "POST",
      body: formData,
      cache: "no-store"
    });

    const data = (await response.json()) as Record<string, unknown>;

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown backend error";

    return NextResponse.json(
      {
        success: false,
        message: `Could not reach backend analyze endpoint: ${message}`
      },
      { status: 502 }
    );
  }
}
