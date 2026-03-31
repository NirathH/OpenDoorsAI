import { NextResponse } from "next/server";
import { requireInstructor } from "@/lib/server/auth/requireInstructor";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type RouteContext = {
  params: Promise<{
    studentId: string;
  }>;
};

export async function PATCH(req: Request, { params }: RouteContext) {
  try {
    const { instructorId } = await requireInstructor();
    const { studentId } = await params;

    const body = await req.json();

    const full_name =
      typeof body.full_name === "string" ? body.full_name.trim() : undefined;
    const job_goal =
      typeof body.job_goal === "string" ? body.job_goal.trim() : undefined;
    const coach_notes =
      typeof body.coach_notes === "string" ? body.coach_notes.trim() : undefined;

    const { data: studentProfile, error: studentError } = await supabaseAdmin
      .from("profiles")
      .select("user_id, instructor_id, role")
      .eq("user_id", studentId)
      .eq("role", "participant")
      .eq("instructor_id", instructorId)
      .maybeSingle();

    if (studentError) {
      return NextResponse.json(
        { error: studentError.message },
        { status: 500 }
      );
    }

    if (!studentProfile) {
      return NextResponse.json(
        { error: "Student not found or not assigned to you." },
        { status: 404 }
      );
    }

    const updates: Record<string, string | null> = {};

    if (full_name !== undefined) updates.full_name = full_name || null;
    if (job_goal !== undefined) updates.job_goal = job_goal || null;
    if (coach_notes !== undefined) updates.coach_notes = coach_notes || null;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields provided to update." },
        { status: 400 }
      );
    }

    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update(updates)
      .eq("user_id", studentId);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unexpected server error.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}