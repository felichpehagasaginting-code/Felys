import { getVerifiedUid, requireAdminDb } from "@/lib/firebase/auth-helpers";
import { taskSchema, stdSuccess, stdError } from "@/lib/validation";
import { recomputeUrgency } from "@/server/services/finance-ledger.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/academic/tasks?status&courseId — server sorted by urgencyScore */
export async function GET(req: Request) {
  try {
    const uid = await getVerifiedUid(req);
    if (!uid) return stdError("UNAUTHORIZED", "Silakan login ulang.", 401);
    const db = requireAdminDb();
    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    const courseId = url.searchParams.get("courseId");

    let q: FirebaseFirestore.Query = db
      .collection("users").doc(uid).collection("tasks")
      .orderBy("urgencyScore", "desc").limit(100);
    if (status && status !== "all") q = q.where("status", "==", status);
    if (courseId) q = q.where("courseId", "==", courseId);
    const snap = await q.get();
    return stdSuccess(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  } catch (e: unknown) {
    return stdError("INTERNAL_ERROR", e instanceof Error ? e.message : "Gagal memuat tugas.", 500);
  }
}

/** POST /api/academic/tasks — hitung urgencyScore di server (P5) */
export async function POST(req: Request) {
  try {
    const uid = await getVerifiedUid(req);
    if (!uid) return stdError("UNAUTHORIZED", "Silakan login ulang.", 401);
    const body = await req.json();
    const parsed = taskSchema.safeParse(body);
    if (!parsed.success) return stdError("BAD_REQUEST", "Data tugas tidak valid.", 400, parsed.error.issues);
    const t = parsed.data;
    const db = requireAdminDb();

    const courseSnap = await db.collection("users").doc(uid).collection("courses").doc(t.courseId).get();
    const course = courseSnap.exists ? courseSnap.data() : undefined;
    const urgencyScore = recomputeUrgency({
      deadline: t.deadline, priority: t.priority, estimatedHours: t.estimatedHours ?? null,
    });

    const ref = db.collection("users").doc(uid).collection("tasks").doc();
    const data = {
      ...t,
      courseName: (course?.name as string) || null,
      courseColor: (course?.color as string) || null,
      status: t.status || "todo",
      urgencyScore,
      manualOrder: null,
      completedSubtasksCount: 0,
      totalSubtasksCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await ref.set(data);
    return stdSuccess({ id: ref.id, ...data }, "Tugas dibuat.");
  } catch (e: unknown) {
    return stdError("INTERNAL_ERROR", e instanceof Error ? e.message : "Gagal membuat tugas.", 500);
  }
}
