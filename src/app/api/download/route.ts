import { NextRequest, NextResponse } from "next/server";
import { getProviderBySlug } from "@/lib/providers";

/**
 * Mock download endpoint.
 * Real implementation would stream file / return signed URL.
 * UI uses client-side queue simulation for progress UX.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { platform, mediaId, formatId, metadata } = body ?? {};

    if (!platform || !formatId) {
      return NextResponse.json(
        { success: false, error: "platform and formatId required" },
        { status: 400 }
      );
    }

    const provider = getProviderBySlug(platform);
    if (!provider) {
      return NextResponse.json(
        { success: false, error: "Unknown platform" },
        { status: 400 }
      );
    }

    const meta = metadata ?? { id: mediaId || `media_${Date.now()}` };
    const link = await provider.getDownloadLinks(meta, formatId);

    if (!link) {
      return NextResponse.json(
        { success: false, error: "No download link available" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        downloadUrl: link.url,
        headers: link.headers ?? {},
        // Mock: client simulates progress; real app would stream
        mock: true,
      },
    });
  } catch (err) {
    console.error("[api/download]", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
