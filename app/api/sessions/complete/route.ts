import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      sessionId,
      compactTranscript,
      durationSeconds,
      transcriptStatus,
    }: {
      sessionId?: string;
      compactTranscript?: string;
      durationSeconds?: number;
      transcriptStatus?: string;
    } = body;

    // ==============================
    // 1. VALIDATION
    // ==============================
    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId is required" },
        { status: 400 }
      );
    }

    const safeTranscript = (compactTranscript ?? "").trim();
    const safeDuration =
      typeof durationSeconds === "number" && durationSeconds >= 0
        ? durationSeconds
        : 0;

    const endedAt = new Date().toISOString();

    // ==============================
    // 2. FETCH SESSION
    // ==============================
    const { data: session, error: sessionFetchError } = await supabase
      .from("sessions")
      .select("id, assignment_id, participant_id, status")
      .eq("id", sessionId)
      .single();

    if (sessionFetchError || !session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    // ==============================
    // 3. UPDATE SESSION
    // ==============================
    const { error: sessionUpdateError } = await supabase
      .from("sessions")
      .update({
        status: "completed",
        ended_at: endedAt,
        duration_seconds: safeDuration,
        compact_transcript: safeTranscript,
      })
      .eq("id", sessionId);

    if (sessionUpdateError) {
      console.error("Session update error:", sessionUpdateError);
      return NextResponse.json(
        { error: "Failed to update session" },
        { status: 500 }
      );
    }

    // ==============================
    // 4. UPSERT TRANSCRIPT
    // ==============================
    const { data: existingTranscript, error: transcriptFetchError } =
      await supabase
        .from("transcripts")
        .select("id")
        .eq("session_id", sessionId)
        .maybeSingle();

    if (transcriptFetchError) {
      console.error("Transcript fetch error:", transcriptFetchError);
      return NextResponse.json(
        { error: "Failed to check transcript" },
        { status: 500 }
      );
    }

    if (existingTranscript) {
      const { error: transcriptUpdateError } = await supabase
        .from("transcripts")
        .update({
          status: transcriptStatus ?? "completed",
          transcript_text: safeTranscript,
          updated_at: endedAt,
        })
        .eq("id", existingTranscript.id);

      if (transcriptUpdateError) {
        console.error("Transcript update error:", transcriptUpdateError);
        return NextResponse.json(
          { error: "Failed to update transcript" },
          { status: 500 }
        );
      }
    } else {
      const { error: transcriptInsertError } = await supabase
        .from("transcripts")
        .insert({
          session_id: sessionId,
          status: transcriptStatus ?? "completed",
          transcript_text: safeTranscript,
          created_at: endedAt,
          updated_at: endedAt,
        });

      if (transcriptInsertError) {
        console.error("Transcript insert error:", transcriptInsertError);
        return NextResponse.json(
          { error: "Failed to create transcript" },
          { status: 500 }
        );
      }
    }

    // ==============================
    // 5. UPDATE ASSIGNMENT (if exists)
    // ==============================
    if (session.assignment_id) {
      const { error: assignmentUpdateError } = await supabase
        .from("session_assignments")
        .update({ status: "completed" })
        .eq("id", session.assignment_id);

      if (assignmentUpdateError) {
        console.error(
          "Assignment update error:",
          assignmentUpdateError
        );
        // ⚠️ not blocking (non-critical)
      }
    }

    // ==============================
    // 6. TRIGGER FEEDBACK GENERATION (NEW 🔥)
    // ==============================
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/sessions/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sessionId }),
      });
    } catch (err) {
      console.error("Feedback trigger failed:", err);
      // ⚠️ don't fail session completion because of feedback
    }

    // ==============================
    // 7. SUCCESS RESPONSE
    // ==============================
    return NextResponse.json({
      success: true,
      sessionId,
      message: "Session completed successfully",
    });

  } catch (error) {
    console.error("POST /api/sessions/complete error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}