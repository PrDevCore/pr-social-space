import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { presignMedia } from "@/lib/zernio";

// POST /api/social/media { filename, contentType }
// Returns a presigned uploadUrl the browser PUTs the file to directly
// (CORS-enabled, avoids Vercel's serverless body limit), plus the publicUrl
// to attach to a post's mediaItems. ZERNIO_API_KEY never leaves the server.
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { filename?: string; contentType?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const filename = body.filename?.trim();
  const contentType = body.contentType?.trim();
  if (!filename || !contentType) {
    return NextResponse.json(
      { error: "filename and contentType are required" },
      { status: 400 }
    );
  }

  try {
    const { uploadUrl, publicUrl } = await presignMedia({ filename, contentType });
    return NextResponse.json({ uploadUrl, publicUrl });
  } catch (err) {
    console.error("media presign:", err);
    return NextResponse.json(
      { error: "Failed to create upload." },
      { status: 502 }
    );
  }
}
