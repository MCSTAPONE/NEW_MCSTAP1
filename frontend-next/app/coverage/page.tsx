import { AppShell } from "@/components/app-shell";
import { MetricGrid } from "@/components/metric-grid";
import { ProgressList } from "@/components/progress-list";
import { coverageSummary, moduleCoverage } from "@/data/app-data";

export default function CoveragePage() {
  return (
    <AppShell
      title="Coverage Dashboard"
      subtitle="Coverage metrics are now modeled as typed frontend data so they can be replaced by API responses without reshaping the UI."
    >
      <section className="card panel">
        <div className="section-title">
          <div>
            <h2>Coverage Summary</h2>
            <p>Structured to accept future backend values from `/coverage/summary`.</p>
          </div>
        </div>
        <MetricGrid items={coverageSummary} />
      </section>
      <section className="card panel">
        <div className="section-title">
          <div>
            <h2>Coverage by Module</h2>
            <p>Progress visualization carried over from the original template.</p>
          </div>
        </div>
        <ProgressList items={moduleCoverage} />
      </section>
    </AppShell>
  );
}
