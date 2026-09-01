"use client";

import { create } from "zustand";
import { AIChatMessage } from "@/types/ai";

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
  clearMessages: () => void;
}

const initialMessages: AIChatMessage[] = [
  {
    id: "msg_init_1",
    role: "assistant",
    content: "Hai! Aku **Fio**, asisten pintar Felys kamu ✨ Mau cek tugas yang harus dikerjain duluan atau mau cek sisa budget hari ini?",
    createdAt: new Date().toISOString(),
  },
];

export const useAIStore = create<AIState>((set) => ({
  isDrawerOpen: false,
  messages: initialMessages,
  isLoading: false,
  pendingPrompt: null,
  openDrawer: () => set({ isDrawerOpen: true }),
  openDrawerWithPrompt: (prompt: string) => set({ isDrawerOpen: true, pendingPrompt: prompt }),
  clearPendingPrompt: () => set({ pendingPrompt: null }),
  closeDrawer: () => set({ isDrawerOpen: false }),
  toggleDrawer: () => set((state) => ({ isDrawerOpen: !state.isDrawerOpen })),
  addMessage: (msg) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          ...msg,
          id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
          createdAt: new Date().toISOString(),
        },
      ],
    })),
  setLoading: (loading) => set({ isLoading: loading }),
  clearMessages: () => set({ messages: initialMessages }),
}));
