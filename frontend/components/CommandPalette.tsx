"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Issue = { id: number; number: number; title: string; status: string };

export function CommandPalette({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [issues, setIssues] = useState<Issue[]>([]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch("/api/issues?limit=100", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then(setIssues);
  }, []);

  const filtered = issues.filter((i) =>
    `${i.number} ${i.title}`.toLowerCase().includes(query.toLowerCase()),
  );

  function jump(i: Issue) {
    router.push(`/issues/${i.id}`);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-start justify-center pt-32 z-50"
      onClick={onClose}
    >
      <div
        className="bg-panel border border-border rounded-lg w-[480px] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          autoFocus
          value={query}
          onChange={(e) => { setQuery(e.target.value); setActive(0); }}
          onKeyDown={(e) => {
            if (e.key === "Escape") onClose();
            else if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, filtered.length - 1)); }
            else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
            else if (e.key === "Enter" && filtered[active]) jump(filtered[active]);
          }}
          placeholder="Search issues…"
          className="w-full bg-bg border-b border-border px-4 py-3 outline-none"
          data-testid="palette-input"
        />
        <ul className="max-h-80 overflow-y-auto">
          {filtered.slice(0, 30).map((i, idx) => (
            <li
              key={i.id}
              onMouseEnter={() => setActive(idx)}
              onClick={() => jump(i)}
              className={`flex items-center gap-3 px-4 py-2 text-sm cursor-pointer ${idx === active ? "bg-bg" : ""}`}
            >
              <span className="text-xs text-muted font-mono w-16">ENG-{i.number}</span>
              <span className="flex-1 truncate">{i.title}</span>
              <span className="text-xs text-muted">{i.status}</span>
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="px-4 py-3 text-sm text-muted">No matches</li>
          )}
        </ul>
      </div>
    </div>
  );
}
