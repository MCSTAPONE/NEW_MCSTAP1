"use client";

import { FormEvent, useEffect, useState } from "react";

import { AppShell } from "@/components/app-shell";

type LicenseStatus = {
  installDate: string;
  trialDays: number;
  daysElapsed: number;
  daysRemaining: number;
  trialExpired: boolean;
  activated: boolean;
  activatedAt: string | null;
  licenseKeyMasked: string | null;
  requiresLicenseKey: boolean;
};

export default function MaintenanceLicensePage() {
  const [status, setStatus] = useState<LicenseStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [licenseKey, setLicenseKey] = useState("");
  const [activating, setActivating] = useState(false);
  const [activateError, setActivateError] = useState("");

  async function loadStatus() {
    setLoading(true);
    setLoadError("");
    try {
      const response = await fetch("/api/license/status", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok || data.status !== "ok") {
        throw new Error(data.message ?? "Unable to load license status.");
      }
      setStatus(data);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Unable to load license status.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadStatus();
  }, []);

  async function handleActivate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setActivating(true);
    setActivateError("");

    try {
      const response = await fetch("/api/license/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ licenseKey })
      });
      const data = await response.json();

      if (!response.ok || data.status !== "ok") {
        throw new Error(data.message ?? "License key is invalid.");
      }

      setLicenseKey("");
      await loadStatus();
    } catch (error) {
      setActivateError(error instanceof Error ? error.message : "License key is invalid.");
    } finally {
      setActivating(false);
    }
  }

  return (
    <AppShell title="Licence" subtitle="Free trial status and license activation.">
      <section className="card panel">
        <div className="section-title">
          <div>
            <h2>Licence Status</h2>
            <p>Every installation starts with a 30 day free trial.</p>
          </div>
        </div>

        {loading ? <p>Loading licence status...</p> : null}
        {loadError ? <div className="alert-banner danger">{loadError}</div> : null}

        {status && !loading ? (
          <div className="content-stack">
            {status.activated ? (
              <div className="alert-banner success">
                Licensed. Activated on {new Date(status.activatedAt ?? "").toLocaleDateString()} with key{" "}
                {status.licenseKeyMasked}.
              </div>
            ) : status.trialExpired ? (
              <div className="alert-banner danger">
                Your 30 day free trial has ended. Enter a licence key below to continue using MC STAP 1.
              </div>
            ) : (
              <>
                <div className="alert-banner info">
                  Free trial active — {status.daysRemaining} of {status.trialDays} days remaining.
                </div>
                <div className="progress-list">
                  <article className="progress-row">
                    <div className="progress-header">
                      <span>Trial period</span>
                      <span>
                        {status.daysElapsed}/{status.trialDays} days used
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${Math.min(100, (status.daysElapsed / status.trialDays) * 100)}%` }}
                      />
                    </div>
                  </article>
                </div>
              </>
            )}
          </div>
        ) : null}
      </section>

      {status && !status.activated ? (
        <section className="card panel">
          <div className="section-title">
            <div>
              <h2>Activate Licence</h2>
              <p>
                {status.trialExpired
                  ? "A licence key is required to continue."
                  : "Already have a licence key? Activate it any time before the trial ends."}
              </p>
            </div>
          </div>

          <form className="login-form" onSubmit={handleActivate}>
            <label className="login-label" htmlFor="licenseKey">
              Licence Key
            </label>
            <input
              id="licenseKey"
              className="field"
              value={licenseKey}
              onChange={(event) => setLicenseKey(event.target.value)}
              placeholder="XXXXX-XXXXX-XXXXX-XXXXX"
              disabled={activating}
            />

            {activateError ? <div className="alert-banner danger">{activateError}</div> : null}

            <button className="primary-button" type="submit" disabled={activating || !licenseKey.trim()}>
              {activating ? "Activating..." : "Activate Licence"}
            </button>
          </form>
        </section>
      ) : null}
    </AppShell>
  );
}
