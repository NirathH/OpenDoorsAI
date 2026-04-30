import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createSupabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const supabaseServer = await createSupabaseServer();

    const { data: authData, error: authError } =
      await supabaseServer.auth.getUser();

    if (authError || !authData.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const authUserId = authData.user.id;

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

    if (participantProfile.role !== "participant") {
      return NextResponse.json(
        { error: "Only participants can create sessions" },
        { status: 403 }
      );
    }

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

    let sessionTitle = title?.trim() || "Practice Session";

    if (assignmentId) {
      const { data: assignment, error: assignmentError } =
        await supabaseAdmin
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

      if (assignment.participant_id !== authUserId) {
        return NextResponse.json(
          { error: "Assignment does not belong to this participant" },
          { status: 403 }
        );
      }

      sessionTitle = assignment.title?.trim() || sessionTitle;
    }

    const now = new Date().toISOString();

    const { data: session, error: sessionError } = await supabaseAdmin
      .from("sessions")
      .insert({
        participant_id: authUserId,
        assignment_id: assignmentId ?? null,
        title: sessionTitle,
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

    if (assignmentId) {
      const { error: assignmentUpdateError } = await supabaseAdmin
        .from("session_assignments")
        .update({ status: "in_progress" })
        .eq("id", assignmentId)
        .eq("participant_id", authUserId);

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
  } catch (error: unknown) {
    console.error("POST /api/sessions/create error:", error);

    const message =
      error instanceof Error ? error.message : "Internal server error";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}