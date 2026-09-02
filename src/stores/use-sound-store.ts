"use client";

import { create } from "zustand";

const SOUND_STORAGE_KEY = "felys_sound_enabled";
const VOLUME_STORAGE_KEY = "felys_sound_volume";

interface SoundStore {
  isSoundEnabled: boolean;
  volume: number; // 0 to 1
  setSoundEnabled: (enabled: boolean) => void;
  setVolume: (volume: number) => void;
  toggleSound: () => void;
}

export const useSoundStore = create<SoundStore>((set) => ({
  isSoundEnabled:
    typeof window !== "undefined"
      ? localStorage.getItem(SOUND_STORAGE_KEY) !== "false"
      : true,
  volume:
    typeof window !== "undefined"
      ? parseFloat(localStorage.getItem(VOLUME_STORAGE_KEY) || "0.65")
      : 0.65,

  setSoundEnabled: (enabled) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(SOUND_STORAGE_KEY, String(enabled));
    }
    set({ isSoundEnabled: enabled });
  },

  setVolume: (vol) => {
    const clamped = Math.max(0, Math.min(1, vol));
    if (typeof window !== "undefined") {
      localStorage.setItem(VOLUME_STORAGE_KEY, String(clamped));
    }
    set({ volume: clamped });
  },

  toggleSound: () => {
    set((state) => {
      const next = !state.isSoundEnabled;
      if (typeof window !== "undefined") {
        localStorage.setItem(SOUND_STORAGE_KEY, String(next));
      }
      return { isSoundEnabled: next };
    });
  },
}));
