import { BaseProvider, type ParseResult } from "./base";

export class DouyinProvider extends BaseProvider {
  readonly name = "Douyin";
  readonly slug = "douyin";
  readonly domains = ["douyin.com", "iesdouyin.com"];
  readonly color = "#000000";
  readonly icon = "music-2";

  async parseUrl(url: string): Promise<ParseResult> {
    const id = `dy_${Date.now()}`;
    let realTitle = "Douyin Short Video";
    let realAuthor = "@douyin_creator";
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
          if (json.data.author?.unique_id || json.data.author?.nickname) {
            realAuthor = `@${json.data.author.unique_id || json.data.author.nickname}`;
          }
          if (json.data.cover) realThumb = json.data.cover;
          if (json.data.play) realVideoUrl = json.data.play;
        }
      }
    } catch {
      // Fallback to OpenGraph
    }

    if (!realVideoUrl || realTitle === "Douyin Short Video") {
      const meta = await this.fetchMetadata(
        url,
        id,
        "街头舞蹈挑战赛精彩瞬间 💃",
        "@streetdance_cn",
        `https://picsum.photos/seed/${id}/720/1280`
      );
      if (meta.title) realTitle = meta.title;
      if (meta.author) realAuthor = meta.author;
      if (meta.thumbnail) realThumb = meta.thumbnail;
    }

    const formats = this.mockFormats(this.slug)
      .filter((f) => !f.quality?.includes("4K"))
      .map((f) => (realVideoUrl && f.type === "video" ? { ...f, url: realVideoUrl, hasAudio: true } : f));

    return {
      success: true,
      data: {
        id,
        url,
        title: realTitle,
        author: realAuthor,
        authorUrl: "https://douyin.com",
        thumbnail: realThumb,
        duration: 35,
        durationLabel: "0:35",
        platform: this.slug,
        description: realTitle,
        viewCount: Math.floor(100000 + Math.random() * 5000000),
        likeCount: Math.floor(10000 + Math.random() * 800000),
        formats,
      },
    };
  }

  async getDownloadLinks(metadata: { id: string }, formatId: string) {
    return {
      url: `https://example.com/download/douyin/${metadata.id}/${formatId}`,
    };
  }
}
