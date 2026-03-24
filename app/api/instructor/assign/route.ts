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

    const { data: instructorProfile } = await serverSupabase
      .from("profiles")
      .select("role")
      .eq("user_id", instructorId)
      .maybeSingle();

    if (!instructorProfile || instructorProfile.role !== "instructor") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const studentId = String(body.studentId || "").trim();

    if (!studentId) {
      return NextResponse.json(
        { error: "studentId is required." },
        { status: 400 }
      );
    }

    const { data: studentProfile } = await adminSupabase
      .from("profiles")
      .select("user_id, role")
      .eq("user_id", studentId)
      .maybeSingle();

    if (!studentProfile || studentProfile.role !== "participant") {
      return NextResponse.json(
        { error: "Student not found." },
        { status: 404 }
      );
    }

    const { error: assignError } = await adminSupabase
      .from("profiles")
      .update({ instructor_id: instructorId })
      .eq("user_id", studentId);

    if (assignError) {
      return NextResponse.json(
        { error: assignError.message || "Failed to assign student." },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Assign student route error:", error);
    return NextResponse.json(
      { error: "Something went wrong while assigning the student." },
      { status: 500 }
    );
  }
}