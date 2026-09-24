"use client";

import { create } from "zustand";
import { AIChatMessage } from "@/types/ai";
import { FirestoreService } from "@/lib/firebase/firestore-service";
import { auth } from "@/lib/firebase/client";

function getCurrentUserId(): string | null {
  return auth.currentUser?.uid || null;
}

interface AIState {
  isDrawerOpen: boolean;
  messages: AIChatMessage[];
  isLoading: boolean;
  pendingPrompt: string | null;
  openDrawer: () => void;
  openDrawerWithPrompt: (prompt: string) => void;
  clearPendingPrompt: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  addMessage: (message: Omit<AIChatMessage, "id" | "createdAt">) => void;
  setLoading: (loading: boolean) => void;
  clearMessages: () => Promise<void>;
  initFirestoreSync: (userId: string) => () => void;
  resetAIStore: () => void;
}

const initialMessages: AIChatMessage[] = [
  {
    id: "msg_init_1",
    role: "assistant",
    content: "Hai! Aku **Fio**, asisten pintar Felys kamu. Mau cek tugas yang harus dikerjain duluan atau mau cek sisa budget hari ini?",
    createdAt: new Date().toISOString(),
  },
];

let activeAiUnsubscribe: (() => void) | null = null;

export const useAIStore = create<AIState>((set, get) => ({
  isDrawerOpen: false,
  messages: initialMessages,
  isLoading: false,
  pendingPrompt: null,

  openDrawer: () => set({ isDrawerOpen: true }),
  openDrawerWithPrompt: (prompt: string) => set({ isDrawerOpen: true, pendingPrompt: prompt }),
  clearPendingPrompt: () => set({ pendingPrompt: null }),
  closeDrawer: () => set({ isDrawerOpen: false }),
  toggleDrawer: () => set((state) => ({ isDrawerOpen: !state.isDrawerOpen })),

  addMessage: (msg) => {
    const newMessage: AIChatMessage = {
      ...msg,
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      messages: [...state.messages, newMessage],
    }));

    const userId = getCurrentUserId();
    if (userId) {
      FirestoreService.saveAiMessage(userId, newMessage).catch((err) =>
        console.warn("Firestore saveAiMessage warning:", err)
      );
    }
  },

  setLoading: (loading) => set({ isLoading: loading }),

  clearMessages: async () => {
    set({ messages: initialMessages });
    const userId = getCurrentUserId();
    if (userId) {
      try {
        await FirestoreService.clearAiMessages(userId);
      } catch (err) {
        console.warn("Firestore clearAiMessages warning:", err);
      }
    }
  },

  initFirestoreSync: (userId: string) => {
    if (activeAiUnsubscribe) {
      activeAiUnsubscribe();
      activeAiUnsubscribe = null;
    }

    const unsub = FirestoreService.subscribeAiMessages(userId, (dbMsgs) => {
      if (dbMsgs && dbMsgs.length > 0) {
        set({ messages: dbMsgs });
      }
    });

    activeAiUnsubscribe = unsub;
    return unsub;
  },

  resetAIStore: () => {
    if (activeAiUnsubscribe) {
      activeAiUnsubscribe();
      activeAiUnsubscribe = null;
    }
    set({
      isDrawerOpen: false,
      messages: initialMessages,
      isLoading: false,
      pendingPrompt: null,
    });
  },
}));
