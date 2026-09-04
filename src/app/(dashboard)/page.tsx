"use client";

import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  Plus,
  CheckSquare,
  Receipt,
  Camera,
  CalendarClock,
  Users,
  Target,
  Shield,
  BookOpen,
  TrendingUp,
  Wallet,
  Clock,
} from "lucide-react";
import { useModeStore } from "@/stores/use-mode-store";
import { useDataStore } from "@/stores/use-data-store";
import { useAuthStore } from "@/stores/use-auth-store";
import { TaskCard } from "@/components/academic/TaskCard";
import { TransactionCard } from "@/components/finance/TransactionCard";
import { ChartSkeleton, DashboardSkeleton } from "@/components/ui/Skeleton";
// Heavy components lazy-loaded (recharts/tesseract); chart pakai skeleton anti layout-shift,
// modal tanpa fallback (tertutup = null, tidak ada visual glitch).
const DonutExpenseChart = dynamic(() => import("@/components/finance/DonutExpenseChart").then((m) => m.DonutExpenseChart), { ssr: false, loading: () => <ChartSkeleton /> });
const ReceiptScanModal = dynamic(() => import("@/components/finance/ReceiptScanModal").then((m) => m.ReceiptScanModal), { ssr: false });
const NumpadQuickEntry = dynamic(() => import("@/components/finance/NumpadQuickEntry").then((m) => m.NumpadQuickEntry), { ssr: false });
import { InsightCard } from "@/components/ai/InsightCard";
import { NLPQuickBar } from "@/components/shared/NLPQuickBar";
import { RecurringBillsModal } from "@/components/finance/RecurringBillsModal";
import { SplitBillModal } from "@/components/finance/SplitBillModal";
import { SavingsGoalModal } from "@/components/finance/SavingsGoalModal";
import { EmergencyFundModal } from "@/components/finance/EmergencyFundModal";
import { DailyAllowanceCard } from "@/components/finance/DailyAllowanceCard";
import { DDayCountdownBanner } from "@/components/academic/DDayCountdownBanner";
import { LiveClassStatusCard } from "@/components/academic/LiveClassStatusCard";
import { AccountOverviewGrid } from "@/components/finance/AccountOverviewGrid";
import { Button } from "@/components/ui/Button";
import { TaskFormModal } from "@/components/academic/TaskFormModal";
import { formatCurrencyIDR, getBudgetStatusConfig } from "@/lib/utils";
import { Task } from "@/types/academic";
import { Reveal } from "@/components/shared/Reveal";
import { Collapsible } from "@/components/shared/Collapsible";
import { ensureGsap, prefersReducedMotion } from "@/lib/motion/gsap-setup";

