"use client";

import { useState } from "react";

import { AppShell } from "@/components/app-shell";
import { StatusBadge } from "@/components/status-badge";

type RecorderResponse = {
  status: string;
  message?: string;
  system?: string;
};

export default function ScriptRecorderPage() {
  const [result, setResult] = useState<RecorderResponse | null>(null);
  const [error, setError] = useState("");
  const [isStarting, setIsStarting] = useState(false);

  async function handleStart() {
    setError("");
    setIsStarting(true);
    setResult(null);

    try {
      const response = await fetch("/api/script-studio/recorder/start", {
        method: "POST"
      });
      const data = (await response.json()) as RecorderResponse;

      if (!response.ok) {
        throw new Error(data.message ?? "Failed to start recorder.");
      }

      setResult(data);
    } catch (startError) {
      const message = startError instanceof Error ? startError.message : "Failed to start recorder.";
      setError(message);
      setResult({
        status: "ERROR",
        message
      });
    } finally {
      setIsStarting(false);
    }
  }

  return (
    <AppShell
      title="SAP Recorder"
      subtitle="Check SAP connectivity from the migrated Next.js workflow before adding captured steps into your scripts."
    >
      <section className="split-card">
        <section className="card panel">
          <div className="section-title">
            <div>
              <h2>Recorder Control</h2>
              <p>This screen now triggers the existing Windows backend recorder handshake through a Next.js proxy.</p>
            </div>
            <StatusBadge tone={result?.status === "SUCCESS" ? "success" : result ? "danger" : "info"}>
              {result?.status ?? "Idle"}
            </StatusBadge>
          </div>

          <div className="content-stack">
            <button className="button-link" type="button" onClick={handleStart} disabled={isStarting}>
              {isStarting ? "Checking SAP Session..." : "Start Recording"}
            </button>
            {error ? <div className="login-error">{error}</div> : null}
            {result ? (
              <div className="content-stack">
                {result.system ? <div className="pill">Connected System: {result.system}</div> : null}
                {result.message ? <p className="muted">{result.message}</p> : null}
              </div>
            ) : (
              <p className="muted">Use this to verify SAP GUI attachment and login before a future capture session.</p>
            )}
          </div>
        </section>

        <section className="card panel">
          <div className="section-title">
            <div>
              <h2>Current Scope</h2>
              <p>The migrated UI now covers the connection check. Full action capture can be layered on top of this flow later.</p>
            </div>
          </div>
          <div className="content-stack">
            <div className="pill">SAP session attach</div>
            <div className="pill">Login handshake</div>
            <div className="pill">Connection feedback</div>
          </div>
        </section>
      </section>
    </AppShell>
  );
}
