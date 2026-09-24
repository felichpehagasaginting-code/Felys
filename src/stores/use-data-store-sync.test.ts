import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useDataStore } from "./use-data-store";
import { FirestoreService } from "@/lib/firebase/firestore-service";

describe("useDataStore - 10-Channel Firestore Barrier & Skeleton Sync", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useDataStore.getState().resetDataStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("has correct initial state after resetDataStore (guest ready)", () => {
    useDataStore.getState().resetDataStore();
    const state = useDataStore.getState();

    expect(state.isLoaded).toBe(true);
    expect(state.isFirestoreReady).toBe(true);
    expect(state.isFirestoreSyncing).toBe(false);
  });

  it("coordinates 10 concurrent listeners and triggers isFirestoreReady only when all channels are ready", () => {
    // Mock all 10 FirestoreService subscribe methods to capture callbacks
    let profileCb: (d: any) => void = () => {};
    let coursesCb: (c: any[]) => void = () => {};
    let tasksCb: (t: any[]) => void = () => {};
    let accountsCb: (a: any[]) => void = () => {};
    let categoriesCb: (c: any[]) => void = () => {};
    let transactionsCb: (t: any[]) => void = () => {};
    let budgetsCb: (b: any[]) => void = () => {};
    let savingsCb: (s: any[]) => void = () => {};
    let billsCb: (b: any[]) => void = () => {};
    let debtsCb: (d: any[]) => void = () => {};

    vi.spyOn(FirestoreService, "seedDefaultCategoriesIfEmpty").mockImplementation(async () => {});
    vi.spyOn(FirestoreService, "syncLocalDataToFirestore").mockImplementation(async () => {});

    vi.spyOn(FirestoreService, "subscribeUserProfile").mockImplementation((_, cb) => {
      profileCb = cb;
      return () => {};
    });
    vi.spyOn(FirestoreService, "subscribeCourses").mockImplementation((_, cb) => {
      coursesCb = cb;
      return () => {};
    });
    vi.spyOn(FirestoreService, "subscribeTasks").mockImplementation((_, cb) => {
      tasksCb = cb;
      return () => {};
    });
    vi.spyOn(FirestoreService, "subscribeAccounts").mockImplementation((_, cb) => {
      accountsCb = cb;
      return () => {};
    });
    vi.spyOn(FirestoreService, "subscribeCategories").mockImplementation((_, cb) => {
      categoriesCb = cb;
      return () => {};
    });
    vi.spyOn(FirestoreService, "subscribeTransactions").mockImplementation((_, cb) => {
      transactionsCb = cb;
      return () => {};
    });
    vi.spyOn(FirestoreService, "subscribeBudgets").mockImplementation((_, cb) => {
      budgetsCb = cb;
      return () => {};
    });
    vi.spyOn(FirestoreService, "subscribeSavingsGoals").mockImplementation((_, cb) => {
      savingsCb = cb;
      return () => {};
    });
    vi.spyOn(FirestoreService, "subscribeRecurringBills").mockImplementation((_, cb) => {
      billsCb = cb;
      return () => {};
    });
    vi.spyOn(FirestoreService, "subscribeDebts").mockImplementation((_, cb) => {
      debtsCb = cb;
      return () => {};
    });

    // Start sync
    const unsub = useDataStore.getState().initFirestoreSync("test_user_123");

    // Barrier is now active: syncing started, not ready yet
    expect(useDataStore.getState().isFirestoreSyncing).toBe(true);
    expect(useDataStore.getState().isFirestoreReady).toBe(false);

    // Simulate 9 channels arriving
    profileCb({ ddayEvent: { title: "UAS", targetDate: "2026-10-10" } });
    coursesCb([]);
    tasksCb([]);
    accountsCb([]);
    categoriesCb([]);
    transactionsCb([]);
    budgetsCb([]);
    savingsCb([]);
    billsCb([]);

    // Still not ready because 10th channel (debts) has not arrived
    expect(useDataStore.getState().isFirestoreReady).toBe(false);
    expect(useDataStore.getState().isFirestoreSyncing).toBe(true);

    // 10th channel arrives
    debtsCb([]);

    // All 10 channels are ready!
    expect(useDataStore.getState().isFirestoreReady).toBe(true);
    expect(useDataStore.getState().isFirestoreSyncing).toBe(false);
    expect(useDataStore.getState().isLoaded).toBe(true);

    unsub();
  });

  it("releases the barrier via safety timeout if network has extreme lag", () => {
    vi.spyOn(FirestoreService, "seedDefaultCategoriesIfEmpty").mockImplementation(async () => {});
    vi.spyOn(FirestoreService, "syncLocalDataToFirestore").mockImplementation(async () => {});
    vi.spyOn(FirestoreService, "subscribeUserProfile").mockImplementation(() => () => {});
    vi.spyOn(FirestoreService, "subscribeCourses").mockImplementation(() => () => {});
    vi.spyOn(FirestoreService, "subscribeTasks").mockImplementation(() => () => {});
    vi.spyOn(FirestoreService, "subscribeAccounts").mockImplementation(() => () => {});
    vi.spyOn(FirestoreService, "subscribeCategories").mockImplementation(() => () => {});
    vi.spyOn(FirestoreService, "subscribeTransactions").mockImplementation(() => () => {});
    vi.spyOn(FirestoreService, "subscribeBudgets").mockImplementation(() => () => {});
    vi.spyOn(FirestoreService, "subscribeSavingsGoals").mockImplementation(() => () => {});
    vi.spyOn(FirestoreService, "subscribeRecurringBills").mockImplementation(() => () => {});
    vi.spyOn(FirestoreService, "subscribeDebts").mockImplementation(() => () => {});

    const unsub = useDataStore.getState().initFirestoreSync("test_user_timeout");

    expect(useDataStore.getState().isFirestoreReady).toBe(false);

    // Fast forward 3500ms
    vi.advanceTimersByTime(3500);

    // Safety timer should have unlocked the barrier
    expect(useDataStore.getState().isFirestoreReady).toBe(true);
    expect(useDataStore.getState().isFirestoreSyncing).toBe(false);

    unsub();
  });
});
