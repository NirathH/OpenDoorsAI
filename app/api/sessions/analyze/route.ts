import { NextRequest, NextResponse } from "next/server";
import { analyzeSession } from "@/lib/server/sessions/analyzeSession";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { sessionId, offlineContext } = await req.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId is required" },
        { status: 400 }
      );
    }

    const feedback = await analyzeSession(sessionId, offlineContext);

    return NextResponse.json({
      success: true,
      feedback,
    });
  } catch (error: unknown) {
    console.error("POST /api/sessions/analyze error:", error);

    const message =
      error instanceof Error ? error.message : "Failed to analyze session";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}