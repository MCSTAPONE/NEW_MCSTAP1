"use client";

import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { StatusBadge } from "@/components/status-badge";

const flowSteps = [
  "IW31 Create Order",
  "IW32 Change Order",
  "IW33 Display Order",
  "IW39 Display Orders",
  "IW40 Processing",
  "IW41 Confirmation",
  "IW23 Notification",
  "ME51N Purchase Requisition"
];

type RunResult = {
  status: string;
  return_code?: number;
  output?: string;
  errors?: string;
  error?: string;
};

export default function PmExecutionPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);

  async function runFlow() {
    setIsRunning(true);
    setResult(null);

    try {
      const response = await fetch("/api/pm/run", {
        method: "POST"
      });

      const data = (await response.json()) as RunResult;
      setResult(data);
    } catch (error) {
      setResult({
        status: "FAILED",
        error: error instanceof Error ? error.message : "Unknown execution error"
      });
    } finally {
      setIsRunning(false);
    }
  }

  const tone =
    result?.status === "SUCCESS" ? "success" : result ? "danger" : "info";

  return (
    <AppShell
      title="PM Execution Center"
      subtitle="Launch the PM lifecycle from the Next.js workspace while keeping the existing backend execution endpoint in place."
    >
      <section className="card panel">
        <div className="section-title">
          <div>
            <h2>Business Process Execution</h2>
            <p>Run the end-to-end PM lifecycle and review the current backend response without leaving the migrated UI.</p>
          </div>
          <button className="button-link" type="button" onClick={runFlow} disabled={isRunning}>
            {isRunning ? "Running PM Flow..." : "Run PM Flow"}
          </button>
        </div>

        <div className="content-stack">
          <article className="card panel">
            <div className="section-title">
              <div>
                <h3>Lifecycle Scope</h3>
                <p>The sequence below matches the legacy PM execution template.</p>
              </div>
            </div>
            <ul className="bullet-list">
              {flowSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ul>
          </article>

          <article className="card panel">
            <div className="section-title">
              <div>
                <h3>Execution Result</h3>
                <p>The current implementation proxies the existing FastAPI endpoint at `/pm/run`.</p>
              </div>
              <StatusBadge tone={tone}>
                {result?.status ?? "Ready"}
              </StatusBadge>
            </div>

            {result ? (
              <div className="content-stack">
                {"return_code" in result && result.return_code !== undefined ? (
                  <p className="muted">Return code: {result.return_code}</p>
                ) : null}
                {result.error ? (
                  <pre className="code-block">{result.error}</pre>
                ) : null}
                {result.output ? (
                  <pre className="code-block">{result.output}</pre>
                ) : null}
                {result.errors ? (
                  <pre className="code-block">{result.errors}</pre>
                ) : null}
                {!result.error && !result.output && !result.errors ? (
                  <p className="muted">The backend returned a status without additional console output.</p>
                ) : null}
              </div>
            ) : (
              <p className="muted">No run started yet. Use “Run PM Flow” to trigger the backend execution.</p>
            )}
          </article>
        </div>
      </section>
    </AppShell>
  );
}
