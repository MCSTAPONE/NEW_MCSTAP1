"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { StatusBadge } from "@/components/status-badge";

type TestCase = {
  id: string;
  title: string;
  module: string;
  transaction: string;
  processStep: string;
  status: "Manual" | "Automated";
  scriptPath: string;
};

export default function TestCaseDetailPage() {
  const params = useParams<{ testCaseId: string }>();
  const testCaseId = typeof params.testCaseId === "string" ? params.testCaseId : "";
  const [item, setItem] = useState<TestCase | null>(null);
  const [error, setError] = useState("");

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

        const loadedItem: TestCase = data.item;
        setItem(loadedItem);
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : "Failed to load test case.");
      }
    })();
  }, [testCaseId]);

  if (!item) {
    return (
      <AppShell title="Test Case Details" subtitle="Loading test case details...">
        <section className="card panel">
          {error ? <div className="login-error">{error}</div> : <p className="muted">Loading test case details...</p>}
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={item.title}
      subtitle="Test case details now come from the Next.js API layer instead of the legacy template route."
    >
      <section className="card panel">
        <div className="section-title">
          <div>
            <div className="eyebrow">{item.id}</div>
            <h2>Test Case Details</h2>
            <p>{item.processStep}</p>
          </div>
          <StatusBadge tone={item.status === "Automated" ? "success" : "warning"}>{item.status}</StatusBadge>
        </div>

        <div className="grid-two">
          <article className="card panel">
            <div className="section-title">
              <div>
                <h3>Classification</h3>
                <p>Core routing metadata loaded from PostgreSQL.</p>
              </div>
            </div>
            <ul className="bullet-list">
              <li>Module: {item.module}</li>
              <li>Transaction: {item.transaction || "Not set"}</li>
              <li>Automation status: {item.status}</li>
            </ul>
          </article>

          <article className="card panel">
            <div className="section-title">
              <div>
                <h3>Automation Script</h3>
                <p>Current script linkage preserved from the database record.</p>
              </div>
            </div>
            <code className="inline-code">{item.scriptPath || "Not set"}</code>
          </article>
        </div>

        <div className="toolbar" style={{ marginTop: 24 }}>
          <Link className="button-link" href={`/test-cases/${item.id}/edit`}>
            Edit Test Case
          </Link>
        </div>
      </section>
    </AppShell>
  );
}
