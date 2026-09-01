"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "academic" | "finance";
  size?: "sm" | "md" | "lg" | "icon";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] select-none";

    const variantStyles = {
      primary: "bg-accent text-white hover:opacity-90 shadow-sm focus:ring-accent",
      academic: "bg-[#7C5CFA] text-white hover:bg-[#6846EB] shadow-sm focus:ring-[#7C5CFA]",
      finance: "bg-[#37B98F] text-white hover:bg-[#2CA17B] shadow-sm focus:ring-[#37B98F]",
      secondary: "bg-white border border-[#EDEAF2] text-[#2D2A32] hover:bg-[#FAF9FC] shadow-soft focus:ring-[#B69CFF]",
      ghost: "bg-transparent text-[#8A8593] hover:text-[#2D2A32] hover:bg-black/5 focus:ring-transparent",
      danger: "bg-[#FF7A85] text-white hover:bg-[#FA616E] shadow-sm focus:ring-[#FF7A85]",
    };

    const sizeStyles = {
      sm: "h-9 px-3.5 text-xs rounded-xl gap-1.5",
      md: "h-11 px-5 text-sm rounded-xl gap-2",
      lg: "h-13 px-6 text-base rounded-2xl gap-2.5",
      icon: "h-10 w-10 p-0 rounded-xl",
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
