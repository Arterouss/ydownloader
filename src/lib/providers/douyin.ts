import { BaseProvider, type ParseResult } from "./base";

async function unshorten(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(6000),
    });
    return res.url || url;
  } catch {
    return url;
  }
}

export class DouyinProvider extends BaseProvider {
  readonly name = "Douyin";
  readonly slug = "douyin";
  readonly domains = ["douyin.com", "iesdouyin.com", "v.douyin.com"];
  readonly color = "#000000";
  readonly icon = "music-2";

  async parseUrl(url: string): Promise<ParseResult> {
    const canonicalUrl = await unshorten(url);
    const id = `dy_${Date.now()}`;
    let realTitle = "Douyin Short Video";
    let realAuthor = "@douyin_creator";
    let realThumb = `https://picsum.photos/seed/${id}/720/1280`;
    let realVideoUrl: string | undefined;

    try {
      const res = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(canonicalUrl)}`, {
        signal: AbortSignal.timeout(6000),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          if (json.data.title) realTitle = json.data.title;
          if (json.data.author?.unique_id || json.data.author?.nickname) {
            realAuthor = `@${json.data.author.unique_id || json.data.author.nickname}`;
          }
          if (json.data.cover) realThumb = json.data.cover;
          if (json.data.play) realVideoUrl = json.data.play;
        }
      }
    } catch {
      // Fallback
    }

    const formats = this.mockFormats(this.slug).map((f) =>
      realVideoUrl && f.type === "video" ? { ...f, url: realVideoUrl, hasAudio: true } : f
    );

    return {
      success: true,
      data: {
        id,
        url: canonicalUrl,
        title: realTitle,
        author: realAuthor,
        authorUrl: "https://douyin.com",
        thumbnail: realThumb,
        duration: 35,
        durationLabel: "0:35",
        platform: this.slug,
        description: realTitle,
        formats,
      },
    };
  }

  async getDownloadLinks(metadata: { id: string }, formatId: string) {
    return {
      url: `https://example.com/download/douyin/${metadata.id}/${formatId}`,
    };
  }
}
