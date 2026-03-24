import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const serverSupabase = await createSupabaseServer();
    const { data: authData, error: authError } =
      await serverSupabase.auth.getUser();

    if (authError || !authData.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const instructorId = authData.user.id;

    const { data: instructorProfile, error: profileError } =
      await serverSupabase
        .from("profiles")
        .select("role")
        .eq("user_id", instructorId)
        .maybeSingle();

    if (
      profileError ||
      !instructorProfile ||
      instructorProfile.role !== "instructor"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await req.formData();

    const fullName = String(formData.get("full_name") || "").trim();
    const email = String(formData.get("email") || "")
      .trim()
      .toLowerCase();
    const password = String(formData.get("password") || "").trim();

    if (!fullName || !email || !password) {
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

    const { data: createdUser, error: createUserError } =
      await adminSupabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          role: "participant",
        },
      });

    if (createUserError || !createdUser.user) {
      return NextResponse.json(
        { error: createUserError?.message || "Failed to create auth user." },
        { status: 400 }
      );
    }

    const newUserId = createdUser.user.id;

    // IMPORTANT:
    // If a DB trigger already created the profile row, this will update it.
    // If not, this will insert it.
    const { error: upsertProfileError } = await adminSupabase
      .from("profiles")
      .upsert(
        {
          user_id: newUserId,
          full_name: fullName,
          role: "participant",
          instructor_id: instructorId,
        },
        {
          onConflict: "user_id",
        }
      );

    if (upsertProfileError) {
      await adminSupabase.auth.admin.deleteUser(newUserId);

      return NextResponse.json(
        {
          error:
            upsertProfileError.message || "Failed to create or update profile.",
        },
        { status: 400 }
      );
    }

    return NextResponse.redirect(new URL("/instructor/students", req.url), {
      status: 303,
    });
  } catch (error) {
    console.error("Create student route error:", error);

    return NextResponse.json(
      { error: "Something went wrong while creating the student." },
      { status: 500 }
    );
  }
}