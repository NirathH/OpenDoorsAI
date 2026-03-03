import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const session_id = formData.get("session_id")?.toString();
    const participant_id = formData.get("participant_id")?.toString();
    const upload = formData.get("file");

    if (!session_id || !participant_id) {
      return NextResponse.json(
        { ok: false, error: "session_id and participant_id are required" },
        { status: 400 }
      );
    }

    // Accept File OR Blob-like objects
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

    // Determine file extension
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

    // Storage path convention
    const storage_path = `${participant_id}/${session_id}.${ext}`;

    // Convert file to bytes
    const bytes = new Uint8Array(await fileLike.arrayBuffer());

    // Upload to Supabase Storage
    const { error: uploadError } = await supabaseAdmin.storage
      .from("recordings")
      .upload(storage_path, bytes, {
        contentType: mimeType,
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json(
        { ok: false, error: `Upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Save metadata in DB
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

    // Update session status
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

    return NextResponse.json({
      ok: true,
      storage_path,
    });
  } catch (err: any) {
    console.error("UPLOAD ERROR:", err);

    return NextResponse.json(
      {
        ok: false,
        error: err?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}