export default function DashboardPage() {
  const { activeMode } = useModeStore();
  const { user, cachedDisplayName } = useAuthStore();
  const {
    tasks,
    courses,
    transactions,
    insights,
    isLoaded,
    getMonthlyBudgetSummary,
    getTotalNetWorth,
  } = useDataStore();

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [isFinanceModalOpen, setIsFinanceModalOpen] = useState(false);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);
  const [isSplitBillOpen, setIsSplitBillOpen] = useState(false);
  const [isSavingsGoalOpen, setIsSavingsGoalOpen] = useState(false);
  const [isEmergencyFundOpen, setIsEmergencyFundOpen] = useState(false);

  // GSAP hero intro: badge pop → sapaan per-huruf (SplitText) → paragraf → tombol stagger
  const heroRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  // Nama instant: Auth user → cache localStorage → fallback.
  // Tidak lagi menunggu onAuthStateChanged (1–3 dtk) dengan "Mahasiswa".
  const displayName =
    user?.displayName?.split(" ")[0] || cachedDisplayName || "Mahasiswa";

  useEffect(() => {
    const hero = heroRef.current;
    const title = titleRef.current;
    if (!hero || !title || prefersReducedMotion()) return;
    const { gsap, SplitText } = ensureGsap();
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power4.out" } });
      tl.from(".hero-badge", { y: -16, opacity: 0, scale: 0.85, duration: 0.6 }, 0.05);

      if (SplitText && typeof SplitText.create === "function") {
        try {
          const split = SplitText.create(title, { type: "chars", mask: "chars" });
          tl.from(split.chars, { yPercent: 110, duration: 0.7, stagger: 0.02 }, 0.15);
        } catch {
          tl.from(title, { y: 20, opacity: 0, duration: 0.7 }, 0.15);
        }
      } else {
        tl.from(title, { y: 20, opacity: 0, duration: 0.7 }, 0.15);
      }

      tl.from(".hero-sub", { y: 14, opacity: 0, duration: 0.6 }, 0.5)
        .from(".hero-actions > *", { y: 16, opacity: 0, scale: 0.92, duration: 0.5, stagger: 0.07 }, 0.6);
    }, hero);
    return () => ctx.revert();
  }, [displayName]);

  // Time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 11) return "Selamat Pagi";
    if (hour < 15) return "Selamat Siang";
    if (hour < 18) return "Selamat Sore";
    return "Selamat Malam";
  };

  const activeTasks = tasks
    .filter((t) => t.status !== "done")
    .sort((a, b) => b.urgencyScore - a.urgencyScore);

  const completedTodayCount = tasks.filter((t) => t.status === "done").length;

  // Monthly budget summary
  const summary = getMonthlyBudgetSummary();
  const budgetConfig = getBudgetStatusConfig(summary.overallPercentage);
  const totalNetWorth = getTotalNetWorth();

  // Recent 5 transactions
  const recentTransactions = transactions.slice(0, 5);

  // Fresh-boot: sync Firestore belum tiba + tidak ada cache lokal → skeleton.
  // User dengan cache tidak pernah melihat ini (paint instant dari localStorage).
  if (!isLoaded && tasks.length === 0 && transactions.length === 0) {
    return <DashboardSkeleton />;
  }

  const handleEditTask = (task: Task) => {
    setTaskToEdit(task);
    setIsTaskModalOpen(true);
  };

  const handleCreateTask = () => {
    setTaskToEdit(null);
    setIsTaskModalOpen(true);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* 1. Welcoming Hero Banner (Apple Minimalist Aesthetics) */}
      <section ref={heroRef} className="p-6 sm:p-8 rounded-[32px] bg-gradient-to-br from-surface to-background border border-border shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-6 overflow-hidden">
        <div className="space-y-2">
          <div className="hero-badge inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Felys Student Space</span>
          </div>
          <h1 ref={titleRef} className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-foreground tracking-tight">
            {getGreeting()}, {displayName}! ✨
          </h1>
          <p className="hero-sub text-xs sm:text-sm text-muted max-w-xl leading-relaxed">
            {activeMode === "academic"
              ? `Kamu memiliki ${activeTasks.length} tugas aktif dan ${completedTodayCount} tugas tuntas. Fokus satu per satu, ya!`
              : `Total aset bersih aktifmu ${formatCurrencyIDR(totalNetWorth)}. Jaga pengeluaran tetap terkontrol hari ini.`}
          </p>
        </div>

        {/* Action Bar Pills */}
        <div className="hero-actions flex items-center gap-2 flex-wrap">
          {activeMode === "academic" ? (
            <>
              <Link href="/academic/calendar">
                <Button variant="secondary" size="md" className="rounded-2xl">
                  <Clock className="w-4 h-4 text-[#7C5CFA]" />
                  <span>Kalender</span>
                </Button>
              </Link>
              <Button
                onClick={handleCreateTask}
                variant="academic"
                size="md"
                className="rounded-2xl"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Tugas</span>
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={() => setIsSplitBillOpen(true)}
                variant="secondary"
                size="md"
                className="rounded-2xl"
                title="Split Bill"
              >
                <Users className="w-4 h-4 text-[#7C5CFA]" />
                <span className="hidden sm:inline">Split Bill</span>
              </Button>
              <Button
                onClick={() => setIsScanModalOpen(true)}
                variant="secondary"
                size="md"
                className="rounded-2xl"
                title="Scan Struk"
              >
                <Camera className="w-4 h-4 text-[#1F8766]" />
                <span className="hidden sm:inline">Scan Struk</span>
              </Button>
              <Button
                onClick={() => setIsRecurringModalOpen(true)}
                variant="secondary"
                size="md"
                className="rounded-2xl"
                title="Biaya Rutin"
              >
                <CalendarClock className="w-4 h-4 text-[#FF7A85]" />
                <span className="hidden sm:inline">Tagihan</span>
              </Button>
              <Button
                onClick={() => setIsSavingsGoalOpen(true)}
                variant="secondary"
                size="md"
                className="rounded-2xl"
                title="Celengan Impian"
              >
                <Target className="w-4 h-4 text-[#B69CFF]" />
                <span className="hidden sm:inline">Celengan</span>
              </Button>
              <Button
                onClick={() => setIsFinanceModalOpen(true)}
                variant="finance"
                size="md"
                className="rounded-2xl"
              >
                <Plus className="w-4 h-4" />
                <span>Catat Transaksi</span>
              </Button>
            </>
          )}
        </div>
      </section>

      {/* 2. Natural Language Quick Input Bar */}
      <Reveal blur>
        <NLPQuickBar />
      </Reveal>

      {/* 3. AI Contextual Insight Card (if available) */}
      {insights.length > 0 && (
        <Reveal y={36} blur>
          <InsightCard insight={insights[0]} />
        </Reveal>
      )}

      {/* ========================================================================= */}
      {/* SECTION A: MODE AKADEMIK (FOCUSED & SPACIOUS) */}
      {/* ========================================================================= */}
      {activeMode === "academic" && (
        <div className="space-y-8 animate-in fade-in-50 duration-300">
          {/* Top Status Grid: Live Class & D-Day Banner */}
          <Reveal className="grid grid-cols-1 lg:grid-cols-2 gap-6" y={36}>
            <LiveClassStatusCard />
            <DDayCountdownBanner />
          </Reveal>

          {/* Main Tasks Board */}
          <Reveal className="space-y-4">
            <Collapsible
              storageKey="dash-tasks"
              header={
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-2xl bg-[#EDE5FF] dark:bg-[#383442] flex items-center justify-center text-[#7C5CFA]">
                      <CheckSquare className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-foreground">
                        Daftar Tugas Prioritas
                      </h2>
                      <p className="text-xs text-muted">
                        Diurutkan otomatis oleh AI berdasarkan deadline, bobot, dan estimasi waktu.
                      </p>
                    </div>
                  </div>

                  <Link
                    href="/academic"
                    className="text-xs font-bold text-[#7C5CFA] hover:underline hidden sm:flex items-center gap-1 bg-[#EDE5FF]/60 dark:bg-[#383442]/60 px-3 py-1.5 rounded-full transition-all"
                  >
                    <span>Lihat Semua ({tasks.length})</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              }
            >
            {activeTasks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeTasks.map((task) => (
                  <TaskCard key={task.id} task={task} onEdit={handleEditTask} />
                ))}
              </div>
            ) : (
              <div className="p-12 rounded-[32px] bg-surface border border-border text-center space-y-3 shadow-soft">
                <div className="w-14 h-14 rounded-3xl bg-[#E0FBF2] text-[#1F8766] flex items-center justify-center mx-auto">
                  <Sparkles className="w-7 h-7" />
                </div>
                <h4 className="text-base font-bold text-foreground">Semua Tugas Beres! 🎉</h4>
                <p className="text-xs text-muted max-w-md mx-auto leading-relaxed">
                  Tidak ada deadline mendesak saat ini. Waktu yang tepat untuk istirahat sejenak atau membaca materi kuliah berikutnya.
                </p>
                <Button
                  onClick={handleCreateTask}
                  variant="academic"
                  size="md"
                  className="rounded-2xl mt-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Tugas Baru</span>
                </Button>
              </div>
            )}
            </Collapsible>
          </Reveal>

          {/* Mata Kuliah Quick Badges */}
          {courses.length > 0 && (
            <Reveal className="p-6 rounded-[32px] bg-surface border border-border shadow-soft space-y-3">
              <Collapsible
                storageKey="dash-courses"
                header={
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-[#7C5CFA]" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
                        Mata Kuliah Aktif Semester Ini
                      </h3>
                    </div>
                    <Link
                      href="/academic/courses"
                      className="text-xs font-bold text-[#7C5CFA] hover:underline hidden sm:inline"
                    >
                      Kelola Mata Kuliah
                    </Link>
                  </div>
                }
              >
              <div className="flex items-center gap-2 flex-wrap">
                {courses.map((course) => (
                  <div
                    key={course.id}
                    className="px-3.5 py-1.5 rounded-2xl border text-xs font-bold flex items-center gap-2 shadow-xs"
                    style={{
                      backgroundColor: `${course.color}15`,
                      borderColor: `${course.color}40`,
                      color: "inherit",
                    }}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: course.color }}
                    />
                    <span>{course.name}</span>
                    <span className="text-[10px] text-muted font-normal">
                      ({course.sks || 3} SKS)
                    </span>
                  </div>
                ))}
              </div>
              </Collapsible>
            </Reveal>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION B: MODE KEUANGAN (SPACIOUS & STRUCTURED) */}
      {/* ========================================================================= */}
      {activeMode === "finance" && (
        <div className="space-y-8 animate-in fade-in-50 duration-300">
          {/* 1. Multi-Account Grid (Dompet & E-Wallet) */}
          <Reveal>
            <AccountOverviewGrid />
          </Reveal>

          {/* 2. Dual Analytics Columns: Budget Status vs Daily Allowance */}
          <Reveal y={36}>
            <Collapsible
              storageKey="dash-analytics"
              header={
                <div className="flex items-center gap-2 px-1">
                  <div className="w-8 h-8 rounded-2xl bg-[#E0FBF2] dark:bg-[#1E3029] flex items-center justify-center text-[#1F8766]">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-foreground">Analitik Keuangan</h3>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${
                        summary.isDeficit
                          ? "bg-[#FFE8EA] text-[#D93D4A]"
                          : `${budgetConfig.badgeBg} ${budgetConfig.textColor}`
                      }`}
                    >
                      {summary.isDeficit ? "Defisit" : `${summary.overallPercentage}%`}
                    </span>
                  </div>
                </div>
              }
            >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Monthly Budget & Expense Distribution */}
            <div className="lg:col-span-7 space-y-6">
              <div className="p-6 sm:p-7 rounded-[32px] bg-surface border border-border space-y-5 shadow-soft">
                <div className="flex items-center justify-between pb-3 border-b border-border/80">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-2xl bg-[#E0FBF2] dark:bg-[#1E3029] flex items-center justify-center text-[#1F8766]">
                      <Receipt className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground">
                        Status Anggaran Bulanan
                      </h3>
                      <p className="text-[11px] text-muted">
                        Pantau limit pengeluaran agar tidak overbudget di akhir bulan.
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                      summary.isDeficit
                        ? "bg-[#FFE8EA] text-[#D93D4A]"
                        : `${budgetConfig.badgeBg} ${budgetConfig.textColor}`
                    }`}
                  >
                    {summary.isDeficit ? "Defisit" : `${summary.overallPercentage}% Terpakai`}
                  </span>
                </div>

                {/* Numbers Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-[#FAF9FC] dark:bg-[#23211F] border border-border">
                    <span className="text-[11px] text-muted font-semibold block mb-0.5">
                      Sisa Budget
                    </span>
                    <span
                      className={`text-xl font-extrabold tracking-tight ${
                        summary.isDeficit ? "text-[#D93D4A]" : "text-[#1F8766]"
                      }`}
                    >
                      {formatCurrencyIDR(Math.abs(summary.remaining))}
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#FAF9FC] dark:bg-[#23211F] border border-border">
                    <span className="text-[11px] text-muted font-semibold block mb-0.5">
                      Pemasukan Kas
                    </span>
                    <span className="text-xl font-extrabold tracking-tight text-[#1F8766]">
                      +{formatCurrencyIDR(summary.totalIncome)}
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#FAF9FC] dark:bg-[#23211F] border border-border">
                    <span className="text-[11px] text-muted font-semibold block mb-0.5">
                      Total Pengeluaran
                    </span>
                    <span className="text-xl font-extrabold tracking-tight text-[#D93D4A]">
                      -{formatCurrencyIDR(summary.totalSpent)}
                    </span>
                  </div>
                </div>

                {/* Progress Gauge */}
                <div className="space-y-2">
                  <div className="w-full h-3 bg-[#EDEAF2] dark:bg-[#383442] rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        summary.isDeficit ? "bg-[#FF7A85]" : budgetConfig.barColor
                      } transition-all duration-500 rounded-full`}
                      style={{ width: `${Math.min(100, summary.overallPercentage)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted font-medium">
                    <span>Terpakai: {formatCurrencyIDR(summary.totalSpent)}</span>
                    <span>Batas: {formatCurrencyIDR(summary.effectiveBudgetBase || summary.totalSpent)}</span>
                  </div>
                </div>

                {/* Distribution Chart */}
                <div className="pt-4 border-t border-border/60">
                  <h4 className="text-xs font-bold text-foreground mb-2 text-center">
                    Distribusi Kategori Pengeluaran
                  </h4>
                  <DonutExpenseChart budgets={summary.categories} />
                </div>
              </div>
            </div>

            {/* Right: Daily Allowance & Quick Shortucts */}
            <div className="lg:col-span-5 space-y-6">
              <DailyAllowanceCard />

              {/* Quick Feature Pocket Cards */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setIsSavingsGoalOpen(true)}
                  className="p-4 rounded-3xl bg-surface border border-border hover:shadow-soft transition-all text-left space-y-1.5 group"
                >
                  <div className="w-8 h-8 rounded-2xl bg-[#EDE5FF] text-[#7C5CFA] flex items-center justify-center transition-transform group-hover:scale-110">
                    <Target className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-foreground block">
                    Celengan Impian
                  </span>
                  <p className="text-[10px] text-muted leading-tight">
                    Tabungan target laptop & liburan semester
                  </p>
                </button>

                <button
                  onClick={() => setIsEmergencyFundOpen(true)}
                  className="p-4 rounded-3xl bg-surface border border-border hover:shadow-soft transition-all text-left space-y-1.5 group"
                >
                  <div className="w-8 h-8 rounded-2xl bg-[#E0FBF2] text-[#1F8766] flex items-center justify-center transition-transform group-hover:scale-110">
                    <Shield className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-foreground block">
                    Dana Darurat
                  </span>
                  <p className="text-[10px] text-muted leading-tight">
                    Cadangan kas tak terduga kosan
                  </p>
                </button>
              </div>
            </div>
            </div>
            </Collapsible>
          </Reveal>

          {/* 3. Recent Transactions Feed */}
          <Reveal className="space-y-4">
            <Collapsible
              storageKey="dash-feed"
              header={
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-[#E0FBF2] dark:bg-[#1E3029] flex items-center justify-center text-[#1F8766]">
                      <Receipt className="w-3.5 h-3.5" />
                    </div>
                    <h3 className="text-base font-bold text-foreground">
                      Transaksi Keuangan Terkini
                    </h3>
                  </div>
                  <Link
                    href="/finance"
                    className="text-xs font-bold text-[#1F8766] hover:underline hidden sm:flex items-center gap-1"
                  >
                    <span>Buka Riwayat Lengkap ({transactions.length})</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              }
            >
            {recentTransactions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {recentTransactions.map((trx) => (
                  <TransactionCard key={trx.id} transaction={trx} />
                ))}
              </div>
            ) : (
              <div className="p-8 rounded-[32px] bg-surface border border-border text-center space-y-2">
                <p className="text-xs text-muted italic">Belum ada transaksi yang dicatat.</p>
                <Button
                  onClick={() => setIsFinanceModalOpen(true)}
                  variant="finance"
                  size="sm"
                  className="rounded-2xl mt-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>Catat Transaksi Pertama</span>
                </Button>
              </div>
            )}
            </Collapsible>
          </Reveal>
        </div>
      )}

      {/* Global Modals (Zero Feature Reduction) */}
      <TaskFormModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        taskToEdit={taskToEdit}
      />
      <NumpadQuickEntry
        isOpen={isFinanceModalOpen}
        onClose={() => setIsFinanceModalOpen(false)}
      />
      <ReceiptScanModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
      />
      <RecurringBillsModal
        isOpen={isRecurringModalOpen}
        onClose={() => setIsRecurringModalOpen(false)}
      />
      <SplitBillModal
        isOpen={isSplitBillOpen}
        onClose={() => setIsSplitBillOpen(false)}
      />
      <SavingsGoalModal
        isOpen={isSavingsGoalOpen}
        onClose={() => setIsSavingsGoalOpen(false)}
      />
      <EmergencyFundModal
        isOpen={isEmergencyFundOpen}
        onClose={() => setIsEmergencyFundOpen(false)}
      />
    </div>
  );
}
