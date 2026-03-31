import { NextResponse } from "next/server";
import { HumeClient } from "hume";
import { analyzeSession } from "@/lib/server/sessions/analyzeSession";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { jobId, sessionId } = await req.json();

    if (!jobId || !sessionId) {
      return NextResponse.json({ error: "jobId and sessionId required" }, { status: 400 });
    }

    const client = new HumeClient({
      apiKey: process.env.HUME_API_KEY!,
    });

    const statusObj = await client.expressionMeasurement.batch.getJobDetails(jobId);
    const status = statusObj.state.status;

    if (status === "COMPLETED") {
      // Job is done! Let's get predictions.
      const predictions = await client.expressionMeasurement.batch.getJobPredictions(jobId);
      
      const totals: Record<string, number> = {};
      let count = 0;

      for (const file of predictions) {
        for (const result of (file as any).results?.predictions || []) {
           for (const grouped of result.models?.prosody?.groupedPredictions || []) {
              for (const pred of grouped.predictions || []) {
                 for (const emotion of pred.emotions || []) {
                    if (!totals[emotion.name]) totals[emotion.name] = 0;
                    totals[emotion.name] += emotion.score;
                 }
                 count++;
              }
           }
        }
      }

      const topEmotions = Object.keys(totals)
        .map(name => ({
          name,
          score: count > 0 ? totals[name] / count : 0
        }))
        .sort((a,b) => b.score - a.score)
        .slice(0, 5)
        .map(e => `${e.name} (${Math.round(e.score * 100)}%)`)
        .join(", ");

      const offlineContext = topEmotions ? `The user's overall global emotions measured from the offline voice analysis throughout the whole session were: ${topEmotions}. Please consider this in your coaching feedback.` : "";

      // Trigger OpenAI analysis with the new deep context
      await analyzeSession(sessionId, offlineContext);

      return NextResponse.json({ status: "COMPLETED" });
    } else if (status === "FAILED") {
      // Fallback
      await analyzeSession(sessionId);
      return NextResponse.json({ status: "FAILED" });
    } else {
      // Still processing
      return NextResponse.json({ status });
    }
  } catch (error: any) {
    console.error("Hume batch poll error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
