import { NextRequest, NextResponse } from "next/server";
import { parseMediaUrl } from "@/lib/providers";
import { isValidUrl } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const url = typeof body?.url === "string" ? body.url.trim() : "";

    if (!url) {
      return NextResponse.json(
        { success: false, error: "URL is required" },
        { status: 400 }
      );
    }

    if (!isValidUrl(url)) {
      return NextResponse.json(
        { success: false, error: "Invalid URL format" },
        { status: 400 }
      );
    }

    const result = await parseMediaUrl(url);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Parse failed" },
        { status: 422 }
      );
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (err) {
    console.error("[api/parse]", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
