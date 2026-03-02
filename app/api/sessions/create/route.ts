import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { participant_id } = await req.json();

  if (!participant_id) {
    return NextResponse.json({ error: "participant_id is required" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("sessions")
    .insert({
      participant_id,
      status: "created",
      started_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ session: data });
}