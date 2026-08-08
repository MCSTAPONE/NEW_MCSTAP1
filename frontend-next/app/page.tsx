import { AppShell } from "@/components/app-shell";
import { MetricGrid } from "@/components/metric-grid";
import { SectionCard } from "@/components/section-card";
import { coverageSummary, dashboardSections } from "@/data/app-data";

export default function HomePage() {
  return (
    <AppShell
      title="Dashboard"
      subtitle="A modernized Next.js shell for the existing SAP automation experience, preserving the current information architecture while making the UI easier to extend."
    >
      <section className="hero-grid">
        <div className="card panel">
          <div className="section-title">
            <div>
              <h2>Platform Overview</h2>
              <p>
                Centralize coverage, script authoring, flow design, and operational reporting
                from a single frontend surface.
              </p>
            </div>
          </div>
          <MetricGrid items={coverageSummary} />
        </div>
        <div className="card panel">
          <div className="section-title">
            <div>
              <h2>Migration Notes</h2>
              <p>What this conversion establishes for the UI layer.</p>
            </div>
          </div>
          <ul className="bullet-list">
            <li>Moves the UI into a standalone Next.js App Router project with TypeScript.</li>
            <li>Replaces duplicated template markup with reusable components and typed data.</li>
            <li>Preserves existing modules and flows so backend APIs can be connected incrementally.</li>
          </ul>
        </div>
      </section>
      {dashboardSections.map((section) => (
        <SectionCard key={section.title} section={section} />
      ))}
    </AppShell>
  );
}
