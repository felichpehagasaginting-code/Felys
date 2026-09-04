import { z } from "zod";

export const transactionSchema = z.object({
  type: z.enum(["expense", "income"]),
  amount: z.number().int().positive().max(1_000_000_000),
  categoryId: z.string().min(1).max(100),
  categoryName: z.string().max(100).optional(),
  categoryIcon: z.string().max(50).optional(),
  categoryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  accountId: z.string().max(100).optional(),
  accountName: z.string().max(100).optional(),
  note: z.string().max(500).nullable().optional(),
  date: z.string().datetime({ offset: true }).or(z.string().min(1)),
});

export const adjustBalanceSchema = z.object({
  accountId: z.string().min(1).max(100),
  newBalance: z.number().int().min(0).max(100_000_000_000),
  reason: z.string().min(3).max(300),
});

export const transferSchema = z.object({
  fromId: z.string().min(1).max(100),
  toId: z.string().min(1).max(100),
  amount: z.number().int().positive().max(1_000_000_000),
  note: z.string().max(300).optional(),
}).refine((v) => v.fromId !== v.toId, { message: "Akun asal dan tujuan harus berbeda" });

export const taskSchema = z.object({
  title: z.string().min(1).max(200),
  courseId: z.string().min(1).max(100),
  deadline: z.string().min(1),
  priority: z.enum(["low", "medium", "high"]),
  estimatedHours: z.number().min(0).max(1000).nullable().optional(),
  description: z.string().max(2000).nullable().optional(),
  status: z.enum(["todo", "in_progress", "done"]).optional(),
});

export const budgetLimitSchema = z.object({
  categoryId: z.string().min(1).max(100),
  monthlyLimit: z.number().int().min(0).max(1_000_000_000),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020).max(2100),
});

export function stdSuccess(data: unknown, message = "Operasi berhasil") {
  return Response.json({ success: true, data, message });
}

export function stdError(code: string, message: string, status = 400, details: unknown[] = []) {
  return Response.json(
    { success: false, error: { code, message, details } },
    { status }
  );
}
