"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Download,
  Film,
  Music,
  Image as ImageIcon,
  User,
  Clock,
  Eye,
  Heart,
  ExternalLink,
  Check,
} from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn, formatDuration } from "@/lib/utils";
import { useDownloadStore } from "@/store/download-store";
import type { MediaFormat } from "@/lib/providers/base";

export function MediaInspectorModal() {
  const {
    activeMetadata,
    isInspectorOpen,
    isMockMode,
    setInspectorOpen,
    setActiveMetadata,
    addToQueue,
  } = useDownloadStore();

  const [selectedFormat, setSelectedFormat] = useState<MediaFormat | null>(null);
  const [activeTab, setActiveTab] = useState("video");

  const formats = activeMetadata?.formats ?? [];

  const videoFormats = useMemo(
    () => formats.filter((f) => f.type === "video" && f.hasAudio !== false),
    [formats]
  );
  const audioFormats = useMemo(
    () => formats.filter((f) => f.type === "audio"),
    [formats]
  );
  const imageFormats = useMemo(
    () => formats.filter((f) => f.type === "image"),
    [formats]
  );

  // Automatically select the best format with audio by default
  useEffect(() => {
    if (activeMetadata) {
      if (activeTab === "video" && videoFormats.length > 0) {
        setSelectedFormat(videoFormats[0]);
      } else if (activeTab === "audio" && audioFormats.length > 0) {
        setSelectedFormat(audioFormats[0]);
      } else if (activeTab === "image" && imageFormats.length > 0) {
        setSelectedFormat(imageFormats[0]);
      }
    }
  }, [activeMetadata, activeTab, videoFormats, audioFormats, imageFormats]);

  const close = () => {
    setInspectorOpen(false);
    setTimeout(() => {
      setActiveMetadata(null);
      setSelectedFormat(null);
      setActiveTab("video");
    }, 200);
  };

  const handleDownload = () => {
    if (!activeMetadata || !selectedFormat) {
      toast.error("Select a format first");
      return;
    }
    if (!selectedFormat.url) {
      toast.error("Stream video langsung tidak tersedia (platform membatasi akses tanpa login).");
      return;
    }
    addToQueue(activeMetadata, selectedFormat);
    toast.success(`Queued: ${selectedFormat.label} · ${selectedFormat.ext.toUpperCase()}`);
    close();
  };

  if (!isInspectorOpen || !activeMetadata) return null;

  const meta = activeMetadata;

  return (
    <AnimatePresence>
      {isInspectorOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed left-1/2 top-1/2 z-50 w-[min(920px,95vw)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-zinc-700/50 bg-zinc-900/95 shadow-2xl backdrop-blur-xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-3">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "rounded-md px-2 py-0.5 text-xs font-semibold uppercase text-white",
                    `badge-${meta.platform}`
                  )}
                >
                  {meta.platform}
                </span>
                <span className="text-sm text-zinc-400">Media Inspector</span>
              </div>
              <Button variant="ghost" size="icon-sm" onClick={close}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid max-h-[85vh] grid-cols-1 overflow-y-auto md:grid-cols-[340px_1fr]">
              {/* Preview pane */}
              <div className="border-b border-zinc-800 p-5 md:border-b-0 md:border-r">
                {isMockMode && (
                  <div className="mb-4 rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 text-sm text-amber-400">
                    <strong className="block mb-1">⚠️ Pembatasan Akses Platform</strong>
                    Platform sumber membatasi download langsung tanpa login. Pratinjau ditampilkan, namun link unduhan stream tidak tersedia.
                  </div>
                )}

                <div className="relative mb-4 aspect-video overflow-hidden rounded-xl bg-zinc-800">
                  <Image
                    src={meta.thumbnail}
                    alt={meta.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  {meta.durationLabel && (
                    <span className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-xs font-medium text-white">
                      {meta.durationLabel}
                    </span>
                  )}
                </div>

                <h2 className="mb-2 line-clamp-2 text-base font-semibold text-white">
                  {meta.title}
                </h2>

                <div className="mb-3 flex items-center gap-2 text-sm text-zinc-400">
                  <User className="h-3.5 w-3.5" />
                  <span className="truncate">{meta.author}</span>
                  {meta.authorUrl && (
                    <a
                      href={meta.authorUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-400 hover:text-indigo-300"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>

                <div className="flex flex-wrap gap-3 text-xs text-zinc-500">
                  {meta.duration != null && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDuration(meta.duration)}
                    </span>
                  )}
                  {meta.viewCount != null && (
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {meta.viewCount.toLocaleString()}
                    </span>
                  )}
                  {meta.likeCount != null && (
                    <span className="flex items-center gap-1">
                      <Heart className="h-3 w-3" />
                      {meta.likeCount.toLocaleString()}
                    </span>
                  )}
                </div>

                {meta.isCarousel && meta.carouselItems && (
                  <div className="mt-4">
                    <p className="mb-2 text-xs font-medium text-zinc-500">
                      Carousel ({meta.carouselItems.length})
                    </p>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {meta.carouselItems.map((item, i) => (
                        <div
                          key={i}
                          className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-zinc-800"
                        >
                          <Image
                            src={item.thumbnail}
                            alt={`Slide ${i + 1}`}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Format selector */}
              <div className="flex flex-col p-5">
                <Tabs
                  value={activeTab}
                  onValueChange={(v) => {
                    setActiveTab(v);
                    setSelectedFormat(null);
                  }}
                >
                  <TabsList className="w-full">
                    <TabsTrigger value="video" className="flex-1 gap-1.5">
                      <Film className="h-3.5 w-3.5" />
                      Video
                      {videoFormats.length > 0 && (
                        <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                          {videoFormats.length}
                        </Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="audio" className="flex-1 gap-1.5">
                      <Music className="h-3.5 w-3.5" />
                      Audio
                    </TabsTrigger>
                    <TabsTrigger value="image" className="flex-1 gap-1.5">
                      <ImageIcon className="h-3.5 w-3.5" />
                      Cover
                    </TabsTrigger>
                  </TabsList>

                  <ScrollArea className="mt-3 h-[280px] pr-2">
                    <TabsContent value="video" className="mt-0 space-y-2">
                      {videoFormats.length === 0 && (
                        <p className="py-8 text-center text-sm text-zinc-500">
                          No video formats
                        </p>
                      )}
                      {videoFormats.map((fmt) => (
                        <FormatRow
                          key={fmt.id}
                          format={fmt}
                          selected={selectedFormat?.id === fmt.id}
                          onSelect={() => setSelectedFormat(fmt)}
                        />
                      ))}
                    </TabsContent>

                    <TabsContent value="audio" className="mt-0 space-y-2">
                      {audioFormats.length === 0 && (
                        <p className="py-8 text-center text-sm text-zinc-500">
                          No audio formats
                        </p>
                      )}
                      {audioFormats.map((fmt) => (
                        <FormatRow
                          key={fmt.id}
                          format={fmt}
                          selected={selectedFormat?.id === fmt.id}
                          onSelect={() => setSelectedFormat(fmt)}
                        />
                      ))}
                    </TabsContent>

                    <TabsContent value="image" className="mt-0 space-y-2">
                      {imageFormats.length === 0 && (
                        <p className="py-8 text-center text-sm text-zinc-500">
                          No image formats
                        </p>
                      )}
                      {imageFormats.map((fmt) => (
                        <FormatRow
                          key={fmt.id}
                          format={fmt}
                          selected={selectedFormat?.id === fmt.id}
                          onSelect={() => setSelectedFormat(fmt)}
                        />
                      ))}
                    </TabsContent>
                  </ScrollArea>
                </Tabs>

                {/* Footer actions */}
                <div className="mt-auto flex items-center justify-between border-t border-zinc-800 pt-4">
                  <div className="text-xs text-zinc-400">
                    {selectedFormat ? (
                      <span>
                        Selected:{" "}
                        <strong className="text-white">
                          {selectedFormat.label}
                        </strong>{" "}
                        · {selectedFormat.ext.toUpperCase()}
                        {selectedFormat.fileSizeLabel &&
                          ` · ${selectedFormat.fileSizeLabel}`}
                        {selectedFormat.hasAudio !== false && " · 🔊 Audio"}
                      </span>
                    ) : (
                      "Select a quality to download"
                    )}
                  </div>
                  <Button
                    onClick={handleDownload}
                    disabled={!selectedFormat || !selectedFormat.url}
                    className="gap-2 bg-indigo-500 shadow-lg shadow-indigo-500/25 hover:bg-indigo-400 disabled:opacity-50"
                  >
                    <Download className="h-4 w-4" />
                    {selectedFormat?.url ? "Download" : "Stream Tidak Tersedia"}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function FormatRow({
  format,
  selected,
  onSelect,
}: {
  format: MediaFormat;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all",
        selected
          ? "border-indigo-500/50 bg-indigo-500/10 glow-card"
          : "border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-800/50"
      )}
    >
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
          selected
            ? "bg-indigo-500 text-white"
            : "bg-zinc-800 text-zinc-400"
        )}
      >
        {selected ? (
          <Check className="h-4 w-4" />
        ) : (
          format.ext.toUpperCase().slice(0, 3)
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white">{format.label}</span>
          {format.fps && format.fps >= 60 && (
            <Badge variant="secondary" className="h-5 text-[10px]">
              {format.fps}fps
            </Badge>
          )}
          {format.type === "video" && (
            <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-400 border border-emerald-500/30">
              🔊 Audio
            </span>
          )}
        </div>
        <div className="mt-0.5 flex gap-2 text-xs text-zinc-500">
          {format.resolution && <span>{format.resolution}</span>}
          {format.bitrate && <span>{format.bitrate}</span>}
          {format.fileSizeLabel && <span>{format.fileSizeLabel}</span>}
        </div>
      </div>
    </button>
  );
}
