"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { marked } from "marked";
import { AppShell } from "@/components/AppShell";

type Issue = {
  id: number;
  number: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  assignee_id: number | null;
  creator_id: number;
  created_at: string;
  updated_at: string;
};

type Comment = {
  id: number;
  issue_id: number;
  author_id: number;
  body: string;
  created_at: string;
};

type User = { id: number; name: string; email: string };

const STATUSES = ["backlog", "todo", "in_progress", "done", "cancelled"];
const PRIORITIES = ["none", "low", "medium", "high", "urgent"];

export default function IssueDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const [issue, setIssue] = useState<Issue | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDesc, setEditingDesc] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [descDraft, setDescDraft] = useState("");
  const [newComment, setNewComment] = useState("");

  async function load() {
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };
    const [issueRes, usersRes, commentsRes] = await Promise.all([
      fetch(`/api/issues/${id}`, { headers }),
      fetch(`/api/users`, { headers }),
      fetch(`/api/issues/${id}/comments`, { headers }),
    ]);
    if (issueRes.status === 404) {
      router.replace("/issues");
      return;
    }
    setIssue(await issueRes.json());
    setUsers(await usersRes.json());
    setComments(await commentsRes.json());
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function patch(updates: Partial<Issue>) {
    const token = localStorage.getItem("token");
    const res = await fetch(`/api/issues/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(updates),
    });
    setIssue(await res.json());
  }

  async function postComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim()) return;
    const token = localStorage.getItem("token");
    const res = await fetch(`/api/issues/${id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ body: newComment }),
    });
    const created: Comment = await res.json();
    setComments((c) => [...c, created]);
    setNewComment("");
  }

  if (!issue) return <AppShell><div className="p-6 text-muted">Loading…</div></AppShell>;

  return (
    <AppShell>
      <div className="p-6 max-w-3xl">
        <div className="text-xs text-muted font-mono mb-2">ENG-{issue.number}</div>

        {editingTitle ? (
          <input
            autoFocus
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={() => { setEditingTitle(false); if (titleDraft !== issue.title) patch({ title: titleDraft }); }}
            onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
            className="text-2xl font-semibold bg-panel border border-border rounded px-2 py-1 w-full"
          />
        ) : (
          <h1
            className="text-2xl font-semibold mb-3 cursor-text"
            data-testid="issue-title"
            onClick={() => { setTitleDraft(issue.title); setEditingTitle(true); }}
          >
            {issue.title}
          </h1>
        )}

        <div className="flex gap-3 mb-6 text-sm">
          <select
            value={issue.status}
            onChange={(e) => patch({ status: e.target.value })}
            className="bg-panel border border-border rounded px-2 py-1"
            data-testid="status-select"
          >
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={issue.priority}
            onChange={(e) => patch({ priority: e.target.value })}
            className="bg-panel border border-border rounded px-2 py-1"
          >
            {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <select
            value={issue.assignee_id ?? ""}
            onChange={(e) => patch({ assignee_id: e.target.value ? Number(e.target.value) : null })}
            className="bg-panel border border-border rounded px-2 py-1"
          >
            <option value="">Unassigned</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>

        <section className="mb-8">
          <h2 className="text-sm uppercase text-muted mb-2">Description</h2>
          {editingDesc ? (
            <div>
              <textarea
                autoFocus
                value={descDraft}
                onChange={(e) => setDescDraft(e.target.value)}
                rows={8}
                className="w-full bg-panel border border-border rounded px-3 py-2 font-mono text-sm"
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => { setEditingDesc(false); patch({ description: descDraft }); }}
                  className="bg-accent rounded px-3 py-1 text-sm"
                >Save</button>
                <button
                  onClick={() => setEditingDesc(false)}
                  className="bg-panel border border-border rounded px-3 py-1 text-sm"
                >Cancel</button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => { setDescDraft(issue.description); setEditingDesc(true); }}
              className="markdown bg-panel border border-border rounded p-4 cursor-text min-h-16"
              dangerouslySetInnerHTML={{ __html: marked.parse(issue.description || "_No description_") as string }}
            />
          )}
        </section>

        <section>
          <h2 className="text-sm uppercase text-muted mb-2">Comments</h2>
          <ul className="space-y-3 mb-3">
            {comments.map((c) => (
              <li key={c.id} className="bg-panel border border-border rounded p-3 text-sm">
                <p className="text-xs text-muted mb-1">
                  {users.find((u) => u.id === c.author_id)?.name ?? "Someone"}
                </p>
                <p className="whitespace-pre-wrap">{c.body}</p>
              </li>
            ))}
          </ul>
          <form onSubmit={postComment} className="flex gap-2">
            <input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment…"
              className="flex-1 bg-panel border border-border rounded px-3 py-2 text-sm"
              data-testid="comment-input"
            />
            <button type="submit" className="bg-accent rounded px-3 py-2 text-sm">Post</button>
          </form>
        </section>
      </div>
    </AppShell>
  );
}
