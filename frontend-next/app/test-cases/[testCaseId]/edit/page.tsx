"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/app-shell";

const modules = ["PM", "MM", "FI", "CO", "SD", "WM", "QM", "PP", "SCM", "LO", "TR", "PLM", "PROC"];

type TestCase = {
  id: string;
  title: string;
  module: string;
  transaction: string;
  processStep: string;
  status: "Manual" | "Automated";
  scriptPath: string;
};

export default function TestCaseEditPage() {
  const params = useParams<{ testCaseId: string }>();
  const testCaseId = typeof params.testCaseId === "string" ? params.testCaseId : "";
  const [testCase, setTestCase] = useState<TestCase | null>(null);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [module, setModule] = useState("");
  const [transaction, setTransaction] = useState("");
  const [processStep, setProcessStep] = useState("");
  const [status, setStatus] = useState<"Manual" | "Automated">("Manual");
  const [scriptPath, setScriptPath] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!testCaseId) {
      return;
    }

    void (async () => {
      try {
        const response = await fetch(`/api/test-cases/${testCaseId}`, { cache: "no-store" });
        const data = (await response.json()) as { item?: TestCase; message?: string };

        if (!response.ok || !data.item) {
          throw new Error(data.message ?? "Failed to load test case.");
        }

        const loadedTestCase: TestCase = data.item;
        setTestCase(loadedTestCase);
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : "Failed to load test case.");
      }
    })();
  }, [testCaseId]);

  useEffect(() => {
    if (!testCase) {
      return;
    }

    setTitle(testCase.title);
    setModule(testCase.module);
    setTransaction(testCase.transaction);
    setProcessStep(testCase.processStep);
    setStatus(testCase.status);
    setScriptPath(testCase.scriptPath);
    setSaved(false);
  }, [testCase]);

  async function handleSave() {
    if (!testCase) {
      return;
    }

    setError("");
    setIsSaving(true);

    try {
      const response = await fetch(`/api/test-cases/${testCase.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title,
          module,
          transaction,
          processStep,
          status,
          scriptPath
        })
      });

      const data = (await response.json()) as { item?: TestCase; message?: string };

      if (!response.ok || !data.item) {
        throw new Error(data.message ?? "Failed to save test case.");
      }

      const updatedTestCase: TestCase = data.item;
      setTestCase(updatedTestCase);
      setSaved(true);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save test case.");
    } finally {
      setIsSaving(false);
    }
  }

  if (!testCase) {
    return (
      <AppShell title="Edit Test Case" subtitle="Loading test case...">
        <section className="card panel">
          {error ? <div className="login-error">{error}</div> : <p className="muted">Loading test case...</p>}
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={`Edit ${testCase.id}`}
      subtitle="This migrated edit screen keeps the original form structure while waiting for live save handlers."
    >
      <section className="card panel">
        <div className="section-title">
          <div>
            <div className="eyebrow">{testCase.id}</div>
            <h2>Edit Test Case</h2>
            <p>Changes currently stay in local UI state only until the backend CRUD flow is migrated.</p>
          </div>
        </div>

        <div className="content-stack">
          {error ? <div className="login-error">{error}</div> : null}
          <input className="field" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Title" />
          <div className="grid-two">
            <select className="select" value={module} onChange={(event) => setModule(event.target.value)}>
              {modules.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <input
              className="field"
              value={transaction}
              onChange={(event) => setTransaction(event.target.value)}
              placeholder="Transaction Code"
            />
          </div>
          <textarea
            className="textarea"
            value={processStep}
            onChange={(event) => setProcessStep(event.target.value)}
            placeholder="Process Step"
          />
          <div className="grid-two">
            <select
              className="select"
              value={status}
              onChange={(event) => setStatus(event.target.value as "Manual" | "Automated")}
            >
              <option value="Manual">Manual</option>
              <option value="Automated">Automated</option>
            </select>
            <input
              className="field"
              value={scriptPath}
              onChange={(event) => setScriptPath(event.target.value)}
              placeholder="Automation Script Path"
            />
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
