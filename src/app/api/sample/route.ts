import { NextRequest, NextResponse } from "next/server";
import { getFormatUrl } from "@/lib/ytdlp";

export const maxDuration = 60;

/**
 * Proxy endpoint that streams real video/audio content to the browser.
 *
 * Usage:
 *   /api/sample?url=<sourceUrl>&format=<formatId>&title=<fileName>&ext=<extension>
 *
 * - If `directUrl` is provided (a real CDN stream URL), it proxies that directly.
 * - If `url` + `format` are provided, it uses yt-dlp to resolve the direct URL first.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const ext = (searchParams.get("ext") || "mp4").toLowerCase();
    const title = searchParams.get("title") || "media_download";
    const directUrl = searchParams.get("directUrl");
    const sourceUrl = searchParams.get("url");
    const formatId = searchParams.get("format");

    const safeTitle =
      title.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 80) || "video";
    const fileName = `${safeTitle}.${ext}`;

    let streamUrl = "";

    // Priority 1: Direct CDN URL provided by the client
    if (
      directUrl &&
      directUrl.startsWith("http") &&
      !directUrl.includes("example.com")
    ) {
      streamUrl = directUrl;
    }
    // Priority 2: Resolve via yt-dlp
    else if (sourceUrl && formatId) {
      try {
        streamUrl = await getFormatUrl(sourceUrl, formatId);
      } catch (e) {
        console.error("[api/sample] yt-dlp resolve failed:", e);
      }
    }

    if (!streamUrl) {
      return NextResponse.json(
        { success: false, error: "No stream URL available" },
        { status: 400 }
      );
    }

    // Stream the content from the CDN to the client
    const res = await fetch(streamUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Referer: sourceUrl || "",
      },
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) {
      return NextResponse.json(
        {
          success: false,
          error: `Upstream returned ${res.status}`,
        },
        { status: 502 }
      );
    }

    // Determine content type
    let contentType = res.headers.get("content-type") || "video/mp4";
    if (
      contentType.includes("text/html") ||
      contentType.includes("application/xml")
    ) {
      contentType =
        ext === "mp3" || ext === "m4a"
          ? "audio/mpeg"
          : ext === "webm"
            ? "video/webm"
            : ext === "jpg" || ext === "jpeg" || ext === "png"
              ? "image/jpeg"
              : "video/mp4";
    }

    const contentLength = res.headers.get("content-length");

    const responseHeaders: Record<string, string> = {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-cache",
    };

    if (contentLength) {
      responseHeaders["Content-Length"] = contentLength;
    }

    // Stream the body through
    return new NextResponse(res.body, {
      status: 200,
      headers: responseHeaders,
    });
  } catch (err) {
    console.error("[api/sample] Error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to stream media" },
      { status: 500 }
    );
  }
}
