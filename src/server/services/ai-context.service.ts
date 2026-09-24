export interface UserAIContextPayload {
  userProfile?: {
    name?: string;
    email?: string;
  };
  ddayEvent?: {
    title: string;
    targetDate: string;
    daysLeft?: number | null;
  };
  courses?: {
    id: string;
    name: string;
    sks?: number | null;
    todaySchedules?: {
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      room?: string;
    }[];
  }[];
  tasks?: {
    id?: string;
    title: string;
    course?: string;
    deadline: string;
    urgencyScore: number;
    priority: string;
    status?: string;
    completedSubtasks?: number;
    totalSubtasks?: number;
  }[];
  accounts?: {
    name: string;
    provider: string;
    currentBalance: number;
  }[];
  totalNetWorth?: number;
  budgetSummary?: {
    totalLimit?: number;
    totalSpent?: number;
    remaining?: number;
    percentage?: number;
    categories?: {
      name: string;
      spent: number;
      limit: number;
      usedPercentage: number;
      status: string;
    }[];
  };
  savingsGoals?: {
    title: string;
    currentAmount: number;
    targetAmount: number;
    percentage: number;
  }[];
  debts?: {
    friendName: string;
    amount: number;
    type: "they_owe_me" | "i_owe_them";
    description?: string;
  }[];
  lectureDocName?: string;
  lectureDocText?: string;
}

export class AIContextService {
  /**
   * Mengonstruksi prompt data realtime pengguna dalam format teks ringkas & terstruktur.
   * Dirancang bebas kebocoran data antar-user (Strict User Isolation).
   */
  public static formatRealtimeContext(context: UserAIContextPayload | undefined): string {
    if (!context) {
      return "Tidak ada data kontekstual yang tersedia.";
    }

    const sections: string[] = [];

    // 1. Identitas & D-Day Target
    const userName = context.userProfile?.name?.trim() || "Mahasiswa";
    const dday = context.ddayEvent?.targetDate
      ? `${context.ddayEvent.title || "Target Ujian/Sidang"} (Tanggal: ${context.ddayEvent.targetDate}${
          context.ddayEvent.daysLeft !== null && context.ddayEvent.daysLeft !== undefined
            ? context.ddayEvent.daysLeft > 0
              ? `, H-${context.ddayEvent.daysLeft}`
              : context.ddayEvent.daysLeft === 0
              ? ", HARI H!"
              : ", Selesai"
            : ""
        })`
      : "Belum ada target D-Day yang diatur.";
    sections.push(`[PROFIL MAHASISWA & TARGET D-DAY]
- Nama: ${userName}
- Target D-Day: ${dday}`);

    // 2. Mata Kuliah & Jadwal Kuliah Hari Ini
    if (context.courses && context.courses.length > 0) {
      const courseList = context.courses
        .map((c) => {
          const schedules = c.todaySchedules && c.todaySchedules.length > 0
            ? c.todaySchedules.map((s) => `[Jam ${s.startTime}-${s.endTime}${s.room ? ` @ ${s.room}` : ""}]`).join(", ")
            : "Tidak ada jadwal hari ini";
          return `- ${c.name} (${c.sks || 3} SKS): ${schedules}`;
        })
        .join("\n");
      sections.push(`[MATA KULIAH & JADWAL HARI INI]\n${courseList}`);
    } else {
      sections.push(`[MATA KULIAH & JADWAL HARI INI]\n- Belum ada mata kuliah yang terdaftar.`);
    }

    // 3. Tugas Akademik Aktif & Sub-tasks
    if (context.tasks && context.tasks.length > 0) {
      const tasksFormatted = context.tasks
        .map((t, i) => {
          const subtaskProgress = t.totalSubtasks && t.totalSubtasks > 0
            ? ` | Subtasks: ${t.completedSubtasks || 0}/${t.totalSubtasks}`
            : "";
          return `${i + 1}. ${t.title} [MK: ${t.course || "Umum"}] - Deadline: ${t.deadline} (Urgensi: ${t.urgencyScore}/100, Prioritas: ${t.priority.toUpperCase()}${subtaskProgress})`;
        })
        .join("\n");
      sections.push(`[TUGAS KULIAH AKTIF & DEADLINE]\n${tasksFormatted}`);
    } else {
      sections.push(`[TUGAS KULIAH AKTIF & DEADLINE]\n- Semua tugas sudah tuntas! Tidak ada tugas aktif.`);
    }

    // 4. Saldo Rekening / E-Wallet & Total Net Worth
    if (context.accounts && context.accounts.length > 0) {
      const accountsFormatted = context.accounts
        .map((a) => `- ${a.name} (${a.provider.toUpperCase()}): Rp ${a.currentBalance.toLocaleString("id-ID")}`)
        .join("\n");
      const totalNetWorthStr = typeof context.totalNetWorth === "number"
        ? `\nTotal Saldo Bersih (Net Worth): Rp ${context.totalNetWorth.toLocaleString("id-ID")}`
        : "";
      sections.push(`[DOMPET, REKENING & SALDO AKTIF]\n${accountsFormatted}${totalNetWorthStr}`);
    }

    // 5. Anggaran & Pengeluaran Bulan Ini
    if (context.budgetSummary) {
      const b = context.budgetSummary;
      const categoriesSummary = b.categories && b.categories.length > 0
        ? "\nRincian Kategori:\n" +
          b.categories
            .map(
              (c) =>
                `  * ${c.name}: Terpakai Rp ${c.spent.toLocaleString("id-ID")} / Limit Rp ${c.limit.toLocaleString("id-ID")} (${c.usedPercentage}%, Status: ${c.status})`
            )
            .join("\n")
        : "";

      sections.push(`[ANGGARAN KEUANGAN BULAN INI]
- Total Batas Anggaran: Rp ${(b.totalLimit || 0).toLocaleString("id-ID")}
- Total Pengeluaran: Rp ${(b.totalSpent || 0).toLocaleString("id-ID")} (${b.percentage || 0}%)
- Sisa Anggaran: Rp ${(b.remaining || 0).toLocaleString("id-ID")}${categoriesSummary}`);
    }

    // 6. Tabungan Impian (Savings Goals)
    if (context.savingsGoals && context.savingsGoals.length > 0) {
      const savingsFormatted = context.savingsGoals
        .map(
          (s) =>
            `- ${s.title}: Terkumpul Rp ${s.currentAmount.toLocaleString("id-ID")} dari target Rp ${s.targetAmount.toLocaleString("id-ID")} (${s.percentage}%)`
        )
        .join("\n");
      sections.push(`[CELENGAN & TABUNGAN IMPIAN]\n${savingsFormatted}`);
    }

    // 7. Utang & Piutang Teman
    if (context.debts && context.debts.length > 0) {
      const debtsFormatted = context.debts
        .map((d) => {
          const typeStr = d.type === "they_owe_me" ? "Piutang (Teman berutang padaku)" : "Utang (Aku berutang pada teman)";
          return `- ${d.friendName}: Rp ${d.amount.toLocaleString("id-ID")} (${typeStr}${d.description ? ` - "${d.description}"` : ""})`;
        })
        .join("\n");
      sections.push(`[CATATAN UTANG / PIUTANG TEMAN]\n${debtsFormatted}`);
    }

    return sections.join("\n\n");
  }
}
