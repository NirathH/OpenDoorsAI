import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: NextRequest) {
  try {
    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId is required" },
        { status: 400 }
      );
    }

    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .select("id, compact_transcript, title")
      .eq("id", sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    if (!session.compact_transcript) {
      return NextResponse.json(
        { error: "No transcript available for analysis" },
        { status: 400 }
      );
    }

    const prompt = `
You are a supportive interview coach for neurodiverse users.

Analyze the following mock interview transcript and return JSON only.

Required JSON shape:
{
  "summary": "...",
  "strengths": ["...", "..."],
  "improvements": ["...", "..."],
  "next_step": "...",
  "scores": {
    "clarity": 8,
    "confidence": 7,
    "relevance": 8
  }
}

Rules:
- Keep language simple, encouraging, and specific.
- Avoid harsh wording.
- Keep feedback concise.
- Scores must be between 1 and 10.

Transcript:
${session.compact_transcript}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a helpful interview feedback assistant that returns valid JSON only.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content;

    if (!raw) {
      return NextResponse.json(
        { error: "No feedback returned by model" },
        { status: 500 }
      );
    }

    const feedbackJson = JSON.parse(raw);

    const { data: existingFeedback } = await supabase
      .from("feedback")
      .select("id")
      .eq("session_id", sessionId)
      .maybeSingle();

    if (existingFeedback?.id) {
      const { error: updateError } = await supabase
        .from("feedback")
        .update({
          feedback_json: feedbackJson,
        })
        .eq("id", existingFeedback.id);

      if (updateError) {
        return NextResponse.json(
          { error: updateError.message },
          { status: 500 }
        );
      }
    } else {
      const { error: insertError } = await supabase.from("feedback").insert({
        session_id: sessionId,
        feedback_json: feedbackJson,
      });

      if (insertError) {
        return NextResponse.json(
          { error: insertError.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      feedback: feedbackJson,
    });
  } catch (error) {
    console.error("POST /api/sessions/analyze error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}