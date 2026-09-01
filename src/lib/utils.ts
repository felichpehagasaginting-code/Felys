import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, isToday, isTomorrow, isYesterday, differenceInDays } from "date-fns";
import { id } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrencyIDR(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumberShort(num: number): string {
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1).replace(/\.0$/, "")}jt`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(0)}rb`;
  }
  return num.toString();
}

export function formatDateRelative(dateInput: string | Date): string {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isToday(date)) {
    return `Hari ini, ${format(date, "HH:mm")}`;
  }
  if (isTomorrow(date)) {
    return `Besok, ${format(date, "HH:mm")}`;
  }
  if (isYesterday(date)) {
    return `Kemarin, ${format(date, "HH:mm")}`;
  }

  const daysDiff = differenceInDays(date, new Date());
  if (daysDiff > 0 && daysDiff <= 7) {
    return `${daysDiff} hari lagi (${format(date, "EEEE", { locale: id })})`;
  }

  return format(date, "d MMM yyyy", { locale: id });
}

export function getUrgencyBadgeConfig(score: number): {
  level: "urgent" | "warning" | "safe";
  label: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  dotColor: string;
} {
  if (score >= 80) {
    return {
      level: "urgent",
      label: "Mendesak",
      bgClass: "bg-[#FFE8EA]",
      textClass: "text-[#D93D4A]",
      borderClass: "border-[#FFA8B0]",
      dotColor: "#FF7A85",
    };
  }
  if (score >= 50) {
    return {
      level: "warning",
      label: "Perlu Dicicil",
      bgClass: "bg-[#FFF4E5]",
      textClass: "text-[#B86B14]",
      borderClass: "border-[#FFD59E]",
      dotColor: "#FFC978",
    };
  }
  return {
    level: "safe",
    label: "Santai",
    bgClass: "bg-[#E5FAF2]",
    textClass: "text-[#1F8766]",
    borderClass: "border-[#9EE9D0]",
    dotColor: "#7FE3C0",
  };
}

export function getBudgetStatusConfig(percentage: number): {
  status: "safe" | "attention" | "warning" | "overbudget";
  label: string;
  barColor: string;
  textColor: string;
  badgeBg: string;
} {
  if (percentage >= 100) {
    return {
      status: "overbudget",
      label: "Overbudget",
      barColor: "bg-[#FF7A85]",
      textColor: "text-[#D93D4A]",
      badgeBg: "bg-[#FFE8EA]",
    };
  }
  if (percentage >= 90) {
    return {
      status: "warning",
      label: "Mepet Limit",
      barColor: "bg-[#FF9F43]",
      textColor: "text-[#C25E00]",
      badgeBg: "bg-[#FFF0E0]",
    };
  }
  if (percentage >= 70) {
    return {
      status: "attention",
      label: "Perhatian",
      barColor: "bg-[#FFC978]",
      textColor: "text-[#B86B14]",
      badgeBg: "bg-[#FFF4E5]",
    };
  }
  return {
    status: "safe",
    label: "Aman",
    barColor: "bg-[#7FE3C0]",
    textColor: "text-[#1F8766]",
    badgeBg: "bg-[#E5FAF2]",
  };
}
