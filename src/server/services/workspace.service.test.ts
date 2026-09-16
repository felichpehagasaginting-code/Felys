import { describe, it, expect } from "vitest";
import { WorkspaceService } from "./workspace.service";
import { TeamWorkspace } from "@/types/workspace";

describe("WorkspaceService", () => {
  it("creates a new workspace with owner role and valid invite code", () => {
    const ws = WorkspaceService.createWorkspace(
      { uid: "u1", displayName: "Felich", email: "felich@felys.app" },
      "Makalah Sistem Informasi",
      "Manajemen Sistem"
    );

    expect(ws.title).toBe("Makalah Sistem Informasi");
    expect(ws.members.length).toBe(1);
    expect(ws.members[0].role).toBe("owner");
    expect(ws.inviteCode.length).toBe(6);
  });

  it("calculates progress and individual member contributions", () => {
    const ws: TeamWorkspace = {
      id: "ws-1",
      title: "Proyek AI",
      inviteCode: "ABC123",
      ownerUid: "u1",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      members: [
        { uid: "u1", displayName: "Budi", role: "owner" },
        { uid: "u2", displayName: "Siti", role: "member" },
      ],
      tasks: [
        {
          id: "t1",
          workspaceId: "ws-1",
          title: "Tugas 1",
          assigneeUid: "u1",
          status: "done",
          createdAt: new Date().toISOString(),
        },
        {
          id: "t2",
          workspaceId: "ws-1",
          title: "Tugas 2",
          assigneeUid: "u2",
          status: "in_progress",
          createdAt: new Date().toISOString(),
        },
      ],
    };

    const progress = WorkspaceService.calculateProgress(ws);

    expect(progress.totalTasks).toBe(2);
    expect(progress.completedTasks).toBe(1);
    expect(progress.percentage).toBe(50);

    const budi = progress.memberContributions.find((m) => m.name === "Budi");
    const siti = progress.memberContributions.find((m) => m.name === "Siti");

    expect(budi?.completed).toBe(1);
    expect(siti?.completed).toBe(0);
  });
});
