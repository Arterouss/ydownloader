import { BaseProvider, type ParseResult } from "./base";

export class BilibiliProvider extends BaseProvider {
  readonly name = "Bilibili";
  readonly slug = "bilibili";
  readonly domains = ["bilibili.com", "b23.tv", "bilibili.tv"];
  readonly color = "#00A1D6";
  readonly icon = "tv";

  async parseUrl(url: string): Promise<ParseResult> {
    const id = `bl_${Date.now()}`;
    const meta = await this.fetchMetadata(
      url,
      id,
      "【4K】赛博朋克城市漫游 — Cyberpunk Night Drive",
      "夜行者NightWalker",
      `https://picsum.photos/seed/${id}/1280/720`
    );

    return {
      success: true,
      data: {
        id,
        url,
        title: meta.title,
        author: meta.author,
        authorUrl: meta.authorUrl || "https://bilibili.com",
        thumbnail: meta.thumbnail,
        duration: 892,
        durationLabel: "14:52",
        platform: this.slug,
        description: meta.description || "Bilibili high quality video.",
        viewCount: Math.floor(50000 + Math.random() * 1000000),
        likeCount: Math.floor(5000 + Math.random() * 100000),
        uploadDate: new Date().toISOString().split("T")[0],
        formats: this.mockFormats(this.slug),
      },
    };
  }


  async getDownloadLinks(metadata: { id: string }, formatId: string) {
    return {
      url: `https://example.com/download/bilibili/${metadata.id}/${formatId}`,
    };
  }
}
