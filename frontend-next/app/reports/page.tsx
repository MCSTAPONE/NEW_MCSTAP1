import { AppShell } from "@/components/app-shell";
import { MetricGrid } from "@/components/metric-grid";
import { StatusBadge } from "@/components/status-badge";

const reportSummary = [
  {
    label: "Report Sources",
    value: "3",
    note: "Execution reports, coverage snapshots, and risk summaries are modeled here."
  },
  {
    label: "Primary Viewer",
    value: "Allure",
    note: "Existing detailed execution results continue to come from the backend report surface."
  },
  {
    label: "Delivery Mode",
    value: "Hybrid",
    note: "Next.js owns the navigation shell while deep report artifacts can remain backend-served."
  }
];

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

const reportFeeds = [
  {
    title: "Allure Execution Report",
    description:
      "Open the current backend-generated Allure report for step-level execution evidence and attachments.",
    status: "Available via backend",
    tone: "success" as const,
    href: `${apiBaseUrl}/reports/allure`,
    cta: "Open Allure"
  },
  {
    title: "Coverage Snapshot",
    description:
      "Use the migrated coverage page for high-level automation percentages and module-by-module rollout view.",
    status: "Migrated to Next.js",
    tone: "info" as const,
    href: "/coverage",
    cta: "Open Coverage"
  },
  {
    title: "Risk Review",
    description:
      "Use the migrated risk workspace to review severity, hotspots, and follow-up recommendations.",
    status: "Migrated to Next.js",
    tone: "info" as const,
    href: "/risk",
    cta: "Open Risk"
  }
];

const rolloutNotes = [
  "Top-level reporting navigation is now available in Next.js so users no longer hit a dead menu link.",
  "Detailed execution artifacts still come from the Windows-hosted FastAPI backend until a report API is added.",
  "This page creates a stable handoff point for future report APIs without changing the user-facing route."
];

export default function ReportsPage() {
  return (
    <AppShell
      title="Reports & Insights"
      subtitle="A migrated reporting landing page that keeps users in the Next.js experience while deeper execution artifacts continue to come from the backend."
    >
      <section className="card panel">
        <div className="section-title">
          <div>
            <h2>Reporting Overview</h2>
            <p>Structured to bridge the current hybrid reporting model without blocking the UI migration.</p>
          </div>
        </div>
        <MetricGrid items={reportSummary} />
      </section>

      <section className="split-card">
        <div className="card panel">
          <div className="section-title">
            <div>
              <h2>Available Report Surfaces</h2>
              <p>Each report area can later switch from static routing to API-driven availability checks.</p>
            </div>
          </div>
          <div className="content-stack">
            {reportFeeds.map((feed) => (
              <article key={feed.title} className="risk-item">
                <div>
                  <strong>{feed.title}</strong>
                  <p className="muted">{feed.description}</p>
                </div>
                <div className="content-stack" style={{ gap: 10, justifyItems: "end" }}>
                  <StatusBadge tone={feed.tone}>{feed.status}</StatusBadge>
                  <a
                    className="button-link"
                    href={feed.href}
                    target={feed.href.startsWith("http") ? "_blank" : undefined}
                    rel={feed.href.startsWith("http") ? "noreferrer" : undefined}
                  >
                    {feed.cta}
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="card panel">
          <div className="section-title">
            <div>
              <h2>Migration Notes</h2>
              <p>What this page resolves right now and what still remains backend-owned.</p>
            </div>
          </div>
          <ul className="bullet-list">
            {rolloutNotes.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </section>
    </AppShell>
  );
}
