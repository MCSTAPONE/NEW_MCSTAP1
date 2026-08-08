import { NextResponse } from "next/server";

type AssistantMode = "script" | "flow" | "execution" | "coverage";

type RequestPayload = {
  mode?: AssistantMode;
  module?: string;
  transaction?: string;
  notes?: string;
};

function extractResponseText(data: Record<string, unknown>) {
  if (typeof data.output_text === "string" && data.output_text.trim()) {
    return data.output_text.trim();
  }

  const output = Array.isArray(data.output) ? data.output : [];

  for (const item of output) {
    if (!item || typeof item !== "object") {
      continue;
    }

    const content = Array.isArray((item as { content?: unknown }).content)
      ? ((item as { content: Array<Record<string, unknown>> }).content ?? [])
      : [];

    for (const part of content) {
      if (part.type === "output_text" && typeof part.text === "string" && part.text.trim()) {
        return part.text.trim();
      }

      if (part.type === "refusal" && typeof part.refusal === "string" && part.refusal.trim()) {
        return part.refusal.trim();
      }
    }
  }

  return "";
}

function buildUserPrompt(payload: Required<RequestPayload>) {
  return [
    `Mode: ${payload.mode}`,
    `Module: ${payload.module}`,
    `Transaction: ${payload.transaction || "Not provided"}`,
    `Notes: ${payload.notes || "Not provided"}`,
    "",
    "Return three sections with short headings:",
    "1. Summary",
    "2. Recommended Next Steps",
    "3. Suggested Prompt",
    "",
    "Keep the answer practical for the current MCSTAP app.",
    "Recommended Next Steps should be a flat bullet list with 4 to 6 bullets."
  ].join("\n");
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL ?? "gpt-5.6-terra";

  if (!apiKey) {
    return NextResponse.json(
      {
        status: "error",
        message: "OPENAI_API_KEY is not configured for the frontend container."
      },
      { status: 503 }
    );
  }

  try {
    const payload = (await request.json()) as RequestPayload;
    const mode = payload.mode ?? "script";
    const moduleName = (payload.module ?? "PM").toUpperCase();
    const transaction = (payload.transaction ?? "").trim().toUpperCase();
    const notes = (payload.notes ?? "").trim();

    const systemPrompt =
      "You are an SAP test automation planning assistant inside the MCSTAP application. " +
      "Give concise, implementation-focused guidance that fits the current app structure: Test Cases, Repository, Flow Library, Script Studio, Reports, and backend execution through Windows. " +
      "Do not invent unavailable app features. Prefer practical next actions over theory.";

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        reasoning: {
          effort: "low"
        },
        max_output_tokens: 700,
        input: [
          {
            role: "system",
            content: [
              {
                type: "input_text",
                text: systemPrompt
              }
            ]
          },
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: buildUserPrompt({
                  mode,
                  module: moduleName,
                  transaction,
                  notes
                })
              }
            ]
          }
        ]
      })
    });

    const data = (await response.json()) as Record<string, unknown>;

    if (!response.ok) {
      const apiError =
        typeof data.error === "object" && data.error && "message" in data.error
          ? String((data.error as { message?: string }).message ?? "OpenAI API request failed.")
          : "OpenAI API request failed.";

      return NextResponse.json({ status: "error", message: apiError }, { status: response.status });
    }

    const text = extractResponseText(data);

    if (!text) {
      return NextResponse.json(
        {
          status: "error",
          message: "The OpenAI response did not include readable text output."
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      status: "ok",
      source: "openai",
      model,
      text
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown AI request error";
    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}
