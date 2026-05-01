import OpenAI from "openai";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type VideoAnalysisStats = {
  framesAnalyzed?: number;
  faceDetectedFrames?: number;
  lookingAwayFrames?: number;
  smileFrames?: number;
  eyeContactPercent?: number;
  faceDetectedPercent?: number;
  lookingAwayCount?: number;
  avgSmileScore?: number;
};

type FeedbackJson = {
  summary: string;
  strengths: string[];
  improvements: string[];
  next_step: string;
  behavior_feedback: {
    eye_contact: string;
    engagement: string;
    facial_expression: string;
  };
  scores: {
    clarity: number;
    confidence: number;
    relevance: number;
    delivery: number;
  };
};

function buildFallbackFeedback(
  transcriptText: string,
  videoAnalysis?: VideoAnalysisStats | null
): FeedbackJson {
  const hasContent = transcriptText.trim().length > 0;

  return {
    summary: hasContent
      ? "You completed the session and gave enough information to review. Your next improvement should be making answers more structured and confident."
      : "You completed the session, which is a good first step. There was not enough clear transcript data to give detailed content feedback.",
    strengths: hasContent
      ? [
          "You stayed engaged with the session.",
          "You attempted to respond to the prompts.",
          "You are building consistency by practicing.",
        ]
      : [
          "You showed up and completed the practice.",
          "You are getting familiar with the session format.",
        ],
    improvements: hasContent
      ? [
          "Use a clearer beginning, middle, and ending in your answers.",
          "Add one specific example to make your answer stronger.",
          "Slow down slightly so your answer sounds more controlled.",
        ]
      : [
          "Speak clearly so the transcript can capture your answer.",
          "Try to answer with at least two or three full sentences.",
          "Take a short pause before answering instead of rushing.",
        ],
    next_step: hasContent
      ? "In the next session, answer one question using a clear example and a strong final sentence."
      : "In the next session, focus on speaking clearly and giving fuller answers.",
    behavior_feedback: {
      eye_contact:
        videoAnalysis?.eyeContactPercent !== undefined
          ? `Estimated eye contact was ${videoAnalysis.eyeContactPercent}%. Try to face the camera more consistently.`
          : "No video eye-contact data was available.",
      engagement:
        videoAnalysis?.faceDetectedPercent !== undefined
          ? `Your face was detected ${videoAnalysis.faceDetectedPercent}% of the time. Staying centered helps the coach read your delivery better.`
          : "No face-detection data was available.",
      facial_expression:
        videoAnalysis?.avgSmileScore !== undefined
          ? `Your average smile score was ${Number(
              videoAnalysis.avgSmileScore
            ).toFixed(2)}. A calm, natural expression can make you seem more engaged.`
          : "No facial-expression data was available.",
    },
    scores: {
      clarity: hasContent ? 7 : 4,
      confidence: hasContent ? 6 : 4,
      relevance: hasContent ? 7 : 4,
      delivery: hasContent ? 6 : 4,
    },
  };
}

