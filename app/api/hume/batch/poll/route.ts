import { NextResponse } from "next/server";
import { HumeClient } from "hume";
import { analyzeSession } from "@/lib/server/sessions/analyzeSession";
import { createSupabaseServer } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * Ensures this runs in Node (required for Hume + server libs)
 */
export const runtime = "nodejs";

/**
 * POST /api/...
 *
 * Purpose:
 * - Poll a Hume AI job (emotion analysis)
 * - If complete → extract emotions
 * - Send emotion context into analyzeSession (OpenAI feedback)
 */
export async function POST(req: Request) {
  try {
    // Extract request body
    const { jobId, sessionId } = await req.json();

    // Validate required inputs
    if (!jobId || !sessionId) {
      return NextResponse.json(
        { error: "jobId and sessionId required" },
        { status: 400 }
      );
    }

    // Authenticate user
    const supabaseServer = await createSupabaseServer();
    const { data: authData, error: authError } = await supabaseServer.auth.getUser();

    if (authError || !authData?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const authUserId = authData.user.id;

    // Verify session ownership
    const { data: sessionData, error: sessionError } = await supabaseAdmin
      .from("sessions")
      .select("participant_id")
      .eq("id", sessionId)
      .single();

    if (sessionError || !sessionData) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (sessionData.participant_id !== authUserId) {
      // Check if user is an instructor of this participant
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("instructor_id")
        .eq("user_id", sessionData.participant_id)
        .single();

      if (!profile || profile.instructor_id !== authUserId) {
        return NextResponse.json({ error: "Unauthorized access to session" }, { status: 403 });
      }
    }

    // Initialize Hume client
    const client = new HumeClient({
      apiKey: process.env.HUME_API_KEY!,
    });

    // Get job status from Hume
    const statusObj = await client.expressionMeasurement.batch.getJobDetails(jobId);
    const status = statusObj.state.status;

    /**
     * CASE 1: Job completed
     * - Extract emotions
     * - Build summary
     * - Pass into AI feedback
     */
    if (status === "COMPLETED") {
      const predictions = await client.expressionMeasurement.batch.getJobPredictions(jobId);

      const totals: Record<string, number> = {};
      let count = 0;

      /**
       * Loop through deeply nested Hume response:
       * files → results → predictions → prosody → groupedPredictions → emotions
       */
      interface HumeFile {
        results?: {
          predictions?: Array<{
            models?: {
              prosody?: {
                groupedPredictions?: Array<{
                  predictions?: Array<{
                    emotions?: Array<{ name: string; score: number }>;
                  }>;
                }>;
              };
            };
          }>;
        };
      }

      for (const file of predictions) {
        for (const result of (file as unknown as HumeFile)?.results?.predictions || []) {
          for (const grouped of result.models?.prosody?.groupedPredictions || []) {
            for (const pred of grouped.predictions || []) {
              for (const emotion of pred.emotions || []) {
                // Aggregate emotion scores
                if (!totals[emotion.name]) totals[emotion.name] = 0;
                totals[emotion.name] += emotion.score;
              }
              count++;
            }
          }
        }
      }

      /**
       * Get top 5 emotions with average scores
       */
      const topEmotions = Object.keys(totals)
        .map((name) => ({
          name,
          score: count > 0 ? totals[name] / count : 0,
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
        .map((e) => `${e.name} (${Math.round(e.score * 100)}%)`)
        .join(", ");

      /**
       * Build context string to inject into AI feedback
       */
      const offlineContext = topEmotions
        ? `The user's overall emotions during the session were: ${topEmotions}. Use this to improve coaching feedback.`
        : "";

      // Run AI feedback with emotion context, passing predictions so it is saved in the DB
      await analyzeSession(sessionId, offlineContext, predictions);

      return NextResponse.json({ status: "COMPLETED" });
    }

    /**
     * CASE 2: Job failed
     * - Still generate feedback (fallback)
     */
    else if (status === "FAILED") {
      await analyzeSession(sessionId);
      return NextResponse.json({ status: "FAILED" });
    }

    /**
     * CASE 3: Job still processing
     */
    else {
      return NextResponse.json({ status });
    }
  } catch (error: unknown) {
    console.error("Hume batch poll error:", error);

    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}