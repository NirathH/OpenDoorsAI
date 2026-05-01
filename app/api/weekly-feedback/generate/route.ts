import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { generateWeeklyFeedback } from "@/lib/server/weekly/generateWeeklyFeedback";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const supabaseServer = await createSupabaseServer();

    const { data: authData, error: authError } =
      await supabaseServer.auth.getUser();

    if (authError || !authData.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const requestedParticipantId = body.participantId as string | undefined;

    const authUserId = authData.user.id;

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("user_id, role")
      .eq("user_id", authUserId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    let participantId = authUserId;

    if (profile.role === "instructor") {
      if (!requestedParticipantId) {
        return NextResponse.json(
          { error: "participantId is required for instructors" },
          { status: 400 }
        );
      }

      const { data: participantProfile } = await supabaseAdmin
        .from("profiles")
        .select("user_id, instructor_id")
        .eq("user_id", requestedParticipantId)
        .single();

      if (!participantProfile || participantProfile.instructor_id !== authUserId) {
        return NextResponse.json(
          { error: "You can only generate feedback for your own participants" },
          { status: 403 }
        );
      }

      participantId = requestedParticipantId;
    }

    const result = await generateWeeklyFeedback(supabaseAdmin, participantId);

    return NextResponse.json({
      success: true,
      weeklyFeedback: result,
    });
  } catch (error: unknown) {
    console.error("POST /api/weekly-feedback/generate error:", error);

    const message =
      error instanceof Error ? error.message : "Failed to generate weekly feedback";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}