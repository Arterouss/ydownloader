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
  Facebook,
  MessageCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn, detectPlatform, isValidUrl, getApiBaseUrl } from "@/lib/utils";
import { useDownloadStore } from "@/store/download-store";
import type { MediaMetadata } from "@/lib/providers/base";

const platformIcons: Record<string, React.ElementType> = {
  youtube: Youtube,
  tiktok: Music2,
  instagram: Instagram,
  facebook: Facebook,
  whatsapp: MessageCircle,
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
  facebook: "Facebook",
  whatsapp: "WhatsApp",
  bilibili: "Bilibili",
  x: "X",
  douyin: "Douyin",
  vimeo: "Vimeo",
  generic: "Web",
};

const supportedPlatforms = [
  "Facebook",
  "Instagram",
  "TikTok",
  "Douyin",
  "Bilibili",
  "YouTube",
  "WhatsApp",
  "X / Twitter",
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

  const handleParseUrl = useCallback(async (rawUrl: string) => {
    const trimmed = rawUrl.trim();
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
      const apiBase = getApiBaseUrl();
      const res = await fetch(`${apiBase}/api/parse`, {
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
      setActiveMetadata(meta, json.isMock);
      setInspectorOpen(true);
      toast.success(`Found: ${meta.title.slice(0, 40)}…`);
    } catch {
      setParseError("Network error");
      toast.error("Network error — try again");
    } finally {
      setParsing(false);
    }
  }, [setParsing, setParseError, setActiveMetadata, setInspectorOpen]);

  const handleParse = useCallback(() => {
    handleParseUrl(url);
  }, [url, handleParseUrl]);

  // Handle native Android Share Intent ("Share to YDownloader")
  useEffect(() => {
    const processSharedUrl = (incomingUrl: string) => {
      if (incomingUrl && isValidUrl(incomingUrl)) {
        setUrl(incomingUrl);
        toast.info("Received shared link from social media!");
        setTimeout(() => {
          handleParseUrl(incomingUrl);
        }, 200);
      }
    };

    if (typeof window !== "undefined" && (window as any).__INITIAL_SHARED_URL__) {
      const initial = (window as any).__INITIAL_SHARED_URL__;
      (window as any).__INITIAL_SHARED_URL__ = null;
      processSharedUrl(initial);
    }

    const handler = (e: any) => {
      const sharedUrl = e?.detail?.url;
      if (sharedUrl) {
        processSharedUrl(sharedUrl);
      }
    };

    window.addEventListener("appSharedUrl", handler);
    return () => window.removeEventListener("appSharedUrl", handler);
  }, [handleParseUrl]);

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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isParsing) {
      e.preventDefault();
      handleParse();
    }
  };

  const PlatformIcon = detected ? platformIcons[detected] || Globe : Link2;

  return (
    <div className="mx-auto w-full max-w-3xl">
      {/* Glow container */}
      <div className="relative group">
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 opacity-70 blur-xl transition-all duration-500 group-hover:opacity-100 group-hover:blur-2xl" />

        <div className="relative rounded-2xl border border-white/10 bg-zinc-950/80 p-2 shadow-2xl backdrop-blur-2xl">
          <div className="flex items-center gap-3 px-3 py-2">
            {/* Platform badge / icon */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 transition-colors">
              <PlatformIcon className="h-5 w-5 text-zinc-300" />
            </div>

            {/* Input field */}
            <input
              ref={inputRef}
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Paste social media link (Douyin, Bilibili, IG, FB, YT, WA, TikTok)..."
              disabled={isParsing}
              className="h-11 w-full bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none disabled:opacity-50"
            />

            {/* Paste button */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handlePaste}
              disabled={isParsing}
              className="hidden sm:flex items-center gap-1.5 text-zinc-400 hover:text-white"
            >
              <ClipboardPaste className="h-4 w-4" />
              <span>Paste</span>
            </Button>

            {/* Parse / Download button */}
            <Button
              type="button"
              size="sm"
              onClick={handleParse}
              disabled={isParsing || !url.trim()}
              className="relative shrink-0 overflow-hidden bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 font-medium text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40 hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:shadow-none"
            >
              {isParsing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing…
                </>
              ) : (
                <>
                  <Sparkles className="mr-1.5 h-4 w-4" />
                  Analyze
                </>
              )}
            </Button>
          </div>

          {/* Quick-select platform indicator */}
          <div className="flex flex-wrap items-center justify-between border-t border-zinc-800/80 px-4 py-2.5 text-xs text-zinc-500">
            <div className="flex items-center gap-2">
              <span className="font-medium text-zinc-400">Supported:</span>
              <div className="flex flex-wrap gap-1.5">
                {supportedPlatforms.map((p) => (
                  <span
                    key={p}
                    className="rounded bg-zinc-900 px-2 py-0.5 text-[11px] text-zinc-400"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>

            {detected && (
              <span className="font-medium text-indigo-400 capitalize">
                Detected: {platformLabels[detected] || detected}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Error alert */}
      <AnimatePresence>
        {parseError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-3 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{parseError}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
