import { NextResponse } from "next/server";
import { HumeClient } from "hume";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * This route must run on Node.js because it uses
 * server-side SDKs and environment variables.
 */
export const runtime = "nodejs";

/**
 * POST /api/...
 *
 * Purpose:
 * - Receive a sessionId
 * - Find the session's recording
 * - Generate a temporary signed URL for that recording
 * - Send the file to Hume for analysis
 * - Return the Hume jobId
 */
export async function POST(req: Request) {
  try {
    // Read request body
    const { sessionId } = await req.json();

    // Validate required input
    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId required" },
        { status: 400 }
      );
    }

    /**
     * Step 1:
     * Find the recording linked to this session
     */
    const { data: recording, error: recordingError } = await supabaseAdmin
      .from("recordings")
      .select("storage_path")
      .eq("session_id", sessionId)
      .single();

    if (recordingError || !recording?.storage_path) {
      return NextResponse.json(
        { error: "Recording not found" },
        { status: 404 }
      );
    }

    /**
     * Step 2:
     * Create a temporary signed URL so Hume can download the file
     * from Supabase Storage
     */
    const { data: signedUrlData, error: signedUrlError } =
      await supabaseAdmin.storage
        .from("recordings")
        .createSignedUrl(recording.storage_path, 3600);

    if (signedUrlError || !signedUrlData?.signedUrl) {
      return NextResponse.json(
        { error: "Signed URL generation failed" },
        { status: 500 }
      );
    }

    /**
     * Step 3:
     * Create Hume client
     */
    const client = new HumeClient({
      apiKey: process.env.HUME_API_KEY!,
    });

    /**
     * Step 4:
     * Start a Hume batch inference job using the signed file URL
     */
    const job = await client.expressionMeasurement.batch.startInferenceJob({
      urls: [signedUrlData.signedUrl],
      models: {
        face: {},
        prosody: {},
        language: {},
      },
    });

    /**
     * Step 5:
     * Return the created Hume job ID
     */
    return NextResponse.json({
      jobId: job.jobId,
    });
  } catch (error: unknown) {
    console.error("Hume batch start error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}