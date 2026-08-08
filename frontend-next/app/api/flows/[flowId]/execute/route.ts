import { NextResponse } from "next/server";

const backendBaseUrl = process.env.BACKEND_URL ?? "http://host.docker.internal:8000";

type RouteContext = {
  params: Promise<{
    flowId: string;
  }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const { flowId } = await context.params;

  try {
    const response = await fetch(`${backendBaseUrl}/api/flow-library/${flowId}/execute`, {
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
        message: `Could not reach backend flow execution endpoint: ${message}`,
        logs: []
      },
      { status: 502 }
    );
  }
}
