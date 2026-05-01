import type { SupabaseClient } from "@supabase/supabase-js";
import OpenAI from "openai";

type FeedbackJson = {
  summary?: string;
  strengths?: string[];
  improvements?: string[];
  next_step?: string;
  behavior_feedback?: {
    eye_contact?: string;
    engagement?: string;
    facial_expression?: string;
  };
  scores?: {
    clarity?: number;
    confidence?: number;
    relevance?: number;
    delivery?: number;
  };
};

function getWeekRange() {
  const today = new Date();

  const day = today.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;

  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() + diffToMonday);
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  return {
    weekStart,
    weekEnd,
    weekStartDate: weekStart.toISOString().slice(0, 10),
    weekEndDate: weekEnd.toISOString().slice(0, 10),
  };
}

function avg(values: number[]) {
  if (values.length === 0) return null;
  return Number(
    (values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1)
  );
}

export async function generateWeeklyFeedback(
  supabase: SupabaseClient,
  participantId: string
) {
  const { weekStart, weekEnd, weekStartDate, weekEndDate } = getWeekRange();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, instructor_id, job_goal, coach_notes, support_notes")
    .eq("user_id", participantId)
    .maybeSingle();

  const { data: sessions } = await supabase
    .from("sessions")
    .select("id, title, created_at, ended_at")
    .eq("participant_id", participantId)
    .eq("status", "completed")
    .gte("created_at", weekStart.toISOString())
    .lte("created_at", weekEnd.toISOString())
    .order("created_at", { ascending: true });

  if (!sessions || sessions.length === 0) {
    throw new Error("No completed sessions found for this week.");
  }

  const sessionIds = sessions.map((session) => session.id);

  const { data: feedbackRows } = await supabase
    .from("feedback")
    .select("session_id, feedback_json")
    .in("session_id", sessionIds);

  const { data: previousWeekly } = await supabase
    .from("weekly_feedback")
    .select("feedback_json, week_start, week_end")
    .eq("participant_id", participantId)
    .lt("week_start", weekStartDate)
    .order("week_start", { ascending: false })
    .limit(1)
    .maybeSingle();

  const feedbackBySessionId = new Map<string, FeedbackJson>();

  (feedbackRows ?? []).forEach((row) => {
    feedbackBySessionId.set(row.session_id, row.feedback_json as FeedbackJson);
  });

  const clarityScores: number[] = [];
  const confidenceScores: number[] = [];
  const relevanceScores: number[] = [];
  const deliveryScores: number[] = [];

  sessions.forEach((session) => {
    const feedback = feedbackBySessionId.get(session.id);
    const scores = feedback?.scores;

    if (typeof scores?.clarity === "number") clarityScores.push(scores.clarity);
    if (typeof scores?.confidence === "number")
      confidenceScores.push(scores.confidence);
    if (typeof scores?.relevance === "number")
      relevanceScores.push(scores.relevance);
    if (typeof scores?.delivery === "number") deliveryScores.push(scores.delivery);
  });

  const avgClarity = avg(clarityScores);
  const avgConfidence = avg(confidenceScores);
  const avgRelevance = avg(relevanceScores);
  const avgDelivery = avg(deliveryScores);

  const sessionContext = sessions
    .map((session, index) => {
      const feedback = feedbackBySessionId.get(session.id);

      return `
Session ${index + 1}: ${session.title || "Practice Session"}
Summary: ${feedback?.summary || "No summary available"}
Strengths: ${(feedback?.strengths || []).join("; ") || "None listed"}
Improvements: ${(feedback?.improvements || []).join("; ") || "None listed"}
Next step: ${feedback?.next_step || "None listed"}
Scores: ${JSON.stringify(feedback?.scores || {})}
Delivery feedback: ${JSON.stringify(feedback?.behavior_feedback || {})}
`;
    })
    .join("\n");

  const prompt = `
You are a professional communication coach creating a weekly progress report for a neurodivergent participant.

This app is designed to support neurodivergent individuals practicing interviews, workplace conversations, confidence, clarity, and self-advocacy.

Your feedback must be:
- Serious and specific
- Evidence-based
- Supportive but honest
- Not generic
- Written in clear, simple language
- Helpful for both the participant and their coach/instructor

Do NOT say vague things like:
- "Keep practicing"
- "You did well"
- "Improve confidence"
unless you explain exactly what behavior showed that and what to do next.

Use the session titles, summaries, strengths, improvements, scores, and delivery feedback to identify patterns across the week.

Participant:
- Name: ${profile?.full_name || "Participant"}
- Goal: ${profile?.job_goal || "Not provided"}
- Coach notes: ${profile?.coach_notes || "Not provided"}
- Support notes: ${profile?.support_notes || "Not provided"}

This week:
- Week start: ${weekStartDate}
- Week end: ${weekEndDate}
- Sessions completed: ${sessions.length}
- Average clarity: ${avgClarity ?? "not enough data"}
- Average confidence: ${avgConfidence ?? "not enough data"}
- Average relevance: ${avgRelevance ?? "not enough data"}
- Average delivery: ${avgDelivery ?? "not enough data"}

This week's sessions:
${sessionContext}

Previous weekly report:
${JSON.stringify(previousWeekly?.feedback_json || null)}

Return JSON only with this exact shape:

{
  "summary": "A detailed 4-6 sentence weekly summary. Mention the participant's main pattern, growth, and biggest challenge. Be specific.",
  "progress_made": [
    "Specific improvement with evidence from the sessions",
    "Specific improvement with evidence from the sessions"
  ],
  "still_working_on": [
    "Specific challenge and why it matters",
    "Specific challenge and why it matters"
  ],
  "next_week_focus": "One clear, specific focus for next week. Explain exactly what the participant should practice.",
  "coach_note": "A thoughtful note written for a coach/instructor explaining how to support this participant next week.",
  "recommended_practice": [
    "A concrete practice activity the participant can do",
    "Another concrete practice activity"
  ]
}

Rules:
- Mention neurodivergent support needs respectfully and only when useful.
- Do not diagnose the participant.
- Do not shame the participant.
- Be honest if answers were too short, unclear, or lacked examples.
- If eye contact or delivery data exists, frame it as supportive coaching, not criticism.
- Focus on observable behavior, not personality.
- Give feedback that a real instructor could use in the next coaching session.
- Every item should be specific enough that the participant knows what to do next.
`;

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
  });

  const completion = await openai.chat.completions.create({
  model: "gpt-4.1-mini",
  temperature: 0.2,
  response_format: { type: "json_object" },
  messages: [
    {
      role: "system",
      content:
        "You are a professional communication coach for neurodivergent individuals. Return detailed, specific, valid JSON only.",
    },
    {
      role: "user",
      content: prompt,
    },
  ],
});

  const raw = completion.choices[0]?.message?.content || "{}";
  const feedbackJson = JSON.parse(raw);

  const { data: saved, error: saveError } = await supabase
    .from("weekly_feedback")
    .upsert(
      {
        participant_id: participantId,
        instructor_id: profile?.instructor_id ?? null,
        week_start: weekStartDate,
        week_end: weekEndDate,
        sessions_count: sessions.length,
        avg_clarity: avgClarity,
        avg_confidence: avgConfidence,
        avg_relevance: avgRelevance,
        avg_delivery: avgDelivery,
        feedback_json: feedbackJson,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "participant_id,week_start,week_end",
      }
    )
    .select()
    .single();

  if (saveError) {
    throw new Error(saveError.message);
  }

  return saved;
}