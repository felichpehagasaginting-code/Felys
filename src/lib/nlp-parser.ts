import { PriorityLevel, Task } from "@/types/academic";
import { Category, Transaction } from "@/types/finance";
import { addDays, setHours, setMinutes } from "date-fns";

export interface ParsedNLPResult {
  type: "task" | "transaction";
  taskData?: {
    title: string;
    courseName?: string;
    deadline: string;
    priority: PriorityLevel;
    estimatedHours: number;
  };
  transactionData?: {
    type: "expense" | "income";
    amount: number;
    categoryName?: string;
    note: string;
    date: string;
  };
  rawQuery: string;
  confidence: number;
}

const DAY_MAP: Record<string, number> = {
  senin: 1,
  selasa: 2,
  rabu: 3,
  kamis: 4,
  jumat: 5,
  "jum'at": 5,
  sabtu: 6,
  minggu: 7,
  ahad: 7,
};

/**
 * Natural Language Parser for Indonesian Student Productivity
 */
export function parseStudentNLP(
  query: string,
  categories: Category[] = [],
  courses: { id: string; name: string }[] = []
): ParsedNLPResult | null {
  const text = query.trim();
  if (!text || text.length < 3) return null;

  const lower = text.toLowerCase();

  // 1. Check if it's an Income Transaction
  const isIncome =
    lower.includes("uang saku") ||
    lower.includes("uang jajan") ||
    lower.includes("transferan") ||
    lower.includes("dikasih") ||
    lower.includes("gaji") ||
    lower.includes("pemasukan") ||
    lower.includes("dapat uang");

  // 2. Check for Currency / Amount (e.g. 25rb, 50k, 15.000, 20000, 1.5jt)
  const amountMatch = lower.match(
    /(?:rp\.?\s*)?(\d+(?:[.,]\d+)?)\s*(rb|k|ribu|jt|juta)?(?:\s|$|\b)/i
  );

  const isExplicitTask =
    lower.startsWith("tugas") ||
    lower.startsWith("makalah") ||
    lower.startsWith("laporan") ||
    lower.startsWith("pr") ||
    lower.startsWith("proyek") ||
    lower.startsWith("kuis") ||
    lower.startsWith("ujian") ||
    lower.includes("deadline") ||
    lower.includes("kumpul") ||
    lower.includes("submit");

  // If explicit task or no financial amount found, try task parser first
  if (isExplicitTask || (!amountMatch && !isIncome)) {
    return parseAsTask(text, lower, courses);
  }

  if (amountMatch) {
    let rawNum = parseFloat(amountMatch[1].replace(",", "."));
    const unit = amountMatch[2]?.toLowerCase();

    if (unit === "rb" || unit === "k" || unit === "ribu") {
      rawNum = rawNum * 1000;
    } else if (unit === "jt" || unit === "juta") {
      rawNum = rawNum * 1000000;
    } else if (rawNum < 1000 && !unit) {
      // e.g. "makan 15" -> assume 15k
      rawNum = rawNum * 1000;
    }

    const matchedAmount = Math.round(rawNum);

    // Find category from keywords
    let matchedCategory: Category | undefined;
    for (const cat of categories) {
      const catLower = cat.name.toLowerCase();
      if (lower.includes(catLower)) {
        matchedCategory = cat;
        break;
      }
    }

    if (!matchedCategory) {
      if (lower.includes("makan") || lower.includes("minum") || lower.includes("geprek") || lower.includes("bakso") || lower.includes("kfc") || lower.includes("mcd")) {
        matchedCategory = categories.find((c) => c.name.toLowerCase().includes("makan"));
      } else if (lower.includes("laundry") || lower.includes("cuci baju") || lower.includes("londri") || lower.includes("setrika") || lower.includes("dry clean")) {
        matchedCategory = categories.find((c) => c.name.toLowerCase().includes("laundry") || c.name.toLowerCase().includes("cuci"));
      } else if (lower.includes("kopi") || lower.includes("ngopi") || lower.includes("jajan") || lower.includes("snack") || lower.includes("boba")) {
        matchedCategory = categories.find((c) => c.name.toLowerCase().includes("kopi") || c.name.toLowerCase().includes("jajan"));
      } else if (lower.includes("bensin") || lower.includes("gojek") || lower.includes("grab") || lower.includes("angkot") || lower.includes("bus")) {
        matchedCategory = categories.find((c) => c.name.toLowerCase().includes("transport"));
      } else if (lower.includes("print") || lower.includes("fotokopi") || lower.includes("buku") || lower.includes("alat tulis")) {
        matchedCategory = categories.find((c) => c.name.toLowerCase().includes("kuliah"));
      } else if (isIncome) {
        matchedCategory = categories.find((c) => c.type === "income" || c.name.toLowerCase().includes("saku"));
      }
    }

    return {
      type: "transaction",
      rawQuery: text,
      confidence: 0.9,
      transactionData: {
        type: isIncome ? "income" : "expense",
        amount: matchedAmount,
        categoryName: matchedCategory?.name || (isIncome ? "Uang Saku / Pemasukan" : "Pengeluaran"),
        note: text,
        date: new Date().toISOString(),
      },
    };
  }

  return parseAsTask(text, lower, courses);
}

