export type PriorityLevel = "low" | "medium" | "high";
export type TaskStatus = "todo" | "in_progress" | "done";

export interface CourseSchedule {
  id: string;
  dayOfWeek: 1 | 2 | 3 | 4 | 5 | 6 | 7; // 1 = Senin, ..., 5 = Jumat
  startTime: string; // "08:00"
  endTime: string;   // "10:30"
  room?: string;     // "Lab AI Gedung B"
}

export interface Course {
  id: string;
  name: string;
  color: string; // hex
  sks?: number | null;
  schedules?: CourseSchedule[];
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

export interface DDayEvent {
  title: string;
  targetDate: string; // YYYY-MM-DD
  updatedAt?: string;
}

export type UrgencyLevel = "urgent" | "warning" | "safe";
