import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * Ensure Node.js runtime (needed for file handling + Supabase admin)
 */
export const runtime = "nodejs";

/**
 * POST /api/...
 *
 * Purpose:
 * - Receive a recording file from the frontend
 * - Upload it to Supabase Storage
 * - Save metadata in the database
 * - Mark the session as completed/uploaded
 */
export async function POST(req: Request) {
  try {
    /**
     * Step 1: Parse form data
     * Expecting:
     * - session_id
     * - participant_id
     * - file
     */
    const formData = await req.formData();

    const session_id = formData.get("session_id")?.toString();
    let participant_id = formData.get("participant_id")?.toString();
    const upload = formData.get("file");

    /**
     * Step 2: Validate required fields
     */
    if (!session_id) {
      return NextResponse.json(
        { ok: false, error: "session_id is required" },
        { status: 400 }
      );
    }

    if (!participant_id) {
      // Fallback: fetch participant_id from sessions table
      const { data: session } = await supabaseAdmin
        .from("sessions")
        .select("participant_id")
        .eq("id", session_id)
        .single();
      if (session?.participant_id) {
        participant_id = session.participant_id;
      } else {
        return NextResponse.json(
          { ok: false, error: "participant_id is required" },
          { status: 400 }
        );
      }
    }

    /**
     * Step 3: Validate file input
     * Accepts File or Blob-like objects
     */
    if (!upload || typeof upload !== "object" || !("arrayBuffer" in upload)) {
      return NextResponse.json(
        { ok: false, error: "file is required (multipart form-data)" },
        { status: 400 }
      );
    }

    const fileLike = upload as Blob & {
      name?: string;
      type?: string;
    };

    const mimeType = fileLike.type || "video/webm";

    /**
     * Step 4: Determine file extension based on MIME type
     */
    const ext =
      mimeType.includes("mp4")
        ? "mp4"
        : mimeType.includes("webm")
        ? "webm"
        : mimeType.includes("wav")
        ? "wav"
        : mimeType.includes("mpeg")
        ? "mp3"
        : "bin";

    /**
     * Step 5: Define storage path
     * Example: participantId/sessionId.webm
     */
    const storage_path = `${participant_id}/${session_id}.${ext}`;

    /**
     * Step 6: Convert file to byte array
     */
    const bytes = new Uint8Array(await fileLike.arrayBuffer());

    /**
     * Step 7: Upload file to Supabase Storage
     */
    const { error: uploadError } = await supabaseAdmin.storage
      .from("recordings")
      .upload(storage_path, bytes, {
        contentType: mimeType,
        upsert: true, // overwrite if exists
      });

    if (uploadError) {
      return NextResponse.json(
        { ok: false, error: `Upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    /**
     * Step 8: Save recording metadata in DB
     */
    const { error: recordingError } = await supabaseAdmin
      .from("recordings")
      .upsert({
        session_id,
        storage_path,
        mime_type: mimeType,
      });

    if (recordingError) {
      return NextResponse.json(
        { ok: false, error: `DB insert failed: ${recordingError.message}` },
        { status: 500 }
      );
    }

    /**
     * Step 9: Update session status
     */
    const { error: sessionError } = await supabaseAdmin
      .from("sessions")
      .update({
        status: "uploaded",
        ended_at: new Date().toISOString(),
      })
      .eq("id", session_id);

    if (sessionError) {
      return NextResponse.json(
        { ok: false, error: `Session update failed: ${sessionError.message}` },
        { status: 500 }
      );
    }

    /**
     * Step 10: Success response
     */
    return NextResponse.json({
      ok: true,
      storage_path,
    });
  } catch (err: unknown) {
    console.error("UPLOAD ERROR:", err);

    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      {
        ok: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}