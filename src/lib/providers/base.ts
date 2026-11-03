export type MediaType = "video" | "audio" | "image";

export interface MediaFormat {
  id: string;
  type: MediaType;
  label: string;
  quality: string;
  resolution?: string;
  fps?: number;
  bitrate?: string;
  ext: string;
  fileSize?: number;
  fileSizeLabel?: string;
  url?: string;
  hasAudio?: boolean;
}

export interface MediaMetadata {
  id: string;
  url: string;
  title: string;
  author: string;
  authorUrl?: string;
  thumbnail: string;
  duration?: number;
  durationLabel?: string;
  platform: string;
  description?: string;
  viewCount?: number;
  likeCount?: number;
  uploadDate?: string;
  formats: MediaFormat[];
  isCarousel?: boolean;
  carouselItems?: { thumbnail: string; type: MediaType }[];
}

export interface ParseResult {
  success: boolean;
  data?: MediaMetadata;
  error?: string;
}

export abstract class BaseProvider {
  abstract readonly name: string;
  abstract readonly slug: string;
  abstract readonly domains: string[];
  abstract readonly color: string;
  abstract readonly icon: string;

  matches(url: string): boolean {
    try {
      const host = new URL(url).hostname.replace("www.", "").toLowerCase();
      return this.domains.some(
        (d) => host === d || host.endsWith(`.${d}`) || host.includes(d)
      );
    } catch {
      return false;
    }
  }

  abstract parseUrl(url: string): Promise<ParseResult>;

  abstract getDownloadLinks(
    metadata: MediaMetadata,
    formatId: string
  ): Promise<{ url: string; headers?: Record<string, string> } | null>;

  protected async fetchMetadata(
    url: string,
    fallbackId: string,
    defaultTitle: string,
    defaultAuthor: string,
    defaultThumb?: string
  ): Promise<{
    title: string;
    author: string;
    authorUrl?: string;
    thumbnail: string;
    description?: string;
  }> {
    let title = defaultTitle;
    let author = defaultAuthor;
    let authorUrl: string | undefined;
    let thumbnail = defaultThumb || `https://picsum.photos/seed/${fallbackId}/1280/720`;
    let description: string | undefined;

    try {
      if (url.includes("youtube.com") || url.includes("youtu.be")) {
        const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
        const res = await fetch(oembedUrl, { signal: AbortSignal.timeout(4000) });
        if (res.ok) {
          const json = await res.json();
          if (json.title) title = json.title;
          if (json.author_name) author = json.author_name;
          if (json.author_url) authorUrl = json.author_url;
          if (json.thumbnail_url) thumbnail = json.thumbnail_url;
          return { title, author, authorUrl, thumbnail, description };
        }
      } else if (url.includes("tiktok.com")) {
        const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
        const res = await fetch(oembedUrl, { signal: AbortSignal.timeout(4000) });
        if (res.ok) {
          const json = await res.json();
          if (json.title) title = json.title;
          if (json.author_name) author = json.author_name;
          if (json.author_url) authorUrl = json.author_url;
          if (json.thumbnail_url) thumbnail = json.thumbnail_url;
          return { title, author, authorUrl, thumbnail, description };
        }
      } else if (url.includes("vimeo.com")) {
        const oembedUrl = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`;
        const res = await fetch(oembedUrl, { signal: AbortSignal.timeout(4000) });
        if (res.ok) {
          const json = await res.json();
          if (json.title) title = json.title;
          if (json.author_name) author = json.author_name;
          if (json.author_url) authorUrl = json.author_url;
          if (json.thumbnail_url) thumbnail = json.thumbnail_url;
          if (json.description) description = json.description;
          return { title, author, authorUrl, thumbnail, description };
        }
      }
    } catch {
      // Ignore oEmbed errors and proceed to HTML scraper
    }

    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        },
        signal: AbortSignal.timeout(4000),
      });
      if (res.ok) {
        const html = await res.text();
        const ogTitle = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i) ||
          html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["']/i) ||
          html.match(/<title[^>]*>([^<]+)<\/title>/i);
        if (ogTitle?.[1]) {
          title = ogTitle[1].replace(/\s*[-|]\s*YouTube.*$/i, "").trim() || title;
        }

        const ogImage = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
          html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i) ||
          html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i);
        if (ogImage?.[1]) {
          thumbnail = ogImage[1];
        }

        const ogDesc = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i) ||
          html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:description["']/i);
        if (ogDesc?.[1]) {
          description = ogDesc[1];
        }

        const ogSite = html.match(/<meta[^>]*property=["']og:site_name["'][^>]*content=["']([^"']+)["']/i) ||
          html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:site_name["']/i);
        if (ogSite?.[1] && author === defaultAuthor) {
          author = ogSite[1];
        }
      }
    } catch {
      // Ignore HTML scrape errors
    }

    return { title, author, authorUrl, thumbnail, description };
  }

  protected mockFormats(platform: string): MediaFormat[] {
    return [
      {
        id: "1080p-60",
        type: "video",
        label: "1080p 60fps",
        quality: "1080p",
        resolution: "1920x1080",
        fps: 60,
        ext: "mp4",
        fileSize: 180_000_000,
        fileSizeLabel: "180 MB",
        hasAudio: true,
      },
      {
        id: "720p-60",
        type: "video",
        label: "720p 60fps",
        quality: "720p",
        resolution: "1280x720",
        fps: 60,
        ext: "mp4",
        fileSize: 75_000_000,
        fileSizeLabel: "75 MB",
        hasAudio: true,
      },
      {
        id: "audio-320",
        type: "audio",
        label: "320 kbps MP3",
        quality: "320kbps",
        bitrate: "320kbps",
        ext: "mp3",
        fileSize: 8_500_000,
        fileSizeLabel: "8.5 MB",
        hasAudio: true,
      },
    ];
  }


  protected delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
