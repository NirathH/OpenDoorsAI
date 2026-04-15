import { NextResponse } from "next/server";
import { requireInstructor } from "@/lib/server/auth/requireInstructor";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * Route params type
 * Example: /api/students/[studentId]
 */
type RouteContext = {
  params: Promise<{
    studentId: string;
  }>;
};

/**
 * PATCH /api/...
 *
 * Purpose:
 * - Allow an instructor to update a student’s profile
 * - Only if the student is assigned to that instructor
 */
export async function PATCH(req: Request, { params }: RouteContext) {
  try {
    /**
     * Step 1: Ensure user is an authenticated instructor
     */
    const { instructorId } = await requireInstructor();

    /**
     * Step 2: Get studentId from route params
     */
    const { studentId } = await params;

    /**
     * Step 3: Parse request body
     */
    const body = await req.json();

    // Only accept valid string fields and trim them
    const full_name =
      typeof body.full_name === "string" ? body.full_name.trim() : undefined;

    const job_goal =
      typeof body.job_goal === "string" ? body.job_goal.trim() : undefined;

    const coach_notes =
      typeof body.coach_notes === "string"
        ? body.coach_notes.trim()
        : undefined;

    /**
     * Step 4: Verify student exists AND belongs to this instructor
     */
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

    // If student is not found or not assigned to this instructor
    if (!studentProfile) {
      return NextResponse.json(
        { error: "Student not found or not assigned to you." },
        { status: 404 }
      );
    }

    /**
     * Step 5: Build update object dynamically
     * Only include fields that were actually provided
     */
    const updates: Record<string, string | null> = {};

    if (full_name !== undefined) {
      updates.full_name = full_name || null;
    }

    if (job_goal !== undefined) {
      updates.job_goal = job_goal || null;
    }

    if (coach_notes !== undefined) {
      updates.coach_notes = coach_notes || null;
    }

    // If nothing valid was provided, return error
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields provided to update." },
        { status: 400 }
      );
    }

    /**
     * Step 6: Update student profile in database
     */
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

    /**
     * Step 7: Success response
     */
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unexpected server error.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}