function normalizeFeedback(
  raw: unknown,
  transcriptText: string,
  videoAnalysis?: VideoAnalysisStats | null
): FeedbackJson {
  const fallback = buildFallbackFeedback(transcriptText, videoAnalysis);

  if (!raw || typeof raw !== "object") {
    return fallback;
  }

  const obj = raw as Record<string, unknown>;

  const toStringArray = (value: unknown, backup: string[]) => {
    if (!Array.isArray(value)) return backup;
    const arr = value.filter((item): item is string => typeof item === "string");
    return arr.length > 0 ? arr : backup;
  };

  const toScore = (value: unknown, backup: number) => {
    if (typeof value !== "number" || Number.isNaN(value)) return backup;
    return Math.max(1, Math.min(10, Math.round(value)));
  };

  const scoresObj =
    obj.scores && typeof obj.scores === "object"
      ? (obj.scores as Record<string, unknown>)
      : {};

  const behaviorObj =
    obj.behavior_feedback && typeof obj.behavior_feedback === "object"
      ? (obj.behavior_feedback as Record<string, unknown>)
      : {};

  return {
    summary:
      typeof obj.summary === "string" && obj.summary.trim()
        ? obj.summary.trim()
        : fallback.summary,
    strengths: toStringArray(obj.strengths, fallback.strengths),
    improvements: toStringArray(obj.improvements, fallback.improvements),
    next_step:
      typeof obj.next_step === "string" && obj.next_step.trim()
        ? obj.next_step.trim()
        : fallback.next_step,
    behavior_feedback: {
      eye_contact:
        typeof behaviorObj.eye_contact === "string" &&
        behaviorObj.eye_contact.trim()
          ? behaviorObj.eye_contact.trim()
          : fallback.behavior_feedback.eye_contact,
      engagement:
        typeof behaviorObj.engagement === "string" &&
        behaviorObj.engagement.trim()
          ? behaviorObj.engagement.trim()
          : fallback.behavior_feedback.engagement,
      facial_expression:
        typeof behaviorObj.facial_expression === "string" &&
        behaviorObj.facial_expression.trim()
          ? behaviorObj.facial_expression.trim()
          : fallback.behavior_feedback.facial_expression,
    },
    scores: {
      clarity: toScore(scoresObj.clarity, fallback.scores.clarity),
      confidence: toScore(scoresObj.confidence, fallback.scores.confidence),
      relevance: toScore(scoresObj.relevance, fallback.scores.relevance),
      delivery: toScore(scoresObj.delivery, fallback.scores.delivery),
    },
  };
}

