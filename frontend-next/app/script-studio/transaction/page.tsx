import { AppShell } from "@/components/app-shell";

export default function ScriptTransactionTemplatePage() {
  return (
    <AppShell
      title="Transaction Template"
      subtitle="Use this reference to understand the standard handoff into an SAP transaction from generated scripts."
    >
      <section className="card panel">
        <div className="section-title">
          <div>
            <h2>Start Transaction Pattern</h2>
            <p>This template reflects the seeded transaction step that the builder inserts after login.</p>
          </div>
        </div>
        <div className="content-stack">
          <div className="pill">Action: START_TRANSACTION</div>
          <div className="pill">Parameter Name: TCODE</div>
          <div className="pill">Parameter Value: SAP transaction code</div>
          <p className="muted">Open any script from the library to refine the generated transaction code or add follow-up steps.</p>
        </div>
      </section>
    </AppShell>
  );
}
