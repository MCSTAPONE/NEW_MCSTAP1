import { AppShell } from "@/components/app-shell";
import { StatusBadge } from "@/components/status-badge";

const scripts = [
  { name: "test_iw31.py", module: "PM", transaction: "IW31", status: "Active" },
  { name: "test_iw32.py", module: "PM", transaction: "IW32", status: "Active" },
  { name: "test_iw33.py", module: "PM", transaction: "IW33", status: "Active" },
  { name: "test_iw39.py", module: "PM", transaction: "IW39", status: "Active" },
  { name: "test_iw40.py", module: "PM", transaction: "IW40", status: "Active" },
  { name: "test_iw41.py", module: "PM", transaction: "IW41", status: "Active" },
  { name: "test_iw23.py", module: "PM", transaction: "IW23", status: "Active" },
  { name: "test_me51n.py", module: "PM", transaction: "ME51N", status: "Active" },
  { name: "test_ko88.py", module: "PM", transaction: "KO88", status: "Active" }
];

export default function TestScriptsPage() {
  return (
    <AppShell
      title="Test Script Library"
      subtitle="Available automation scripts, carried over from the legacy Test Script Library page."
    >
      <section className="card panel">
        <div className="section-title">
          <div>
            <h2>Available Automation Scripts</h2>
            <p>Static inventory matching the original template content.</p>
          </div>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Script Name</th>
                <th>Module</th>
                <th>Transaction</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {scripts.map((script) => (
                <tr key={script.name}>
                  <td>{script.name}</td>
                  <td>{script.module}</td>
                  <td>{script.transaction}</td>
                  <td>
                    <StatusBadge tone="success">{script.status}</StatusBadge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}
