import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function formatSpeed(bytesPerSecond: number): string {
  return `${formatBytes(bytesPerSecond)}/s`;
}

export function formatDuration(seconds: number): string {
  if (!seconds || seconds < 0) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function detectPlatform(url: string): string | null {
  try {
    const host = new URL(url).hostname.replace("www.", "").toLowerCase();
    if (host.includes("youtube.com") || host.includes("youtu.be")) return "youtube";
    if (host.includes("tiktok.com")) return "tiktok";
    if (host.includes("instagram.com")) return "instagram";
    if (host.includes("bilibili.com") || host.includes("b23.tv")) return "bilibili";
    if (host.includes("twitter.com") || host.includes("x.com")) return "x";
    if (host.includes("douyin.com")) return "douyin";
    if (host.includes("vimeo.com")) return "vimeo";
    if (host.includes("dailymotion.com")) return "dailymotion";
    if (host.includes("pinterest.com") || host.includes("pin.it")) return "pinterest";
    if (host.includes("reddit.com")) return "reddit";
    if (host.includes("facebook.com") || host.includes("fb.watch")) return "facebook";
    if (host.includes("twitch.tv")) return "twitch";
    return null;
  } catch {
    return null;
  }
}

export function isValidUrl(str: string): boolean {
  try {
    const u = new URL(str);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}
