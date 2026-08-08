import { AppShell } from "@/components/app-shell";

export default function ScriptLogoutTemplatePage() {
  return (
    <AppShell
      title="Logout Template"
      subtitle="Keep script endings consistent with the standard SAP session shutdown pattern."
    >
      <section className="card panel">
        <div className="section-title">
          <div>
            <h2>Standard Logout Sequence</h2>
            <p>This template represents the cleanup step appended to new scripts by default.</p>
          </div>
        </div>
        <div className="content-stack">
          <div className="pill">Finalize in-flight actions</div>
          <div className="pill">Execute LOGOUT step</div>
          <div className="pill">Close or release SAP session</div>
          <p className="muted">Use the script detail page if you need to remove or reposition this final step for a special case.</p>
        </div>
      </section>
    </AppShell>
  );
}
