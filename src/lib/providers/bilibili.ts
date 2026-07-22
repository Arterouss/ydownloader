import { BaseProvider, type ParseResult } from "./base";

export class BilibiliProvider extends BaseProvider {
  readonly name = "Bilibili";
  readonly slug = "bilibili";
  readonly domains = ["bilibili.com", "b23.tv", "bilibili.tv"];
  readonly color = "#00A1D6";
  readonly icon = "tv";

  async parseUrl(url: string): Promise<ParseResult> {
    await this.delay(700 + Math.random() * 400);

    return {
      success: true,
      data: {
        id: `bl_${Date.now()}`,
        url,
        title: "【4K】赛博朋克城市漫游 — Cyberpunk Night Drive",
        author: "夜行者NightWalker",
        authorUrl: "https://space.bilibili.com/123456",
        thumbnail: `https://picsum.photos/seed/bili${Date.now()}/1280/720`,
        duration: 892,
        durationLabel: "14:52",
        platform: this.slug,
        viewCount: 890_000,
        likeCount: 67_000,
        uploadDate: "2026-05-22",
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