export async function analyzeSession(sessionId: string, offlineContext?: string) {
  console.log("Analyzing session:", sessionId);

  const { data: session, error: sessionError } = await supabaseAdmin
    .from("sessions")
    .select(
      "id, compact_transcript, participant_id, assignment_id, title, video_analysis"
    )
    .eq("id", sessionId)
    .single();

  if (sessionError || !session) {
    throw new Error(sessionError?.message || "Session not found");
  }

  let transcriptText = session.compact_transcript ?? "";

  if (!transcriptText.trim()) {
    const { data: transcriptRow, error: transcriptError } = await supabaseAdmin
      .from("transcripts")
      .select("transcript_text")
      .eq("session_id", sessionId)
      .maybeSingle();

    if (transcriptError) {
      throw new Error(transcriptError.message);
    }

    transcriptText = transcriptRow?.transcript_text ?? "";
  }

  const videoAnalysis = session.video_analysis as VideoAnalysisStats | null;
  const hasTranscript = transcriptText.trim().length > 0;

  let participantContext = "";
  let assignmentContext = "";

  const { data: participantProfile } = await supabaseAdmin
    .from("profiles")
    .select("full_name, job_goal, participant_condition, coach_notes")
    .eq("user_id", session.participant_id)
    .maybeSingle();

  if (participantProfile) {
    participantContext = `
Participant info:
- Name: ${participantProfile.full_name || "Not provided"}
- Overall job goal: ${participantProfile.job_goal || "Not provided"}
- Coach notes: ${participantProfile.coach_notes || "Not provided"}
- Participant condition/notes: ${
      participantProfile.participant_condition || "Not provided"
    }
`.trim();
  }

  if (session.assignment_id) {
    const { data: assignment } = await supabaseAdmin
      .from("session_assignments")
      .select("title, goal, instructions")
      .eq("id", session.assignment_id)
      .maybeSingle();

    if (assignment) {
      assignmentContext = `
Assignment info:
- Title: ${assignment.title || "Not provided"}
- Goal: ${assignment.goal || "Not provided"}
- Instructions: ${assignment.instructions || "Not provided"}
`.trim();
    }
  }

  const videoContext = videoAnalysis
    ? `
Video behavior context:
- Estimated eye contact: ${videoAnalysis.eyeContactPercent ?? 0}%
- Face detected: ${videoAnalysis.faceDetectedPercent ?? 0}%
- Looking away count: ${videoAnalysis.lookingAwayCount ?? 0}
- Average smile score: ${videoAnalysis.avgSmileScore ?? 0}
`.trim()
    : "Video behavior context: No video analysis data was available.";

  let feedbackJson: FeedbackJson;

  if (!hasTranscript) {
    feedbackJson = buildFallbackFeedback(transcriptText, videoAnalysis);
  } else {
    const prompt = `
You are a professional communication coach working with a neurodivergent participant.

Your job is to analyze ONE practice session and give **clear, specific, non-generic feedback** that helps the participant improve real-world communication skills.

This is NOT general feedback. You must:
- Use evidence from what the participant said
- Identify patterns (short answers, hesitation, lack of detail, etc.)
- Give actionable advice
- Avoid generic phrases like "good job" or "keep practicing"

Analyze the following practice session and return JSON only.

Required JSON shape:
{
  "summary": "3-4 sentence summary explaining how the participant communicated overall. Mention strengths AND weaknesses clearly.",
  "strengths": ["...", "..."],
  "improvements": ["...", "..."],
  "next_step": "...",
  "behavior_feedback": {
    "eye_contact": "...",
    "engagement": "...",
    "facial_expression": "..."
  },
  "scores": {
    "clarity": 1,
    "confidence": 1,
    "relevance": 1,
    "delivery": 1
  }
}

Rules:
- Keep language simple, encouraging, and specific.
- DO NOT be generic or vague in the feedback.

- Avoid harsh wording.
- Be concrete and actionable.
- Keep strengths and improvements concise.
- DO NOT say "good job" without explaining why
- Scores must be integers between 1 and 10.
- Base clarity and relevance mostly on the transcript.
- Base delivery and confidence on transcript plus video behavior context.
- Use video behavior context when commenting on delivery, confidence, and engagement.
- Do not overclaim: eye contact is an estimate based on face direction, not exact eye tracking.
- If the transcript is short or low quality, focus on helpful general coaching.
- Use participant goal, coach notes, and assignment context when relevant.
- Be neurodivergent-aware:
  → Encourage structure (examples, storytelling)
  → Support clarity over perfection
  → Avoid overwhelming language
  → Be direct but respectful


${participantContext}

${assignmentContext}

${videoContext}

${
  offlineContext
    ? `Additional emotional context from audio analysis:\n${offlineContext}\n`
    : ""
}

Transcript:
${transcriptText}
`;

    try {
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
               "You are a strict but supportive communication coach for neurodivergent individuals. Return detailed, structured JSON only.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      const raw = completion.choices[0]?.message?.content;

      if (!raw) {
        throw new Error("No feedback returned by model");
      }

      const parsed = JSON.parse(raw) as unknown;
      feedbackJson = normalizeFeedback(parsed, transcriptText, videoAnalysis);
    } catch (openaiError) {
      console.error("OpenAI analysis failed, using fallback:", openaiError);
      feedbackJson = buildFallbackFeedback(transcriptText, videoAnalysis);
    }
  }

  const { data: existingFeedback, error: existingFeedbackError } =
    await supabaseAdmin
      .from("feedback")
      .select("id")
      .eq("session_id", sessionId)
      .maybeSingle();

  if (existingFeedbackError) {
    throw new Error(existingFeedbackError.message);
  }

  if (existingFeedback) {
    const { error: updateError } = await supabaseAdmin
      .from("feedback")
      .update({
        feedback_json: feedbackJson,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingFeedback.id);

    if (updateError) {
      throw new Error(updateError.message);
    }
  } else {
    const { error: insertError } = await supabaseAdmin.from("feedback").insert({
      session_id: sessionId,
      feedback_json: feedbackJson,
      updated_at: new Date().toISOString(),
    });

    if (insertError) {
      throw new Error(insertError.message);
    }
  }

  console.log("Feedback saved for session:", sessionId);
  return feedbackJson;
}