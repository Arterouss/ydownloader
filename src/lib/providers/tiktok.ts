import { BaseProvider, type ParseResult } from "./base";

export class TikTokProvider extends BaseProvider {
  readonly name = "TikTok";
  readonly slug = "tiktok";
  readonly domains = ["tiktok.com", "vm.tiktok.com"];
  readonly color = "#000000";
  readonly icon = "music-2";

  async parseUrl(url: string): Promise<ParseResult> {
    await this.delay(500 + Math.random() * 300);

    return {
      success: true,
      data: {
        id: `tt_${Date.now()}`,
        url,
        title: "POV: When the code finally works 🔥 #coding #devlife",
        author: "@devmemes",
        authorUrl: "https://tiktok.com/@devmemes",
        thumbnail: `https://picsum.photos/seed/tiktok${Date.now()}/720/1280`,
        duration: 28,
        durationLabel: "0:28",
        platform: this.slug,
        viewCount: 2_400_000,
        likeCount: 340_000,
        uploadDate: "2026-07-10",
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
