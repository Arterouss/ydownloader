import { BaseProvider, type ParseResult } from "./base";

export class InstagramProvider extends BaseProvider {
  readonly name = "Instagram";
  readonly slug = "instagram";
  readonly domains = ["instagram.com", "instagr.am"];
  readonly color = "#E4405F";
  readonly icon = "instagram";

  async parseUrl(url: string): Promise<ParseResult> {
    const id = `ig_${Date.now()}`;
    const meta = await this.fetchMetadata(
      url,
      id,
      "Instagram Post / Reel",
      "@instagram_user",
      `https://picsum.photos/seed/${id}/1080/1080`
    );

    const isCarousel = url.includes("/p/") || url.includes("/carousel/") || Math.random() > 0.5;

    return {
      success: true,
      data: {
        id,
        url,
        title: meta.title,
        author: meta.author,
        authorUrl: meta.authorUrl || "https://instagram.com",
        thumbnail: meta.thumbnail,
        duration: isCarousel ? undefined : 45,
        durationLabel: isCarousel ? undefined : "0:45",
        platform: this.slug,
        description: meta.description || "Instagram media content.",
        likeCount: Math.floor(1000 + Math.random() * 100000),
        uploadDate: new Date().toISOString().split("T")[0],
        isCarousel,
        carouselItems: isCarousel
          ? [
              {
                thumbnail: meta.thumbnail,
                type: "image",
              },
              {
                thumbnail: `https://picsum.photos/seed/igc2_${id}/1080/1080`,
                type: "image",
              },
              {
                thumbnail: `https://picsum.photos/seed/igc3_${id}/1080/1350`,
                type: "video",
              },
            ]
          : undefined,
        formats: this.mockFormats(this.slug).filter(
          (f) => !f.quality?.includes("4K")
        ),
      },
    };
  }


  async getDownloadLinks(metadata: { id: string }, formatId: string) {
    return {
      url: `https://example.com/download/instagram/${metadata.id}/${formatId}`,
    };
  }
}
