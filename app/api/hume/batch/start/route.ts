import { NextResponse } from "next/server";
import { HumeClient } from "hume";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId required" }, { status: 400 });
    }

    const { data: rec, error: recErr } = await supabaseAdmin
      .from("recordings")
      .select("storage_path")
      .eq("session_id", sessionId)
      .single();

    if (recErr || !rec?.storage_path) {
      return NextResponse.json({ error: "Recording not found" }, { status: 404 });
    }

    // Get a temporary signed URL to let Hume download the file
    const { data: signed, error: signedErr } = await supabaseAdmin.storage
      .from("recordings")
      .createSignedUrl(rec.storage_path, 3600);

    if (signedErr || !signed?.signedUrl) {
      return NextResponse.json({ error: "Signed URL generation failed" }, { status: 500 });
    }

    const client = new HumeClient({
      apiKey: process.env.HUME_API_KEY!,
    });

    const job = await client.expressionMeasurement.batch.startInferenceJob({
      urls: [signed.signedUrl],
      models: {
        face: {},
        prosody: {},
        language: {}
      }
    });

    return NextResponse.json({ jobId: job.jobId });
  } catch (error: any) {
    console.error("Hume batch start error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
