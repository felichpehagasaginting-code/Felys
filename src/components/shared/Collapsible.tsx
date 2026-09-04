"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface CollapsibleProps {
  /** Kunci unik untuk menyimpan status buka/tutup di localStorage. */
  storageKey: string;
  /** Header section yang sudah ada (judul + aksi) — chevron ditambah otomatis. */
  header: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

/**
 * P7: progressive disclosure — section bisa diciutkan, status tersimpan
 * per perangkat. Mengurangi scroll panjang tanpa menghapus fitur.
 */
export function Collapsible({ storageKey, header, children, defaultOpen = true, className }: CollapsibleProps) {
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(`felys_collapse_${storageKey}`);
      if (raw !== null) setOpen(raw === "1");
    } catch {}
  }, [storageKey]);

  const toggle = () => {
    setOpen((v) => {
      const next = !v;
      try {
        localStorage.setItem(`felys_collapse_${storageKey}`, next ? "1" : "0");
      } catch {}
      return next;
    });
  };

  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0">{header}</div>
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          aria-label={open ? "Ciutkan bagian" : "Bentangkan bagian"}
          className="shrink-0 p-1.5 rounded-full text-muted hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-all"
        >
          <ChevronDown
            className={cn("w-4 h-4 transition-transform duration-300", !open && "-rotate-90")}
          />
        </button>
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="pt-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
