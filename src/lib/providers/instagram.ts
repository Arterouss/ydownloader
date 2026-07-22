import { BaseProvider, type ParseResult } from "./base";

export class InstagramProvider extends BaseProvider {
  readonly name = "Instagram";
  readonly slug = "instagram";
  readonly domains = ["instagram.com", "instagr.am"];
  readonly color = "#E4405F";
  readonly icon = "instagram";

  async parseUrl(url: string): Promise<ParseResult> {
    await this.delay(550 + Math.random() * 350);

    const isCarousel = url.includes("/p/") || Math.random() > 0.5;

    return {
      success: true,
      data: {
        id: `ig_${Date.now()}`,
        url,
        title: "Sunset vibes from Bali 🌅 Travel diary day 3",
        author: "@wanderlust.studio",
        authorUrl: "https://instagram.com/wanderlust.studio",
        thumbnail: `https://picsum.photos/seed/ig${Date.now()}/1080/1080`,
        duration: isCarousel ? undefined : 45,
        durationLabel: isCarousel ? undefined : "0:45",
        platform: this.slug,
        likeCount: 52_000,
        uploadDate: "2026-07-18",
        isCarousel,
        carouselItems: isCarousel
          ? [
              {
                thumbnail: `https://picsum.photos/seed/igc1/1080/1080`,
                type: "image",
              },
              {
                thumbnail: `https://picsum.photos/seed/igc2/1080/1080`,
                type: "image",
              },
              {
                thumbnail: `https://picsum.photos/seed/igc3/1080/1350`,
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
