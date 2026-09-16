"use client";

import React, { useState } from "react";
import { Modal, ModalContent } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { IOSSegmentedControl } from "@/components/ui/IOSSegmentedControl";
import { TeamWorkspace, GroupTask, GroupTaskStatus, WorkspaceMember } from "@/types/workspace";
import { WorkspaceService } from "@/server/services/workspace.service";
import { triggerHaptic } from "@/lib/haptics";
import { useAuthStore } from "@/stores/use-auth-store";
import { toast } from "sonner";
import {
  Users,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  Share2,
  Copy,
  FolderGit2,
  UserCheck,
  CheckSquare,
  Sparkles,
  X,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

interface TeamWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TeamWorkspaceModal({ isOpen, onClose }: TeamWorkspaceModalProps) {
  const { user, cachedDisplayName } = useAuthStore();
  const [activeTab, setActiveTab] = useState<"kanban" | "members" | "new_task">("kanban");

  // Sample default workspace for demo / storage
  const [workspace, setWorkspace] = useState<TeamWorkspace>(() => {
    const ownerName = user?.displayName?.split(" ")[0] || cachedDisplayName || "Saya";
    const initial = WorkspaceService.createWorkspace(
      { uid: user?.uid || "my-uid", displayName: ownerName, email: user?.email || undefined },
      "Makalah Riset Kolaboratif",
      "Kecerdasan Buatan"
    );
    // Add sample initial teammates & tasks
    initial.members.push({ uid: "u-andi", displayName: "Andi", role: "member" });
    initial.members.push({ uid: "u-citra", displayName: "Citra", role: "member" });
    initial.tasks.push({
      id: "gt-1",
      workspaceId: initial.id,
      title: "Pencarian Literatur & Review Jurnal",
      assigneeUid: "u-citra",
      assigneeName: "Citra",
      status: "done",
      milestone: "Fase 1",
      createdAt: new Date().toISOString(),
    });
    initial.tasks.push({
      id: "gt-2",
      workspaceId: initial.id,
      title: "Desain Arsitektur & Diagram Sistem",
      assigneeUid: user?.uid || "my-uid",
      assigneeName: ownerName,
      status: "in_progress",
      milestone: "Fase 2",
      createdAt: new Date().toISOString(),
    });
    initial.tasks.push({
      id: "gt-3",
      workspaceId: initial.id,
      title: "Penyusunan Slide Presentasi Akhir",
      assigneeUid: "u-andi",
      assigneeName: "Andi",
      status: "todo",
      milestone: "Fase 3",
      createdAt: new Date().toISOString(),
    });
    return initial;
  });

  // New task form state
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [selectedAssigneeUid, setSelectedAssigneeUid] = useState(user?.uid || "my-uid");
  const [newTaskMilestone, setNewTaskMilestone] = useState("Fase 1");

  // Join code state
  const [joinCodeInput, setJoinCodeInput] = useState("");

  if (!isOpen) return null;

  const progress = WorkspaceService.calculateProgress(workspace);

  const handleCopyInvite = () => {
    triggerHaptic("light");
    navigator.clipboard.writeText(workspace.inviteCode);
    toast.success(`Kode Undangan "${workspace.inviteCode}" disalin ke clipboard! 📋`);
  };

  const handleTaskStatusChange = (taskId: string, newStatus: GroupTaskStatus) => {
    triggerHaptic("light");
    setWorkspace((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)),
    }));
  };

  const handleCreateGroupTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    triggerHaptic("success");
    const assignee = workspace.members.find((m) => m.uid === selectedAssigneeUid);
    const newTask: GroupTask = {
      id: `gt-${Date.now()}`,
      workspaceId: workspace.id,
      title: newTaskTitle.trim(),
      assigneeUid: assignee?.uid,
      assigneeName: assignee?.displayName || "Belum Ditugaskan",
      status: "todo",
      milestone: newTaskMilestone,
      createdAt: new Date().toISOString(),
    };

    setWorkspace((prev) => ({
      ...prev,
      tasks: [...prev.tasks, newTask],
    }));

    setNewTaskTitle("");
    setActiveTab("kanban");
    toast.success(`Tugas kelompok "${newTask.title}" berhasil ditambahkan! 🚀`);
  };

  const handleJoinByCode = () => {
    if (!joinCodeInput.trim() || joinCodeInput.trim().length !== 6) {
      toast.error("Masukkan 6 digit kode undangan kelompok.");
      return;
    }
    triggerHaptic("success");
    toast.success(`Berhasil bergabung ke kelompok kode ${joinCodeInput.toUpperCase()}! 🎉`);
    setJoinCodeInput("");
  };

  const kanbanColumns: { id: GroupTaskStatus; label: string; color: string }[] = [
    { id: "todo", label: "Antrean 📋", color: "border-border" },
    { id: "in_progress", label: "Dikerjakan ⏳", color: "border-[#7C5CFA]" },
    { id: "done", label: "Selesai ✅", color: "border-[#7FE3C0]" },
  ];

  return (
    <Modal open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <ModalContent className="max-w-2xl w-[94vw] p-5 sm:p-7 max-h-[88vh] overflow-y-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#7C5CFA] to-[#B69CFF] text-white flex items-center justify-center shadow-soft shrink-0">
              <FolderGit2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-foreground truncate">
                  {workspace.title}
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EDE5FF] dark:bg-[#342A45] text-[#7C5CFA] shrink-0">
                  {workspace.courseName || "Tugas Kelompok"}
                </span>
              </div>
              <p className="text-xs text-muted">
                Kolaborasi tim, pembagian sub-tugas, & pantau kontribusi anggota
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-muted hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress & Accountability Bar */}
        <div className="p-3.5 rounded-2xl bg-[#FAF9FC] dark:bg-[#201D28] border border-border space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-foreground flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#7C5CFA]" />
              <span>Progres Tim: {progress.completedTasks}/{progress.totalTasks} Tugas Tuntas</span>
            </span>
            <span className="font-mono font-extrabold text-[#7C5CFA]">
              {progress.percentage}%
            </span>
          </div>
          <div className="w-full h-2 bg-surface rounded-full overflow-hidden border border-border/80">
            <div
              className="h-full bg-gradient-to-r from-[#7C5CFA] via-[#B69CFF] to-[#7FE3C0] transition-all duration-300 rounded-full"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
        </div>

        {/* Tab Switcher */}
        <IOSSegmentedControl<"kanban" | "members" | "new_task">
          options={[
            {
              id: "kanban",
              label: `Papan Kanban (${workspace.tasks.length})`,
              activeColor: "bg-[#7C5CFA]",
              activeTextColor: "text-white",
            },
            {
              id: "members",
              label: `Anggota (${workspace.members.length})`,
              activeColor: "bg-[#7FE3C0]",
              activeTextColor: "text-[#0F3E30] dark:text-[#0F3E30]",
            },
            {
              id: "new_task",
              label: "+ Bagi Tugas",
              activeColor: "bg-[#8EC8FF]",
              activeTextColor: "text-[#0C2D48]",
            },
          ]}
          value={activeTab}
          onChange={(tab) => {
            triggerHaptic("light");
            setActiveTab(tab);
          }}
          size="sm"
          className="w-full"
        />

        {activeTab === "kanban" ? (
          /* KANBAN BOARD */
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {kanbanColumns.map((col) => {
              const colTasks = workspace.tasks.filter((t) => t.status === col.id);
              return (
                <div
                  key={col.id}
                  className="p-3 rounded-2xl bg-surface border border-border flex flex-col space-y-2.5 min-h-[220px]"
                >
                  <div className="flex items-center justify-between pb-1.5 border-b border-border/60">
                    <span className="text-xs font-bold text-foreground">
                      {col.label}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-black/5 dark:bg-white/5 text-muted">
                      {colTasks.length}
                    </span>
                  </div>

                  <div className="space-y-2 flex-1">
                    {colTasks.length === 0 ? (
                      <p className="text-[11px] text-muted text-center py-6 italic opacity-70">
                        Kosong
                      </p>
                    ) : (
                      colTasks.map((task) => (
                        <div
                          key={task.id}
                          className="p-2.5 rounded-xl bg-[#FAF9FC] dark:bg-[#201D28] border border-border shadow-xs space-y-1.5 text-xs hover:border-[#7C5CFA]/40 transition-all"
                        >
                          <div className="font-bold text-foreground leading-snug">
                            {task.title}
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-muted pt-1 border-t border-border/40">
                            <span className="font-semibold text-[#7C5CFA] bg-[#EDE5FF] dark:bg-[#342A45] px-1.5 py-0.5 rounded-md">
                              👤 {task.assigneeName}
                            </span>
                            {task.milestone && (
                              <span className="opacity-80 font-mono">
                                {task.milestone}
                              </span>
                            )}
                          </div>

                          {/* Quick Status Mover Buttons */}
                          <div className="flex items-center justify-end gap-1 pt-1">
                            {task.status !== "todo" && (
                              <button
                                type="button"
                                onClick={() => handleTaskStatusChange(task.id, "todo")}
                                className="text-[9px] px-1.5 py-0.5 rounded bg-surface hover:bg-black/5 text-muted"
                                title="Kembalikan ke Todo"
                              >
                                ← Antre
                              </button>
                            )}
                            {task.status !== "in_progress" && task.status !== "done" && (
                              <button
                                type="button"
                                onClick={() => handleTaskStatusChange(task.id, "in_progress")}
                                className="text-[9px] px-1.5 py-0.5 rounded bg-[#EDE5FF] text-[#7C5CFA] font-bold"
                              >
                                Mulai →
                              </button>
                            )}
                            {task.status !== "done" && (
                              <button
                                type="button"
                                onClick={() => handleTaskStatusChange(task.id, "done")}
                                className="text-[9px] px-1.5 py-0.5 rounded bg-[#E0FBF2] text-[#1F8766] font-bold"
                              >
                                Beres ✓
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : activeTab === "members" ? (
          /* MEMBERS & INVITE CODE */
          <div className="space-y-4 pt-1">
            {/* Invite Code Box */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-[#EDE5FF] to-[#E0FBF2] dark:from-[#2B2338] dark:to-[#1E2E28] border border-[#B69CFF]/30 flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted block">
                  Kode Undangan Kelompok:
                </span>
                <span className="text-xl font-mono font-black text-foreground tracking-widest">
                  {workspace.inviteCode}
                </span>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleCopyInvite}
                className="rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
              >
                <Copy className="w-3.5 h-3.5 text-[#7C5CFA]" />
                <span>Salin Kode</span>
              </Button>
            </div>

            {/* Member Contributions */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-muted uppercase tracking-wider block">
                Daftar Anggota & Kontribusi:
              </span>
              <div className="space-y-2">
                {progress.memberContributions.map((member) => (
                  <div
                    key={member.uid}
                    className="p-3 rounded-2xl bg-surface border border-border flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-[#EDE5FF] dark:bg-[#342A45] text-[#7C5CFA] font-bold flex items-center justify-center text-xs shrink-0">
                        {member.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-foreground block truncate">
                          {member.name}
                        </span>
                        <span className="text-[10px] text-muted">
                          {member.completed} dari {member.total} tugas selesai
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="w-20 sm:w-28 h-2 bg-[#FAF9FC] dark:bg-[#2A2634] rounded-full overflow-hidden border border-border">
                        <div
                          className="h-full bg-[#7FE3C0] rounded-full transition-all"
                          style={{
                            width: `${member.total > 0 ? Math.round((member.completed / member.total) * 100) : 0}%`,
                          }}
                        />
                      </div>
                      <span className="text-[10px] font-mono font-bold text-muted w-8 text-right">
                        {member.total > 0 ? Math.round((member.completed / member.total) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Join Another Group */}
            <div className="pt-2 border-t border-border space-y-2">
              <span className="text-xs font-bold text-muted block">
                Gabung ke Kelompok Lain:
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Masukkan 6 digit kode (contoh: KMP892)"
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                  maxLength={6}
                  className="flex-1 p-2 text-xs font-mono rounded-xl bg-surface border border-border text-foreground uppercase tracking-widest focus:outline-none"
                />
                <Button
                  type="button"
                  variant="academic"
                  size="sm"
                  onClick={handleJoinByCode}
                  className="rounded-xl font-bold"
                >
                  Gabung
                </Button>
              </div>
            </div>
          </div>
        ) : (
          /* NEW TASK FORM */
          <form onSubmit={handleCreateGroupTask} className="space-y-3 pt-1">
            <div>
              <label className="text-xs font-bold text-muted block mb-1">
                Judul Tugas / Milestone:
              </label>
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Contoh: Analisis dataset BAB 4, Pembuatan prototype Figma, dll."
                className="w-full p-2.5 rounded-2xl bg-surface border border-border text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[#7C5CFA]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-muted block mb-1">
                  Tugaskan ke Anggota:
                </label>
                <select
                  value={selectedAssigneeUid}
                  onChange={(e) => setSelectedAssigneeUid(e.target.value)}
                  className="w-full p-2.5 rounded-2xl bg-surface border border-border text-xs text-foreground focus:outline-none"
                >
                  {workspace.members.map((m) => (
                    <option key={m.uid} value={m.uid}>
                      {m.displayName} {m.role === "owner" ? "(Ketua)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-muted block mb-1">
                  Fase / Milestone:
                </label>
                <input
                  type="text"
                  value={newTaskMilestone}
                  onChange={(e) => setNewTaskMilestone(e.target.value)}
                  placeholder="Fase 1 / Bab 2"
                  className="w-full p-2.5 rounded-2xl bg-surface border border-border text-xs text-foreground focus:outline-none"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="academic"
              size="md"
              disabled={!newTaskTitle.trim()}
              className="w-full rounded-2xl font-bold shadow-soft mt-2"
            >
              + Tambahkan ke Papan Tugas Tim
            </Button>
          </form>
        )}
      </ModalContent>
    </Modal>
  );
}
