export type GroupTaskStatus = "todo" | "in_progress" | "review" | "done";

export interface WorkspaceMember {
  uid: string;
  displayName: string;
  email?: string;
  role: "owner" | "member";
  avatarUrl?: string;
}

export interface GroupTask {
  id: string;
  workspaceId: string;
  title: string;
  description?: string;
  assigneeUid?: string;
  assigneeName?: string;
  deadline?: string;
  status: GroupTaskStatus;
  milestone?: string;
  createdAt: string;
  completedAt?: string;
}

export interface TeamWorkspace {
  id: string;
  title: string;
  courseName?: string;
  description?: string;
  inviteCode: string;
  ownerUid: string;
  members: WorkspaceMember[];
  tasks: GroupTask[];
  createdAt: string;
  updatedAt: string;
}
