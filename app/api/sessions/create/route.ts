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
            participantId,
            assignmentId,
            title,
            humeConfigId,
        }: {
            participantId?: string;
            assignmentId?: string | null;
            title?: string | null;
            humeConfigId?: string | null;
        } = body;

        if (!participantId) {
            return NextResponse.json(
                { error: "participantId is required" },
                { status: 400 }
            );
        }

        // Optional: verify participant profile exists
        const { data: participantProfile, error: profileError } = await supabase
            .from("profiles")
            .select("user_id, role")
            .eq("user_id", participantId)
            .single();

        if (profileError || !participantProfile) {
            return NextResponse.json(
                { error: "Participant profile not found" },
                { status: 404 }
            );
        }

        // Optional: make sure assignment exists if one was passed
        if (assignmentId) {
            const { data: assignment, error: assignmentError } = await supabase
                .from("session_assignments")
                .select("id, participant_id, status, title")
                .eq("id", assignmentId)
                .single();

            if (assignmentError || !assignment) {
                return NextResponse.json(
                    { error: "Assignment not found" },
                    { status: 404 }
                );
            }

            if (assignment.participant_id !== participantId) {
                return NextResponse.json(
                    { error: "Assignment does not belong to this participant" },
                    { status: 400 }
                );
            }
        }

        const now = new Date().toISOString();

        const { data: session, error: sessionError } = await supabase
            .from("sessions")
            .insert({
                participant_id: participantId,
                assignment_id: assignmentId ?? null,
                title: title ?? "Practice Session",
                status: "active",
                started_at: now,
                hume_config_id: humeConfigId ?? null,
            })
            .select()
            .single();

        if (sessionError || !session) {
            console.error("Create session error:", sessionError);
            return NextResponse.json(
                { error: sessionError?.message || "Failed to create session" },
                { status: 500 }
            );
        }

        // If this session came from an assignment, mark it in progress
        if (assignmentId) {
            const { error: assignmentUpdateError } = await supabase
                .from("session_assignments")
                .update({ status: "in_progress" })
                .eq("id", assignmentId);

            if (assignmentUpdateError) {
                console.error(
                    "Failed to update assignment status:",
                    assignmentUpdateError
                );
            }
        }

        return NextResponse.json({
            success: true,
            sessionId: session.id,
            session,
        });
    } catch (error) {
        console.error("POST /api/sessions/create error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}