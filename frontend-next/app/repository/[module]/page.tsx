"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { StatusBadge } from "@/components/status-badge";

type RepositoryAsset = {
  id: string;
  name: string;
  module: string;
  transaction: string;
  scriptName: string;
  description: string;
  status: string;
};

const initialForm = {
  assetName: "",
  transactionCode: "",
  scriptName: "",
  description: ""
};

export default function RepositoryModulePage() {
  const params = useParams<{ module: string }>();
  const moduleName = typeof params.module === "string" ? params.module.toUpperCase() : "";
  const [items, setItems] = useState<RepositoryAsset[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  async function loadAssets() {
    if (!moduleName) {
      return;
    }

    try {
      const response = await fetch(`/api/repository/${moduleName}`, { cache: "no-store" });
      const data = (await response.json()) as { items?: RepositoryAsset[]; message?: string };

      if (!response.ok) {
        throw new Error(data.message ?? "Failed to load repository assets.");
      }

      setItems(data.items ?? []);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Failed to load repository assets.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadAssets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleName]);

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSaving(true);

    try {
      const response = await fetch(`/api/repository/${moduleName}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });

      const data = (await response.json()) as { item?: RepositoryAsset; message?: string };
      if (!response.ok || !data.item) {
        throw new Error(data.message ?? "Failed to create repository asset.");
      }

      setItems((current) => [...current, data.item as RepositoryAsset]);
      setForm(initialForm);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to create repository asset.");
    } finally {
      setIsSaving(false);
    }
  }

  function toggleSelected(id: string) {
    setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  async function handleBulkDelete() {
    if (!selectedIds.length) {
      return;
    }

    if (!window.confirm(`Delete ${selectedIds.length} selected asset(s)?`)) {
      return;
    }

    setIsDeleting(true);
    setError("");

    try {
      const response = await fetch(`/api/repository/${moduleName}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assetIds: selectedIds })
      });

      const data = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(data.message ?? "Failed to delete assets.");
      }

      setItems((current) => current.filter((item) => !selectedIds.includes(item.id)));
      setSelectedIds([]);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Failed to delete assets.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <AppShell
      title={`${moduleName || "Repository"} Module`}
      subtitle="Module-level repository inventory now comes from the live repository asset table through the Next.js app."
    >
      <section className="split-card">
        <div className="card panel">
          <div className="section-title">
            <div>
              <h2>Add Repository Asset</h2>
              <p>New assets are saved as Draft status, matching the original repository workflow.</p>
            </div>
          </div>
          <form className="content-stack" onSubmit={handleCreate}>
            <input
              className="field"
              placeholder="Asset Name"
              required
              value={form.assetName}
              onChange={(event) => setForm((current) => ({ ...current, assetName: event.target.value }))}
            />
            <input
              className="field"
              placeholder="Transaction Code"
              required
              value={form.transactionCode}
              onChange={(event) => setForm((current) => ({ ...current, transactionCode: event.target.value }))}
            />
            <input
              className="field"
              placeholder="Script Name"
              value={form.scriptName}
              onChange={(event) => setForm((current) => ({ ...current, scriptName: event.target.value }))}
            />
            <textarea
              className="textarea"
              placeholder="Description"
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
            />
            <button className="button-link" type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Asset"}
            </button>
          </form>
        </div>

        <div className="card panel">
          <div className="section-title">
            <div>
              <h2>Repository Assets</h2>
              <p>Assets, linked scripts, and transaction coverage for this module are now loaded from PostgreSQL.</p>
            </div>
            <StatusBadge tone={items.length ? "info" : "warning"}>
              {items.length ? `${items.length} assets` : "No assets yet"}
            </StatusBadge>
          </div>

          {error ? <div className="login-error">{error}</div> : null}

          {selectedIds.length ? (
            <div className="toolbar">
              <span className="muted">{selectedIds.length} selected</span>
              <button className="button-link" type="button" onClick={handleBulkDelete} disabled={isDeleting}>
                {isDeleting ? "Deleting..." : "Delete Selected"}
              </button>
            </div>
          ) : null}

          {isLoading ? (
            <p className="muted">Loading repository assets...</p>
          ) : items.length ? (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th />
                    <th>Asset</th>
                    <th>Transaction</th>
                    <th>Status</th>
                    <th>Description</th>
                    <th>Linked Script</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(item.id)}
                          onChange={() => toggleSelected(item.id)}
                        />
                      </td>
                      <td>{item.name}</td>
                      <td>{item.transaction || "Not set"}</td>
                      <td>
                        <StatusBadge tone={item.scriptName ? "success" : "warning"}>
                          {item.status}
                        </StatusBadge>
                      </td>
                      <td>{item.description || "No description"}</td>
                      <td>
                        <code className="inline-code">{item.scriptName || "Not linked"}</code>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <h3>No repository assets for {moduleName || "this module"} yet</h3>
              <p>This module is now live in the Next.js app, but no repository rows have been registered for it yet.</p>
            </div>
          )}
        </div>
      </section>
    </AppShell>
  );
}
