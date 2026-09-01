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
        "animate-pulse rounded-2xl bg-[#EDEAF2]/70 dark:bg-[#383442]/70",
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
