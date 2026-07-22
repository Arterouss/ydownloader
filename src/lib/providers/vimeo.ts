import { BaseProvider, type ParseResult } from "./base";

export class VimeoProvider extends BaseProvider {
  readonly name = "Vimeo";
  readonly slug = "vimeo";
  readonly domains = ["vimeo.com"];
  readonly color = "#1AB7EA";
  readonly icon = "video";

  async parseUrl(url: string): Promise<ParseResult> {
    await this.delay(600 + Math.random() * 400);

    return {
      success: true,
      data: {
        id: `vm_${Date.now()}`,
        url,
        title: "Brand Film — Quiet Luxury Collection 2026",
        author: "Atelier Films",
        authorUrl: "https://vimeo.com/atelierfilms",
        thumbnail: `https://picsum.photos/seed/vimeo${Date.now()}/1920/1080`,
        duration: 180,
        durationLabel: "3:00",
        platform: this.slug,
        viewCount: 45_000,
        uploadDate: "2026-04-01",
        formats: this.mockFormats(this.slug),
      },
    };
  }

  async getDownloadLinks(metadata: { id: string }, formatId: string) {
    return {
      url: `https://example.com/download/vimeo/${metadata.id}/${formatId}`,
    };
  }
}
