import { BaseProvider, type ParseResult } from "./base";

export class TikTokProvider extends BaseProvider {
  readonly name = "TikTok";
  readonly slug = "tiktok";
  readonly domains = ["tiktok.com", "vm.tiktok.com"];
  readonly color = "#000000";
  readonly icon = "music-2";

  async parseUrl(url: string): Promise<ParseResult> {
    const id = `tt_${Date.now()}`;
    const meta = await this.fetchMetadata(
      url,
      id,
      "TikTok Video Content",
      "@tiktok_creator",
      `https://picsum.photos/seed/${id}/720/1280`
    );

    return {
      success: true,
      data: {
        id,
        url,
        title: meta.title,
        author: meta.author,
        authorUrl: meta.authorUrl || "https://tiktok.com",
        thumbnail: meta.thumbnail,
        duration: 28,
        durationLabel: "0:28",
        platform: this.slug,
        description: meta.description || "TikTok short video.",
        viewCount: Math.floor(50000 + Math.random() * 3000000),
        likeCount: Math.floor(5000 + Math.random() * 400000),
        uploadDate: new Date().toISOString().split("T")[0],
        formats: this.mockFormats(this.slug).filter(
          (f) => f.quality !== "4K" && f.id !== "4k-60" && f.id !== "4k-30"
        ),
      },
    };
  }


  async getDownloadLinks(metadata: { id: string }, formatId: string) {
    return {
      url: `https://example.com/download/tiktok/${metadata.id}/${formatId}`,
    };
  }
}
