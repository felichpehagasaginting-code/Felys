import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { MonthlyBudgetSummary, Transaction, DailyAllowanceSummary } from "@/types/finance";
import { formatCurrencyIDR } from "@/lib/utils";

interface GeneratePDFParams {
  studentName?: string;
  studentEmail?: string;
  summary: MonthlyBudgetSummary;
  transactions: Transaction[];
  dailyAllowance?: DailyAllowanceSummary;
}

const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

export function generateFinancialStatementPDF({
  studentName = "Mahasiswa Felys",
  studentEmail = "student@felys.app",
  summary,
  transactions,
  dailyAllowance,
}: GeneratePDFParams) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const periodName = `${MONTH_NAMES[summary.month - 1]} ${summary.year}`;
  const printDate = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Colors (RGB)
  const primaryPurple: [number, number, number] = [124, 92, 250]; // #7C5CFA
  const primaryGreen: [number, number, number] = [31, 135, 102]; // #1F8766
  const textDark: [number, number, number] = [38, 35, 46];
  const mutedGray: [number, number, number] = [120, 115, 135];

  // 1. HEADER BANNER
  doc.setFillColor(primaryPurple[0], primaryPurple[1], primaryPurple[2]);
  doc.roundedRect(14, 12, 182, 24, 3, 3, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text("FELYS — LAPORAN KEUANGAN MAHASISWA", 20, 22);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Transparansi Pengelolaan Uang Saku & Beban Hidup Kuliah", 20, 29);

  // 2. METADATA SECTION
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("INFORMASI MAHASISWA & PERIODE", 14, 44);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Nama Mahasiswa: ${studentName}`, 14, 50);
  doc.text(`Email / Akun: ${studentEmail}`, 14, 55);

  doc.text(`Periode Laporan: ${periodName}`, 120, 50);
  doc.text(`Tanggal Unduh: ${printDate}`, 120, 55);

  // Divider
  doc.setDrawColor(220, 215, 230);
  doc.line(14, 60, 196, 60);

  // 3. EXECUTIVE FINANCIAL SUMMARY BOXES
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("RINGKASAN ARUS KAS (CASHFLOW SUMMARY)", 14, 67);

  // Box 1: Pemasukan
  doc.setFillColor(240, 253, 248);
  doc.roundedRect(14, 71, 56, 20, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(primaryGreen[0], primaryGreen[1], primaryGreen[2]);
  doc.text("TOTAL PEMASUKAN", 18, 77);
  doc.setFontSize(11);
  doc.text(formatCurrencyIDR(summary.totalIncome), 18, 86);

  // Box 2: Pengeluaran
  doc.setFillColor(255, 240, 242);
  doc.roundedRect(76, 71, 56, 20, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(217, 61, 74);
  doc.text("TOTAL PENGELUARAN", 80, 77);
  doc.setFontSize(11);
  doc.text(formatCurrencyIDR(summary.totalSpent), 80, 86);

  // Box 3: Saldo Sisa
  doc.setFillColor(245, 243, 255);
  doc.roundedRect(138, 71, 58, 20, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(primaryPurple[0], primaryPurple[1], primaryPurple[2]);
  doc.text("SALDO KAS BERSIH", 142, 77);
  doc.setFontSize(11);
  doc.text(formatCurrencyIDR(summary.netSavings), 142, 86);

  // Additional Daily Allowance note
  if (dailyAllowance) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(mutedGray[0], mutedGray[1], mutedGray[2]);
    doc.text(
      `• Jatah belanja harian aman: ${formatCurrencyIDR(dailyAllowance.dailyAllowance)}/hari  |  Rata-rata pengeluaran: ${formatCurrencyIDR(dailyAllowance.dailyBurnRate)}/hari`,
      14,
      97
    );
  }

  // 4. CATEGORY BREAKDOWN TABLE
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text("RINCIAN ANGGARAN & REALISASI PER KATEGORI", 14, 106);

  const categoryRows = summary.categories.map((c, i) => [
    `${i + 1}`,
    c.categoryName || "Kategori",
    c.monthlyLimit > 0 ? formatCurrencyIDR(c.monthlyLimit) : "Tidak dibatasi",
    formatCurrencyIDR(c.spentAmount),
    c.monthlyLimit > 0 ? formatCurrencyIDR(c.remainingAmount) : "-",
    c.monthlyLimit > 0 ? `${c.usedPercentage}%` : "-",
    c.status.toUpperCase(),
  ]);

  autoTable(doc, {
    startY: 110,
    head: [["No", "Kategori Pengeluaran", "Limit", "Realisasi", "Sisa", "Persen", "Status"]],
    body: categoryRows,
    theme: "grid",
    headStyles: {
      fillColor: [124, 92, 250],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
      halign: "center",
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [38, 35, 46],
    },
    columnStyles: {
      0: { halign: "center", cellWidth: 10 },
      1: { halign: "left" },
      2: { halign: "right" },
      3: { halign: "right" },
      4: { halign: "right" },
      5: { halign: "center" },
      6: { halign: "center" },
    },
  });

  // 5. RECENT TRANSACTIONS TABLE
  const lastY = (doc as any).lastAutoTable?.finalY || 160;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text("RIWAYAT TRANSAKSI TERAKHIR", 14, lastY + 10);

  const recentTransactions = transactions.slice(0, 15);
  const transactionRows = recentTransactions.map((trx, idx) => {
    const d = new Date(trx.date);
    const dateStr = `${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`;
    return [
      `${idx + 1}`,
      dateStr,
      trx.categoryName || "Kategori",
      trx.note || "-",
      trx.type === "income" ? "Pemasukan (+)" : "Pengeluaran (-)",
      formatCurrencyIDR(trx.amount),
    ];
  });

  autoTable(doc, {
    startY: lastY + 14,
    head: [["No", "Tanggal", "Kategori", "Catatan", "Jenis", "Nominal"]],
    body: transactionRows,
    theme: "striped",
    headStyles: {
      fillColor: [47, 43, 58],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
      halign: "center",
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [38, 35, 46],
    },
    columnStyles: {
      0: { halign: "center", cellWidth: 10 },
      1: { halign: "center" },
      2: { halign: "left" },
      3: { halign: "left" },
      4: { halign: "center" },
      5: { halign: "right" },
    },
  });

  // 6. FOOTER NOTES
  const finalY = (doc as any).lastAutoTable?.finalY || 250;
  if (finalY < 275) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7.5);
    doc.setTextColor(mutedGray[0], mutedGray[1], mutedGray[2]);
    doc.text(
      "Catatan: Laporan ini dibuat secara otomatis oleh sistem Felys Assistant untuk transparansi keuangan mahasiswa kepada orang tua / pihak beasiswa.",
      14,
      finalY + 10
    );
  }

  // Save the PDF
  const filename = `Laporan_Keuangan_Felys_${periodName.replace(/\s+/g, "_")}.pdf`;
  doc.save(filename);
}
