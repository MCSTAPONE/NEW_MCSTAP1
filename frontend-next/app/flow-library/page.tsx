"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { StatusBadge } from "@/components/status-badge";

type Flow = {
  id: string;
  name: string;
  description: string;
  module: string;
  status: "Draft" | "Ready" | "Active";
};

type FlowForm = {
  name: string;
  description: string;
  module: string;
  status: Flow["status"];
};

const toneByStatus = {
  Active: "success",
  Ready: "info",
  Draft: "warning"
} as const;

const modules = ["All Modules", "PM", "MM", "CO", "FI", "SD", "PP", "QM", "WM", "TR", "LO", "PLM", "SCM", "PROC", "E2E"];

export default function FlowLibraryPage() {
  const [items, setItems] = useState<Flow[]>([]);
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("All Modules");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState<FlowForm>({
    name: "",
    description: "",
    module: "PM",
    status: "Draft"
  });

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch("/api/flows", { cache: "no-store" });
        const data = (await response.json()) as { items?: Flow[]; message?: string };
        if (!response.ok) {
          throw new Error(data.message ?? "Failed to load flows.");
        }
        setItems(data.items ?? []);
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : "Failed to load flows.");
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        !search ||
        `${item.id} ${item.name} ${item.description} ${item.module} ${item.status}`
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
      const response = await fetch("/api/flows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = (await response.json()) as { item?: Flow; message?: string };
      if (!response.ok || !data.item) {
        throw new Error(data.message ?? "Failed to create flow.");
      }
      const newFlow: Flow = data.item;
      setItems((current) => [...current, newFlow]);
      setForm({
        name: "",
        description: "",
        module: "PM",
        status: "Draft"
      });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to create flow.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(flowId: string) {
    if (!window.confirm("Delete this flow?")) {
      return;
    }

    try {
      const response = await fetch(`/api/flows/${flowId}`, { method: "DELETE" });
      const data = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(data.message ?? "Failed to delete flow.");
      }
      setItems((current) => current.filter((item) => item.id !== flowId));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Failed to delete flow.");
    }
  }

  return (
    <AppShell
      title="Flow Library"
      subtitle="The migrated flow library now supports real create and delete actions through the Next.js API layer."
    >
      <section className="split-card">
        <div className="card panel">
          <div className="section-title">
            <div>
              <h2>Create Flow</h2>
              <p>Create new flow records directly in PostgreSQL from the Next.js workspace.</p>
            </div>
          </div>
          <form className="content-stack" onSubmit={handleCreate}>
            <input
              className="field"
              placeholder="Flow name"
              required
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            />
            <textarea
              className="textarea"
              placeholder="Description"
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
            />
            <div className="grid-two">
              <select
                className="select"
                value={form.module}
                onChange={(event) => setForm((current) => ({ ...current, module: event.target.value }))}
              >
                {modules.filter((module) => module !== "All Modules").map((module) => (
                  <option key={module} value={module}>
                    {module}
                  </option>
                ))}
              </select>
              <select
                className="select"
                value={form.status}
                onChange={(event) =>
                  setForm((current) => ({ ...current, status: event.target.value as Flow["status"] }))
                }
              >
                <option value="Draft">Draft</option>
                <option value="Ready">Ready</option>
                <option value="Active">Active</option>
              </select>
            </div>
            <button className="button-link" type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Create Flow"}
            </button>
          </form>
        </div>

        <div className="card panel">
          <div className="section-title">
            <div>
              <h2>Search & Filter</h2>
              <p>Filters now work against the live flow list instead of the old typed placeholder set.</p>
            </div>
          </div>
          <div className="content-stack">
            <input className="field" placeholder="Search flow name" value={search} onChange={(event) => setSearch(event.target.value)} />
            <select className="select" value={moduleFilter} onChange={(event) => setModuleFilter(event.target.value)}>
              {modules.map((module) => (
                <option key={module} value={module}>
                  {module}
                </option>
              ))}
            </select>
            {error ? <div className="login-error">{error}</div> : null}
          </div>
        </div>
      </section>

      <section className="content-stack">
        {isLoading ? (
          <section className="card panel">
            <p className="muted">Loading flows...</p>
          </section>
        ) : (
          filteredItems.map((flow) => (
            <article key={flow.id} className="card panel">
              <div className="section-title">
                <div>
                  <div className="eyebrow">{flow.id}</div>
                  <h3>{flow.name}</h3>
                  <p>{flow.description}</p>
                </div>
                <StatusBadge tone={toneByStatus[flow.status]}>{flow.status}</StatusBadge>
              </div>
              <div className="toolbar">
                <span className="pill" style={{ background: "rgba(11, 103, 178, 0.08)", color: "#0b67b2" }}>
                  Module: {flow.module}
                </span>
                <Link className="button-link" href={`/flow-library/${flow.id}`}>
                  Open Flow
                </Link>
                <Link className="button-link" href={`/flow-library/${flow.id}/edit`}>
                  Edit
                </Link>
                <button className="button-link" type="button" onClick={() => handleDelete(flow.id)}>
                  Delete
                </button>
              </div>
            </article>
          ))
        )}
      </section>
    </AppShell>
  );
}
