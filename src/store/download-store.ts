"use client";

import { create } from "zustand";
import type { MediaMetadata, MediaFormat } from "@/lib/providers/base";
import { triggerFileDownload } from "@/lib/utils";

export type QueueItemStatus =
  | "queued"
  | "downloading"
  | "paused"
  | "completed"
  | "failed"
  | "cancelled";

export interface QueueItem {
  id: string;
  metadata: MediaMetadata;
  format: MediaFormat;
  status: QueueItemStatus;
  progress: number;
  speed: number;
  error?: string;
  createdAt: number;
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  itemCount: number;
  cover?: string;
}

interface DownloadState {
  queue: QueueItem[];
  history: QueueItem[];
  collections: Collection[];
  activeMetadata: MediaMetadata | null;
  isInspectorOpen: boolean;
  isCommandOpen: boolean;
  isParsing: boolean;
  parseError: string | null;
  currentView: "dashboard" | "history" | "collections" | "favorites" | "settings";

  setActiveMetadata: (meta: MediaMetadata | null) => void;
  setInspectorOpen: (open: boolean) => void;
  setCommandOpen: (open: boolean) => void;
  setParsing: (v: boolean) => void;
  setParseError: (err: string | null) => void;
  setCurrentView: (view: DownloadState["currentView"]) => void;

  addToQueue: (metadata: MediaMetadata, format: MediaFormat) => string;
  updateQueueItem: (id: string, patch: Partial<QueueItem>) => void;
  removeFromQueue: (id: string) => void;
  pauseItem: (id: string) => void;
  resumeItem: (id: string) => void;
  cancelItem: (id: string) => void;
  clearCompleted: () => void;
  simulateDownload: (id: string) => void;
}

const defaultCollections: Collection[] = [
  {
    id: "col_anime",
    name: "Anime",
    description: "Clips, OPs, and AMVs",
    color: "#a855f7",
    icon: "sparkles",
    itemCount: 12,
    cover: "https://picsum.photos/seed/anime/400/300",
  },
  {
    id: "col_tutorials",
    name: "Tutorials",
    description: "Dev & design learning",
    color: "#3b82f6",
    icon: "book-open",
    itemCount: 8,
    cover: "https://picsum.photos/seed/tutorials/400/300",
  },
  {
    id: "col_music",
    name: "Music",
    description: "Tracks and live sets",
    color: "#ec4899",
    icon: "music",
    itemCount: 24,
    cover: "https://picsum.photos/seed/music/400/300",
  },
  {
    id: "col_work",
    name: "Work",
    description: "Reference & assets",
    color: "#14b8a6",
    icon: "briefcase",
    itemCount: 5,
    cover: "https://picsum.photos/seed/work/400/300",
  },
  {
    id: "col_personal",
    name: "Personal",
    description: "Memories & saves",
    color: "#f59e0b",
    icon: "heart",
    itemCount: 17,
    cover: "https://picsum.photos/seed/personal/400/300",
  },
  {
    id: "col_favorites",
    name: "Favorites",
    description: "Starred media",
    color: "#ef4444",
    icon: "star",
    itemCount: 9,
    cover: "https://picsum.photos/seed/favorites/400/300",
  },
];

export const useDownloadStore = create<DownloadState>((set, get) => ({
  queue: [],
  history: [],
  collections: defaultCollections,
  activeMetadata: null,
  isInspectorOpen: false,
  isCommandOpen: false,
  isParsing: false,
  parseError: null,
  currentView: "dashboard",

  setActiveMetadata: (meta) => set({ activeMetadata: meta }),
  setInspectorOpen: (open) => set({ isInspectorOpen: open }),
  setCommandOpen: (open) => set({ isCommandOpen: open }),
  setParsing: (v) => set({ isParsing: v }),
  setParseError: (err) => set({ parseError: err }),
  setCurrentView: (view) => set({ currentView: view }),

  addToQueue: (metadata, format) => {
    const id = `dl_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const item: QueueItem = {
      id,
      metadata,
      format,
      status: "queued",
      progress: 0,
      speed: 0,
      createdAt: Date.now(),
    };
    set((s) => ({ queue: [item, ...s.queue] }));
    setTimeout(() => get().simulateDownload(id), 300);
    return id;
  },

  updateQueueItem: (id, patch) =>
    set((s) => ({
      queue: s.queue.map((q) => (q.id === id ? { ...q, ...patch } : q)),
    })),

  removeFromQueue: (id) =>
    set((s) => ({ queue: s.queue.filter((q) => q.id !== id) })),

  pauseItem: (id) =>
    set((s) => ({
      queue: s.queue.map((q) =>
        q.id === id && q.status === "downloading"
          ? { ...q, status: "paused", speed: 0 }
          : q
      ),
    })),

  resumeItem: (id) => {
    set((s) => ({
      queue: s.queue.map((q) =>
        q.id === id && q.status === "paused"
          ? { ...q, status: "downloading" }
          : q
      ),
    }));
    get().simulateDownload(id);
  },

  cancelItem: (id) =>
    set((s) => ({
      queue: s.queue.map((q) =>
        q.id === id ? { ...q, status: "cancelled", speed: 0 } : q
      ),
    })),

  clearCompleted: () =>
    set((s) => {
      const completed = s.queue.filter((q) => q.status === "completed");
      return {
        queue: s.queue.filter(
          (q) => q.status !== "completed" && q.status !== "cancelled"
        ),
        history: [...completed, ...s.history].slice(0, 50),
      };
    }),

  simulateDownload: (id) => {
    const tick = () => {
      const item = get().queue.find((q) => q.id === id);
      if (!item) return;
      if (item.status === "paused" || item.status === "cancelled") return;
      if (item.status === "completed" || item.status === "failed") return;

      if (item.status === "queued") {
        get().updateQueueItem(id, { status: "downloading" });
      }

      const current = get().queue.find((q) => q.id === id);
      if (!current || current.status !== "downloading") return;

      const increment = 2 + Math.random() * 8;
      const nextProgress = Math.min(100, current.progress + increment);
      const speed = 500_000 + Math.random() * 2_500_000;

      if (nextProgress >= 100) {
        get().updateQueueItem(id, {
          progress: 100,
          speed: 0,
          status: "completed",
        });
        const done = get().queue.find((q) => q.id === id);
        if (done) {
          triggerFileDownload(done.metadata.title, done.format.ext, done.format.url);
        }
        set((s) => {
          const itemDone = s.queue.find((q) => q.id === id);
          if (!itemDone) return s;
          return {
            history: [
              { ...itemDone, status: "completed" as const, progress: 100 },
              ...s.history,
            ].slice(0, 50),
          };
        });
        return;
      }

      get().updateQueueItem(id, { progress: nextProgress, speed });
      setTimeout(tick, 400 + Math.random() * 400);
    };
    tick();
  },
}));
