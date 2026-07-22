import { BaseProvider, type ParseResult } from "./base";

export class GenericProvider extends BaseProvider {
  readonly name = "Generic";
  readonly slug = "generic";
  readonly domains = ["*"];
  readonly color = "#71717a";
  readonly icon = "globe";

  matches(): boolean {
    return true;
  }

  async parseUrl(url: string): Promise<ParseResult> {
    await this.delay(400 + Math.random() * 300);

    let hostname = "unknown";
    try {
      hostname = new URL(url).hostname.replace("www.", "");
    } catch {
      /* ignore */
    }

    return {
      success: true,
      data: {
        id: `gen_${Date.now()}`,
        url,
        title: `Media from ${hostname}`,
        author: hostname,
        thumbnail: `https://picsum.photos/seed/${hostname}/1280/720`,
        duration: 120,
        durationLabel: "2:00",
        platform: this.slug,
        formats: this.mockFormats(this.slug).filter(
          (f) => f.type === "video" && !f.quality?.includes("4K")
        ),
      },
    };
  }

  async getDownloadLinks(metadata: { id: string }, formatId: string) {
    return {
      url: `https://example.com/download/generic/${metadata.id}/${formatId}`,
    };
  }
}
