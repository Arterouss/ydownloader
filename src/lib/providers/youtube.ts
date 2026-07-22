import { BaseProvider, type ParseResult } from "./base";

export class YouTubeProvider extends BaseProvider {
  readonly name = "YouTube";
  readonly slug = "youtube";
  readonly domains = ["youtube.com", "youtu.be", "m.youtube.com"];
  readonly color = "#FF0000";
  readonly icon = "youtube";

  async parseUrl(url: string): Promise<ParseResult> {
    await this.delay(600 + Math.random() * 400);

    const videoId = this.extractId(url);
    return {
      success: true,
      data: {
        id: videoId || `yt_${Date.now()}`,
        url,
        title: "Amazing Tech Review 2026 — Full Breakdown & Benchmarks",
        author: "TechVision Channel",
        authorUrl: "https://youtube.com/@techvision",
        thumbnail: `https://picsum.photos/seed/${videoId || "yt"}/1280/720`,
        duration: 1245,
        durationLabel: "20:45",
        platform: this.slug,
        description:
          "Deep dive into the latest hardware and software innovations of 2026.",
        viewCount: 1_240_000,
        likeCount: 89_000,
        uploadDate: "2026-06-15",
        formats: this.mockFormats(this.slug),
      },
    };
  }

  async getDownloadLinks(metadata: { id: string }, formatId: string) {
    return {
      url: `https://example.com/download/youtube/${metadata.id}/${formatId}`,
    };
  }

  private extractId(url: string): string | null {
    try {
      const u = new URL(url);
      if (u.hostname.includes("youtu.be")) return u.pathname.slice(1);
      return u.searchParams.get("v");
    } catch {
      return null;
    }
  }
}
