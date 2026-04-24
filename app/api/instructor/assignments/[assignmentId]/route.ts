import { NextResponse } from "next/server";
import { requireInstructor } from "@/lib/server/auth/requireInstructor";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type RouteContext = {
  params: Promise<{
    assignmentId: string;
  }>;
};

export async function POST(req: Request, { params }: RouteContext) {
  try {
    const { assignmentId } = await params;
    const { instructorId } = await requireInstructor();

    const formData = await req.formData();
    const intent = String(formData.get("_intent") || "").trim();

    if (intent === "delete") {
      const { error: deleteError } = await supabaseAdmin
        .from("session_assignments")
        .delete()
        .eq("id", assignmentId)
        .eq("instructor_id", instructorId);

      if (deleteError) {
        return NextResponse.json(
          { error: deleteError.message },
          { status: 500 }
        );
      }
    } else if (intent === "update") {
      const title = String(formData.get("title") || "").trim();

      if (!title) {
        return NextResponse.json(
          { error: "Title is required." },
          { status: 400 }
        );
      }

      const { error: updateError } = await supabaseAdmin
        .from("session_assignments")
        .update({ title })
        .eq("id", assignmentId)
        .eq("instructor_id", instructorId);

      if (updateError) {
        return NextResponse.json(
          { error: updateError.message },
          { status: 500 }
        );
      }
    } else {
      return NextResponse.json(
        { error: "Invalid or missing _intent." },
        { status: 400 }
      );
    }

    return NextResponse.redirect(new URL("/instructor/assignments", req.url));
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unexpected server error.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}