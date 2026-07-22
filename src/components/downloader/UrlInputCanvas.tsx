"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Link2,
  Loader2,
  ClipboardPaste,
  Sparkles,
  AlertCircle,
  Youtube,
  Music2,
  Instagram,
  Tv,
  Twitter,
  Video,
  Globe,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn, detectPlatform, isValidUrl } from "@/lib/utils";
import { useDownloadStore } from "@/store/download-store";
import type { MediaMetadata } from "@/lib/providers/base";

const platformIcons: Record<string, React.ElementType> = {
  youtube: Youtube,
  tiktok: Music2,
  instagram: Instagram,
  bilibili: Tv,
  x: Twitter,
  douyin: Music2,
  vimeo: Video,
  generic: Globe,
};

const platformLabels: Record<string, string> = {
  youtube: "YouTube",
  tiktok: "TikTok",
  instagram: "Instagram",
  bilibili: "Bilibili",
  x: "X",
  douyin: "Douyin",
  vimeo: "Vimeo",
  generic: "Web",
};

const supportedPlatforms = [
  "YouTube",
  "TikTok",
  "Instagram",
  "Bilibili",
  "X",
  "Douyin",
  "Vimeo",
];

export function UrlInputCanvas() {
  const [url, setUrl] = useState("");
  const [detected, setDetected] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const {
    isParsing,
    parseError,
    setParsing,
    setParseError,
    setActiveMetadata,
    setInspectorOpen,
  } = useDownloadStore();

  useEffect(() => {
    if (!url.trim()) {
      setDetected(null);
      return;
    }
    if (isValidUrl(url)) {
      setDetected(detectPlatform(url) || "generic");
    } else {
      setDetected(null);
    }
  }, [url]);

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text.trim());
        toast.success("URL pasted");
      }
    } catch {
      toast.error("Clipboard access denied");
    }
  }, []);

  const handleParse = useCallback(async () => {
    const trimmed = url.trim();
    if (!trimmed) {
      toast.error("Paste a media URL first");
      return;
    }
    if (!isValidUrl(trimmed)) {
      setParseError("Invalid URL");
      toast.error("Enter a valid URL");
      return;
    }

    setParsing(true);
    setParseError(null);

    try {
      const res = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });
      const json = await res.json();

      if (!json.success || !json.data) {
        setParseError(json.error || "Failed to parse media");
        toast.error(json.error || "Could not parse this URL");
        return;
      }

      const meta = json.data as MediaMetadata;
      setActiveMetadata(meta);
      setInspectorOpen(true);
      toast.success(`Found: ${meta.title.slice(0, 40)}…`);
    } catch {
      setParseError("Network error");
      toast.error("Network error — try again");
    } finally {
      setParsing(false);
    }
  }, [url, setParsing, setParseError, setActiveMetadata, setInspectorOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isParsing) {
      e.preventDefault();
      handleParse();
    }
  };

  const PlatformIcon = detected ? platformIcons[detected] || Globe : Link2;

  return (
    <div className="mx-auto w-full max-w-3xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="text-center"
      >
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-300">
          <Sparkles className="h-3.5 w-3.5" />
          Universal Media Workspace
        </div>
        <h1 className="mb-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Download anything.{" "}
          <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Beautifully.
          </span>
        </h1>
        <p className="mb-8 text-sm text-zinc-400 sm:text-base">
          Paste a link from YouTube, TikTok, Instagram, Bilibili, X & more
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="relative"
      >
        <div
          className={cn(
            "group relative flex items-center gap-2 rounded-2xl border bg-zinc-900/70 p-2 shadow-2xl backdrop-blur-xl transition-all duration-300",
            parseError
              ? "border-red-500/40 shadow-red-500/10"
              : "border-zinc-700/50 focus-within:border-indigo-500/50 focus-within:shadow-indigo-500/10"
          )}
        >
          {/* Platform badge */}
          <div
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all",
              detected
                ? `badge-${detected} text-white shadow-md`
                : "bg-zinc-800 text-zinc-500"
            )}
          >
            <PlatformIcon className="h-5 w-5" />
          </div>

          <input
            ref={inputRef}
            type="url"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setParseError(null);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Paste media URL here…"
            disabled={isParsing}
            className="h-11 flex-1 bg-transparent text-sm text-white placeholder:text-zinc-500 focus:outline-none disabled:opacity-50 sm:text-base"
            spellCheck={false}
            autoComplete="off"
          />

          <AnimatePresence>
            {detected && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="hidden shrink-0 rounded-md bg-zinc-800 px-2 py-1 text-xs font-medium text-zinc-300 sm:inline"
              >
                {platformLabels[detected] || detected}
              </motion.span>
            )}
          </AnimatePresence>

          <Button
            variant="ghost"
            size="icon"
            onClick={handlePaste}
            disabled={isParsing}
            className="shrink-0 text-zinc-400 hover:text-white"
            title="Paste from clipboard"
          >
            <ClipboardPaste className="h-4 w-4" />
          </Button>

          <Button
            onClick={handleParse}
            disabled={isParsing || !url.trim()}
            className="h-11 shrink-0 rounded-xl bg-indigo-500 px-5 font-semibold text-white shadow-lg shadow-indigo-500/25 hover:bg-indigo-400 disabled:opacity-40"
          >
            {isParsing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Parsing…
              </>
            ) : (
              "Analyze"
            )}
          </Button>
        </div>

        <AnimatePresence>
          {parseError && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-2 flex items-center gap-1.5 text-sm text-red-400"
            >
              <AlertCircle className="h-3.5 w-3.5" />
              {parseError}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Platform chips */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-6 flex flex-wrap items-center justify-center gap-2"
      >
        {supportedPlatforms.map((p) => (
          <span
            key={p}
            className="rounded-full border border-zinc-800 bg-zinc-900/50 px-3 py-1 text-xs text-zinc-500"
          >
            {p}
          </span>
        ))}
      </motion.div>
    </div>
  );
}
