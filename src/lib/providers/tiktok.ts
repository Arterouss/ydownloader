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

export class TikTokProvider extends BaseProvider {
  readonly name = "TikTok";
  readonly slug = "tiktok";
  readonly domains = ["tiktok.com", "vm.tiktok.com", "vt.tiktok.com"];
  readonly color = "#000000";
  readonly icon = "music-2";

  async parseUrl(url: string): Promise<ParseResult> {
    const canonicalUrl = await unshorten(url);
    const id = `tt_${Date.now()}`;
    let realTitle = "TikTok Video Content";
    let realAuthor = "@tiktok_creator";
    let realThumb = `https://picsum.photos/seed/${id}/720/1280`;
    let realVideoUrl: string | undefined;
    let realHdUrl: string | undefined;
    let realAudioUrl: string | undefined;

    try {
      const res = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(canonicalUrl)}`, {
        signal: AbortSignal.timeout(6000),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.code === 0 && json.data) {
          if (json.data.title) realTitle = json.data.title;
          if (json.data.author?.unique_id) realAuthor = `@${json.data.author.unique_id}`;
          if (json.data.cover) realThumb = json.data.cover;
          if (json.data.play) realVideoUrl = json.data.play;
          if (json.data.hdplay) realHdUrl = json.data.hdplay;
          if (json.data.music_info?.play) realAudioUrl = json.data.music_info.play;
        }
      }
    } catch {
      // Fallback
    }

    if (!realVideoUrl) {
      try {
        const { snapsave } = await import("snapsave-media-downloader");
        const snap = await snapsave(canonicalUrl);
        if (snap.success && snap.data?.media?.[0]?.url) {
          realVideoUrl = snap.data.media[0].url;
          if (snap.data.preview) realThumb = snap.data.preview;
          if (snap.data.description) realTitle = snap.data.description;
        }
      } catch {
        // Fallback
      }
    }

    const formats = this.mockFormats(this.slug).map((f) => {
      if (realVideoUrl && f.type === "video") {
        return {
          ...f,
          url: f.quality?.includes("HD") && realHdUrl ? realHdUrl : realVideoUrl,
          hasAudio: true,
        };
      }
      if (realAudioUrl && f.type === "audio") {
        return { ...f, url: realAudioUrl, hasAudio: true };
      }
      return f;
    });

    return {
      success: true,
      data: {
        id,
        url: canonicalUrl,
        title: realTitle,
        author: realAuthor,
        authorUrl: `https://tiktok.com/${realAuthor}`,
        thumbnail: realThumb,
        duration: 30,
        durationLabel: "0:30",
        platform: this.slug,
        description: realTitle,
        formats,
      },
    };
  }

  async getDownloadLinks(metadata: { id: string }, formatId: string) {
    return {
      url: `https://example.com/download/tiktok/${metadata.id}/${formatId}`,
    };
  }
}
