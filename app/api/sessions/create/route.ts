import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createSupabaseServer } from "@/lib/supabaseServer";

/**
 * POST /api/sessions/create
 *
 * Purpose:
 * - Create a new session for a participant
 * - Optionally link it to an assignment
 * - Mark assignment as "in_progress" if used
 */
export async function POST(req: NextRequest) {
  try {
    /**
     * Step 1: Authenticate user (server-side)
     */
    const supabaseServer = await createSupabaseServer();

    const { data: authData, error: authError } =
      await supabaseServer.auth.getUser();

    // If user is not logged in → reject
    if (authError || !authData.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const authUserId = authData.user.id;

    /**
     * Step 2: Fetch participant profile
     * Ensure this user is a participant
     */
    const { data: participantProfile, error: profileError } =
      await supabaseAdmin
        .from("profiles")
        .select("user_id, role, instructor_id, full_name")
        .eq("user_id", authUserId)
        .single();

    if (profileError || !participantProfile) {
      return NextResponse.json(
        { error: "Participant profile not found" },
        { status: 404 }
      );
    }

    // Only participants can create sessions
    if (participantProfile.role !== "participant") {
      return NextResponse.json(
        { error: "Only participants can create sessions" },
        { status: 403 }
      );
    }

    /**
     * Step 3: Parse request body
     */
    const body = await req.json();

    const {
      assignmentId,
      title,
      humeConfigId,
    }: {
      assignmentId?: string | null;
      title?: string | null;
      humeConfigId?: string | null;
    } = body;

    /**
     * Step 4: If assignmentId exists → validate it
     */
    if (assignmentId) {
      const { data: assignment, error: assignmentError } =
        await supabaseAdmin
          .from("session_assignments")
          .select("id, participant_id, status, title")
          .eq("id", assignmentId)
          .single();

      // Assignment must exist
      if (assignmentError || !assignment) {
        return NextResponse.json(
          { error: "Assignment not found" },
          { status: 404 }
        );
      }

      // Assignment must belong to this participant
      if (assignment.participant_id !== authUserId) {
        return NextResponse.json(
          { error: "Assignment does not belong to this participant" },
          { status: 400 }
        );
      }
    }

    /**
     * Step 5: Create the session
     */
    const now = new Date().toISOString();

    const { data: session, error: sessionError } =
      await supabaseAdmin
        .from("sessions")
        .insert({
          participant_id: authUserId,
          assignment_id: assignmentId ?? null,
          title: title ?? "Practice Session",
          status: "active",
          started_at: now,
          hume_config_id: humeConfigId ?? null,
        })
        .select(
          "id, participant_id, assignment_id, title, status, started_at, created_at"
        )
        .single();

    if (sessionError || !session) {
      console.error("Create session error:", sessionError);

      return NextResponse.json(
        { error: sessionError?.message || "Failed to create session" },
        { status: 500 }
      );
    }

    /**
     * Step 6: If session came from an assignment → mark it as in_progress
     */
    if (assignmentId) {
      const { error: assignmentUpdateError } =
        await supabaseAdmin
          .from("session_assignments")
          .update({ status: "in_progress" })
          .eq("id", assignmentId);

      // Not critical → log only
      if (assignmentUpdateError) {
        console.error(
          "Failed to update assignment status:",
          assignmentUpdateError
        );
      }
    }

    /**
     * Step 7: Return success response
     */
    return NextResponse.json({
      success: true,
      sessionId: session.id,
      session,
    });
  } catch (error: unknown) {
    console.error("POST /api/sessions/create error:", error);

    const message =
      error instanceof Error ? error.message : "Internal server error";

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}