function parseAsTask(
  text: string,
  lower: string,
  courses: { id: string; name: string }[]
): ParsedNLPResult {
  const now = new Date();
  let deadline = addDays(now, 3); // Default 3 days from now
  deadline = setHours(setMinutes(deadline, 59), 23); // 23:59

  // 1. Check relative day keywords
  if (lower.includes("besok")) {
    deadline = addDays(now, 1);
  } else if (lower.includes("lusa")) {
    deadline = addDays(now, 2);
  } else if (lower.includes("hari ini") || lower.includes("nanti malam")) {
    deadline = now;
  } else {
    // Check day of week
    for (const [dayName, dayIndex] of Object.entries(DAY_MAP)) {
      if (lower.includes(dayName)) {
        const currentDayIndex = now.getDay() === 0 ? 7 : now.getDay();
        let daysToAdd = dayIndex - currentDayIndex;
        if (daysToAdd <= 0) daysToAdd += 7; // Next occurrence
        deadline = addDays(now, daysToAdd);
        break;
      }
    }
  }

  // 2. Check Time (e.g. jam 23:59 or jam 17.00)
  const timeMatch = lower.match(/jam\s*(\d{1,2})[:.](\d{2})/);
  if (timeMatch) {
    deadline = setHours(setMinutes(deadline, parseInt(timeMatch[2])), parseInt(timeMatch[1]));
  } else {
    deadline = setHours(setMinutes(deadline, 59), 23);
  }

  // 3. Check Priority
  let priority: PriorityLevel = "medium";
  if (lower.includes("prioritas tinggi") || lower.includes("penting banget") || lower.includes("urgent") || lower.includes("darurat")) {
    priority = "high";
  } else if (lower.includes("prioritas rendah") || lower.includes("santai")) {
    priority = "low";
  }

  // 4. Check Hours (e.g. 3 jam, 4 hours)
  const hourMatch = lower.match(/(\d+)\s*(?:jam|hours|sks)/);
  const estimatedHours = hourMatch ? parseInt(hourMatch[1]) : 3;

  // 5. Match Course
  let matchedCourse = courses.find((c) => lower.includes(c.name.toLowerCase()));

  // 6. Clean Title
  let cleanTitle = text
    .replace(/(?:kumpul|deadline|submit|hari|jam\s*\d{1,2}[:.]\d{2}|besok|lusa|senin|selasa|rabu|kamis|jumat|sabtu|minggu|prioritas\s*(?:tinggi|rendah|sedang)|\d+\s*jam|\d+\s*sks)/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleanTitle || cleanTitle.length < 3) {
    cleanTitle = text;
  }

  return {
    type: "task",
    rawQuery: text,
    confidence: 0.85,
    taskData: {
      title: cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1),
      courseName: matchedCourse?.name || "Kuliah Umum",
      deadline: deadline.toISOString(),
      priority,
      estimatedHours,
    },
  };
}
