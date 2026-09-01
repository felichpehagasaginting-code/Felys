export type PriorityLevel = "low" | "medium" | "high";
export type TaskStatus = "todo" | "in_progress" | "done";

export interface Course {
  id: string;
  name: string;
  color: string; // hex
  sks?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface SubTask {
  id: string;
  taskId: string;
  title: string;
  isDone: boolean;
  order: number;
  createdAt?: string;
}

export interface Task {
  id: string;
  title: string;
  courseId: string;
  courseName?: string;
  courseColor?: string;
  description?: string | null;
  deadline: string; // ISO string
  priority: PriorityLevel;
  estimatedHours?: number | null;
  status: TaskStatus;
  urgencyScore: number; // 0 - 100
  manualOrder?: number | null;
  completedSubtasksCount?: number;
  totalSubtasksCount?: number;
  subtasks?: SubTask[];
  createdAt: string;
  updatedAt: string;
}

export type UrgencyLevel = "urgent" | "warning" | "safe";
