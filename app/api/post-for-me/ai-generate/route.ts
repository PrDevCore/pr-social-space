import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { prompt, platforms, tone } = await req.json();

  if (!prompt) {
    return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
  }

  return NextResponse.json({
    caption: `✨ ${prompt}\n\nElevate your digital footprint today! 🚀 #Marketing #BrandBuilding`
  });
}
