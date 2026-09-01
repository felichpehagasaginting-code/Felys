"use client";

import React, { useState } from "react";
import { Check, Clock, Calendar, ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { Task } from "@/types/academic";
import { Card } from "@/components/ui/Card";
import { useDataStore } from "@/stores/use-data-store";
import { formatDateRelative, getUrgencyBadgeConfig, cn } from "@/lib/utils";
import confetti from "canvas-confetti";

interface TaskCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
}

export function TaskCard({ task, onEdit }: TaskCardProps) {
  const { toggleTaskStatus, toggleSubtask, addSubtask, deleteTask } = useDataStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");

  const isDone = task.status === "done";
  const urgencyConfig = getUrgencyBadgeConfig(task.urgencyScore);

  const handleToggleDone = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isDone) {
      // Trigger confetti on completion
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.8 },
        colors: ["#B69CFF", "#7FE3C0", "#FFC978"],
      });
    }
    toggleTaskStatus(task.id);
  };

  const handleAddSubtaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    addSubtask(task.id, newSubtaskTitle.trim());
    setNewSubtaskTitle("");
  };

  const progressPercent =
    task.totalSubtasksCount && task.totalSubtasksCount > 0
      ? Math.round(((task.completedSubtasksCount || 0) / task.totalSubtasksCount) * 100)
      : 0;

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-200 border",
        isDone
          ? "opacity-60 bg-[#FAF9FC]/50 dark:bg-[#1E1C24]/50 border-border"
          : "hover:shadow-card hover:-translate-y-0.5 bg-surface border-border"
      )}
    >
      {/* Left urgency vertical highlight bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1.5"
        style={{
          backgroundColor: isDone ? "#D1CADB" : urgencyConfig.dotColor,
        }}
      />

      <div className="pl-2">
        {/* Top Meta: Course Badge & Urgency Pill */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Course Tag */}
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold text-foreground/80 border"
              style={{
                backgroundColor: `${task.courseColor || "#B69CFF"}20`,
                borderColor: `${task.courseColor || "#B69CFF"}50`,
              }}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: task.courseColor || "#B69CFF" }}
              />
              {task.courseName || "Mata Kuliah"}
            </span>

            {/* Urgency Badge */}
            {!isDone && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border",
                  urgencyConfig.bgClass,
                  urgencyConfig.textClass,
                  urgencyConfig.borderClass
                )}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: urgencyConfig.dotColor }}
                />
                {urgencyConfig.label} ({Math.round(task.urgencyScore)})
              </span>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onEdit && (
              <button
                onClick={() => onEdit(task)}
                className="p-1 rounded-lg text-muted hover:text-foreground text-xs font-semibold"
              >
                Edit
              </button>
            )}
            <button
              onClick={() => deleteTask(task.id)}
              className="p-1 rounded-lg text-muted hover:text-[#FF7A85] transition-colors"
              title="Hapus tugas"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Task Title & Checkbox */}
        <div className="flex items-start gap-3 mb-2.5">
          <button
            type="button"
            onClick={handleToggleDone}
            className={cn(
              "mt-0.5 w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all select-none shrink-0",
              isDone
                ? "bg-[#7FE3C0] border-[#7FE3C0] text-white"
                : "border-[#8A8593]/40 hover:border-[#7C5CFA]"
            )}
          >
            {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
          </button>

          <div className="flex-1 min-w-0">
            <h4
              className={cn(
                "text-sm font-semibold text-foreground leading-snug transition-all",
                isDone && "line-through text-muted font-normal"
              )}
            >
              {task.title}
            </h4>

            {task.description && (
              <p className="text-xs text-muted mt-1 line-clamp-2 leading-relaxed">
                {task.description}
              </p>
            )}
          </div>
        </div>

        {/* Subtask Progress Bar (if any) */}
        {task.totalSubtasksCount && task.totalSubtasksCount > 0 ? (
          <div className="my-2.5">
            <div className="flex items-center justify-between text-[11px] text-muted mb-1">
              <span>Sub-tugas: {task.completedSubtasksCount} / {task.totalSubtasksCount}</span>
              <span className="font-semibold">{progressPercent}%</span>
            </div>
            <div className="w-full h-1.5 bg-[#EDEAF2] dark:bg-[#383442] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#7C5CFA] transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        ) : null}

        {/* Footer Meta: Deadline & Estimated Time */}
        <div className="flex items-center justify-between text-xs text-muted pt-2 border-t border-border/50">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-muted" />
              <span>{formatDateRelative(task.deadline)}</span>
            </span>

            {task.estimatedHours && (
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-muted" />
                <span>{task.estimatedHours} jam</span>
              </span>
            )}
          </div>

          {/* Subtasks collapse button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-[11px] font-semibold text-[#7C5CFA] hover:underline"
          >
            <span>Checklist</span>
            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {/* Expanded Subtasks List */}
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-border space-y-2">
            {task.subtasks && task.subtasks.length > 0 ? (
              task.subtasks.map((st) => (
                <div
                  key={st.id}
                  onClick={() => toggleSubtask(task.id, st.id)}
                  className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-black/5 cursor-pointer text-xs"
                >
                  <div
                    className={cn(
                      "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                      st.isDone
                        ? "bg-[#7FE3C0] border-[#7FE3C0] text-white"
                        : "border-muted/50"
                    )}
                  >
                    {st.isDone && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <span
                    className={cn(
                      "flex-1 text-foreground",
                      st.isDone && "line-through text-muted"
                    )}
                  >
                    {st.title}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted italic">Belum ada sub-tugas</p>
            )}

            {/* Quick add subtask input */}
            <form onSubmit={handleAddSubtaskSubmit} className="flex gap-2 pt-1">
              <input
                type="text"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                placeholder="Tambah sub-tugas baru..."
                className="flex-1 bg-surface border border-border rounded-lg px-2.5 py-1 text-xs text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent"
              />
              <button
                type="submit"
                className="p-1 rounded-lg bg-[#EDE5FF] text-[#7C5CFA] hover:bg-[#7C5CFA] hover:text-white transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </div>
    </Card>
  );
}
