"use client";

import { useRouter } from "next/navigation";
import { Fragment, FormEvent, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { StatusBadge } from "@/components/status-badge";
import { repositoryModules } from "@/data/app-data";
import { AnalyzeResult, extractGeneratedSteps, generateScript } from "@/lib/script-recording";

type Flow = {
  id: string;
  name: string;
  description: string;
  module: string;
  status: string;
};

type FlowStep = {
  id: number;
  flowId: string;
  sequence: number;
  transaction: string;
  description: string;
};

type Script = {
  id: string;
};

type StepValidation = {
  sequence: number;
  expectedTransaction: string;
  actualTransaction: string | null;
  valid: boolean;
  missing: boolean;
};

export default function ScriptBuilderPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    module: "PM",
    description: ""
  });

  const [flows, setFlows] = useState<Flow[]>([]);
  const [flowsLoaded, setFlowsLoaded] = useState(false);
  const [selectedFlowId, setSelectedFlowId] = useState("");
  const [flowSteps, setFlowSteps] = useState<FlowStep[]>([]);
  const [recordingFiles, setRecordingFiles] = useState<Record<number, File>>({});

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<AnalyzeResult[]>([]);
  const [stepValidation, setStepValidation] = useState<StepValidation[]>([]);
  const [analysisStatus, setAnalysisStatus] = useState<"Waiting" | "SUCCESS" | "FAILED">("Waiting");

  const [generatedScript, setGeneratedScript] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  async function ensureFlowsLoaded() {
    if (flowsLoaded) return;
    try {
      const response = await fetch("/api/flows", { cache: "no-store" });
      const data = (await response.json()) as { items?: Flow[] };
      setFlows(data.items ?? []);
    } catch {
      setFlows([]);
    } finally {
      setFlowsLoaded(true);
    }
  }

  async function handleFlowSelect(flowId: string) {
    setSelectedFlowId(flowId);
    setRecordingFiles({});
    setAnalysisResults([]);
    setStepValidation([]);
    setAnalysisStatus("Waiting");
    setGeneratedScript("");

    if (!flowId) {
      setFlowSteps([]);
      return;
    }

    try {
      const response = await fetch(`/api/flows/${flowId}`, { cache: "no-store" });
      const data = (await response.json()) as { steps?: FlowStep[] };
      setFlowSteps(data.steps ?? []);
    } catch {
      setFlowSteps([]);
      setError("Failed to load steps for the selected flow.");
    }
  }

  function handleFileSelect(stepId: number, file: File | null) {
    setRecordingFiles((current) => {
      const next = { ...current };
      if (file) {
        next[stepId] = file;
      } else {
        delete next[stepId];
      }
      return next;
    });
  }

  async function handleAnalyze() {
    if (!flowSteps.length) {
      setError("Select a business flow with steps before analyzing.");
      return;
    }

    setError("");
    setIsAnalyzing(true);
    setGeneratedScript("");

    const results: AnalyzeResult[] = [];
    const validation: StepValidation[] = [];

    for (const step of flowSteps) {
      const file = recordingFiles[step.id];

      if (!file) {
        validation.push({
          sequence: step.sequence,
          expectedTransaction: step.transaction,
          actualTransaction: null,
          valid: false,
          missing: true
        });
        continue;
      }

      const formData = new FormData();
      formData.append("recording_file", file);

      try {
        const response = await fetch("/api/script-studio/analyze", {
          method: "POST",
          body: formData
        });
        const result = (await response.json()) as AnalyzeResult;

        if (!result.success) {
          validation.push({
            sequence: step.sequence,
            expectedTransaction: step.transaction,
            actualTransaction: null,
            valid: false,
            missing: false
          });
          continue;
        }

        results.push(result);
        validation.push({
          sequence: step.sequence,
          expectedTransaction: step.transaction,
          actualTransaction: result.transaction,
          valid: result.transaction === step.transaction,
          missing: false
        });
      } catch {
        validation.push({
          sequence: step.sequence,
          expectedTransaction: step.transaction,
          actualTransaction: null,
          valid: false,
          missing: false
        });
      }
    }

    setAnalysisResults(results);
    setStepValidation(validation);
    setAnalysisStatus(results.length ? "SUCCESS" : "FAILED");
    setIsAnalyzing(false);

    if (!results.length) {
      setError("No valid recordings analyzed. Upload at least one recording that matches a flow step.");
    }
  }

  function handleGenerate() {
    if (!analysisResults.length) {
      setError("Analyze at least one recording before generating a script.");
      return;
    }
    setError("");
    setGeneratedScript(generateScript(analysisResults));
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSaving(true);

    try {
      const detectedTransaction = analysisResults[0]?.transaction ?? "";

      const scriptResponse = await fetch("/api/scripts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          module: form.module,
          transaction: detectedTransaction,
          description: form.description,
          status: "Draft"
        })
      });

      const scriptData = (await scriptResponse.json()) as { item?: Script; message?: string };
      if (!scriptResponse.ok || !scriptData.item) {
        throw new Error(scriptData.message ?? "Failed to create script.");
      }

      const scriptId = scriptData.item.id;
      const generatedSteps = extractGeneratedSteps(analysisResults);

      for (const step of generatedSteps) {
        await fetch(`/api/scripts/${scriptId}/steps`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "SET_TEXT",
            parameterName: step.parameterName,
            parameterValue: step.parameterValue
          })
        });
      }

      router.push(`/script-studio/library/${scriptId}`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save script.");
    } finally {
      setIsSaving(false);
    }
  }

  const totalActions = analysisResults.reduce((sum, result) => sum + (result.action_count || 0), 0);
  const totalFields = analysisResults.reduce((sum, result) => sum + (result.field_count || 0), 0);
  const discoveredFields = analysisResults[0]?.fields ?? [];
  const validCount = stepValidation.filter((item) => item.valid).length;
  const completion = flowSteps.length ? Math.round((validCount / flowSteps.length) * 100) : 0;

  return (
    <AppShell
      title="Script Builder"
      subtitle="Select a business flow, upload SAP GUI recordings per step, analyze them, and generate an automation script."
    >
      <form onSubmit={handleSave}>
        <section className="split-card">
          <section className="card panel">
            <div className="section-title">
              <div>
                <h2>Script Information</h2>
                <p>Same metadata as the legacy Script Builder screen.</p>
              </div>
            </div>
            <div className="content-stack">
              <input
                className="field"
                placeholder="Script Name"
                required
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              />
              <select
                className="select"
                value={form.module}
                onChange={(event) => setForm((current) => ({ ...current, module: event.target.value }))}
              >
                {repositoryModules.map((module) => (
                  <option key={module} value={module}>
                    {module}
                  </option>
                ))}
              </select>
              <select
                className="select"
                value={selectedFlowId}
                onFocus={() => void ensureFlowsLoaded()}
                onChange={(event) => void handleFlowSelect(event.target.value)}
              >
                <option value="">Select Flow</option>
                {flows.map((flow) => (
                  <option key={flow.id} value={flow.id}>
                    {flow.name}
                  </option>
                ))}
              </select>
              <textarea
                className="textarea"
                placeholder="Description"
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              />
            </div>
          </section>

          <section className="card panel">
            <div className="section-title">
              <div>
                <h2>SAP Recording Upload</h2>
                <p>One recording file per business flow step.</p>
              </div>
            </div>
            {flowSteps.length ? (
              <div className="content-stack">
                {flowSteps.map((step) => (
                  <div key={step.id} className="risk-item">
                    <div>
                      <strong>{step.transaction}</strong>
                      <p className="muted">Step {step.sequence}: {step.description || "No description"}</p>
                    </div>
                    <input
                      type="file"
                      accept=".txt"
                      onChange={(event) => handleFileSelect(step.id, event.target.files?.[0] ?? null)}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted">Select a flow first.</p>
            )}
          </section>
        </section>

        <section className="split-card">
          <section className="card panel">
            <div className="section-title">
              <div>
                <h2>Parsed Actions Preview</h2>
                <p>Actions parsed from the uploaded SAP GUI recordings.</p>
              </div>
            </div>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Seq</th>
                    <th>Action</th>
                    <th>Field</th>
                    <th>Sample Value</th>
                  </tr>
                </thead>
                <tbody>
                  {analysisResults.length ? (
                    analysisResults.map((result, resultIndex) => (
                      <Fragment key={`${result.transaction}-${resultIndex}`}>
                        <tr>
                          <td colSpan={4} style={{ background: "rgba(11, 103, 178, 0.08)", fontWeight: 600 }}>
                            Transaction: {result.transaction}
                          </td>
                        </tr>
                        {result.actions.map((action) => (
                          <tr key={`${result.transaction}-${resultIndex}-${action.seq}`}>
                            <td>{action.seq}</td>
                            <td>{action.action}</td>
                            <td>{action.field || ""}</td>
                            <td>{action.sample_value || ""}</td>
                          </tr>
                        ))}
                      </Fragment>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4}>Analyze Recording First</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="card panel">
            <div className="section-title">
              <div>
                <h2>Recording Analysis</h2>
                <p>Live status of the analyzed recordings.</p>
              </div>
              <StatusBadge tone={analysisStatus === "SUCCESS" ? "success" : analysisStatus === "FAILED" ? "danger" : "info"}>
                {analysisStatus}
              </StatusBadge>
            </div>
            <div className="content-stack">
              <p className="muted">Transaction: {analysisResults[0]?.transaction ?? "None"}</p>
              <p className="muted">Actions: {totalActions}</p>
              <p className="muted">Fields: {totalFields}</p>
              <p className="muted">Flow Completion: {completion}%</p>

              {stepValidation.length ? (
                <div className="content-stack">
                  {stepValidation.map((item) => (
                    <div key={item.sequence}>
                      {item.missing
                        ? `❌ ${item.expectedTransaction} - Missing Recording`
                        : `${item.valid ? "✅" : "❌"} ${item.expectedTransaction} → ${item.actualTransaction ?? "Analyze Failed"}`}
                    </div>
                  ))}
                </div>
              ) : null}

              <h4>Discovered Fields</h4>
              {discoveredFields.length ? (
                discoveredFields.map((field) => <div key={field.field}>✅ {field.field}</div>)
              ) : (
                <p className="muted">Analyze recording first.</p>
              )}
            </div>
          </section>
        </section>

        <section className="card panel">
          <div className="section-title">
            <div>
              <h2>Generated Automation Script</h2>
              <p>Preview of the Python automation script generated from the parsed recordings.</p>
            </div>
          </div>
          <pre className="code-block">{generatedScript || "Python script will appear here..."}</pre>
        </section>

        {error ? <div className="login-error">{error}</div> : null}

        <div className="toolbar">
          <button className="button-link" type="button" onClick={handleAnalyze} disabled={isAnalyzing}>
            {isAnalyzing ? "Analyzing..." : "🔍 Analyze"}
          </button>
          <button className="button-link" type="button" onClick={handleGenerate} disabled={!analysisResults.length}>
            ⚙ Generate Script
          </button>
          <button className="button-link" type="submit" disabled={!generatedScript || isSaving}>
            {isSaving ? "Saving..." : "💾 Save"}
          </button>
        </div>
      </form>
    </AppShell>
  );
}
