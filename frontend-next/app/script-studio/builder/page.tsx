"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { repositoryModules } from "@/data/app-data";

type Script = {
  id: string;
  name: string;
  module: string;
  transaction: string;
  description: string;
  status: "Draft" | "Ready" | "Active";
};

type ScriptForm = {
  name: string;
  module: string;
  transaction: string;
  description: string;
  status: Script["status"];
};

export default function ScriptBuilderPage() {
  const router = useRouter();
  const [form, setForm] = useState<ScriptForm>({
    name: "",
    module: "PM",
    transaction: "",
    description: "",
    status: "Draft"
  });
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSaving(true);

    try {
      const response = await fetch("/api/scripts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = (await response.json()) as { item?: Script; message?: string };

      if (!response.ok || !data.item) {
        throw new Error(data.message ?? "Failed to create script.");
      }

      const newScript: Script = data.item;
      router.push(`/script-studio/library/${newScript.id}`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to create script.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AppShell
      title="Script Builder"
      subtitle="Create a new automation script in Next.js and seed the default SAP startup steps automatically."
    >
      <section className="split-card">
        <section className="card panel">
          <div className="section-title">
            <div>
              <h2>Create Automation Script</h2>
              <p>This builder saves directly through the Next.js API and creates LOGIN, START_TRANSACTION, and LOGOUT steps.</p>
            </div>
          </div>

          <form className="content-stack" onSubmit={handleSubmit}>
            <input
              className="field"
              placeholder="Script Name"
              required
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            />
            <div className="grid-two">
              <select
                className="select"
                value={form.module}
                onChange={(event) => setForm((current) => ({ ...current, module: event.target.value }))}
              >
                {repositoryModules.map((module) => (
                  <option key={module} value={module}>
                    {module}
                  </option>
                ))}
              </select>
              <input
                className="field"
                placeholder="Transaction Code"
                required
                value={form.transaction}
                onChange={(event) => setForm((current) => ({ ...current, transaction: event.target.value }))}
              />
            </div>
            <textarea
              className="textarea"
              placeholder="Description"
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
            />
            {error ? <div className="login-error">{error}</div> : null}
            <button className="button-link" type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Create Script"}
            </button>
          </form>
        </section>

        <section className="card panel">
          <div className="section-title">
            <div>
              <h2>Included Actions</h2>
              <p>The script starts with a safe baseline you can refine in the library detail page.</p>
            </div>
          </div>
          <div className="content-stack">
            <div className="pill">LOGIN</div>
            <div className="pill">START_TRANSACTION</div>
            <div className="pill">LOGOUT</div>
          </div>
        </section>
      </section>
    </AppShell>
  );
}
