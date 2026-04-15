import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * Ensure this runs on Node.js (required for Supabase admin + storage)
 */
export const runtime = "nodejs";

/**
 * GET /api/...
 *
 * Purpose:
 * - Receive a session_id
 * - Find its recording in the database
 * - Generate a temporary signed URL
 * - Return the URL so the client can access the file
 */
export async function GET(req: Request) {
  /**
   * Step 1: Extract session_id from query params
   * Example: /api/... ?session_id=123
   */
  const { searchParams } = new URL(req.url);
  const session_id = searchParams.get("session_id");

  // Validate input
  if (!session_id) {
    return NextResponse.json(
      { ok: false, error: "session_id required" },
      { status: 400 }
    );
  }

  /**
   * Step 2: Find recording in the database
   */
  const { data: recording, error: recordingError } = await supabaseAdmin
    .from("recordings")
    .select("storage_path")
    .eq("session_id", session_id)
    .single();

  if (recordingError) {
    return NextResponse.json(
      { ok: false, error: recordingError.message },
      { status: 500 }
    );
  }

  /**
   * Step 3: Generate signed URL (temporary access link)
   * Valid for 5 minutes (300 seconds)
   */
  const { data: signedUrlData, error: signedUrlError } =
    await supabaseAdmin.storage
      .from("recordings")
      .createSignedUrl(recording.storage_path, 300);

  if (signedUrlError) {
    return NextResponse.json(
      { ok: false, error: signedUrlError.message },
      { status: 500 }
    );
  }

  /**
   * Step 4: Return signed URL
   */
  return NextResponse.json({
    ok: true,
    signedUrl: signedUrlData.signedUrl,
  });
}