import { NextResponse } from "next/server";

/**
 * POST /api/error-report
 * Receives client-side error reports from error boundaries.
 * Logs them to stdout so they appear in Vercel's function logs.
 *
 * This is a temporary diagnostic endpoint — remove once the iOS
 * dashboard crash is identified and fixed.
 */
export async function POST(request) {
  try {
    const body = await request.json();

    // Log to Vercel function logs (visible in Vercel dashboard > Logs)
    console.error("=== CLIENT ERROR REPORT ===");
    console.error("Message:", body.message || "unknown");
    console.error("Digest:", body.digest || "none");
    console.error("URL:", body.url || "unknown");
    console.error("User-Agent:", body.ua || "unknown");
    console.error("Level:", body.level || "page");
    console.error("Timestamp:", body.timestamp || new Date().toISOString());
    if (body.stack) {
      console.error("Stack:", body.stack.slice(0, 2000));
    }
    console.error("=== END ERROR REPORT ===");

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Error report endpoint failed:", e.message);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
