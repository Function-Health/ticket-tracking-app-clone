"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { KeyboardShortcuts } from "./KeyboardShortcuts";
import { CommandPalette } from "./CommandPalette";

type Me = { id: number; email: string; name: string; workspace_id: number };

export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [me, setMe] = useState<Me | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login");
      return;
    }
    fetch("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } })
      .then(async (r) => {
        if (!r.ok) {
          localStorage.removeItem("token");
          router.replace("/login");
          return null;
        }
        return r.json();
      })
      .then((data) => data && setMe(data));
  }, [router]);

  function logout() {
    localStorage.removeItem("token");
    router.replace("/login");
  }

  return (
    <div className="min-h-screen flex">
      <aside className="w-56 border-r border-border bg-panel p-4 flex flex-col">
        <div className="mb-6">
          <p className="font-semibold">Ticket Tracker</p>
          <p className="text-xs text-muted">{me?.name ?? "…"}</p>
        </div>
        <nav className="flex flex-col gap-1 text-sm">
          <Link
            href="/issues"
            className={`px-2 py-1 rounded hover:bg-bg ${pathname?.startsWith("/issues") ? "bg-bg" : ""}`}
          >
            Issues
          </Link>
          <Link
            href="/board"
            className={`px-2 py-1 rounded hover:bg-bg ${pathname?.startsWith("/board") ? "bg-bg" : ""}`}
          >
            Board
          </Link>
        </nav>
        <div className="mt-auto pt-4 border-t border-border text-xs text-muted">
          <button
            onClick={() => setPaletteOpen(true)}
            className="w-full text-left px-2 py-1 rounded hover:bg-bg"
          >
            ⌘K Command palette
          </button>
          <button onClick={logout} className="w-full text-left px-2 py-1 rounded hover:bg-bg mt-1">
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1">{children}</main>
      <KeyboardShortcuts onOpenPalette={() => setPaletteOpen(true)} />
      {paletteOpen && <CommandPalette onClose={() => setPaletteOpen(false)} />}
    </div>
  );
}
