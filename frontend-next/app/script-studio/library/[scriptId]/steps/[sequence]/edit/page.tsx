"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/app-shell";

type Script = {
  id: string;
  name: string;
};

type ScriptStep = {
  sequence: number;
  action: string;
  parameterName: string;
  parameterValue: string;
};

const actions = ["LOGIN", "START_TRANSACTION", "SET_TEXT", "CLICK", "SCREENSHOT", "VERIFY_TEXT", "LOGOUT", "EXECUTE_FLOW"];

export default function EditScriptStepPage() {
  const params = useParams<{ scriptId: string; sequence: string }>();
  const scriptId = typeof params.scriptId === "string" ? params.scriptId : "";
  const sequence = typeof params.sequence === "string" ? Number(params.sequence) : 0;
  const [script, setScript] = useState<Script | null>(null);
  const [step, setStep] = useState<ScriptStep | null>(null);
  const [action, setAction] = useState("LOGIN");
  const [parameterName, setParameterName] = useState("");
  const [parameterValue, setParameterValue] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!scriptId || !sequence) {
      return;
    }

    void (async () => {
      try {
        const response = await fetch(`/api/scripts/${scriptId}`, { cache: "no-store" });
        const data = (await response.json()) as { item?: Script; steps?: ScriptStep[]; message?: string };
        if (!response.ok || !data.item) {
          throw new Error(data.message ?? "Failed to load script.");
        }

        const matchedStep = data.steps?.find((candidate) => candidate.sequence === sequence);
        if (!matchedStep) {
          throw new Error("Script step not found.");
        }

        const loadedScript: Script = data.item;
        setScript(loadedScript);
        setStep(matchedStep);
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : "Failed to load script step.");
      }
    })();
  }, [scriptId, sequence]);

  useEffect(() => {
    if (!step) {
      return;
    }

    setAction(step.action);
    setParameterName(step.parameterName);
    setParameterValue(step.parameterValue);
    setSaved(false);
  }, [step]);

  async function handleSave() {
    setError("");
    setIsSaving(true);

    try {
      const response = await fetch(`/api/scripts/${scriptId}/steps/${sequence}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          parameterName,
          parameterValue
        })
      });
      const data = (await response.json()) as { item?: ScriptStep; message?: string };
      if (!response.ok || !data.item) {
        throw new Error(data.message ?? "Failed to save script step.");
      }
      const updatedStep: ScriptStep = data.item;
      setStep(updatedStep);
      setSaved(true);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save script step.");
    } finally {
      setIsSaving(false);
    }
  }

  if (!script || !step) {
    return (
      <AppShell title="Edit Script Step" subtitle="Loading step...">
        <section className="card panel">
          {error ? <div className="login-error">{error}</div> : <p className="muted">Loading script step...</p>}
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={`Edit Step ${step.sequence}`}
      subtitle="Script step editing is now available in the migrated Next.js workflow."
    >
      <section className="card panel">
        <div className="section-title">
          <div>
            <div className="eyebrow">{script.id}</div>
            <h2>Edit Script Step</h2>
            <p>Adjust action type and parameter values for this script step.</p>
          </div>
        </div>
        <div className="content-stack">
          {error ? <div className="login-error">{error}</div> : null}
          <select className="select" value={action} onChange={(event) => setAction(event.target.value)}>
            {actions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <input className="field" value={parameterName} onChange={(event) => setParameterName(event.target.value)} placeholder="Parameter Name" />
          <input className="field" value={parameterValue} onChange={(event) => setParameterValue(event.target.value)} placeholder="Parameter Value" />
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
