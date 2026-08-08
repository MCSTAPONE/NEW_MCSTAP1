"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/app-shell";

type Flow = {
  id: string;
  name: string;
  description: string;
  module: string;
  status: "Draft" | "Ready" | "Active";
};

const modules = ["PM", "MM", "CO", "FI", "SD", "PP", "QM", "WM", "TR", "LO", "PLM", "SCM", "PROC", "E2E"];

export default function EditFlowPage() {
  const params = useParams<{ flowId: string }>();
  const flowId = typeof params.flowId === "string" ? params.flowId : "";
  const [flow, setFlow] = useState<Flow | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [module, setModule] = useState("PM");
  const [status, setStatus] = useState<Flow["status"]>("Draft");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!flowId) {
      return;
    }

    void (async () => {
      try {
        const response = await fetch(`/api/flows/${flowId}`, { cache: "no-store" });
        const data = (await response.json()) as { item?: Flow; message?: string };
        if (!response.ok || !data.item) {
          throw new Error(data.message ?? "Failed to load flow.");
        }
        const loadedFlow: Flow = data.item;
        setFlow(loadedFlow);
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : "Failed to load flow.");
      }
    })();
  }, [flowId]);

  useEffect(() => {
    if (!flow) {
      return;
    }

    setName(flow.name);
    setDescription(flow.description);
    setModule(flow.module);
    setStatus(flow.status);
    setSaved(false);
  }, [flow]);

  async function handleSave() {
    if (!flow) {
      return;
    }

    setError("");
    setIsSaving(true);

    try {
      const response = await fetch(`/api/flows/${flow.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, module, status })
      });
      const data = (await response.json()) as { item?: Flow; message?: string };
      if (!response.ok || !data.item) {
        throw new Error(data.message ?? "Failed to save flow.");
      }
      const updatedFlow: Flow = data.item;
      setFlow(updatedFlow);
      setSaved(true);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save flow.");
    } finally {
      setIsSaving(false);
    }
  }

  if (!flow) {
    return (
      <AppShell title="Edit Flow" subtitle="Loading flow...">
        <section className="card panel">
          {error ? <div className="login-error">{error}</div> : <p className="muted">Loading flow...</p>}
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={`Edit ${flow.id}`}
      subtitle="The flow edit form now saves through the Next.js API layer."
    >
      <section className="card panel">
        <div className="section-title">
          <div>
            <div className="eyebrow">{flow.id}</div>
            <h2>Edit Flow</h2>
            <p>Update the flow metadata without returning to the legacy FastAPI template flow.</p>
          </div>
        </div>
        <div className="content-stack">
          {error ? <div className="login-error">{error}</div> : null}
          <input className="field" value={name} onChange={(event) => setName(event.target.value)} placeholder="Flow Name" />
          <textarea className="textarea" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Description" />
          <div className="grid-two">
            <select className="select" value={module} onChange={(event) => setModule(event.target.value)}>
              {modules.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <select className="select" value={status} onChange={(event) => setStatus(event.target.value as Flow["status"])}>
              <option value="Draft">Draft</option>
              <option value="Ready">Ready</option>
              <option value="Active">Active</option>
            </select>
          </div>
          <div className="toolbar">
            <button className="button-link" type="button" onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
            {saved ? <span className="pill">Saved to database</span> : null}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
