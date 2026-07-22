"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Pause,
  Play,
  X,
  CheckCircle2,
  AlertCircle,
  Trash2,
  ChevronUp,
  ChevronDown,
  Download,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn, formatSpeed, triggerFileDownload } from "@/lib/utils";
import { useDownloadStore, type QueueItem } from "@/store/download-store";

export function DownloadQueueBar() {
  const {
    queue,
    pauseItem,
    resumeItem,
    cancelItem,
    removeFromQueue,
    clearCompleted,
  } = useDownloadStore();
  const [expanded, setExpanded] = useState(true);

  const active = queue.filter(
    (q) =>
      q.status === "downloading" ||
      q.status === "queued" ||
      q.status === "paused"
  );
  const completed = queue.filter((q) => q.status === "completed");
  const visible = queue.filter((q) => q.status !== "cancelled");

  if (visible.length === 0) return null;

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className="fixed bottom-16 left-0 right-0 z-40 px-3 pb-2 md:bottom-0 md:left-[68px] md:px-4 md:pb-4"
    >
      <div className="mx-auto max-w-4xl overflow-hidden rounded-2xl border border-zinc-700/50 bg-zinc-900/90 shadow-2xl shadow-black/40 backdrop-blur-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <Download className="h-4 w-4 text-indigo-400" />
            <span className="text-sm font-medium text-white">
              Download Queue
            </span>
            {active.length > 0 && (
              <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-xs font-semibold text-indigo-300">
                {active.length} active
              </span>
            )}
            {completed.length > 0 && (
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-400">
                {completed.length} done
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {completed.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearCompleted}
                className="h-7 gap-1 text-xs text-zinc-400"
              >
                <Trash2 className="h-3 w-3" />
                Clear done
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setExpanded((e) => !e)}
            >
              {expanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Items */}
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: "auto" }}
              exit={{ height: 0 }}
              className="overflow-hidden"
            >
              <div className="max-h-56 space-y-1 overflow-y-auto p-2">
                {visible.map((item) => (
                  <QueueRow
                    key={item.id}
                    item={item}
                    onPause={() => pauseItem(item.id)}
                    onResume={() => resumeItem(item.id)}
                    onCancel={() => cancelItem(item.id)}
                    onRemove={() => removeFromQueue(item.id)}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function QueueRow({
  item,
  onPause,
  onResume,
  onCancel,
  onRemove,
}: {
  item: QueueItem;
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
  onRemove: () => void;
}) {
  const isDone = item.status === "completed";
  const isFailed = item.status === "failed";
  const isPaused = item.status === "paused";
  const isActive = item.status === "downloading";

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2 transition-colors",
        isDone && "bg-emerald-500/5",
        isFailed && "bg-red-500/5",
        isActive && "bg-indigo-500/5"
      )}
    >
      <div className="relative h-10 w-14 shrink-0 overflow-hidden rounded-lg bg-zinc-800">
        <Image
          src={item.metadata.thumbnail}
          alt=""
          fill
          className="object-cover"
          unoptimized
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium text-white">
            {item.metadata.title}
          </p>
          <span className="shrink-0 text-[10px] uppercase text-zinc-500">
            {item.format.ext}
          </span>
        </div>
        <div className="mt-1 flex items-center gap-2">
          {(isActive || isPaused) && (
            <>
              <Progress
                value={item.progress}
                className="h-1.5 flex-1"
                indicatorClassName={
                  isPaused ? "bg-amber-500" : "bg-indigo-500"
                }
              />
              <span className="w-10 shrink-0 text-right text-[11px] tabular-nums text-zinc-400">
                {Math.round(item.progress)}%
              </span>
              {isActive && item.speed > 0 && (
                <span className="shrink-0 text-[11px] tabular-nums text-zinc-500">
                  {formatSpeed(item.speed)}
                </span>
              )}
            </>
          )}
          {isDone && (
            <span className="flex items-center gap-1 text-xs text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Completed · {item.format.label}
            </span>
          )}
          {isFailed && (
            <span className="flex items-center gap-1 text-xs text-red-400">
              <AlertCircle className="h-3.5 w-3.5" />
              {item.error || "Failed"}
            </span>
          )}
          {item.status === "queued" && (
            <span className="text-xs text-zinc-500">Queued…</span>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-0.5">
        {isActive && (
          <Button variant="ghost" size="icon-sm" onClick={onPause}>
            <Pause className="h-3.5 w-3.5" />
          </Button>
        )}
        {isPaused && (
          <Button variant="ghost" size="icon-sm" onClick={onResume}>
            <Play className="h-3.5 w-3.5" />
          </Button>
        )}
        {(isActive || isPaused || item.status === "queued") && (
          <Button variant="ghost" size="icon-sm" onClick={onCancel}>
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
        {isDone && (
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-indigo-400 hover:bg-indigo-500/15 hover:text-indigo-300"
            title="Simpan File Ke Perangkat / Galeri"
            onClick={() => triggerFileDownload(item.metadata.title, item.format.ext, item.format.url)}
          >
            <Download className="h-3.5 w-3.5" />
          </Button>
        )}
        {(isDone || isFailed) && (
          <Button variant="ghost" size="icon-sm" onClick={onRemove}>
            <X className="h-3.5 w-3.5" />
          </Button>
        )}

      </div>
    </div>
  );
}
