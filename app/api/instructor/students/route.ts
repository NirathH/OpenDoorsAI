import { NextResponse } from "next/server";
import { requireInstructor } from "@/lib/server/auth/requireInstructor";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * POST /api/...
 *
 * Purpose:
 * - Allow an instructor to create a new participant account
 * - Automatically assign that participant to the instructor
 */
export async function POST(req: Request) {
  try {
    /**
     * Step 1: Ensure the current user is an authenticated instructor
     */
    const { instructorId } = await requireInstructor();

    /**
     * Step 2: Read form data from the request
     */
    const formData = await req.formData();

    const full_name = String(formData.get("full_name") || "").trim();
    const email = String(formData.get("email") || "").trim().toLowerCase();
    const password = String(formData.get("password") || "").trim();
    const job_goal = String(formData.get("job_goal") || "").trim();
    const coach_notes = String(formData.get("coach_notes") || "").trim();

    /**
     * Step 3: Validate required fields
     */
    if (!full_name || !email || !password) {
      return NextResponse.json(
        { error: "Full name, email, and password are required." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    /**
     * Step 4: Create the auth user in Supabase Auth
     */
    const { data: createdUser, error: createUserError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name,
        },
      });

    if (createUserError || !createdUser.user) {
      return NextResponse.json(
        {
          error: createUserError?.message || "Failed to create auth user.",
        },
        { status: 500 }
      );
    }

    /**
     * Step 5: Create or update the participant profile
     * and assign the participant to the current instructor
     */
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert(
        {
          user_id: createdUser.user.id,
          full_name,
          role: "participant",
          instructor_id: instructorId,
          job_goal: job_goal || null,
          coach_notes: coach_notes || null,
        },
        {
          onConflict: "user_id",
        }
      );

    /**
     * Step 6: If profile creation fails,
     * clean up by deleting the auth user we just created
     */
    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(createdUser.user.id);

      return NextResponse.json(
        { error: profileError.message },
        { status: 500 }
      );
    }

    /**
     * Step 7: Redirect back to the instructor's student list
     */
    return NextResponse.redirect(new URL("/instructor/students", req.url));
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unexpected server error.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}