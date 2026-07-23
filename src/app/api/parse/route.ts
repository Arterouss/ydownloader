import { NextRequest, NextResponse } from "next/server";
import { isValidUrl, detectPlatform } from "@/lib/utils";
import { getVideoInfo, qualityLabel, formatBytes } from "@/lib/ytdlp";
import type { MediaFormat, MediaMetadata } from "@/lib/providers/base";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  let url = "";
  try {
    const body = await req.json();
    url = typeof body?.url === "string" ? body.url.trim() : "";

    if (!url) {
      return NextResponse.json(
        { success: false, error: "URL is required" },
        { status: 400 }
      );
    }

    if (!isValidUrl(url)) {
      return NextResponse.json(
        { success: false, error: "Invalid URL format" },
        { status: 400 }
      );
    }

    const platform = detectPlatform(url) || "generic";

    // Use yt-dlp to extract real metadata and formats
    const info = await getVideoInfo(url);

    // Build real format list from yt-dlp data
    const videoFormats: MediaFormat[] = [];
    const audioFormats: MediaFormat[] = [];
    const seenQualities = new Set<string>();

    // Sort formats by height descending
    const sortedFormats = (info.formats || [])
      .filter((f) => f.url && !f.url.includes("manifest"))
      .sort((a, b) => (b.height || 0) - (a.height || 0));

    for (const f of sortedFormats) {
      const isVideo = f.vcodec && f.vcodec !== "none";
      const isAudio = f.acodec && f.acodec !== "none";

      if (isVideo) {
        const quality = qualityLabel(f);
        const key = `${quality}-${f.fps || 30}-${f.ext}`;

        // Deduplicate: keep 1 per quality + fps combo
        if (seenQualities.has(key)) continue;
        seenQualities.add(key);

        const hasAudio = isAudio;
        const fpsLabel = f.fps && f.fps > 30 ? ` ${f.fps}fps` : "";
        const size = f.filesize || f.filesize_approx || 0;

        videoFormats.push({
          id: f.format_id,
          type: "video",
          label: `${quality}${fpsLabel}`,
          quality,
          resolution:
            f.width && f.height ? `${f.width}x${f.height}` : undefined,
          fps: f.fps || undefined,
          ext: f.ext || "mp4",
          fileSize: size || undefined,
          fileSizeLabel: size ? formatBytes(size) : undefined,
          url: f.url,
          hasAudio: !!hasAudio,
        });
      } else if (isAudio && !isVideo) {
        const bitrateKbps = f.tbr ? Math.round(f.tbr) : 128;
        const key = `audio-${bitrateKbps}-${f.ext}`;
        if (seenQualities.has(key)) continue;
        seenQualities.add(key);

        const size = f.filesize || f.filesize_approx || 0;

        audioFormats.push({
          id: f.format_id,
          type: "audio",
          label: `${bitrateKbps}kbps`,
          quality: `${bitrateKbps}kbps`,
          bitrate: `${bitrateKbps}kbps`,
          ext: f.ext || "m4a",
          fileSize: size || undefined,
          fileSizeLabel: size ? formatBytes(size) : undefined,
          url: f.url,
          hasAudio: true,
        });
      }
    }

    // Limit to reasonable number
    const formats: MediaFormat[] = [
      ...videoFormats.slice(0, 12),
      ...audioFormats.slice(0, 5),
    ];

    // If no formats found, add a "best" fallback
    if (formats.length === 0) {
      formats.push({
        id: "best",
        type: "video",
        label: "Best Quality",
        quality: "Best",
        ext: "mp4",
        url: info.webpage_url || url,
      });
    }

    // Build thumbnail — prefer the highest quality thumbnail
    let thumbnail = info.thumbnail || "";
    if (info.thumbnails?.length) {
      const sorted = [...info.thumbnails].sort(
        (a, b) => (b.width || 0) - (a.width || 0)
      );
      thumbnail = sorted[0]?.url || thumbnail;
    }

    // Format duration
    const dur = info.duration || 0;
    const mins = Math.floor(dur / 60);
    const secs = Math.floor(dur % 60);
    const durationLabel = `${mins}:${secs.toString().padStart(2, "0")}`;

    // Format upload date
    let uploadDate = "";
    if (info.upload_date) {
      const d = info.upload_date;
      uploadDate = `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
    }

    const meta: MediaMetadata = {
      id: info.id || `dl_${Date.now()}`,
      url: info.webpage_url || url,
      title: info.title || "Unknown Media",
      author: info.channel || "Unknown",
      authorUrl: info.channel_url || "",
      thumbnail,
      duration: dur || undefined,
      durationLabel: dur ? durationLabel : undefined,
      platform,
      description: info.description?.slice(0, 500) || "",
      viewCount: info.view_count || undefined,
      likeCount: info.like_count || undefined,
      uploadDate: uploadDate || undefined,
      formats,
    };

    return NextResponse.json({ success: true, data: meta });
  } catch (err) {
    console.warn("[api/parse] yt-dlp error, falling back to oEmbed:", err instanceof Error ? err.message : String(err));
    
    // Graceful fallback: If yt-dlp is blocked (e.g. YouTube blocks Render datacenter IP),
    // we use standard OpenGraph/oEmbed to at least get the real title and thumbnail,
    // and provide mock formats so the UI continues to function perfectly for the portfolio.
    try {
      const fallbackUrl = typeof url === "string" ? url : new URL(req.url).searchParams.get("url") || "";
      const platform = detectPlatform(fallbackUrl) || "generic";
      
      const { parseMediaUrl: fallbackParse } = await import("@/lib/providers");
      const fallbackResult = await fallbackParse(fallbackUrl);
      
      if (fallbackResult.success) {
        return NextResponse.json({ 
          success: true, 
          isMock: true, 
          data: fallbackResult.data 
        });
      }
    } catch (fallbackErr) {
      console.error("Fallback also failed:", fallbackErr);
    }

    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to analyze this URL. YouTube might be blocking datacenter IPs. Please try another link (like TikTok or Instagram)." 
      },
      { status: 422 }
    );
  }
}

