"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/app-shell";

type RepositoryModuleSummary = {
  module: string;
  assetCount: number;
  transactionCount: number;
  scriptCount: number;
};

export default function RepositoryPage() {
  const [items, setItems] = useState<RepositoryModuleSummary[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch("/api/repository", { cache: "no-store" });
        const data = (await response.json()) as { items?: RepositoryModuleSummary[]; message?: string };

        if (!response.ok) {
          throw new Error(data.message ?? "Failed to load repository modules.");
        }

        setItems(data.items ?? []);
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : "Failed to load repository modules.");
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  return (
    <AppShell
      title="Test Repository"
      subtitle="Module inventory now comes from the live repository asset table instead of frontend sample data."
    >
      <section className="card panel">
        <div className="section-title">
          <div>
            <h2>Repository Modules</h2>
            <p>Each card now reflects current PostgreSQL repository assets and links into a live module detail page.</p>
          </div>
        </div>

        {error ? <div className="login-error">{error}</div> : null}

        {isLoading ? (
          <p className="muted">Loading repository modules...</p>
        ) : (
          <div className="tile-grid">
            {items.map((item) => (
              <Link key={item.module} href={`/repository/${item.module}`}>
                <article className="tile">
                  <div>
                    <div className="tile-kicker">Module</div>
                    <h3 className="tile-title">{item.module}</h3>
                    <p className="tile-description">
                      {item.assetCount} assets · {item.transactionCount} transactions · {item.scriptCount} linked scripts
                    </p>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}
