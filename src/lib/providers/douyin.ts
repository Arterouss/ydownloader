import { BaseProvider, type ParseResult } from "./base";

export class DouyinProvider extends BaseProvider {
  readonly name = "Douyin";
  readonly slug = "douyin";
  readonly domains = ["douyin.com", "iesdouyin.com"];
  readonly color = "#000000";
  readonly icon = "music-2";

  async parseUrl(url: string): Promise<ParseResult> {
    await this.delay(500 + Math.random() * 300);

    return {
      success: true,
      data: {
        id: `dy_${Date.now()}`,
        url,
        title: "街头舞蹈挑战赛决赛精彩瞬间 💃",
        author: "@streetdance_cn",
        thumbnail: `https://picsum.photos/seed/dy${Date.now()}/720/1280`,
        duration: 35,
        durationLabel: "0:35",
        platform: this.slug,
        viewCount: 5_600_000,
        likeCount: 890_000,
        formats: this.mockFormats(this.slug).filter(
          (f) => !f.quality?.includes("4K")
        ),
      },
    };
  }

  async getDownloadLinks(metadata: { id: string }, formatId: string) {
    return {
      url: `https://example.com/download/douyin/${metadata.id}/${formatId}`,
    };
  }
}
