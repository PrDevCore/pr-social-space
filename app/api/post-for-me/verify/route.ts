import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { apiKey } = await req.json();

  const baseUrl = process.env.POSTFORME_API_BASE || "https://api.postforme.dev/v1";
  const key = apiKey || process.env.POSTFORME_API_KEY;

  if (!key || key === "pfm_xxxxxxxxxxxxxxxxxxxxxxxx") {
    return NextResponse.json({
      ok: true,
      data: {
        valid: true,
        organization: "Sandbox",
        environment: "sandbox",
        message: "Sandbox mode active"
      }
    });
  }

  try {
    const res = await fetch(`${baseUrl}/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`
      }
    });
    const data = await res.json();
    return NextResponse.json({
      ok: res.ok,
      data: res.ok ? { valid: true, organization: data.organization, environment: "live", message: "API Key verified" } : { valid: false, error: data.error || "Invalid key" }
    });
  } catch {
    return NextResponse.json({ ok: false, data: { valid: false, error: "Could not reach Post for Me" } });
  }
}
