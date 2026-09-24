"use client";

import React from "react";
import { Skeleton, TaskCardSkeleton, TransactionRowSkeleton, ChartSkeleton, MetricCardSkeleton } from "@/components/ui/Skeleton";

interface DashboardLayoutSkeletonProps {
  mode?: "academic" | "finance";
}

export function DashboardLayoutSkeleton({ mode = "academic" }: DashboardLayoutSkeletonProps) {
  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 animate-in fade-in-50 duration-300">
      {/* 1. Welcoming Hero Banner Skeleton (1:1 with real hero) */}
      <section className="p-5 sm:p-7 lg:p-8 rounded-[32px] bg-surface border border-border shadow-soft flex flex-col lg:flex-row lg:items-center justify-between gap-6 overflow-hidden">
        <div className="space-y-3 flex-1 min-w-0">
          {/* Badge Pill */}
          <Skeleton className="h-5 w-36 rounded-full" />
          {/* Greeting Title */}
          <Skeleton className="h-9 w-64 sm:w-80 rounded-2xl" />
          {/* Subtitle / Status Summary */}
          <Skeleton className="h-4 w-full max-w-md rounded-lg" />
        </div>

        {/* Action Bar Pills */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap shrink-0">
          <Skeleton className="h-10 w-32 rounded-2xl" />
          <Skeleton className="h-10 w-28 rounded-2xl" />
          <Skeleton className="h-10 w-36 rounded-2xl" />
        </div>
      </section>

      {/* 2. Natural Language Quick Bar Skeleton */}
      <div className="p-2 sm:p-2.5 rounded-2xl bg-surface border border-border flex items-center gap-3">
        <Skeleton className="w-8 h-8 rounded-xl shrink-0" />
        <Skeleton className="h-4 flex-1 rounded-lg" />
        <Skeleton className="h-7 w-20 rounded-xl shrink-0" />
      </div>

      {/* 3. AI Insight Card Skeleton */}
      <div className="p-5 sm:p-6 rounded-[28px] bg-surface border border-border shadow-soft space-y-3">
        <div className="flex items-center gap-2.5">
          <Skeleton className="w-8 h-8 rounded-2xl shrink-0" />
          <div className="space-y-1.5 flex-1">
            <Skeleton className="h-3.5 w-32 rounded-full" />
            <Skeleton className="h-4 w-56 rounded-lg" />
          </div>
        </div>
        <Skeleton className="h-3.5 w-full rounded-lg" />
        <Skeleton className="h-3.5 w-4/5 rounded-lg" />
        <div className="flex gap-2 pt-1">
          <Skeleton className="h-8 w-28 rounded-xl" />
          <Skeleton className="h-8 w-24 rounded-xl" />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODE AKADEMIK LAYOUT SKELETON */}
      {/* ========================================================================= */}
      {mode === "academic" && (
        <div className="space-y-8">
          {/* Top Status Grid: Live Class & D-Day Banner */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Live Class Status Card Skeleton */}
            <div className="p-5 sm:p-6 rounded-3xl bg-surface border border-border shadow-soft space-y-3.5">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-28 rounded-full" />
                <Skeleton className="h-4 w-16 rounded-full" />
              </div>
              <Skeleton className="h-6 w-3/4 rounded-xl" />
              <div className="flex items-center gap-2 pt-1">
                <Skeleton className="h-4 w-24 rounded-lg" />
                <Skeleton className="h-4 w-28 rounded-lg" />
              </div>
            </div>

            {/* D-Day Countdown Banner Skeleton */}
            <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-[#7C5CFA]/15 via-[#B69CFF]/15 to-[#7FE3C0]/15 border border-[#7C5CFA]/30 shadow-soft flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Skeleton className="w-11 h-11 rounded-2xl shrink-0" />
                <div className="space-y-1.5">
                  <Skeleton className="h-3.5 w-24 rounded-full" />
                  <Skeleton className="h-5 w-40 rounded-xl" />
                  <Skeleton className="h-3 w-28 rounded-lg" />
                </div>
              </div>
              <Skeleton className="h-10 w-24 rounded-2xl shrink-0" />
            </div>
          </div>

          {/* Priority Tasks Board Skeleton */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2.5">
                <Skeleton className="w-8 h-8 rounded-2xl shrink-0" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-40 rounded-lg" />
                  <Skeleton className="h-3 w-64 rounded-full" />
                </div>
              </div>
              <Skeleton className="h-7 w-28 rounded-full" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TaskCardSkeleton />
              <TaskCardSkeleton />
              <TaskCardSkeleton />
              <TaskCardSkeleton />
            </div>
          </div>

          {/* Courses Badges Row Skeleton */}
          <div className="p-6 rounded-[32px] bg-surface border border-border shadow-soft space-y-3">
            <Skeleton className="h-4 w-32 rounded-lg" />
            <div className="flex flex-wrap gap-2.5 pt-1">
              <Skeleton className="h-8 w-32 rounded-2xl" />
              <Skeleton className="h-8 w-28 rounded-2xl" />
              <Skeleton className="h-8 w-36 rounded-2xl" />
              <Skeleton className="h-8 w-24 rounded-2xl" />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE KEUANGAN LAYOUT SKELETON */}
      {/* ========================================================================= */}
      {mode === "finance" && (
        <div className="space-y-8">
          {/* Multi-Account Overview Grid Skeleton */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <Skeleton className="h-4 w-36 rounded-lg" />
              <Skeleton className="h-4 w-20 rounded-full" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-4 rounded-3xl bg-surface border border-border space-y-2">
                  <div className="flex items-center justify-between">
                    <Skeleton className="w-7 h-7 rounded-xl" />
                    <Skeleton className="h-3 w-10 rounded-full" />
                  </div>
                  <Skeleton className="h-3 w-20 rounded-full" />
                  <Skeleton className="h-5 w-24 rounded-lg" />
                </div>
              ))}
            </div>
          </div>

          {/* Dual Analytics: Budget Chart vs Daily Allowance */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Monthly Budget & Donut Chart */}
            <div className="lg:col-span-7 space-y-4">
              <div className="p-6 sm:p-7 rounded-[32px] bg-surface border border-border space-y-5 shadow-soft">
                <div className="flex items-center justify-between pb-3 border-b border-border/80">
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-44 rounded-lg" />
                    <Skeleton className="h-3 w-60 rounded-full" />
                  </div>
                  <Skeleton className="h-6 w-24 rounded-full" />
                </div>
                <ChartSkeleton />
              </div>
            </div>

            {/* Right: Daily Allowance Card */}
            <div className="lg:col-span-5">
              <div className="p-6 sm:p-7 rounded-[32px] bg-surface border border-border shadow-soft space-y-4">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-32 rounded-lg" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
                <Skeleton className="h-8 w-48 rounded-xl" />
                <Skeleton className="h-3 w-full rounded-full" />
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <Skeleton className="h-16 rounded-2xl" />
                  <Skeleton className="h-16 rounded-2xl" />
                </div>
              </div>
            </div>
          </div>

          {/* Metric Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
          </div>

          {/* Recent Transactions List Skeleton */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <Skeleton className="h-4 w-36 rounded-lg" />
              <Skeleton className="h-4 w-20 rounded-full" />
            </div>
            <TransactionRowSkeleton />
            <TransactionRowSkeleton />
            <TransactionRowSkeleton />
            <TransactionRowSkeleton />
          </div>
        </div>
      )}
    </div>
  );
}
