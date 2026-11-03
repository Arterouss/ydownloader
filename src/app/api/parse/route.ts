import { NextRequest, NextResponse } from "next/server";
import { isValidUrl, detectPlatform } from "@/lib/utils";
import { getVideoInfo, qualityLabel, formatBytes } from "@/lib/ytdlp";
import type { MediaFormat, MediaMetadata } from "@/lib/providers/base";

export const maxDuration = 30;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

async function unshortenUrl(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(7000),
    });
    return res.url || url;
  } catch {
    return url;
  }
}

async function extractTikTokOrDouyin(url: string, platform: string): Promise<MediaMetadata | null> {
  const canonicalUrl = await unshortenUrl(url);

  // 1. TikWM
  try {
    const res = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(canonicalUrl)}`, {
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      const json = await res.json();
      if (json.code === 0 && json.data?.play) {
        const d = json.data;
        const formats: MediaFormat[] = [];
        if (d.hdplay) {
          formats.push({
            id: "hd-nowatermark",
            type: "video",
            label: "HD (No Watermark)",
            quality: "HD",
            ext: "mp4",
            url: d.hdplay,
            hasAudio: true,
          });
        }
        formats.push({
          id: "sd-nowatermark",
          type: "video",
          label: "MP4 (No Watermark)",
          quality: "SD",
          ext: "mp4",
          url: d.play,
          hasAudio: true,
        });
        if (d.music_info?.play) {
          formats.push({
            id: "audio-mp3",
            type: "audio",
            label: "Original Audio (MP3)",
            quality: "128kbps",
            ext: "mp3",
            url: d.music_info.play,
            hasAudio: true,
          });
        }

        const dur = d.duration || 0;
        const mins = Math.floor(dur / 60);
        const secs = Math.floor(dur % 60);

        return {
          id: d.id || `tt_${Date.now()}`,
          url: canonicalUrl,
          title: d.title || "TikTok Video",
          author: d.author?.nickname || d.author?.unique_id || "TikTok Creator",
          authorUrl: d.author?.unique_id ? `https://www.tiktok.com/@${d.author.unique_id}` : undefined,
          thumbnail: d.cover || "",
          duration: dur,
          durationLabel: `${mins}:${secs.toString().padStart(2, "0")}`,
          platform,
          description: d.title || "",
          viewCount: d.play_count,
          likeCount: d.digg_count,
          uploadDate: d.create_time ? new Date(d.create_time * 1000).toISOString().split("T")[0] : undefined,
          formats,
        };
      }
    }
  } catch (e) {
    console.warn("[TikWM] failed:", e);
  }

  // 2. SnapSave
  try {
    const { snapsave } = await import("snapsave-media-downloader");
    const snap = await snapsave(canonicalUrl);
    if (snap.success && snap.data?.media?.length) {
      const formats: MediaFormat[] = snap.data.media.map((m, idx) => ({
        id: `snap_${idx}`,
        type: "video",
        label: m.resolution || "MP4 Video",
        quality: m.resolution || "HD",
        ext: "mp4",
        url: m.url,
        hasAudio: true,
      }));
      return {
        id: `tt_${Date.now()}`,
        url: canonicalUrl,
        title: snap.data.description || "TikTok Video",
        author: "@tiktok_creator",
        thumbnail: snap.data.preview || "",
        platform,
        formats,
      };
    }
  } catch (e) {
    console.warn("[SnapSave TikTok] failed:", e);
  }

  return null;
}

