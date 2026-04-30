import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createSupabaseServer } from "@/lib/supabaseServer";
import { analyzeSession } from "@/lib/server/sessions/analyzeSession";

export const dynamic = "force-dynamic";

type VideoAnalysisStats = {
  framesAnalyzed?: number;
  faceDetectedFrames?: number;
  lookingAwayFrames?: number;
  smileFrames?: number;
  eyeContactPercent?: number;
  faceDetectedPercent?: number;
  lookingAwayCount?: number;
  avgSmileScore?: number;
};

export async function POST(req: NextRequest) {
  try {
    const supabaseServer = await createSupabaseServer();

    const { data: authData, error: authError } =
      await supabaseServer.auth.getUser();

    if (authError || !authData.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const authUserId = authData.user.id;
    const body = await req.json();

    const {
      sessionId,
      compactTranscript,
      durationSeconds,
      transcriptStatus,
      videoAnalysis,
    }: {
      sessionId?: string;
      compactTranscript?: string;
      durationSeconds?: number;
      transcriptStatus?: string;
      videoAnalysis?: VideoAnalysisStats | null;
    } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId is required" },
        { status: 400 }
      );
    }

    const endedAt = new Date().toISOString();

    const { data: session, error: sessionFetchError } = await supabaseAdmin
      .from("sessions")
      .select("id, participant_id, assignment_id")
      .eq("id", sessionId)
      .single();

    if (sessionFetchError || !session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (session.participant_id !== authUserId) {
      return NextResponse.json(
        { error: "You can only complete your own session" },
        { status: 403 }
      );
    }

    const safeTranscript = (compactTranscript ?? "").trim();

    const safeDuration =
      typeof durationSeconds === "number" && durationSeconds >= 0
        ? Math.round(durationSeconds)
        : 0;

    const finalTranscriptStatus = transcriptStatus ?? "completed";

    const { error: updateError } = await supabaseAdmin
      .from("sessions")
      .update({
        status: "completed",
        ended_at: endedAt,
        duration_seconds: safeDuration,
        compact_transcript: safeTranscript,
        video_analysis: videoAnalysis ?? null,
      })
      .eq("id", sessionId)
      .eq("participant_id", authUserId);

    if (updateError) {
      console.error("Session update error:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    const { data: existingTranscript, error: transcriptFetchError } =
      await supabaseAdmin
        .from("transcripts")
        .select("id")
        .eq("session_id", sessionId)
        .maybeSingle();

    if (transcriptFetchError) {
      return NextResponse.json(
        { error: transcriptFetchError.message },
        { status: 500 }
      );
    }

    if (existingTranscript) {
      await supabaseAdmin
        .from("transcripts")
        .update({
          status: finalTranscriptStatus,
          transcript_text: safeTranscript,
          updated_at: endedAt,
        })
        .eq("id", existingTranscript.id);
    } else {
      await supabaseAdmin.from("transcripts").insert({
        session_id: sessionId,
        status: finalTranscriptStatus,
        transcript_text: safeTranscript,
        created_at: endedAt,
        updated_at: endedAt,
      });
    }

    if (session.assignment_id) {
      await supabaseAdmin
        .from("session_assignments")
        .update({ status: "completed" })
        .eq("id", session.assignment_id)
        .eq("participant_id", authUserId);
    }

    let feedback = null;

    try {
      feedback = await analyzeSession(sessionId);
    } catch (analysisError) {
      console.error("Auto analysis failed:", analysisError);
    }

    return NextResponse.json({
      success: true,
      sessionId,
      feedback,
    });
  } catch (error: unknown) {
    console.error("POST /api/sessions/complete error:", error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}