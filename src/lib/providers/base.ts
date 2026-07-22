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

  protected mockFormats(platform: string): MediaFormat[] {
    return [
      {
        id: "4k-60",
        type: "video",
        label: "4K 60fps",
        quality: "4K",
        resolution: "3840x2160",
        fps: 60,
        ext: "mp4",
        fileSize: 850_000_000,
        fileSizeLabel: "850 MB",
        hasAudio: true,
      },
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
        id: "1080p-30",
        type: "video",
        label: "1080p 30fps",
        quality: "1080p",
        resolution: "1920x1080",
        fps: 30,
        ext: "mp4",
        fileSize: 95_000_000,
        fileSizeLabel: "95 MB",
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
        id: "720p-30",
        type: "video",
        label: "720p 30fps",
        quality: "720p",
        resolution: "1280x720",
        fps: 30,
        ext: "mp4",
        fileSize: 45_000_000,
        fileSizeLabel: "45 MB",
        hasAudio: true,
      },
      {
        id: "480p",
        type: "video",
        label: "480p SD",
        quality: "480p",
        resolution: "854x480",
        fps: 30,
        ext: "mp4",
        fileSize: 22_000_000,
        fileSizeLabel: "22 MB",
        hasAudio: true,
      },
      {
        id: "360p",
        type: "video",
        label: "360p Low",
        quality: "360p",
        resolution: "640x360",
        fps: 30,
        ext: "mp4",
        fileSize: 14_000_000,
        fileSizeLabel: "14 MB",
        hasAudio: true,
      },
      {
        id: "240p",
        type: "video",
        label: "240p Extra Low",
        quality: "240p",
        resolution: "426x240",
        fps: 30,
        ext: "mp4",
        fileSize: 7_500_000,
        fileSizeLabel: "7.5 MB",
        hasAudio: true,
      },
      {
        id: "144p",
        type: "video",
        label: "144p Data Saver",
        quality: "144p",
        resolution: "256x144",
        fps: 30,
        ext: "mp4",
        fileSize: 3_200_000,
        fileSizeLabel: "3.2 MB",
        hasAudio: true,
      },
      {
        id: "audio-320",
        type: "audio",
        label: "320 kbps",
        quality: "320kbps",
        bitrate: "320kbps",
        ext: "mp3",
        fileSize: 8_500_000,
        fileSizeLabel: "8.5 MB",
      },
      {
        id: "audio-256",
        type: "audio",
        label: "256 kbps",
        quality: "256kbps",
        bitrate: "256kbps",
        ext: "m4a",
        fileSize: 6_800_000,
        fileSizeLabel: "6.8 MB",
      },
      {
        id: "audio-128",
        type: "audio",
        label: "128 kbps",
        quality: "128kbps",
        bitrate: "128kbps",
        ext: "mp3",
        fileSize: 3_400_000,
        fileSizeLabel: "3.4 MB",
      },
      {
        id: "thumb-orig",
        type: "image",
        label: "Original Cover",
        quality: "original",
        ext: "jpg",
        fileSize: 450_000,
        fileSizeLabel: "450 KB",
      },
      {
        id: "thumb-hd",
        type: "image",
        label: "HD Wallpaper",
        quality: "hd",
        resolution: "1920x1080",
        ext: "png",
        fileSize: 1_200_000,
        fileSizeLabel: "1.2 MB",
      },
    ];
  }

  protected delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
