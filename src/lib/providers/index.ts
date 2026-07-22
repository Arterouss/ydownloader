import { BaseProvider, type MediaMetadata, type ParseResult } from "./base";
import { YouTubeProvider } from "./youtube";
import { TikTokProvider } from "./tiktok";
import { InstagramProvider } from "./instagram";
import { BilibiliProvider } from "./bilibili";
import { XProvider } from "./x";
import { DouyinProvider } from "./douyin";
import { VimeoProvider } from "./vimeo";
import { GenericProvider } from "./generic";

export * from "./base";

const providers: BaseProvider[] = [
  new YouTubeProvider(),
  new TikTokProvider(),
  new InstagramProvider(),
  new BilibiliProvider(),
  new XProvider(),
  new DouyinProvider(),
  new VimeoProvider(),
  new GenericProvider(),
];

export function getProviderForUrl(url: string): BaseProvider | null {
  for (const provider of providers) {
    if (provider.slug === "generic") continue;
    if (provider.matches(url)) return provider;
  }
  const generic = providers.find((p) => p.slug === "generic");
  return generic ?? null;
}

export function getAllProviders(): BaseProvider[] {
  return providers.filter((p) => p.slug !== "generic");
}

export function getProviderBySlug(slug: string): BaseProvider | null {
  return providers.find((p) => p.slug === slug) ?? null;
}

export async function parseMediaUrl(url: string): Promise<ParseResult> {
  const provider = getProviderForUrl(url);
  if (!provider) {
    return { success: false, error: "Unsupported platform" };
  }
  try {
    return await provider.parseUrl(url);
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to parse URL",
    };
  }
}

export type { MediaMetadata, ParseResult };
