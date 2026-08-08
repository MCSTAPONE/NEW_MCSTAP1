import { NextResponse } from "next/server";

const backendBaseUrl = process.env.BACKEND_URL ?? "http://host.docker.internal:8000";

type RouteContext = {
  params: Promise<{
    scriptId: string;
  }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const { scriptId } = await context.params;

  try {
    const response = await fetch(`${backendBaseUrl}/api/script-studio/${scriptId}/run`, {
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
        message: `Could not reach backend script execution endpoint: ${message}`,
        logs: []
      },
      { status: 502 }
    );
  }
}
