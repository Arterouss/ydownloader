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

    let realTitle = "YouTube Video";
    let realAuthor = "YouTube Creator";
    let realThumb = defaultThumb;
    let realMp4: string | undefined;
    let realMp3: string | undefined;

    try {
      const btch = await import("btch-downloader");
      const yt = await btch.youtube(url);
      if (yt.status && (yt.mp4 || yt.mp3)) {
        if (yt.title) realTitle = yt.title;
        if (yt.author) realAuthor = yt.author;
        if (yt.thumbnail) realThumb = yt.thumbnail;
        if (yt.mp4) realMp4 = yt.mp4;
        if (yt.mp3) realMp3 = yt.mp3;
      }
    } catch {
      // Fallback
    }

    if (!realMp4) {
      const meta = await this.fetchMetadata(url, videoId, realTitle, realAuthor, defaultThumb);
      if (meta.title) realTitle = meta.title;
      if (meta.author) realAuthor = meta.author;
      if (meta.thumbnail) realThumb = meta.thumbnail;
    }

    const formats = this.mockFormats(this.slug).map((f) => {
      if (realMp4 && f.type === "video") {
        return { ...f, url: realMp4, hasAudio: true };
      }
      if (realMp3 && f.type === "audio") {
        return { ...f, url: realMp3, hasAudio: true };
      }
      return f;
    });

    return {
      success: true,
      data: {
        id: videoId,
        url,
        title: realTitle,
        author: realAuthor,
        authorUrl: `https://youtube.com`,
        thumbnail: realThumb,
        duration: 180,
        durationLabel: "3:00",
        platform: this.slug,
        description: realTitle,
        formats,
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
      return u.searchParams.get("v");
    } catch {
      return null;
    }
  }
}
