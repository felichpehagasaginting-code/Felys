import { TeamWorkspace, WorkspaceMember, GroupTask, GroupTaskStatus } from "@/types/workspace";

export class WorkspaceService {
  /**
   * Generates a clean 6-character alphanumeric invite code (e.g., 'KMP892')
   */
  public static generateInviteCode(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Calculates overall workspace completion rate and per-member contribution.
   */
  public static calculateProgress(workspace: TeamWorkspace): {
    totalTasks: number;
    completedTasks: number;
    percentage: number;
    memberContributions: { uid: string; name: string; completed: number; total: number }[];
  } {
    const tasks = workspace.tasks || [];
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === "done").length;
    const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const memberMap = new Map<string, { uid: string; name: string; completed: number; total: number }>();

    (workspace.members || []).forEach((m) => {
      memberMap.set(m.uid, { uid: m.uid, name: m.displayName, completed: 0, total: 0 });
    });

    tasks.forEach((t) => {
      if (t.assigneeUid && memberMap.has(t.assigneeUid)) {
        const current = memberMap.get(t.assigneeUid)!;
        current.total += 1;
        if (t.status === "done") {
          current.completed += 1;
        }
      }
    });

    return {
      totalTasks,
      completedTasks,
      percentage,
      memberContributions: Array.from(memberMap.values()),
    };
  }

  /**
   * Creates a new Team Workspace with the creator as owner.
   */
  public static createWorkspace(
    owner: { uid: string; displayName: string; email?: string },
    title: string,
    courseName?: string,
    description?: string
  ): TeamWorkspace {
    const now = new Date().toISOString();
    return {
      id: `ws-${Date.now()}`,
      title,
      courseName,
      description,
      inviteCode: this.generateInviteCode(),
      ownerUid: owner.uid,
      members: [
        {
          uid: owner.uid,
          displayName: owner.displayName,
          email: owner.email,
          role: "owner",
        },
      ],
      tasks: [],
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * Adds a new member to the workspace if not already present.
   */
  public static addMember(
    workspace: TeamWorkspace,
    newMember: { uid: string; displayName: string; email?: string }
  ): TeamWorkspace {
    const exists = workspace.members.some((m) => m.uid === newMember.uid);
    if (exists) return workspace;

    return {
      ...workspace,
      members: [
        ...workspace.members,
        {
          uid: newMember.uid,
          displayName: newMember.displayName,
          email: newMember.email,
          role: "member",
        },
      ],
      updatedAt: new Date().toISOString(),
    };
  }
}
