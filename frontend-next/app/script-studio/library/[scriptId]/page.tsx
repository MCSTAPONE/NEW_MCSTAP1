"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { StatusBadge } from "@/components/status-badge";

type Script = {
  id: string;
  name: string;
  module: string;
  transaction: string;
  description: string;
  status: "Draft" | "Ready" | "Active";
};

type ScriptStep = {
  sequence: number;
  action: string;
  parameterName: string;
  parameterValue: string;
};

type RunResult = {
  status: string;
  message?: string;
  logs: string[];
};

const toneByStatus = {
  Active: "success",
  Ready: "info",
  Draft: "warning"
} as const;

const actions = ["LOGIN", "START_TRANSACTION", "SET_TEXT", "CLICK", "SCREENSHOT", "VERIFY_TEXT", "LOGOUT", "EXECUTE_FLOW"];

export default function ScriptDetailPage() {
  const params = useParams<{ scriptId: string }>();
  const scriptId = typeof params.scriptId === "string" ? params.scriptId : "";
  const [script, setScript] = useState<Script | null>(null);
  const [steps, setSteps] = useState<ScriptStep[]>([]);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [form, setForm] = useState({
    action: "LOGIN",
    parameterName: "",
    parameterValue: ""
  });

  useEffect(() => {
    if (!scriptId) {
      return;
    }

    void (async () => {
      try {
        const response = await fetch(`/api/scripts/${scriptId}`, { cache: "no-store" });
        const data = (await response.json()) as { item?: Script; steps?: ScriptStep[]; message?: string };

        if (!response.ok || !data.item) {
          throw new Error(data.message ?? "Failed to load script.");
        }

        const loadedScript: Script = data.item;
        setScript(loadedScript);
        setSteps(data.steps ?? []);
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : "Failed to load script.");
      }
    })();
  }, [scriptId]);

  async function handleAddStep(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSaving(true);

    try {
      const response = await fetch(`/api/scripts/${scriptId}/steps`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = (await response.json()) as { item?: ScriptStep; message?: string };

      if (!response.ok || !data.item) {
        throw new Error(data.message ?? "Failed to add step.");
      }

      const newStep: ScriptStep = data.item;
      setSteps((current) => [...current, newStep].sort((left, right) => left.sequence - right.sequence));
      setForm({
        action: "LOGIN",
        parameterName: "",
        parameterValue: ""
      });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to add step.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteStep(sequence: number) {
    if (!window.confirm("Delete this step?")) {
      return;
    }

    try {
      const response = await fetch(`/api/scripts/${scriptId}/steps/${sequence}`, {
        method: "DELETE"
      });
      const data = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(data.message ?? "Failed to delete step.");
      }

      setSteps((current) => current.filter((item) => item.sequence !== sequence));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Failed to delete step.");
    }
  }

  async function handleRunScript() {
    setError("");
    setIsRunning(true);
    setRunResult(null);

    try {
      const response = await fetch(`/api/scripts/${scriptId}/run`, {
        method: "POST"
      });
      const data = (await response.json()) as RunResult;

      if (!response.ok) {
        throw new Error(data.message ?? "Failed to run script.");
      }

      setRunResult(data);
    } catch (runError) {
      const message = runError instanceof Error ? runError.message : "Failed to run script.";
      setError(message);
      setRunResult({
        status: "FAILED",
        message,
        logs: []
      });
    } finally {
      setIsRunning(false);
    }
  }

  if (!script) {
    return (
      <AppShell title="Script Detail" subtitle="Loading script...">
        <section className="card panel">
          {error ? <div className="login-error">{error}</div> : <p className="muted">Loading script...</p>}
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={script.name}
      subtitle="Script authoring and execution now run through the migrated Next.js flow instead of the legacy template screens."
    >
      <section className="card panel">
        <div className="section-title">
          <div>
            <div className="eyebrow">{script.id}</div>
            <h2>Script Overview</h2>
            <p>Module {script.module} · Transaction {script.transaction || "Not set"}</p>
          </div>
          <StatusBadge tone={toneByStatus[script.status]}>{script.status}</StatusBadge>
        </div>
        <div className="toolbar">
          <button className="button-link" type="button" onClick={handleRunScript} disabled={isRunning}>
            {isRunning ? "Running..." : "Run Script"}
          </button>
        </div>
      </section>

      <section className="split-card">
        <section className="card panel">
          <div className="section-title">
            <div>
              <h2>Add Step</h2>
              <p>Add new automation steps without leaving the migrated script workflow.</p>
            </div>
          </div>
          <form className="content-stack" onSubmit={handleAddStep}>
            <select
              className="select"
              value={form.action}
              onChange={(event) => setForm((current) => ({ ...current, action: event.target.value }))}
            >
              {actions.map((action) => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </select>
            <input
              className="field"
              placeholder="Parameter Name"
              value={form.parameterName}
              onChange={(event) => setForm((current) => ({ ...current, parameterName: event.target.value }))}
            />
            <input
              className="field"
              placeholder="Parameter Value"
              value={form.parameterValue}
              onChange={(event) => setForm((current) => ({ ...current, parameterValue: event.target.value }))}
            />
            <button className="button-link" type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Add Step"}
            </button>
          </form>
        </section>

        <section className="card panel">
          <div className="section-title">
            <div>
              <h2>Execution Result</h2>
              <p>The Next.js script detail screen now proxies execution to the Windows backend.</p>
            </div>
            <StatusBadge tone={runResult?.status === "SUCCESS" ? "success" : runResult ? "danger" : "info"}>
              {runResult?.status ?? "Ready"}
            </StatusBadge>
          </div>
          {runResult ? (
            <div className="content-stack">
              {runResult.message ? <div className="login-error">{runResult.message}</div> : null}
              {runResult.logs.length ? (
                runResult.logs.map((log) => (
                  <pre key={log} className="code-block">
                    {log}
                  </pre>
                ))
              ) : (
                <p className="muted">No execution logs returned yet.</p>
              )}
            </div>
          ) : (
            <p className="muted">Use “Run Script” to execute this automation and review logs here.</p>
          )}
        </section>
      </section>

      <section className="card panel">
        <div className="section-title">
          <div>
            <h2>Existing Steps</h2>
            <p>Step data now comes from PostgreSQL through the Next.js API layer.</p>
          </div>
        </div>

        {error ? <div className="login-error">{error}</div> : null}

        {steps.length ? (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Seq</th>
                  <th>Action</th>
                  <th>Parameter</th>
                  <th>Value</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {steps.map((step) => (
                  <tr key={`${step.sequence}-${step.action}`}>
                    <td>{step.sequence}</td>
                    <td>
                      <StatusBadge tone="info">{step.action}</StatusBadge>
                    </td>
                    <td>{step.parameterName}</td>
                    <td>
                      <code className="inline-code">{step.parameterValue}</code>
                    </td>
                    <td>
                      <div className="toolbar">
                        <Link className="button-link" href={`/script-studio/library/${script.id}/steps/${step.sequence}/edit`}>
                          Edit
                        </Link>
                        <button className="button-link" type="button" onClick={() => handleDeleteStep(step.sequence)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <h3>No steps defined yet</h3>
            <p>This script exists, but no steps have been added yet through the migrated Next.js workflow.</p>
          </div>
        )}
      </section>
    </AppShell>
  );
}
