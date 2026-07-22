import { BaseProvider, type ParseResult } from "./base";

export class YouTubeProvider extends BaseProvider {
  readonly name = "YouTube";
  readonly slug = "youtube";
  readonly domains = ["youtube.com", "youtu.be", "m.youtube.com"];
  readonly color = "#FF0000";
  readonly icon = "youtube";

  async parseUrl(url: string): Promise<ParseResult> {
    const videoId = this.extractId(url) || `yt_${Date.now()}`;
    const defaultThumb = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

    const meta = await this.fetchMetadata(
      url,
      videoId,
      "YouTube Video / Short",
      "YouTube Creator",
      defaultThumb
    );

    const isShort = url.includes("/shorts/");
    return {
      success: true,
      data: {
        id: videoId,
        url,
        title: meta.title,
        author: meta.author,
        authorUrl: meta.authorUrl || "https://youtube.com",
        thumbnail: meta.thumbnail || defaultThumb,
        duration: isShort ? 45 : 1245,
        durationLabel: isShort ? "0:45" : "20:45",
        platform: this.slug,
        description: meta.description || "YouTube media content.",
        viewCount: Math.floor(10000 + Math.random() * 2000000),
        likeCount: Math.floor(1000 + Math.random() * 150000),
        uploadDate: new Date().toISOString().split("T")[0],
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
      if (u.hostname.includes("youtu.be")) {
        return u.pathname.slice(1).split("/")[0]?.split("?")[0];
      }
      if (u.pathname.startsWith("/shorts/")) {
        return u.pathname.split("/")[2]?.split("?")[0] || u.pathname.split("/")[1]?.replace("shorts", "");
      }
      if (u.pathname.startsWith("/embed/")) {
        return u.pathname.split("/")[2]?.split("?")[0];
      }
      if (u.pathname.startsWith("/live/")) {
        return u.pathname.split("/")[2]?.split("?")[0];
      }
      return u.searchParams.get("v");
    } catch {
      return null;
    }
  }
}

