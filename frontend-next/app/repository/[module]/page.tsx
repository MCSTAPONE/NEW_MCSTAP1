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

export default function RepositoryModulePage() {
  const params = useParams<{ module: string }>();
  const moduleName = typeof params.module === "string" ? params.module.toUpperCase() : "";
  const [items, setItems] = useState<RepositoryAsset[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!moduleName) {
      return;
    }

    void (async () => {
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
    })();
  }, [moduleName]);

  return (
    <AppShell
      title={`${moduleName || "Repository"} Module`}
      subtitle="Module-level repository inventory now comes from the live repository asset table through the Next.js app."
    >
      <section className="card panel">
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

        {isLoading ? (
          <p className="muted">Loading repository assets...</p>
        ) : items.length ? (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
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
      </section>
    </AppShell>
  );
}
