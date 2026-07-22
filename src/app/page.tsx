"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  History,
  Star,
  Settings,
  Download,
  CheckCircle2,
  Clock,
} from "lucide-react";
import Image from "next/image";
import { Sidebar } from "@/components/layout/Sidebar";
import { UrlInputCanvas } from "@/components/downloader/UrlInputCanvas";
import { MediaInspectorModal } from "@/components/downloader/MediaInspectorModal";
import { DownloadQueueBar } from "@/components/downloader/DownloadQueueBar";
import { CommandMenu } from "@/components/command/CommandMenu";
import { CollectionsGrid } from "@/components/collections/CollectionsGrid";
import { useDownloadStore } from "@/store/download-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function HomePage() {
  const { currentView, history, setActiveMetadata, setInspectorOpen } =
    useDownloadStore();

  return (
    <div className="relative min-h-screen">
      <Sidebar />

      <main className="min-h-screen pb-28 md:ml-[68px] md:pb-36">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-4 sm:py-8">
          <AnimatePresence mode="wait">
            {currentView === "dashboard" && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="flex min-h-[70vh] flex-col items-center justify-center"
              >
                <UrlInputCanvas />
              </motion.div>
            )}

            {currentView === "history" && (
              <motion.div
                key="history"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
              >
                <div className="mb-6">
                  <h2 className="flex items-center gap-2 text-xl font-semibold text-white">
                    <History className="h-5 w-5 text-zinc-400" />
                    Download History
                  </h2>
                  <p className="text-sm text-zinc-500">
                    Recently completed downloads
                  </p>
                </div>

                {history.length === 0 ? (
                  <EmptyState
                    icon={Clock}
                    title="No history yet"
                    description="Completed downloads appear here"
                  />
                ) : (
                  <div className="space-y-2">
                    {history.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveMetadata(item.metadata);
                          setInspectorOpen(true);
                        }}
                        className="flex w-full items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900/40 p-3 text-left transition-all hover:border-zinc-700 hover:bg-zinc-900/70"
                      >
                        <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded-lg bg-zinc-800">
                          <Image
                            src={item.metadata.thumbnail}
                            alt=""
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-white">
                            {item.metadata.title}
                          </p>
                          <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500">
                            <span className="capitalize">
                              {item.metadata.platform}
                            </span>
                            <span>·</span>
                            <span>{item.format.label}</span>
                            <span>·</span>
                            <span className="uppercase">{item.format.ext}</span>
                          </div>
                        </div>
                        <Badge variant="success" className="shrink-0 gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Done
                        </Badge>
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {currentView === "collections" && (
              <motion.div
                key="collections"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
              >
                <CollectionsGrid />
              </motion.div>
            )}

            {currentView === "favorites" && (
              <motion.div
                key="favorites"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
              >
                <div className="mb-6">
                  <h2 className="flex items-center gap-2 text-xl font-semibold text-white">
                    <Star className="h-5 w-5 text-amber-400" />
                    Favorites
                  </h2>
                  <p className="text-sm text-zinc-500">Starred media items</p>
                </div>
                <EmptyState
                  icon={Star}
                  title="No favorites yet"
                  description="Star media from the inspector to save here"
                />
              </motion.div>
            )}

            {currentView === "settings" && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="max-w-xl"
              >
                <div className="mb-6">
                  <h2 className="flex items-center gap-2 text-xl font-semibold text-white">
                    <Settings className="h-5 w-5 text-zinc-400" />
                    Settings
                  </h2>
                  <p className="text-sm text-zinc-500">
                    Preferences & defaults
                  </p>
                </div>

                <div className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
                  <SettingRow
                    label="Default quality"
                    value="1080p"
                    description="Preferred video resolution"
                  />
                  <Separator />
                  <SettingRow
                    label="Default format"
                    value="MP4"
                    description="Preferred container format"
                  />
                  <Separator />
                  <SettingRow
                    label="Theme"
                    value="Dark"
                    description="Interface appearance"
                  />
                  <Separator />
                  <SettingRow
                    label="Auto-download"
                    value="Off"
                    description="Start download after parse"
                  />
                  <Separator />
                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <p className="text-sm font-medium text-white">
                        Keyboard shortcut
                      </p>
                      <p className="text-xs text-zinc-500">
                        Open command palette
                      </p>
                    </div>
                    <kbd className="rounded-md border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-zinc-300">
                      ⌘ K
                    </kbd>
                  </div>
                </div>

                <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
                  <h3 className="mb-1 text-sm font-medium text-white">
                    About YDownloader
                  </h3>
                  <p className="text-xs leading-relaxed text-zinc-500">
                    Universal media workspace with extensible provider
                    architecture. Mock adapters power the full UI flow for
                    YouTube, TikTok, Instagram, Bilibili, X, Douyin, Vimeo and
                    more.
                  </p>
                  <p className="mt-3 text-xs text-zinc-600">v0.1.0 · Portfolio</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <DownloadQueueBar />
      <MediaInspectorModal />
      <CommandMenu />
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 py-20">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 text-zinc-600">
        <Icon className="h-6 w-6" />
      </div>
      <p className="text-sm font-medium text-zinc-400">{title}</p>
      <p className="mt-1 text-xs text-zinc-600">{description}</p>
      <Button
        variant="outline"
        size="sm"
        className="mt-4 gap-1.5"
        onClick={() => useDownloadStore.getState().setCurrentView("dashboard")}
      >
        <Download className="h-3.5 w-3.5" />
        Go download
      </Button>
    </div>
  );
}

function SettingRow({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-white">{label}</p>
        <p className="text-xs text-zinc-500">{description}</p>
      </div>
      <span className="rounded-md border border-zinc-700 bg-zinc-800/80 px-2.5 py-1 text-xs font-medium text-zinc-300">
        {value}
      </span>
    </div>
  );
}
