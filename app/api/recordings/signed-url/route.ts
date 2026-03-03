import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const session_id = searchParams.get("session_id");

  if (!session_id) {
    return NextResponse.json({ ok: false, error: "session_id required" }, { status: 400 });
  }

  // Find the recording row
  const { data: rec, error: recErr } = await supabaseAdmin
    .from("recordings")
    .select("storage_path")
    .eq("session_id", session_id)
    .single();

  if (recErr) {
    return NextResponse.json({ ok: false, error: recErr.message }, { status: 500 });
  }

  // Create signed URL (valid for 5 minutes = 300 seconds)
  const { data, error } = await supabaseAdmin.storage
    .from("recordings")
    .createSignedUrl(rec.storage_path, 300);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, signedUrl: data.signedUrl });
}