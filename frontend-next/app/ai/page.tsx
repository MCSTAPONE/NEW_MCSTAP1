"use client";

import { useEffect, useMemo, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { repositoryModules } from "@/data/app-data";

const suggestedCommands = [
  "What Should We Automate Next?",
  "Top Automation Opportunities",
  "Build Test Strategy For Purchase Order",
  "Build Test Plan For Purchase Order",
  "Show Process Dependencies For Purchase Order"
];

type AssistantMode = "script" | "flow" | "execution" | "coverage";

const modeOptions: Array<{ value: AssistantMode; label: string; description: string }> = [
  { value: "script", label: "Script Builder", description: "Plan SAP script steps and likely actions." },
  { value: "flow", label: "Flow Design", description: "Outline business flow structure and dependencies." },
  { value: "execution", label: "Execution Help", description: "Prepare for running backend-driven automation." },
  { value: "coverage", label: "Coverage Advice", description: "Identify what should be automated next." }
];

function buildRecommendations(mode: AssistantMode, module: string, transaction: string, notes: string) {
  const trimmedTransaction = transaction.trim().toUpperCase();
  const trimmedNotes = notes.trim();

  if (mode === "script") {
    return {
      title: "Suggested Script Outline",
      summary: `Start in Script Studio, create a ${module} script${trimmedTransaction ? ` for ${trimmedTransaction}` : ""}, then refine generated steps in the library detail page.`,
      bullets: [
        "Use the Script Builder to create the base script with LOGIN, START_TRANSACTION, and LOGOUT.",
        trimmedTransaction ? `Seed the transaction code as ${trimmedTransaction} so the default startup step is ready.` : "Add the transaction code early so the startup step is meaningful.",
        "Add business actions such as SET_TEXT, CLICK, VERIFY_TEXT, or EXECUTE_FLOW in the script detail page.",
        "Run the script from the detail screen and review returned execution logs before linking it elsewhere."
      ],
      prompt: `Create an SAP ${module} automation script${trimmedTransaction ? ` for transaction ${trimmedTransaction}` : ""}. Focus on ${trimmedNotes || "stable business steps, validations, and reusable parameters"}.`
    };
  }

  if (mode === "flow") {
    return {
      title: "Suggested Flow Design",
      summary: `Model the business process in Flow Library first, then connect the flow to reusable scripts and repository assets for ${module}.`,
      bullets: [
        "Create the flow in Flow Library with a clear business description and status.",
        trimmedTransaction ? `Add a step that references transaction ${trimmedTransaction} as the business anchor.` : "Break the process into business transactions in execution order.",
        "Keep each flow step narrow so script reuse stays practical across modules and regression packs.",
        "Use execute flow only after the underlying scripts and backend path are verified."
      ],
      prompt: `Design an SAP ${module} business flow${trimmedTransaction ? ` centered on ${trimmedTransaction}` : ""}. Include key transactions, checkpoints, and reusable automation boundaries.`
    };
  }

  if (mode === "execution") {
    return {
      title: "Execution Readiness Advice",
      summary: "Check that the Windows backend, SAP connection path, and supporting data are ready before triggering automation from the app.",
      bullets: [
        "Make sure the Windows FastAPI backend is running before calling execution routes from Docker.",
        "Verify SAP connectivity first if the scenario depends on live GUI access or recorder-style login flows.",
        trimmedTransaction ? `Confirm that transaction ${trimmedTransaction} exists in the prepared script or flow before execution.` : "Confirm that the intended script or flow includes the right transaction context.",
        "Use returned execution logs as the first validation signal before investigating deeper backend behavior."
      ],
      prompt: `Prepare an SAP ${module} execution run${trimmedTransaction ? ` for transaction ${trimmedTransaction}` : ""}. Validate backend readiness, script dependencies, and execution checkpoints.`
    };
  }

  return {
    title: "Coverage Expansion Advice",
    summary: `Use current module inventory and repository assets to decide what ${module} automation should be added next.`,
    bullets: [
      "Prioritize high-frequency or regression-heavy transactions first.",
      trimmedTransaction ? `Assess whether ${trimmedTransaction} already has a test case, repository asset, flow step, and executable script.` : "Check alignment between test cases, repository assets, and executable scripts.",
      "Close gaps where a test case exists but no repository asset or reusable script has been linked.",
      "Prefer reusable scripts and flows over one-off automation when building new coverage."
    ],
    prompt: `Recommend the next SAP ${module} automation coverage opportunities${trimmedTransaction ? ` around transaction ${trimmedTransaction}` : ""}. Focus on missing links between test cases, repository assets, and scripts.`
  };
}

export default function AiAssistantPage() {
  const [mode, setMode] = useState<AssistantMode>("script");
  const [module, setModule] = useState("PM");
  const [transaction, setTransaction] = useState("");
  const [notes, setNotes] = useState("");
  const [aiText, setAiText] = useState("");
  const [aiModel, setAiModel] = useState("");
  const [aiError, setAiError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [isAsking, setIsAsking] = useState(false);
  const [askError, setAskError] = useState("");

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch("/api/ai/history", { cache: "no-store" });
        const data = (await response.json()) as { history?: string[] };
        setHistory(data.history ?? []);
      } catch {
        setHistory([]);
      }
    })();
  }, []);

  const result = useMemo(() => buildRecommendations(mode, module, transaction, notes), [mode, module, transaction, notes]);

  async function handleAsk() {
    if (!question.trim()) return;
    setIsAsking(true);
    setAskError("");

    try {
      const response = await fetch("/api/ai/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question })
      });

      const data = (await response.json()) as { answer?: string; history?: string[]; message?: string };

      if (!response.ok || data.answer === undefined) {
        throw new Error(data.message ?? "Failed to get an answer.");
      }

      setAnswer(data.answer);
      setHistory(data.history ?? []);
    } catch (askErr) {
      setAskError(askErr instanceof Error ? askErr.message : "Failed to get an answer.");
    } finally {
      setIsAsking(false);
    }
  }

  async function handleGenerate() {
    setIsGenerating(true);
    setAiError("");

    try {
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          mode,
          module,
          transaction,
          notes
        })
      });

      const data = (await response.json()) as { text?: string; model?: string; message?: string };

      if (!response.ok || !data.text) {
        throw new Error(data.message ?? "Failed to generate AI guidance.");
      }

      setAiText(data.text);
      setAiModel(data.model ?? "");
    } catch (generateError) {
      setAiError(generateError instanceof Error ? generateError.message : "Failed to generate AI guidance.");
      setAiText("");
      setAiModel("");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <AppShell
      title="AI Assistant"
      subtitle="A guided planning workspace for turning SAP testing ideas into scripts, flows, execution runs, and coverage actions inside the current app."
    >
      <section className="split-card">
        <div className="card panel">
          <div className="section-title">
            <div>
              <h2>🕒 Recent Commands</h2>
              <p>Click a past command to reuse it.</p>
            </div>
          </div>
          <div className="content-stack">
            {history.length ? (
              history.map((item, index) => (
                <div
                  key={`${item}-${index}`}
                  className="risk-item"
                  style={{ cursor: "pointer" }}
                  onClick={() => setQuestion(item)}
                >
                  {item}
                </div>
              ))
            ) : (
              <p className="muted">No history available.</p>
            )}
          </div>
          <div className="section-title" style={{ marginTop: 16 }}>
            <div>
              <h3>⭐ Suggested Commands</h3>
            </div>
          </div>
          <div className="content-stack">
            {suggestedCommands.map((command) => (
              <div key={command} className="risk-item" style={{ cursor: "pointer" }} onClick={() => setQuestion(command)}>
                {command}
              </div>
            ))}
          </div>
        </div>

        <div className="card panel">
          <div className="section-title">
            <div>
              <h2>MC STAP AI Assistant</h2>
              <p>Ask about Repository Assets, Business Flows, Test Cases, Coverage Analysis, Test Plans, and Test Strategies.</p>
            </div>
          </div>
          <div className="content-stack">
            <textarea
              className="textarea"
              rows={6}
              placeholder="Example: Show all CO repository assets"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void handleAsk();
                }
              }}
            />
            <button className="button-link" type="button" onClick={() => void handleAsk()} disabled={isAsking}>
              {isAsking ? "Asking..." : "Ask AI"}
            </button>
            {askError ? <div className="login-error">{askError}</div> : null}
            {answer ? (
              <div className="card panel">
                <h3>AI Response</h3>
                <pre className="code-block">{answer}</pre>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="split-card">
        <section className="card panel">
          <div className="section-title">
            <div>
              <h2>Assistant Input</h2>
              <p>Use this converted workspace to shape the automation task before jumping into Flow Library, Test Cases, Repository, or Script Studio.</p>
            </div>
          </div>

          <div className="content-stack">
            <select className="select" value={mode} onChange={(event) => setMode(event.target.value as AssistantMode)}>
              {modeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select className="select" value={module} onChange={(event) => setModule(event.target.value)}>
              {repositoryModules.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <input
              className="field"
              placeholder="Transaction Code, for example IW31"
              value={transaction}
              onChange={(event) => setTransaction(event.target.value)}
            />
            <textarea
              className="textarea"
              placeholder="Describe the business goal, expected validations, or the problem you want help with."
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
            {aiError ? <div className="login-error">{aiError}</div> : null}
            <button className="button-link" type="button" onClick={handleGenerate} disabled={isGenerating}>
              {isGenerating ? "Generating..." : "Generate AI Guidance"}
            </button>
          </div>
        </section>

        <section className="card panel">
          <div className="section-title">
            <div>
              <h2>Available Guidance</h2>
              <p>The legacy app only exposed an AI tile. This migrated page turns it into a real planning workspace inside Next.js.</p>
            </div>
          </div>
          <div className="content-stack">
            {modeOptions.map((option) => (
              <article key={option.value} className="risk-item">
                <div>
                  <strong>{option.label}</strong>
                  <p className="muted">{option.description}</p>
                </div>
                <span className="pill" style={{ background: option.value === mode ? "rgba(11, 103, 178, 0.14)" : "rgba(255,255,255,0.14)" }}>
                  {option.value === mode ? "Active" : "Ready"}
                </span>
              </article>
            ))}
          </div>
        </section>
      </section>

      <section className="card panel">
        <div className="section-title">
          <div>
            <h2>{result.title}</h2>
            <p>{result.summary}</p>
          </div>
        </div>

        <div className="split-card">
          <section className="card panel">
            <div className="section-title">
              <div>
                <h3>Recommended Next Steps</h3>
                <p>Use these actions in the current app.</p>
              </div>
            </div>
            <ul className="bullet-list">
              {result.bullets.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="card panel">
            <div className="section-title">
              <div>
                <h3>Reusable Prompt</h3>
                <p>Use this as a planning prompt for future AI integration or team collaboration.</p>
              </div>
            </div>
            <pre className="code-block">{result.prompt}</pre>
          </section>
        </div>
      </section>

      <section className="card panel">
        <div className="section-title">
          <div>
            <h2>Live AI Guidance</h2>
            <p>Generates current planning advice through the OpenAI API when `OPENAI_API_KEY` is configured for the frontend container.</p>
          </div>
          {aiModel ? <span className="pill">{aiModel}</span> : null}
        </div>

        {aiText ? (
          <pre className="code-block">{aiText}</pre>
        ) : (
          <p className="muted">Use “Generate AI Guidance” to request a live recommendation from the configured OpenAI model.</p>
        )}
      </section>
    </AppShell>
  );
}
