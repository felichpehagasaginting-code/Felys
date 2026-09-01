"use client";

import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Budget } from "@/types/finance";
import { formatCurrencyIDR } from "@/lib/utils";

interface DonutExpenseChartProps {
  budgets: Budget[];
}

export function DonutExpenseChart({ budgets }: DonutExpenseChartProps) {
  const chartData = budgets
    .filter((b) => b.spentAmount > 0)
    .map((b) => ({
      name: b.categoryName || "Kategori",
      value: b.spentAmount,
      color: b.categoryColor || "#7FE3C0",
    }));

  if (chartData.length === 0) {
    return (
      <div className="h-56 flex flex-col items-center justify-center text-center p-4">
        <p className="text-xs text-muted">Belum ada data pengeluaran bulan ini</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={4}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: any) => [formatCurrencyIDR(Number(value)), "Pengeluaran"]}
              contentStyle={{
                backgroundColor: "var(--bg-surface)",
                borderColor: "var(--border-soft)",
                borderRadius: "12px",
                fontSize: "12px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Custom Legend */}
      <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
        {chartData.map((item, idx) => (
          <div key={idx} className="flex items-center gap-1.5 text-xs text-muted">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="font-medium text-foreground">{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
