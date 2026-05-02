"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail ?? "Login failed");
      }
      const data: { access_token: string } = await res.json();
      localStorage.setItem("token", data.access_token);
      router.replace("/issues");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center">
      <form onSubmit={onSubmit} className="w-80 space-y-3 bg-panel border border-border rounded-lg p-6">
        <h1 className="text-lg font-semibold mb-2">Sign in</h1>
        <input
          type="email"
          required
          placeholder="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-bg border border-border rounded px-3 py-2"
        />
        <input
          type="password"
          required
          placeholder="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-bg border border-border rounded px-3 py-2"
        />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-accent hover:bg-accent/90 rounded py-2 font-medium disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
        <p className="text-sm text-muted text-center">
          No account? <Link href="/signup" className="text-accent hover:underline">Sign up</Link>
        </p>
      </form>
    </main>
  );
}
