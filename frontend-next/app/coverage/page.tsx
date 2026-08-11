"use client";

import { useEffect, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { MetricGrid } from "@/components/metric-grid";
import { ProgressList } from "@/components/progress-list";
import { coverageSummary as fallbackSummary, moduleCoverage as fallbackModules } from "@/data/app-data";

const moduleLabels: Record<string, string> = {
  PM: "Plant Maintenance (PM)",
  MM: "Material Management (MM)",
  FI: "Finance & Accounting (FI)",
  CO: "Controlling (CO)",
  SD: "Sales & Distribution (SD)",
  WM: "Warehouse Management (WM)",
  QM: "Quality Management (QM)",
  PP: "Production Planning (PP)",
  SCM: "Supply Chain Management (SCM)",
  TR: "Treasury (TR)",
  LO: "Logistics (LO)",
  PLM: "Product Lifecycle Management (PLM)",
  PROC: "Procurement (PROC)"
};

type CoverageResponse = {
  status: string;
  totalAssets: number;
  totalAutomated: number;
  overallCoveragePercent: number;
  modules: { module: string; assetCount: number; automatedCount: number; coveragePercent: number }[];
};

export default function CoveragePage() {
  const [data, setData] = useState<CoverageResponse | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch("/api/coverage", { cache: "no-store" });
        const payload = (await response.json()) as CoverageResponse;
        if (!response.ok || payload.status !== "ok") {
          throw new Error("Failed to load coverage data.");
        }
        setData(payload);
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : "Failed to load coverage data.");
      }
    })();
  }, []);

  const summary = data
    ? [
        { label: "Total Repository Assets", value: String(data.totalAssets), note: "Live count from the repository catalog." },
        { label: "Automated Assets", value: String(data.totalAutomated), note: "Assets with a linked automation script." },
        { label: "Coverage", value: `${data.overallCoveragePercent}%`, note: "Automated assets divided by total assets." },
        { label: "SAP Modules", value: String(data.modules.length), note: "Modules tracked in the repository catalog." }
      ]
    : fallbackSummary;

  const modules = data
    ? data.modules
        .filter((item) => item.assetCount > 0)
        .map((item) => ({ module: moduleLabels[item.module] ?? item.module, percent: item.coveragePercent }))
    : fallbackModules;

  return (
    <AppShell
      title="Coverage Dashboard"
      subtitle="Coverage metrics are now computed live from the repository catalog instead of static placeholder data."
    >
      <section className="card panel">
        <div className="section-title">
          <div>
            <h2>Coverage Summary</h2>
            <p>Sourced from `/api/coverage`, backed by PostgreSQL `repository_assets`.</p>
          </div>
        </div>
        {error ? <div className="login-error">{error}</div> : null}
        <MetricGrid items={summary} />
      </section>
      <section className="card panel">
        <div className="section-title">
          <div>
            <h2>Coverage by Module</h2>
            <p>Percent of each module&apos;s repository assets that have a linked automation script.</p>
          </div>
        </div>
        {modules.length ? (
          <ProgressList items={modules} />
        ) : (
          <p className="muted">No repository assets recorded yet for any module.</p>
        )}
      </section>
    </AppShell>
  );
}
