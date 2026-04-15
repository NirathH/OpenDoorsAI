import { NextResponse } from "next/server";
import { requireInstructor } from "@/lib/server/auth/requireInstructor";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request, { params }: any) {
  const { assignmentId } = params;
  const { instructorId } = await requireInstructor();

  const formData = await req.formData();
  const intent = formData.get("_intent");

  if (intent === "delete") {
    await supabaseAdmin
      .from("session_assignments")
      .delete()
      .eq("id", assignmentId)
      .eq("instructor_id", instructorId);
  }

  if (intent === "update") {
    const title = String(formData.get("title"));

    await supabaseAdmin
      .from("session_assignments")
      .update({ title })
      .eq("id", assignmentId)
      .eq("instructor_id", instructorId);
  }

  return NextResponse.redirect("/instructor/assignments");
}