async function extractFacebook(url: string): Promise<MediaMetadata | null> {
  // 1. SnapSave
  try {
    const { snapsave } = await import("snapsave-media-downloader");
    const snap = await snapsave(url);
    if (snap.success && snap.data?.media?.length) {
      const formats: MediaFormat[] = snap.data.media.map((m, idx) => ({
        id: `fb_${idx}`,
        type: "video",
        label: m.resolution || "HD Video",
        quality: m.resolution || "HD",
        ext: "mp4",
        url: m.url,
        hasAudio: true,
      }));
      return {
        id: `fb_${Date.now()}`,
        url,
        title: snap.data.description || "Facebook Video",
        author: "Facebook Creator",
        thumbnail: snap.data.preview || "",
        platform: "facebook",
        formats,
      };
    }
  } catch (e) {
    console.warn("[SnapSave FB] failed:", e);
  }

  // 2. HTML Scraper
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      },
      signal: AbortSignal.timeout(6000),
    });
    if (res.ok) {
      const html = await res.text();
      const hdMatch =
        html.match(/"browser_native_hd_url":"([^"]+)"/) ||
        html.match(/hd_src:"([^"]+)"/);
      const sdMatch =
        html.match(/"browser_native_sd_url":"([^"]+)"/) ||
        html.match(/sd_src:"([^"]+)"/);
      const rawUrl = (hdMatch?.[1] || sdMatch?.[1] || "")
        .replace(/\\u0026/g, "&")
        .replace(/\\\//g, "/");

      if (rawUrl.startsWith("http")) {
        const titleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
        const thumbMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
        return {
          id: `fb_${Date.now()}`,
          url,
          title: titleMatch?.[1]?.replace(/\s*\|\s*Facebook.*$/i, "").trim() || "Facebook Video",
          author: "Facebook Creator",
          thumbnail: thumbMatch?.[1]?.replace(/&amp;/g, "&") || "",
          platform: "facebook",
          formats: [
            {
              id: "fb_hd",
              type: "video",
              label: hdMatch ? "HD 720p" : "SD Quality",
              quality: hdMatch ? "HD" : "SD",
              ext: "mp4",
              url: rawUrl,
              hasAudio: true,
            },
          ],
        };
      }
    }
  } catch (e) {
    console.warn("[HTML FB] failed:", e);
  }

  return null;
}

async function extractYouTubeFallback(url: string): Promise<MediaMetadata | null> {
  try {
    const btch = await import("btch-downloader");
    const yt = await btch.youtube(url);
    if (yt.status && (yt.mp4 || yt.mp3)) {
      const formats: MediaFormat[] = [];
      if (yt.mp4) {
        formats.push({
          id: "yt_mp4_720",
          type: "video",
          label: "720p HD",
          quality: "720p",
          ext: "mp4",
          url: yt.mp4,
          hasAudio: true,
        });
      }
      if (yt.mp3) {
        formats.push({
          id: "yt_mp3",
          type: "audio",
          label: "128kbps MP3",
          quality: "128kbps",
          ext: "mp3",
          url: yt.mp3,
          hasAudio: true,
        });
      }
      return {
        id: `yt_${Date.now()}`,
        url,
        title: yt.title || "YouTube Video",
        author: yt.author || "YouTube Creator",
        thumbnail: yt.thumbnail || "",
        platform: "youtube",
        formats,
      };
    }
  } catch (e) {
    console.warn("[btch YouTube] failed:", e);
  }
  return null;
}

