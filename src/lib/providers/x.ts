import { BaseProvider, type ParseResult } from "./base";

export class XProvider extends BaseProvider {
  readonly name = "X";
  readonly slug = "x";
  readonly domains = ["twitter.com", "x.com", "t.co"];
  readonly color = "#1DA1F2";
  readonly icon = "twitter";

  async parseUrl(url: string): Promise<ParseResult> {
    await this.delay(450 + Math.random() * 300);

    return {
      success: true,
      data: {
        id: `x_${Date.now()}`,
        url,
        title: "Just shipped our new design system 🚀 Thread on the process ↓",
        author: "@designlead",
        authorUrl: "https://x.com/designlead",
        thumbnail: `https://picsum.photos/seed/x${Date.now()}/1200/675`,
        duration: 62,
        durationLabel: "1:02",
        platform: this.slug,
        likeCount: 12_400,
        uploadDate: "2026-07-20",
        formats: this.mockFormats(this.slug).filter(
          (f) => f.type !== "video" || !f.quality?.includes("4K")
        ),
      },
    };
  }

  async getDownloadLinks(metadata: { id: string }, formatId: string) {
    return {
      url: `https://example.com/download/x/${metadata.id}/${formatId}`,
    };
  }
}
