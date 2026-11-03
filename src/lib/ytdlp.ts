import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export interface YtDlpFormat {
  format_id: string;
  ext: string;
  resolution: string;
  fps: number | null;
  vcodec: string;
  acodec: string;
  filesize: number | null;
  filesize_approx: number | null;
  format_note: string;
  width: number | null;
  height: number | null;
  tbr: number | null;
  url: string;
}

export interface YtDlpInfo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  thumbnails: { url: string; width?: number; height?: number }[];
  duration: number;
  channel: string;
  channel_url: string;
  view_count: number;
  like_count: number;
  upload_date: string;
  formats: YtDlpFormat[];
  webpage_url: string;
  extractor_key: string;
}

/**
 * Extract video metadata and format list using yt-dlp.
 * Works for YouTube, TikTok, Instagram, X/Twitter, Bilibili, Vimeo, and 1000+ other sites.
 */
export async function getVideoInfo(url: string): Promise<YtDlpInfo> {
  const safeUrl = url.replace(/"/g, '\\"');
  const cmd = `python3 -m yt_dlp --js-runtimes node --dump-single-json --no-download --no-playlist "${safeUrl}"`;

  const { stdout } = await execAsync(cmd, {
    timeout: 30000,
    maxBuffer: 10 * 1024 * 1024,
    env: { ...process.env },
  });

  return JSON.parse(stdout);
}

/**
 * Get the direct download URL for a specific format of a video.
 * Returns the URL that can be streamed/proxied to the client.
 */
export async function getFormatUrl(
  url: string,
  formatId: string
): Promise<string> {
  const safeUrl = url.replace(/"/g, '\\"');
  // Always ensure audio is included by selecting progressive stream with audio
  const formatSelector = formatId && !formatId.includes("best")
    ? `${formatId}[acodec!=none]/best[acodec!=none]/best`
    : "best[acodec!=none]/best";
  const cmd = `python3 -m yt_dlp --js-runtimes node -f "${formatSelector}" --get-url --no-playlist "${safeUrl}"`;

  const { stdout } = await execAsync(cmd, {
    timeout: 30000,
    maxBuffer: 1024 * 1024,
    env: { ...process.env },
  });

  return stdout.trim();
}

/**
 * Download video to a temp file and return the file path.
 * Uses yt-dlp to merge best video+audio into a single mp4.
 */
export async function downloadToFile(
  url: string,
  formatId: string,
  outputDir: string,
  fileName: string
): Promise<string> {
  const safeUrl = url.replace(/"/g, '\\"');
  const outputPath = `${outputDir}/${fileName}`;
  const formatSelector = formatId && !formatId.includes("best")
    ? `${formatId}+bestaudio/best`
    : "bestvideo+bestaudio/best";
  const cmd = `python3 -m yt_dlp --js-runtimes node -f "${formatSelector}" --no-playlist --merge-output-format mp4 -o "${outputPath}" "${safeUrl}"`;

  await execAsync(cmd, {
    timeout: 120000,
    maxBuffer: 1024 * 1024,
    env: { ...process.env },
  });

  return outputPath;
}

/** Helper: format bytes to human readable label */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

/** Map a yt-dlp format_note to a quality label */
export function qualityLabel(f: YtDlpFormat): string {
  if (f.height) {
    if (f.height >= 2160) return "4K";
    if (f.height >= 1440) return "1440p";
    if (f.height >= 1080) return "1080p";
    if (f.height >= 720) return "720p";
    if (f.height >= 480) return "480p";
    if (f.height >= 360) return "360p";
    if (f.height >= 240) return "240p";
    return "144p";
  }
  return f.format_note || "Unknown";
}
