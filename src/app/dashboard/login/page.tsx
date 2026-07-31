"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import "./login.css";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Login gagal");
      }
      const next = searchParams.get("next") || "/dashboard/booth-virtual/weddings";
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      setLoading(false);
    }
  }

  return (
    <div className="login-shell">
      <form className="login-card card" onSubmit={handleSubmit}>
        <span className="eyebrow">Miori Booth</span>
        <h1 className="font-display" style={{ marginBottom: 20 }}>
          Login Vendor
        </h1>

        <label className="field-label" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          className="field-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ marginBottom: 14 }}
        />

        <label className="field-label" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          type="password"
          className="field-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ marginBottom: 20 }}
        />

        {error && (
          <p className="muted" style={{ color: "var(--color-danger)", marginBottom: 12 }}>
            {error}
          </p>
        )}

        <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
          {loading ? "Masuk..." : "Masuk"}
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
