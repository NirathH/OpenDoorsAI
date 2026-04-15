import { NextResponse } from "next/server";
import { requireInstructor } from "@/lib/server/auth/requireInstructor";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const { instructorId } = await requireInstructor();
    const formData = await req.formData();

    const participant_id = String(formData.get("participant_id") || "").trim();
    const title = String(formData.get("title") || "").trim();
    const goal = String(formData.get("goal") || "").trim();
    const instructions = String(formData.get("instructions") || "").trim();
    const max_minutes_raw = String(formData.get("max_minutes") || "").trim();
    const due_at = String(formData.get("due_at") || "").trim();

    if (!participant_id || !title) {
      return NextResponse.json(
        { error: "Participant and title are required." },
        { status: 400 }
      );
    }

    const max_minutes = max_minutes_raw ? Number(max_minutes_raw) : null;

    if (max_minutes_raw && (!Number.isFinite(max_minutes) || max_minutes <= 0)) {
      return NextResponse.json(
        { error: "Max minutes must be a valid positive number." },
        { status: 400 }
      );
    }

    const { data: participant, error: participantError } = await supabaseAdmin
      .from("profiles")
      .select("user_id, instructor_id, role")
      .eq("user_id", participant_id)
      .eq("role", "participant")
      .eq("instructor_id", instructorId)
      .maybeSingle();

    if (participantError) {
      return NextResponse.json(
        { error: participantError.message },
        { status: 500 }
      );
    }

    if (!participant) {
      return NextResponse.json(
        { error: "Selected participant is invalid." },
        { status: 400 }
      );
    }

    const { error: insertError } = await supabaseAdmin
      .from("session_assignments")
      .insert({
        participant_id,
        instructor_id: instructorId,
        title,
        goal: goal || null,
        instructions: instructions || null,
        max_minutes,
        due_at: due_at || null,
        status: "assigned",
      });

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.redirect(new URL("/instructor/assignments", req.url));
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unexpected server error.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}