import { NextResponse } from "next/server";

import { ensureSchema } from "@/lib/db";
import { getRecentCommands, recordCommand } from "@/lib/ai-skills";
import { runCommand } from "@/lib/ai-command-parser";

export async function POST(request: Request) {
  try {
    await ensureSchema();
    const payload = (await request.json()) as { question?: string };
    const question = (payload.question ?? "").trim();

    if (!question) {
      return NextResponse.json({ status: "error", message: "question is required." }, { status: 400 });
    }

    await recordCommand(question);

    const commands = question
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    let answer: string;

    if (commands.length > 1) {
      const parts: string[] = [];
      for (const command of commands) {
        const result = await runCommand(command);
        parts.push(`\n${"=".repeat(60)}\nQUESTION: ${command}\n${"=".repeat(60)}\n\n${result}`);
      }
      answer = parts.join("\n");
    } else {
      answer = await runCommand(commands[0] ?? question);
    }

    const history = await getRecentCommands();

    return NextResponse.json({ status: "ok", answer, history });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown AI command error";
    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}
