"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          name,
          workspace_name: workspaceName || `${name}'s Workspace`,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail ?? "Signup failed");
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
        <h1 className="text-lg font-semibold mb-2">Create an account</h1>
        <input
          required
          placeholder="full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-bg border border-border rounded px-3 py-2"
        />
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
        <input
          placeholder="workspace name (optional)"
          value={workspaceName}
          onChange={(e) => setWorkspaceName(e.target.value)}
          className="w-full bg-bg border border-border rounded px-3 py-2"
        />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-accent hover:bg-accent/90 rounded py-2 font-medium disabled:opacity-60"
        >
          {loading ? "Creating…" : "Create account"}
        </button>
        <p className="text-sm text-muted text-center">
          Have an account? <Link href="/login" className="text-accent hover:underline">Sign in</Link>
        </p>
      </form>
    </main>
  );
}
