"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

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

type TestCaseForm = {
  title: string;
  module: string;
  transaction: string;
  processStep: string;
  status: TestCase["status"];
  scriptPath: string;
};

const modules = ["PM", "MM", "FI", "CO", "SD", "WM", "QM", "PP", "SCM", "LO", "TR", "PLM", "PROC"];

const initialForm: TestCaseForm = {
  title: "",
  module: "",
  transaction: "",
  processStep: "",
  status: "Manual",
  scriptPath: ""
};

export default function TestCasesPage() {
  const [items, setItems] = useState<TestCase[]>([]);
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("All Modules");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch("/api/test-cases", { cache: "no-store" });
        const data = (await response.json()) as { items?: TestCase[]; message?: string };

        if (!response.ok) {
          throw new Error(data.message ?? "Failed to load test cases.");
        }

        setItems(data.items ?? []);
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : "Failed to load test cases.");
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        !search ||
        `${item.id} ${item.title} ${item.module} ${item.transaction} ${item.processStep} ${item.scriptPath}`
          .toLowerCase()
          .includes(search.toLowerCase());
      const matchesModule = moduleFilter === "All Modules" || item.module === moduleFilter;
      return matchesSearch && matchesModule;
    });
  }, [items, moduleFilter, search]);

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSaving(true);

    try {
      const response = await fetch("/api/test-cases", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });

      const data = (await response.json()) as { item?: TestCase; message?: string };

      if (!response.ok || !data.item) {
        throw new Error(data.message ?? "Failed to create test case.");
      }

      const newTestCase: TestCase = data.item;
      setItems((current) => [...current, newTestCase]);
      setForm(initialForm);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to create test case.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(testCaseId: string) {
    const confirmed = window.confirm("Delete this test case?");

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`/api/test-cases/${testCaseId}`, {
        method: "DELETE"
      });
      const data = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(data.message ?? "Failed to delete test case.");
      }

      setItems((current) => current.filter((item) => item.id !== testCaseId));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Failed to delete test case.");
    }
  }

  return (
    <AppShell
      title="Test Case Management"
      subtitle="The migrated Next.js screen now supports live create and delete against PostgreSQL through route handlers."
    >
      <section className="split-card">
        <div className="card panel">
          <div className="section-title">
            <div>
              <h2>Create New Test Case</h2>
              <p>New entries now persist through the Next.js API layer instead of staying as UI-only placeholders.</p>
            </div>
          </div>
          <form className="content-stack" onSubmit={handleCreate}>
            <input
              className="field"
              placeholder="Title"
              required
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            />
            <div className="grid-two">
              <select
                className="select"
                required
                value={form.module}
                onChange={(event) => setForm((current) => ({ ...current, module: event.target.value }))}
              >
                <option value="" disabled>
                  Select Module
                </option>
                {modules.map((module) => (
                  <option key={module} value={module}>
                    {module}
                  </option>
                ))}
              </select>
              <input
                className="field"
                placeholder="Transaction Code"
                value={form.transaction}
                onChange={(event) => setForm((current) => ({ ...current, transaction: event.target.value }))}
              />
            </div>
            <textarea
              className="textarea"
              placeholder="Process Step"
              required
              value={form.processStep}
              onChange={(event) => setForm((current) => ({ ...current, processStep: event.target.value }))}
            />
            <div className="grid-two">
              <select
                className="select"
                value={form.status}
                onChange={(event) =>
                  setForm((current) => ({ ...current, status: event.target.value as "Manual" | "Automated" }))
                }
              >
                <option value="Manual">Manual</option>
                <option value="Automated">Automated</option>
              </select>
              <input
                className="field"
                placeholder="Automation Script Path"
                value={form.scriptPath}
                onChange={(event) => setForm((current) => ({ ...current, scriptPath: event.target.value }))}
              />
            </div>
            <button className="button-link" type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Test Case"}
            </button>
          </form>
        </div>
        <div className="card panel">
          <div className="section-title">
            <div>
              <h2>Filters</h2>
              <p>These filters now work against the live list loaded from the Next.js API route.</p>
            </div>
          </div>
          <div className="content-stack">
            <input className="field" placeholder="Search Test Cases..." value={search} onChange={(e) => setSearch(e.target.value)} />
            <select className="select" value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)}>
              <option>All Modules</option>
              {modules.map((module) => (
                <option key={module}>{module}</option>
              ))}
            </select>
            {error ? <div className="login-error">{error}</div> : null}
          </div>
        </div>
      </section>
      <section className="card panel">
        <div className="section-title">
          <div>
            <h2>Available Test Cases</h2>
            <p>Rows now come from PostgreSQL through the Next.js API layer.</p>
          </div>
        </div>
        {isLoading ? (
          <p className="muted">Loading test cases...</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Module</th>
                  <th>Transaction</th>
                  <th>Process Step</th>
                  <th>Status</th>
                  <th>Automation Script</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((testCase) => (
                  <tr key={testCase.id}>
                    <td>{testCase.id}</td>
                    <td>{testCase.title}</td>
                    <td>{testCase.module}</td>
                    <td>{testCase.transaction}</td>
                    <td>{testCase.processStep}</td>
                    <td>
                      <StatusBadge tone={testCase.status === "Automated" ? "success" : "warning"}>
                        {testCase.status}
                      </StatusBadge>
                    </td>
                    <td>{testCase.scriptPath}</td>
                    <td>
                      <div className="toolbar">
                        <Link className="button-link" href={`/test-cases/${testCase.id}`}>
                          View
                        </Link>
                        <Link className="button-link" href={`/test-cases/${testCase.id}/edit`}>
                          Edit
                        </Link>
                        <button className="button-link" type="button" onClick={() => handleDelete(testCase.id)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AppShell>
  );
}
