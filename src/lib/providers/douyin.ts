import { BaseProvider, type ParseResult } from "./base";

export class DouyinProvider extends BaseProvider {
  readonly name = "Douyin";
  readonly slug = "douyin";
  readonly domains = ["douyin.com", "iesdouyin.com"];
  readonly color = "#000000";
  readonly icon = "music-2";

  async parseUrl(url: string): Promise<ParseResult> {
    const id = `dy_${Date.now()}`;
    const meta = await this.fetchMetadata(
      url,
      id,
      "街头舞蹈挑战赛精彩瞬间 💃",
      "@streetdance_cn",
      `https://picsum.photos/seed/${id}/720/1280`
    );

    return {
      success: true,
      data: {
        id,
        url,
        title: meta.title,
        author: meta.author,
        authorUrl: meta.authorUrl || "https://douyin.com",
        thumbnail: meta.thumbnail,
        duration: 35,
        durationLabel: "0:35",
        platform: this.slug,
        description: meta.description || "Douyin short video.",
        viewCount: Math.floor(100000 + Math.random() * 5000000),
        likeCount: Math.floor(10000 + Math.random() * 800000),
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
