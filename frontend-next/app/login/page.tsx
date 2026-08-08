"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { login } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await login(username, password);

      if (!result) {
        setError("Invalid username or password");
        setLoading(false);
        return;
      }

      // Tokens are already stored in localStorage by the login() function
      // Redirect to dashboard
      router.push("/");
      router.refresh();
    } catch {
      setError("Unable to sign in right now.");
      setLoading(false);
    }
  }

  return (
    <div className="login-shell">
      <div className="login-card">
        <div>
          
          <h1 className="login-title">MC STAP 1</h1>
          <p className="login-copy">
            SAP Automation Platform with JWT Authentication
          </p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <label className="login-label" htmlFor="username">
            Username
          </label>
          <input
            id="username"
            className="field"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="Enter username"
            disabled={loading}
          />

          <label className="login-label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            className="field"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter password"
            disabled={loading}
          />

          {error ? <div className="login-error">{error}</div> : null}

          <button className="login-submit" type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>

        <div className="login-hint">
          Default credentials: <strong>admin</strong> / <strong>admin123</strong>
        </div>
      </div>
    </div>
  );
}
