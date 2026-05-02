"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

export function KeyboardShortcuts({ onOpenPalette }: { onOpenPalette: () => void }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      const typing = tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable;

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenPalette();
        return;
      }

      if (typing) return;

      if (e.key === "c") {
        e.preventDefault();
        router.push("/issues");
        // trigger inline create after navigation
        setTimeout(() => {
          const btn = document.querySelector<HTMLButtonElement>('[data-testid="new-issue"]');
          btn?.click();
        }, 50);
      } else if (e.key === "/") {
        e.preventDefault();
        const search = document.querySelector<HTMLInputElement>('input[placeholder="Search…"]');
        search?.focus();
      } else if (e.key === "j" || e.key === "k") {
        const rows = Array.from(document.querySelectorAll<HTMLAnchorElement>('[data-testid^="issue-"]'));
        if (!rows.length) return;
        const active = document.activeElement as HTMLElement | null;
        const idx = rows.findIndex((r) => r === active);
        const next = e.key === "j" ? Math.min(idx + 1, rows.length - 1) : Math.max(idx - 1, 0);
        rows[next === -1 ? 0 : next]?.focus();
      } else if (e.key === "e") {
        const title = document.querySelector<HTMLElement>('[data-testid="issue-title"]');
        title?.click();
      }
    }

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", () => {});
  }, [pathname, router, onOpenPalette]);

  return null;
}
