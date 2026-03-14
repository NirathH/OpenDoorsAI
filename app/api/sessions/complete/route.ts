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

        // Get session first so we can update it and check assignment linkage
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

        const endedAt = new Date().toISOString();

        // Update session row
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
                { error: sessionUpdateError.message || "Failed to update session" },
                { status: 500 }
            );
        }

        // Check if transcript row already exists for this session
        const { data: existingTranscript, error: transcriptFetchError } =
            await supabase
                .from("transcripts")
                .select("id")
                .eq("session_id", sessionId)
                .maybeSingle();

        if (transcriptFetchError) {
            console.error("Transcript fetch error:", transcriptFetchError);
            return NextResponse.json(
                { error: transcriptFetchError.message || "Failed to check transcript" },
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
                    { error: transcriptUpdateError.message || "Failed to update transcript" },
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
                    { error: transcriptInsertError.message || "Failed to create transcript" },
                    { status: 500 }
                );
            }
        }

        // If linked to an assignment, mark that assignment completed too
        if (session.assignment_id) {
            const { error: assignmentUpdateError } = await supabase
                .from("session_assignments")
                .update({ status: "completed" })
                .eq("id", session.assignment_id);

            if (assignmentUpdateError) {
                console.error(
                    "Assignment status update error:",
                    assignmentUpdateError
                );
            }
        }

        return NextResponse.json({
            success: true,
            sessionId,
        });
    } catch (error) {
        console.error("POST /api/sessions/complete error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}