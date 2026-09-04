"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-2xl bg-[#ECE7DF]/70 dark:bg-[#383442]/70",
        className
      )}
      {...props}
    />
  );
}

export function MetricCardSkeleton() {
  return (
    <div className="p-5 rounded-3xl bg-surface border border-border space-y-2">
      <Skeleton className="h-3 w-24 rounded-full" />
      <Skeleton className="h-7 w-36 rounded-xl" />
      <Skeleton className="h-2.5 w-28 rounded-full" />
    </div>
  );
}

export function TaskCardSkeleton() {
  return (
    <div className="p-4 rounded-3xl bg-surface border border-border space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-28 rounded-full" />
        <Skeleton className="h-4 w-16 rounded-full" />
      </div>
      <div className="flex items-start gap-3">
        <Skeleton className="w-5 h-5 rounded-lg shrink-0" />
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-4 w-3/4 rounded-lg" />
          <Skeleton className="h-3 w-1/2 rounded-lg" />
        </div>
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-border/40">
        <Skeleton className="h-3 w-20 rounded-full" />
        <Skeleton className="h-3 w-12 rounded-full" />
      </div>
    </div>
  );
}

export function TransactionRowSkeleton() {
  return (
    <div className="p-4 rounded-3xl bg-surface border border-border flex items-center gap-3">
      <Skeleton className="w-10 h-10 rounded-full shrink-0" />
      <div className="space-y-1.5 flex-1">
        <Skeleton className="h-4 w-2/3 rounded-lg" />
        <Skeleton className="h-3 w-1/3 rounded-lg" />
      </div>
      <Skeleton className="h-5 w-20 rounded-lg shrink-0" />
    </div>
  );
}

/** Placeholder chart donut: lingkaran + legenda, cegah layout shift saat recharts di-load. */
export function ChartSkeleton() {
  return (
    <div className="p-5 rounded-3xl bg-surface border border-border flex items-center gap-5">
      <Skeleton className="w-28 h-28 rounded-full shrink-0" />
      <div className="space-y-2.5 flex-1">
        <Skeleton className="h-3.5 w-3/4 rounded-full" />
        <Skeleton className="h-3.5 w-1/2 rounded-full" />
        <Skeleton className="h-3.5 w-2/3 rounded-full" />
      </div>
    </div>
  );
}

export function InsightCardSkeleton() {
  return (
    <div className="p-5 sm:p-6 rounded-[28px] bg-surface border border-border space-y-3">
      <div className="flex items-center gap-2.5">
        <Skeleton className="w-8 h-8 rounded-2xl shrink-0" />
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-3 w-32 rounded-full" />
          <Skeleton className="h-4 w-48 rounded-lg" />
        </div>
      </div>
      <Skeleton className="h-3.5 w-full rounded-lg" />
      <Skeleton className="h-3.5 w-5/6 rounded-lg" />
      <div className="flex gap-2 pt-1">
        <Skeleton className="h-8 w-28 rounded-xl" />
        <Skeleton className="h-8 w-28 rounded-xl" />
      </div>
    </div>
  );
}

/** Full dashboard untuk fresh-boot (tanpa cache): hero + metrik + insight + list. */
export function DashboardSkeleton() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <div className="p-6 sm:p-8 rounded-[32px] bg-surface border border-border space-y-3">
        <Skeleton className="h-4 w-40 rounded-full" />
        <Skeleton className="h-8 w-72 rounded-2xl" />
        <Skeleton className="h-4 w-96 max-w-full rounded-lg" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCardSkeleton />
        <MetricCardSkeleton />
        <MetricCardSkeleton />
      </div>
      <InsightCardSkeleton />
      <div className="space-y-3">
        <TaskCardSkeleton />
        <TaskCardSkeleton />
        <TransactionRowSkeleton />
      </div>
    </div>
  );
}

/** List generik untuk halaman Academic / Finance saat sync awal. */
export function ListSkeleton({ rows = 5, variant = "task" }: { rows?: number; variant?: "task" | "transaction" }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) =>
        variant === "transaction" ? <TransactionRowSkeleton key={i} /> : <TaskCardSkeleton key={i} />
      )}
    </div>
  );
}
