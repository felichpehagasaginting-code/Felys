"use client";

import { useEffect } from "react";

function isTypingTarget(el: Element | null): boolean {
  if (!el) return false;
  const tag = el.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    (el as HTMLElement).isContentEditable
  );
}

/**
 * P2: shortcut keyboard global dashboard.
 * - N: tambah cepat (tugas/transaksi sesuai mode)
 * - F: buka/tutup asisten Fio
 * Nonaktif saat mengetik, saat modal/dialog terbuka, atau reduced-motion tidak relevan.
 */
export function useKeyboardShortcuts(opts: {
  onQuickAdd: () => void;
  onToggleFio: () => void;
}) {
  const { onQuickAdd, onToggleFio } = opts;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (isTypingTarget(document.activeElement)) return;
      if (document.querySelector('[role="dialog"]')) return;
      const key = e.key.toLowerCase();
      if (key === "n") {
        e.preventDefault();
        onQuickAdd();
      } else if (key === "f") {
        e.preventDefault();
        onToggleFio();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onQuickAdd, onToggleFio]);
}
