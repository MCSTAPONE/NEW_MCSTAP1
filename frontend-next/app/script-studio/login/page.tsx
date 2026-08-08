import { AppShell } from "@/components/app-shell";

export default function ScriptLoginTemplatePage() {
  return (
    <AppShell
      title="Login Template"
      subtitle="Reference the standard SAP login step pattern used at the beginning of generated automation scripts."
    >
      <section className="card panel">
        <div className="section-title">
          <div>
            <h2>Standard Login Sequence</h2>
            <p>This template documents the intended session bootstrap used by generated scripts and recorder-assisted flows.</p>
          </div>
        </div>
        <div className="content-stack">
          <div className="pill">Attach to SAP GUI session</div>
          <div className="pill">Validate active window</div>
          <div className="pill">Execute LOGIN step</div>
          <p className="muted">New scripts created from the builder automatically include this as step 1.</p>
        </div>
      </section>
    </AppShell>
  );
}
