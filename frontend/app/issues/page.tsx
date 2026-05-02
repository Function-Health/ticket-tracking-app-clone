"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";

type Issue = {
  id: number;
  number: number;
  title: string;
  status: string;
  priority: string;
  assignee_id: number | null;
  updated_at: string;
};

type User = { id: number; name: string; email: string };

const STATUSES = ["backlog", "todo", "in_progress", "done", "cancelled"];

export default function IssuesPage() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  async function load() {
    const token = localStorage.getItem("token");
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (assigneeFilter) params.set("assignee_id", assigneeFilter);
    setLoading(true);
    const res = await fetch(`/api/issues?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setIssues(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch("/api/users", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then(setUsers);
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, assigneeFilter]);

  async function createIssue(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const token = localStorage.getItem("token");
    await fetch("/api/issues", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ title: newTitle }),
    });
    setNewTitle("");
    setCreating(false);
    load();
  }

  return (
    <AppShell>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold">Issues</h1>
          <button
            onClick={() => setCreating((v) => !v)}
            className="text-sm bg-accent hover:bg-accent/90 px-3 py-1.5 rounded"
            data-testid="new-issue"
          >
            New issue
          </button>
        </div>

        {creating && (
          <form onSubmit={createIssue} className="mb-4 flex gap-2">
            <input
              autoFocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Issue title"
              className="flex-1 bg-panel border border-border rounded px-3 py-2"
            />
            <button type="submit" className="bg-accent rounded px-3 py-1.5 text-sm">Create</button>
          </form>
        )}

        <div className="flex gap-2 mb-4 text-sm">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-panel border border-border rounded px-2 py-1"
          >
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            className="bg-panel border border-border rounded px-2 py-1"
          >
            <option value="">Anyone</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>

        <div className="border border-border rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-4 text-muted text-sm">Loading…</div>
          ) : issues.length === 0 ? (
            <div className="p-4 text-muted text-sm">No issues yet.</div>
          ) : (
            <ul>
              {issues.map((issue) => (
                <li key={issue.id} className="border-b border-border last:border-b-0">
                  <Link
                    href={`/issues/${issue.id}`}
                    className="flex items-center gap-3 px-4 py-2 hover:bg-panel"
                    data-testid={`issue-${issue.number}`}
                  >
                    <span className="text-muted text-xs w-16 font-mono">ENG-{issue.number}</span>
                    <span className="flex-1">{issue.title}</span>
                    <span className="text-xs text-muted w-24 text-right">{issue.status}</span>
                    <span className="text-xs text-muted w-20 text-right">{issue.priority}</span>
                    <span className="text-xs text-muted w-24 text-right">
                      {users.find((u) => u.id === issue.assignee_id)?.name ?? "Unassigned"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </AppShell>
  );
}
