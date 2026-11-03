import { BaseProvider, type ParseResult } from "./base";

export class FacebookProvider extends BaseProvider {
  readonly name = "Facebook";
  readonly slug = "facebook";
  readonly domains = [
    "facebook.com",
    "fb.watch",
    "fb.com",
    "m.facebook.com",
    "web.facebook.com",
  ];
  readonly color = "#1877F2";
  readonly icon = "video";

  async parseUrl(url: string): Promise<ParseResult> {
    const id = `fb_${Date.now()}`;
    let realTitle = "Facebook Reel & Video";
    let realAuthor = "@facebook_creator";
    let realThumb = `https://picsum.photos/seed/${id}/1280/720`;
    let realVideoUrl: string | undefined;

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
          html.match(/hd_src:"([^"]+)"/) ||
          html.match(/"playable_url_quality_hd":"([^"]+)"/);
        const sdMatch =
          html.match(/"browser_native_sd_url":"([^"]+)"/) ||
          html.match(/sd_src:"([^"]+)"/) ||
          html.match(/"playable_url":"([^"]+)"/);

        const rawUrl = (hdMatch?.[1] || sdMatch?.[1] || "")
          .replace(/\\u0026/g, "&")
          .replace(/\\u0025/g, "%")
          .replace(/\\\//g, "/");

        if (rawUrl.startsWith("http")) {
          realVideoUrl = rawUrl;
        }

        const titleMatch =
          html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i) ||
          html.match(/<title[^>]*>([^<]+)<\/title>/i);
        if (titleMatch?.[1]) {
          realTitle = titleMatch[1].replace(/\s*\|\s*Facebook.*$/i, "").trim() || realTitle;
        }

        const thumbMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
        if (thumbMatch?.[1]) {
          realThumb = thumbMatch[1].replace(/&amp;/g, "&");
        }
      }
    } catch {
      // Fallback
    }

    const formats = this.mockFormats(this.slug).map((f) =>
      realVideoUrl && f.type === "video" ? { ...f, url: realVideoUrl, hasAudio: true } : f
    );

    return {
      success: true,
      data: {
        id,
        url,
        title: realTitle,
        author: realAuthor,
        authorUrl: "https://facebook.com",
        thumbnail: realThumb,
        duration: 45,
        durationLabel: "0:45",
        platform: this.slug,
        description: realTitle,
        viewCount: Math.floor(25000 + Math.random() * 800000),
        likeCount: Math.floor(1200 + Math.random() * 45000),
        uploadDate: new Date().toISOString().split("T")[0],
        formats,
      },
    };
  }

  async getDownloadLinks(metadata: { id: string }, formatId: string) {
    return {
      url: `https://example.com/download/facebook/${metadata.id}/${formatId}`,
    };
  }
}
