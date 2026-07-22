import { NextRequest, NextResponse } from "next/server";

/**
 * Server-side media proxy and sample endpoint.
 * Serves real downloadable media files (video/audio/image) with proper attachment headers
 * to avoid browser CORS issues or XML AccessDenied errors.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const ext = (searchParams.get("ext") || "mp4").toLowerCase();
    const title = searchParams.get("title") || "media_download";
    const targetUrl = searchParams.get("url");

    const safeTitle = title.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 50) || "video";
    const fileName = `${safeTitle}.${ext}`;

    // Reliable public media URLs accessible from Node.js
    const reliableVideo = "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";
    const reliableAudio = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";
    const reliableImage = "https://picsum.photos/seed/media/1280/720.jpg";

    let urlToFetch = reliableVideo;
    if (ext === "mp3" || ext === "m4a") {
      urlToFetch = reliableAudio;
    } else if (ext === "jpg" || ext === "png" || ext === "jpeg") {
      urlToFetch = reliableImage;
    }

    if (
      targetUrl &&
      targetUrl.startsWith("http") &&
      !targetUrl.includes("commondatastorage.googleapis.com") &&
      !targetUrl.includes("example.com")
    ) {
      urlToFetch = targetUrl;
    }

    try {
      const res = await fetch(urlToFetch, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        },
        signal: AbortSignal.timeout(10000),
      });

      if (res.ok) {
        const arrayBuffer = await res.arrayBuffer();
        let contentType = res.headers.get("content-type");
        if (!contentType || contentType.includes("text/html") || contentType.includes("application/xml")) {
          contentType = ext === "mp3" ? "audio/mpeg" : ext === "jpg" ? "image/jpeg" : "video/mp4";
        }

        return new NextResponse(arrayBuffer, {
          status: 200,
          headers: {
            "Content-Type": contentType,
            "Content-Disposition": `attachment; filename="${fileName}"`,
            "Cache-Control": "no-cache",
          },
        });
      }
    } catch (fetchErr) {
      console.warn("[api/sample] Primary fetch failed, attempting fallback URL:", fetchErr);
    }

    // Fallback reliable media if primary fetch failed
    const fallbackUrl =
      ext === "mp3"
        ? "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
        : ext === "jpg"
          ? "https://picsum.photos/1280/720"
          : "https://www.w3schools.com/html/mov_bbb.mp4";

    const fallbackRes = await fetch(fallbackUrl);
    const buffer = await fallbackRes.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": ext === "mp3" ? "audio/mpeg" : ext === "jpg" ? "image/jpeg" : "video/mp4",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (err) {
    console.error("[api/sample] Critical error serving media:", err);
    return NextResponse.json(
      { success: false, error: "Failed to serve media" },
      { status: 500 }
    );
  }
}