function buildYtDlpMeta(info: any, url: string, platform: string): MediaMetadata {
  const videoFormats: MediaFormat[] = [];
  const audioFormats: MediaFormat[] = [];
  const seenQualities = new Set<string>();

  const sortedFormats = (info.formats || [])
    .filter((f: any) => f.url && !f.url.includes("manifest"))
    .sort((a: any, b: any) => {
      const aHasAudio = a.acodec && a.acodec !== "none" ? 1 : 0;
      const bHasAudio = b.acodec && b.acodec !== "none" ? 1 : 0;
      if (aHasAudio !== bHasAudio) return bHasAudio - aHasAudio;
      return (b.height || 0) - (a.height || 0);
    });

  for (const f of sortedFormats) {
    const isVideo = f.vcodec && f.vcodec !== "none";
    const isAudio = f.acodec && f.acodec !== "none";

    if (isVideo) {
      const quality = qualityLabel(f);
      const key = `${quality}-${f.fps || 30}-${f.ext}`;
      if (seenQualities.has(key)) continue;
      seenQualities.add(key);

      const fpsLabel = f.fps && f.fps > 30 ? ` ${f.fps}fps` : "";
      const size = f.filesize || f.filesize_approx || 0;

      videoFormats.push({
        id: f.format_id,
        type: "video",
        label: `${quality}${fpsLabel}`,
        quality,
        resolution: f.width && f.height ? `${f.width}x${f.height}` : undefined,
        fps: f.fps || undefined,
        ext: f.ext || "mp4",
        fileSize: size || undefined,
        fileSizeLabel: size ? formatBytes(size) : undefined,
        url: f.url,
        hasAudio: !!isAudio,
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

  const formats: MediaFormat[] = [
    ...videoFormats.slice(0, 12),
    ...audioFormats.slice(0, 5),
  ];

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

  let thumbnail = info.thumbnail || "";
  if (info.thumbnails?.length) {
    const sorted = [...info.thumbnails].sort((a: any, b: any) => (b.width || 0) - (a.width || 0));
    thumbnail = sorted[0]?.url || thumbnail;
  }

  const dur = info.duration || 0;
  const mins = Math.floor(dur / 60);
  const secs = Math.floor(dur % 60);

  let uploadDate = "";
  if (info.upload_date) {
    const d = info.upload_date;
    uploadDate = `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
  }

  return {
    id: info.id || `dl_${Date.now()}`,
    url: info.webpage_url || url,
    title: info.title || "Media",
    author: info.channel || "Unknown",
    authorUrl: info.channel_url || "",
    thumbnail,
    duration: dur || undefined,
    durationLabel: dur ? `${mins}:${secs.toString().padStart(2, "0")}` : undefined,
    platform,
    description: info.description?.slice(0, 500) || "",
    viewCount: info.view_count || undefined,
    likeCount: info.like_count || undefined,
    uploadDate: uploadDate || undefined,
    formats,
  };
}

export async function POST(req: NextRequest) {
  let url = "";
  try {
    const body = await req.json();
    url = typeof body?.url === "string" ? body.url.trim() : "";

    if (!url) {
      return NextResponse.json(
        { success: false, error: "URL is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!isValidUrl(url)) {
      return NextResponse.json(
        { success: false, error: "Invalid URL format" },
        { status: 400, headers: corsHeaders }
      );
    }

    const platform = detectPlatform(url) || "generic";

    // 1. TikTok & Douyin direct real extraction
    if (platform === "tiktok" || platform === "douyin") {
      const ttMeta = await extractTikTokOrDouyin(url, platform);
      if (ttMeta) {
        return NextResponse.json({ success: true, isMock: false, data: ttMeta }, { headers: corsHeaders });
      }
    }

    // 2. Facebook direct real extraction
    if (platform === "facebook") {
      const fbMeta = await extractFacebook(url);
      if (fbMeta) {
        return NextResponse.json({ success: true, isMock: false, data: fbMeta }, { headers: corsHeaders });
      }
    }

    // 3. YouTube: try yt-dlp first, then fallback to btch
    if (platform === "youtube") {
      try {
        const info = await getVideoInfo(url);
        const meta = buildYtDlpMeta(info, url, platform);
        return NextResponse.json({ success: true, isMock: false, data: meta }, { headers: corsHeaders });
      } catch (ytDlpErr) {
        console.warn("[YouTube] yt-dlp failed, trying direct stream engine...", ytDlpErr);
        const ytMeta = await extractYouTubeFallback(url);
        if (ytMeta) {
          return NextResponse.json({ success: true, isMock: false, data: ytMeta }, { headers: corsHeaders });
        }
      }
    }

    // 4. Other platforms: try yt-dlp
    try {
      const info = await getVideoInfo(url);
      const meta = buildYtDlpMeta(info, url, platform);
      return NextResponse.json({ success: true, isMock: false, data: meta }, { headers: corsHeaders });
    } catch (generalErr) {
      console.warn("[api/parse] yt-dlp failed for " + platform, generalErr);
    }

    // 5. If real extraction fails, fall back to metadata oEmbed (mark isMock: true, NO fake download links)
    const { parseMediaUrl: fallbackParse } = await import("@/lib/providers");
    const fallbackResult = await fallbackParse(url);
    if (fallbackResult.success && fallbackResult.data) {
      return NextResponse.json({
        success: true,
        isMock: true,
        data: fallbackResult.data,
      }, { headers: corsHeaders });
    }

    return NextResponse.json(
      { 
        success: false, 
        error: "Gagal menganalisis URL. Platform ini memblokir akses atau link tidak valid." 
      },
      { status: 422, headers: corsHeaders }
    );
  } catch (err) {
    console.error("[api/parse] Unhandled error:", err);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan saat memproses media." },
      { status: 500, headers: corsHeaders }
    );
  }
}
