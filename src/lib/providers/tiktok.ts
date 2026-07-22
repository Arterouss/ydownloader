import { BaseProvider, type ParseResult } from "./base";

export class TikTokProvider extends BaseProvider {
  readonly name = "TikTok";
  readonly slug = "tiktok";
  readonly domains = ["tiktok.com", "vm.tiktok.com"];
  readonly color = "#000000";
  readonly icon = "music-2";

  async parseUrl(url: string): Promise<ParseResult> {
    const id = `tt_${Date.now()}`;
    let realTitle = "TikTok Video Content";
    let realAuthor = "@tiktok_creator";
    let realThumb = `https://picsum.photos/seed/${id}/720/1280`;
    let realVideoUrl: string | undefined;

    try {
      const res = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`, {
        signal: AbortSignal.timeout(6000),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          if (json.data.title) realTitle = json.data.title;
          if (json.data.author?.unique_id) realAuthor = `@${json.data.author.unique_id}`;
          if (json.data.cover) realThumb = json.data.cover;
          if (json.data.play) realVideoUrl = json.data.play;
        }
      }
    } catch {
      // Ignore TikWM errors and fallback to general metadata
    }

    if (!realVideoUrl || realTitle === "TikTok Video Content") {
      const meta = await this.fetchMetadata(url, id, realTitle, realAuthor, realThumb);
      if (meta.title) realTitle = meta.title;
      if (meta.author) realAuthor = meta.author;
      if (meta.thumbnail) realThumb = meta.thumbnail;
    }

    const formats = this.mockFormats(this.slug)
      .filter((f) => f.quality !== "4K" && f.id !== "4k-60" && f.id !== "4k-30")
      .map((f) => (realVideoUrl && f.type === "video" ? { ...f, url: realVideoUrl } : f));

    return {
      success: true,
      data: {
        id,
        url,
        title: realTitle,
        author: realAuthor,
        authorUrl: `https://tiktok.com/${realAuthor}`,
        thumbnail: realThumb,
        duration: 28,
        durationLabel: "0:28",
        platform: this.slug,
        description: realTitle,
        viewCount: Math.floor(50000 + Math.random() * 3000000),
        likeCount: Math.floor(5000 + Math.random() * 400000),
        uploadDate: new Date().toISOString().split("T")[0],
        formats,
      },
    };
  }



  async getDownloadLinks(metadata: { id: string }, formatId: string) {
    return {
      url: `https://example.com/download/tiktok/${metadata.id}/${formatId}`,
    };
  }
}
