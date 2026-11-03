"use client";

import { useEffect, useState, useCallback } from "react";
import { Command } from "cmdk";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  History,
  FolderOpen,
  Star,
  Settings,
  Download,
  Search,
  Link2,
  Sparkles,
} from "lucide-react";
import { useDownloadStore } from "@/store/download-store";
import { isValidUrl, getApiBaseUrl } from "@/lib/utils";
import { toast } from "sonner";
import type { MediaMetadata } from "@/lib/providers/base";

export function CommandMenu() {
  const {
    isCommandOpen,
    setCommandOpen,
    setCurrentView,
    setParsing,
    setActiveMetadata,
    setInspectorOpen,
    history,
    collections,
  } = useDownloadStore();

  const [query, setQuery] = useState("");

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandOpen(!isCommandOpen);
      }
      if (e.key === "Escape") setCommandOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isCommandOpen, setCommandOpen]);

  useEffect(() => {
    if (!isCommandOpen) setQuery("");
  }, [isCommandOpen]);

  const navigate = useCallback(
    (view: "dashboard" | "history" | "collections" | "favorites" | "settings") => {
      setCurrentView(view);
      setCommandOpen(false);
    },
    [setCurrentView, setCommandOpen]
  );

  const parseUrl = useCallback(
    async (url: string) => {
      setCommandOpen(false);
      setCurrentView("dashboard");
      setParsing(true);
      try {
        const apiBase = getApiBaseUrl();
        const res = await fetch(`${apiBase}/api/parse`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });
        const json = await res.json();
        if (json.success && json.data) {
          const meta = json.data;
          setActiveMetadata(meta, json.isMock);
          setInspectorOpen(true);
          setCommandOpen(false);
          toast.success(`Found: ${meta.title.slice(0, 40)}…`);
        } else {
          toast.error(json.error || "Parse failed");
        }
      } catch {
        toast.error("Network error");
      } finally {
        setParsing(false);
      }
    },
    [
      setCommandOpen,
      setCurrentView,
      setParsing,
      setActiveMetadata,
      setInspectorOpen,
    ]
  );

  const looksLikeUrl = isValidUrl(query.trim());

  return (
    <AnimatePresence>
      {isCommandOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
            onClick={() => setCommandOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ type: "spring", stiffness: 500, damping: 35 }}
            className="fixed left-1/2 top-[18%] z-[70] w-[min(560px,92vw)] -translate-x-1/2 overflow-hidden rounded-2xl border border-zinc-700/60 bg-zinc-900/95 shadow-2xl backdrop-blur-xl"
          >
            <Command
              className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-zinc-500"
              shouldFilter={!looksLikeUrl}
            >
              <div className="flex items-center gap-2 border-b border-zinc-800 px-4">
                <Search className="h-4 w-4 shrink-0 text-zinc-500" />
                <Command.Input
                  value={query}
                  onValueChange={setQuery}
                  placeholder="Search commands, paste URL, jump to…"
                  className="h-12 w-full bg-transparent text-sm text-white placeholder:text-zinc-500 focus:outline-none"
                />
                <kbd className="hidden rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-500 sm:inline">
                  ESC
                </kbd>
              </div>

              <Command.List className="max-h-80 overflow-y-auto p-2">
                <Command.Empty className="py-8 text-center text-sm text-zinc-500">
                  No results
                </Command.Empty>

                {looksLikeUrl && (
                  <Command.Group heading="Quick Parse">
                    <Command.Item
                      value={`parse ${query}`}
                      onSelect={() => parseUrl(query.trim())}
                      className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-zinc-300 aria-selected:bg-indigo-500/15 aria-selected:text-white"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400">
                        <Link2 className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium">Parse & download URL</p>
                        <p className="truncate text-xs text-zinc-500">
                          {query.trim()}
                        </p>
                      </div>
                    </Command.Item>
                  </Command.Group>
                )}

                <Command.Group heading="Navigate">
                  {[
                    {
                      id: "dashboard" as const,
                      label: "Dashboard",
                      icon: LayoutDashboard,
                      hint: "Quick download",
                    },
                    {
                      id: "history" as const,
                      label: "History",
                      icon: History,
                      hint: "Past downloads",
                    },
                    {
                      id: "collections" as const,
                      label: "Collections",
                      icon: FolderOpen,
                      hint: "Organized folders",
                    },
                    {
                      id: "favorites" as const,
                      label: "Favorites",
                      icon: Star,
                      hint: "Starred media",
                    },
                    {
                      id: "settings" as const,
                      label: "Settings",
                      icon: Settings,
                      hint: "Preferences",
                    },
                  ].map((item) => (
                    <Command.Item
                      key={item.id}
                      value={item.label}
                      onSelect={() => navigate(item.id)}
                      className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-300 aria-selected:bg-zinc-800 aria-selected:text-white"
                    >
                      <item.icon className="h-4 w-4 text-zinc-500" />
                      <span className="flex-1">{item.label}</span>
                      <span className="text-xs text-zinc-600">{item.hint}</span>
                    </Command.Item>
                  ))}
                </Command.Group>

                {collections.length > 0 && (
                  <Command.Group heading="Collections">
                    {collections.map((col) => (
                      <Command.Item
                        key={col.id}
                        value={`collection ${col.name}`}
                        onSelect={() => navigate("collections")}
                        className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-300 aria-selected:bg-zinc-800 aria-selected:text-white"
                      >
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{ background: col.color }}
                        />
                        <span className="flex-1">{col.name}</span>
                        <span className="text-xs text-zinc-600">
                          {col.itemCount} items
                        </span>
                      </Command.Item>
                    ))}
                  </Command.Group>
                )}

                {history.length > 0 && (
                  <Command.Group heading="Recent">
                    {history.slice(0, 5).map((item) => (
                      <Command.Item
                        key={item.id}
                        value={`history ${item.metadata.title}`}
                        onSelect={() => {
                          setActiveMetadata(item.metadata);
                          setInspectorOpen(true);
                          setCommandOpen(false);
                        }}
                        className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-300 aria-selected:bg-zinc-800 aria-selected:text-white"
                      >
                        <Download className="h-4 w-4 text-zinc-500" />
                        <span className="flex-1 truncate">
                          {item.metadata.title}
                        </span>
                        <span className="text-xs uppercase text-zinc-600">
                          {item.format.ext}
                        </span>
                      </Command.Item>
                    ))}
                  </Command.Group>
                )}

                <Command.Group heading="Tips">
                  <Command.Item
                    value="tip paste url"
                    disabled
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-500"
                  >
                    <Sparkles className="h-4 w-4" />
                    Paste any media URL and press Enter to parse
                  </Command.Item>
                </Command.Group>
              </Command.List>
            </Command>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
