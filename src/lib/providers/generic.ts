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
    let hostname = "unknown";
    try {
      hostname = new URL(url).hostname.replace("www.", "");
    } catch {
      /* ignore */
    }

    const id = `gen_${Date.now()}`;
    const meta = await this.fetchMetadata(
      url,
      id,
      `Media from ${hostname}`,
      hostname,
      `https://picsum.photos/seed/${hostname}/1280/720`
    );

    return {
      success: true,
      data: {
        id,
        url,
        title: meta.title,
        author: meta.author,
        authorUrl: meta.authorUrl || `https://${hostname}`,
        thumbnail: meta.thumbnail,
        duration: 120,
        durationLabel: "2:00",
        platform: this.slug,
        description: meta.description || `Web media content from ${hostname}`,
        uploadDate: new Date().toISOString().split("T")[0],
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
