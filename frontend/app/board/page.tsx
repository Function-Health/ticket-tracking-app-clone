"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  useDroppable,
  useDraggable,
} from "@dnd-kit/core";
import { AppShell } from "@/components/AppShell";

type Issue = {
  id: number;
  number: number;
  title: string;
  status: string;
  priority: string;
  assignee_id: number | null;
};

const COLUMNS: { key: string; label: string }[] = [
  { key: "backlog", label: "Backlog" },
  { key: "todo", label: "Todo" },
  { key: "in_progress", label: "In Progress" },
  { key: "done", label: "Done" },
  { key: "cancelled", label: "Cancelled" },
];

function Card({ issue }: { issue: Issue }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `issue-${issue.id}`,
    data: { issue },
  });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      data-testid={`card-${issue.number}`}
      className={`bg-panel border border-border rounded p-3 mb-2 text-sm cursor-grab ${isDragging ? "opacity-60" : ""}`}
    >
      <div className="text-xs text-muted font-mono mb-1">ENG-{issue.number}</div>
      <Link href={`/issues/${issue.id}`} className="hover:underline" onPointerDown={(e) => e.stopPropagation()}>
        {issue.title}
      </Link>
    </div>
  );
}

function Column({ id, label, issues }: { id: string; label: string; issues: Issue[] }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      data-testid={`column-${id}`}
      className={`flex-1 min-w-56 bg-bg border border-border rounded p-2 ${isOver ? "ring-1 ring-accent" : ""}`}
    >
      <div className="text-xs uppercase text-muted px-1 py-2 flex justify-between">
        <span>{label}</span>
        <span>{issues.length}</span>
      </div>
      <div>{issues.map((i) => <Card key={i.id} issue={i} />)}</div>
    </div>
  );
}

export default function BoardPage() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  async function load() {
    const token = localStorage.getItem("token");
    const res = await fetch("/api/issues?limit=100", {
      headers: { Authorization: `Bearer ${token}` },
    });
    setIssues(await res.json());
  }

  useEffect(() => { load(); }, []);

  const byStatus = useMemo(() => {
    const map: Record<string, Issue[]> = {};
    for (const c of COLUMNS) map[c.key] = [];
    for (const i of issues) (map[i.status] ?? (map[i.status] = [])).push(i);
    return map;
  }, [issues]);

  async function onDragEnd(e: DragEndEvent) {
    const newStatus = e.over?.id as string | undefined;
    const issue = e.active.data.current?.issue as Issue | undefined;
    if (!newStatus || !issue || issue.status === newStatus) return;

    setIssues((prev) => prev.map((i) => (i.id === issue.id ? { ...i, status: newStatus } : i)));

    const token = localStorage.getItem("token");
    await fetch(`/api/issues/${issue.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status: newStatus }),
    });
  }

  return (
    <AppShell>
      <div className="p-6">
        <h1 className="text-xl font-semibold mb-4">Board</h1>
        <DndContext sensors={sensors} onDragEnd={onDragEnd}>
          <div className="flex gap-3 overflow-x-auto">
            {COLUMNS.map((c) => (
              <Column key={c.key} id={c.key} label={c.label} issues={byStatus[c.key] ?? []} />
            ))}
          </div>
        </DndContext>
      </div>
    </AppShell>
  );
}
