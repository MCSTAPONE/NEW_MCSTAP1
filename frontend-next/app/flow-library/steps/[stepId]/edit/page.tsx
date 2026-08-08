"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/app-shell";

type Flow = {
  id: string;
  name: string;
};

type FlowStep = {
  id: number;
  flowId: string;
  sequence: number;
  transaction: string;
  description: string;
};

export default function EditFlowStepPage() {
  const params = useParams<{ stepId: string }>();
  const stepId = typeof params.stepId === "string" ? Number(params.stepId) : 0;
  const [flow, setFlow] = useState<Flow | null>(null);
  const [step, setStep] = useState<FlowStep | null>(null);
  const [sequence, setSequence] = useState("");
  const [transaction, setTransaction] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!stepId) {
      return;
    }

    void (async () => {
      try {
        const flowsResponse = await fetch("/api/flows", { cache: "no-store" });
        const flowsData = (await flowsResponse.json()) as { items?: Flow[]; message?: string };
        if (!flowsResponse.ok || !flowsData.items) {
          throw new Error(flowsData.message ?? "Failed to load flows.");
        }

        for (const item of flowsData.items) {
          const detailResponse = await fetch(`/api/flows/${item.id}`, { cache: "no-store" });
          const detailData = (await detailResponse.json()) as { steps?: FlowStep[]; item?: Flow };
          const matchedStep = detailData.steps?.find((candidate) => candidate.id === stepId);
          if (matchedStep && detailData.item) {
            const loadedFlow: Flow = detailData.item;
            setFlow(loadedFlow);
            setStep(matchedStep);
            return;
          }
        }

        throw new Error("Flow step not found.");
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : "Failed to load flow step.");
      }
    })();
  }, [stepId]);

  useEffect(() => {
    if (!step) {
      return;
    }

    setSequence(String(step.sequence));
    setTransaction(step.transaction);
    setDescription(step.description);
    setSaved(false);
  }, [step]);

  async function handleSave() {
    if (!step) {
      return;
    }

    setError("");
    setIsSaving(true);

    try {
      const response = await fetch(`/api/flow-steps/${step.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sequence: Number(sequence),
          transaction,
          description
        })
      });
      const data = (await response.json()) as { item?: FlowStep; message?: string };
      if (!response.ok || !data.item) {
        throw new Error(data.message ?? "Failed to save flow step.");
      }
      const updatedStep: FlowStep = data.item;
      setStep(updatedStep);
      setSaved(true);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save flow step.");
    } finally {
      setIsSaving(false);
    }
  }

  if (!step || !flow) {
    return (
      <AppShell title="Edit Flow Step" subtitle="Loading step...">
        <section className="card panel">
          {error ? <div className="login-error">{error}</div> : <p className="muted">Loading step...</p>}
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={`Edit Step ${step.sequence}`}
      subtitle="Step editing is now available in the migrated flow workflow."
    >
      <section className="card panel">
        <div className="section-title">
          <div>
            <div className="eyebrow">{flow.id}</div>
            <h2>Edit Flow Step</h2>
            <p>Update sequence, transaction, and description for this flow step.</p>
          </div>
        </div>
        <div className="content-stack">
          {error ? <div className="login-error">{error}</div> : null}
          <input className="field" value={sequence} onChange={(event) => setSequence(event.target.value)} placeholder="Sequence" />
          <input className="field" value={transaction} onChange={(event) => setTransaction(event.target.value)} placeholder="Transaction" />
          <textarea className="textarea" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Description" />
          <div className="toolbar">
            <button className="button-link" type="button" onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
            {saved ? <span className="pill">Saved to database</span> : null}
            <Link className="button-link" href={`/flow-library/${flow.id}`}>
              Return to Flow
            </Link>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
