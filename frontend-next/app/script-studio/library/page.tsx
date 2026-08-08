"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { StatusBadge } from "@/components/status-badge";

type Script = {
  id: string;
  name: string;
  module: string;
  transaction: string;
  description: string;
  status: "Draft" | "Ready" | "Active";
};

type ScriptForm = {
  name: string;
  module: string;
  transaction: string;
  description: string;
  status: Script["status"];
};

const toneByStatus = {
  Active: "success",
  Ready: "info",
  Draft: "warning"
} as const;

const modules = ["PM", "MM", "FI", "CO", "SD", "WM", "QM", "PP", "SCM", "LO", "TR", "PLM", "PROC"];

export default function ScriptLibraryPage() {
  const [items, setItems] = useState<Script[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState<ScriptForm>({
    name: "",
    module: "PM",
    transaction: "",
    description: "",
    status: "Draft"
  });

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch("/api/scripts", { cache: "no-store" });
        const data = (await response.json()) as { items?: Script[]; message?: string };

        if (!response.ok) {
          throw new Error(data.message ?? "Failed to load scripts.");
        }

        setItems(data.items ?? []);
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : "Failed to load scripts.");
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSaving(true);

    try {
      const response = await fetch("/api/scripts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = (await response.json()) as { item?: Script; message?: string };

      if (!response.ok || !data.item) {
        throw new Error(data.message ?? "Failed to create script.");
      }

      const newScript: Script = data.item;
      setItems((current) => [...current, newScript]);
      setForm({
        name: "",
        module: "PM",
        transaction: "",
        description: "",
        status: "Draft"
      });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to create script.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(scriptId: string) {
    if (!window.confirm("Delete this script?")) {
      return;
    }

    try {
      const response = await fetch(`/api/scripts/${scriptId}`, {
        method: "DELETE"
      });
      const data = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(data.message ?? "Failed to delete script.");
      }

      setItems((current) => current.filter((item) => item.id !== scriptId));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Failed to delete script.");
    }
  }

  return (
    <AppShell
      title="Script Library"
      subtitle="Browse and create reusable automation scripts through the migrated Next.js flow."
    >
      <section className="split-card">
        <section className="card panel">
          <div className="section-title">
            <div>
              <h2>Create Script</h2>
              <p>New scripts now persist through the Next.js API layer and seed default LOGIN / START_TRANSACTION / LOGOUT steps.</p>
            </div>
          </div>
          <form className="content-stack" onSubmit={handleCreate}>
            <input
              className="field"
              placeholder="Script Name"
              required
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            />
            <div className="grid-two">
              <select
                className="select"
                value={form.module}
                onChange={(event) => setForm((current) => ({ ...current, module: event.target.value }))}
              >
                {modules.map((module) => (
                  <option key={module} value={module}>
                    {module}
                  </option>
                ))}
              </select>
              <input
                className="field"
                placeholder="T-Code"
                value={form.transaction}
                onChange={(event) => setForm((current) => ({ ...current, transaction: event.target.value }))}
              />
            </div>
            <textarea
              className="textarea"
              placeholder="Description"
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
            />
            <button className="button-link" type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Create New Script"}
            </button>
          </form>
        </section>

        <section className="card panel">
          <div className="section-title">
            <div>
              <h2>Library Status</h2>
              <p>Script rows now come from PostgreSQL through Next.js route handlers.</p>
            </div>
          </div>
          {error ? <div className="login-error">{error}</div> : <p className="muted">Loaded scripts: {items.length}</p>}
        </section>
      </section>

      <section className="card panel">
        <div className="section-title">
          <div>
            <h2>Available Scripts</h2>
            <p>The library list is now live and no longer depends on typed sample records.</p>
          </div>
        </div>

        {isLoading ? (
          <p className="muted">Loading scripts...</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Script ID</th>
                  <th>Name</th>
                  <th>Module</th>
                  <th>T-Code</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((script) => (
                  <tr key={script.id}>
                    <td>{script.id}</td>
                    <td>
                      <Link href={`/script-studio/library/${script.id}`}>{script.name}</Link>
                    </td>
                    <td>{script.module}</td>
                    <td>{script.transaction || "Not set"}</td>
                    <td>
                      <StatusBadge tone={toneByStatus[script.status]}>{script.status}</StatusBadge>
                    </td>
                    <td>
                      <div className="toolbar">
                        <Link className="button-link" href={`/script-studio/library/${script.id}`}>
                          Open
                        </Link>
                        <button className="button-link" type="button" onClick={() => handleDelete(script.id)}>
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
