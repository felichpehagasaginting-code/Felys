export type InsightType = "task_recommendation" | "budget_alert" | "cross_mode";

export interface AIInsight {
  id: string;
  type: InsightType;
  title: string;
  content: string;
  relatedTaskId?: string | null;
  relatedCategoryId?: string | null;
  actionCta?: {
    label: string;
    actionType: "navigate_task" | "start_task" | "open_budget" | "custom";
    targetId?: string;
  };
  isDismissed: boolean;
  createdAt: string;
  expiresAt?: string;
}

export interface AIChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
}
