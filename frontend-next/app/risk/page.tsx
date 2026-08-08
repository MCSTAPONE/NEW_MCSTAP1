import { AppShell } from "@/components/app-shell";
import { MetricGrid } from "@/components/metric-grid";
import { StatusBadge } from "@/components/status-badge";
import { recommendations, riskItems, riskSummary } from "@/data/app-data";

export default function RiskPage() {
  return (
    <AppShell
      title="Risk Assessment"
      subtitle="A cleaner risk dashboard with reusable summary cards and severity badges."
    >
      <section className="card panel">
        <div className="section-title">
          <div>
            <h2>Risk Summary</h2>
            <p>Current values reflect the existing static dashboard model.</p>
          </div>
        </div>
        <MetricGrid items={riskSummary} />
      </section>
      <section className="split-card">
        <div className="card panel">
          <div className="section-title">
            <div>
              <h2>Risk Matrix</h2>
              <p>Module severity surfaced as typed UI state.</p>
            </div>
          </div>
          <div className="content-stack">
            {riskItems.map((item) => (
              <div key={item.module} className="risk-item">
                <strong>{item.module}</strong>
                <StatusBadge tone={item.severity}>{item.risk} Risk</StatusBadge>
              </div>
            ))}
          </div>
        </div>
        <div className="card panel">
          <div className="section-title">
            <div>
              <h2>Recommendations</h2>
              <p>Ready to be driven by future analytics rules.</p>
            </div>
          </div>
          <ul className="bullet-list">
            {recommendations.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </section>
    </AppShell>
  );
}
