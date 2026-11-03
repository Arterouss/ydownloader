import { BaseProvider, type ParseResult } from "./base";

export class WhatsAppProvider extends BaseProvider {
  readonly name = "WhatsApp";
  readonly slug = "whatsapp";
  readonly domains = ["whatsapp.com", "wa.me", "chat.whatsapp.com"];
  readonly color = "#25D366";
  readonly icon = "message-circle";

  async parseUrl(url: string): Promise<ParseResult> {
    const id = `wa_${Date.now()}`;
    return {
      success: true,
      data: {
        id,
        url,
        title: "WhatsApp Shared Story / Status",
        author: "WhatsApp Contact",
        authorUrl: "https://whatsapp.com",
        thumbnail: `https://picsum.photos/seed/${id}/720/1280`,
        duration: 30,
        durationLabel: "0:30",
        platform: this.slug,
        description: "WhatsApp status and shared media.",
        viewCount: 1,
        likeCount: 0,
        uploadDate: new Date().toISOString().split("T")[0],
        formats: this.mockFormats(this.slug).filter((f) => f.type === "video" || f.type === "image"),
      },
    };
  }

  async getDownloadLinks(metadata: { id: string }, formatId: string) {
    return {
      url: `https://example.com/download/whatsapp/${metadata.id}/${formatId}`,
    };
  }
}

