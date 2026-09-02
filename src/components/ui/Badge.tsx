import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "academic" | "finance" | "urgent" | "warning" | "success" | "outline";
}

export function Badge({ className, variant = "default", children, ...props }: BadgeProps) {
  const variantStyles = {
    default: "bg-[#ECE7DF] text-[#26222B] dark:bg-[#383442] dark:text-[#F8F7FA]",
    academic: "bg-[#EDE5FF] text-[#7C5CFA] border border-[#D1C2FF]",
    finance: "bg-[#E0FBF2] text-[#1F8766] border border-[#9EE9D0]",
    urgent: "bg-[#FFE8EA] text-[#D93D4A] border border-[#FFA8B0]",
    warning: "bg-[#FFF4E5] text-[#B86B14] border border-[#FFD59E]",
    success: "bg-[#E5FAF2] text-[#1F8766] border border-[#9EE9D0]",
    outline: "bg-transparent border border-border text-muted",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium select-none",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
