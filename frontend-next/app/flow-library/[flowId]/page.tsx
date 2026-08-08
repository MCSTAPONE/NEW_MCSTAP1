"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { StatusBadge } from "@/components/status-badge";

type Flow = {
  id: string;
  name: string;
  description: string;
  module: string;
  status: "Draft" | "Ready" | "Active";
};

type FlowStep = {
  id: number;
  flowId: string;
  sequence: number;
  transaction: string;
  description: string;
};

type ExecutionResult = {
  status: string;
  message?: string;
  logs: string[];
};

const toneByStatus = {
  Active: "success",
  Ready: "info",
  Draft: "warning"
} as const;

export default function FlowDetailPage() {
  const params = useParams<{ flowId: string }>();
  const flowId = typeof params.flowId === "string" ? params.flowId : "";
  const [flow, setFlow] = useState<Flow | null>(null);
  const [steps, setSteps] = useState<FlowStep[]>([]);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [form, setForm] = useState({
    sequence: "",
    transaction: "",
    description: ""
  });

  useEffect(() => {
    if (!flowId) {
      return;
    }

    void (async () => {
      try {
        const response = await fetch(`/api/flows/${flowId}`, { cache: "no-store" });
        const data = (await response.json()) as { item?: Flow; steps?: FlowStep[]; message?: string };
        if (!response.ok || !data.item) {
          throw new Error(data.message ?? "Failed to load flow.");
        }
        const loadedFlow: Flow = data.item;
        setFlow(loadedFlow);
        setSteps(data.steps ?? []);
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : "Failed to load flow.");
      }
    })();
  }, [flowId]);

  async function handleAddStep(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSaving(true);

    try {
      const response = await fetch(`/api/flows/${flowId}/steps`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sequence: Number(form.sequence),
          transaction: form.transaction,
          description: form.description
        })
      });

      const data = (await response.json()) as { item?: FlowStep; message?: string };
      if (!response.ok || !data.item) {
        throw new Error(data.message ?? "Failed to add step.");
      }

      const newStep: FlowStep = data.item;
      setSteps((current) => [...current, newStep].sort((left, right) => left.sequence - right.sequence));
      setForm({ sequence: "", transaction: "", description: "" });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to add step.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteStep(stepId: number) {
    if (!window.confirm("Delete this step?")) {
      return;
    }

    try {
      const response = await fetch(`/api/flow-steps/${stepId}`, { method: "DELETE" });
      const data = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(data.message ?? "Failed to delete step.");
      }
      setSteps((current) => current.filter((item) => item.id !== stepId));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Failed to delete step.");
    }
  }

  async function handleExecuteFlow() {
    setError("");
    setIsExecuting(true);
    setExecutionResult(null);

    try {
      const response = await fetch(`/api/flows/${flowId}/execute`, {
        method: "POST"
      });
      const data = (await response.json()) as ExecutionResult;

      if (!response.ok) {
        throw new Error(data.message ?? "Failed to execute flow.");
      }

      setExecutionResult(data);
    } catch (executeError) {
      const message = executeError instanceof Error ? executeError.message : "Failed to execute flow.";
      setError(message);
      setExecutionResult({
        status: "FAILED",
        message,
        logs: []
      });
    } finally {
      setIsExecuting(false);
    }
  }

  if (!flow) {
    return (
      <AppShell title="Flow Details" subtitle="Loading flow...">
        <section className="card panel">
          {error ? <div className="login-error">{error}</div> : <p className="muted">Loading flow...</p>}
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={flow.name}
      subtitle="Flow details and steps now come from the Next.js API layer instead of typed placeholder data."
    >
      <section className="card panel">
        <div className="section-title">
          <div>
            <div className="eyebrow">{flow.id}</div>
            <h2>Flow Details</h2>
            <p>{flow.description}</p>
          </div>
          <StatusBadge tone={toneByStatus[flow.status]}>{flow.status}</StatusBadge>
        </div>
        <div className="toolbar">
          <span className="pill" style={{ background: "rgba(11, 103, 178, 0.08)", color: "#0b67b2" }}>
            Module: {flow.module}
          </span>
          <Link className="button-link" href={`/flow-library/${flow.id}/edit`}>
            Edit Flow
          </Link>
          <button className="button-link" type="button" onClick={handleExecuteFlow} disabled={isExecuting}>
            {isExecuting ? "Executing..." : "Execute Flow"}
          </button>
        </div>
      </section>

      <section className="split-card">
        <section className="card panel">
          <div className="section-title">
            <div>
              <h2>Add Step</h2>
              <p>Add a new business step directly from the migrated flow detail screen.</p>
            </div>
          </div>
          <form className="content-stack" onSubmit={handleAddStep}>
            <input
              className="field"
              placeholder="Sequence Number"
              required
              value={form.sequence}
              onChange={(event) => setForm((current) => ({ ...current, sequence: event.target.value }))}
            />
            <input
              className="field"
              placeholder="Transaction Code"
              required
              value={form.transaction}
              onChange={(event) => setForm((current) => ({ ...current, transaction: event.target.value }))}
            />
            <textarea
              className="textarea"
              placeholder="Description"
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
            />
            <button className="button-link" type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Add Step"}
            </button>
          </form>
        </section>

        <section className="card panel">
          <div className="section-title">
            <div>
              <h2>Business Steps</h2>
              <p>Step records now load from PostgreSQL through the new flow API routes.</p>
            </div>
          </div>

          {error ? <div className="login-error">{error}</div> : null}

          {steps.length ? (
            <div className="content-stack">
              {steps.map((step) => (
                <article key={step.id} className="risk-item">
                  <div>
                    <strong>Step {step.sequence}</strong>
                    <p className="muted">{step.description || "No description"}</p>
                  </div>
                  <div className="content-stack" style={{ gap: 10, justifyItems: "end" }}>
                    <StatusBadge tone="info">{step.transaction}</StatusBadge>
                    <div className="toolbar">
                      <Link className="button-link" href={`/flow-library/steps/${step.id}/edit`}>
                        Edit
                      </Link>
                      <button className="button-link" type="button" onClick={() => handleDeleteStep(step.id)}>
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <h3>No steps defined yet</h3>
              <p>This flow exists, but no steps have been added yet through the migrated flow workflow.</p>
            </div>
          )}
        </section>
      </section>

      <section className="card panel">
        <div className="section-title">
          <div>
            <h2>Execution Result</h2>
            <p>The migrated flow detail screen now proxies flow execution to the Windows backend.</p>
          </div>
          <StatusBadge tone={executionResult?.status === "SUCCESS" ? "success" : executionResult ? "danger" : "info"}>
            {executionResult?.status ?? "Ready"}
          </StatusBadge>
        </div>

        {executionResult ? (
          <div className="content-stack">
            {executionResult.message ? <div className="login-error">{executionResult.message}</div> : null}
            {executionResult.logs.length ? (
              executionResult.logs.map((log) => (
                <pre key={log} className="code-block">
                  {log}
                </pre>
              ))
            ) : (
              <p className="muted">No execution logs returned yet.</p>
            )}
          </div>
        ) : (
          <p className="muted">Use “Execute Flow” to run this flow through the Windows backend and review returned logs here.</p>
        )}
      </section>
    </AppShell>
  );
}
