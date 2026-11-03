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

export function getApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    // If running in Capacitor native Android (origin is https://localhost or capacitor://localhost)
    if (
      window.location.protocol === "capacitor:" ||
      window.location.hostname === "localhost" ||
      (window as any).Capacitor?.isNativePlatform?.()
    ) {
      return process.env.NEXT_PUBLIC_API_URL || "https://ydownloader-cpvj.onrender.com";
    }
  }
  return process.env.NEXT_PUBLIC_API_URL || "";
}

export function detectPlatform(url: string): string | null {
  try {
    const host = new URL(url).hostname.replace("www.", "").toLowerCase();
    if (host.includes("youtube.com") || host.includes("youtu.be")) return "youtube";
    if (host.includes("tiktok.com")) return "tiktok";
    if (host.includes("instagram.com")) return "instagram";
    if (host.includes("bilibili.com") || host.includes("b23.tv")) return "bilibili";
    if (host.includes("twitter.com") || host.includes("x.com")) return "x";
    if (host.includes("douyin.com") || host.includes("iesdouyin.com")) return "douyin";
    if (host.includes("facebook.com") || host.includes("fb.watch") || host.includes("fb.com")) return "facebook";
    if (host.includes("whatsapp.com") || host.includes("wa.me")) return "whatsapp";
    if (host.includes("vimeo.com")) return "vimeo";
    if (host.includes("dailymotion.com")) return "dailymotion";
    if (host.includes("pinterest.com") || host.includes("pin.it")) return "pinterest";
    if (host.includes("reddit.com")) return "reddit";
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

export async function triggerFileDownload(title: string, ext: string, contentUrl?: string) {
  if (typeof window === "undefined") return;

  let targetUrl = contentUrl;
  if (targetUrl && targetUrl.includes("flower.mp4")) {
    targetUrl = "https://www.w3schools.com/html/mov_bbb.mp4";
  }

  const safeTitle = (title || "media").replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 80);
  const fileName = `${safeTitle}.${ext || "mp4"}`;

  const apiBase = getApiBaseUrl();
  const params = new URLSearchParams({
    ext: ext || "mp4",
    title: safeTitle,
  });

  if (targetUrl && targetUrl.startsWith("http") && !targetUrl.includes("example.com")) {
    params.set("directUrl", targetUrl);
  }

  const proxyUrl = `${apiBase}/api/sample?${params.toString()}`;
  const effectiveDownloadUrl = targetUrl && !targetUrl.includes("example.com") ? targetUrl : proxyUrl;

  // 1. Check if running inside Android APK with Native Download Manager
  const androidDownloader = (window as any).AndroidDownloader;
  if (androidDownloader && typeof androidDownloader.downloadFile === "function") {
    try {
      androidDownloader.downloadFile(effectiveDownloadUrl, fileName, title || "Media Download");
      return;
    } catch (e) {
      console.warn("Android native downloader error, falling back to browser:", e);
    }
  }

  // 2. Standard Web Browser Download
  try {
    const res = await fetch(proxyUrl);
    if (!res.ok) throw new Error(`Proxy returned ${res.status}`);
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 15000);
  } catch (err) {
    console.warn("Proxy download fallback:", err);
    const a = document.createElement("a");
    a.href = proxyUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}
