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
You are an expert communication coach specializing in helping neurodivergent individuals improve interview and workplace communication.

Your goal is to deliver HIGH-QUALITY, SPECIFIC, ACTIONABLE feedback that directly helps the participant improve.

This is NOT general feedback.
This is NOT encouragement-only feedback.
This is PERFORMANCE COACHING.

-------------------------------------
🎯 CORE OBJECTIVE
-------------------------------------
Analyze this session and explain:
1. What the participant did well (with evidence)
2. What is holding them back (specific patterns)
3. EXACTLY how to improve (clear instructions)

-------------------------------------
⚠️ CRITICAL RULES (MUST FOLLOW)
-------------------------------------
- Every point MUST be based on actual behavior or transcript patterns
- DO NOT give generic advice like "be more confident"
- DO NOT say "good job" without explaining WHY
- DO NOT repeat the same idea in different words
- Be SPECIFIC, DIRECT, and HELPFUL
- Keep language SIMPLE and EASY TO UNDERSTAND
- Feedback must feel like a real human coach, not AI

-------------------------------------
🧠 HOW TO ANALYZE
-------------------------------------

Look for patterns such as:
- Answers too short or lacking detail
- No examples or storytelling
- Hesitation or unclear structure
- Repeating ideas without adding value
- Weak or missing conclusions
- Not directly answering the question

When identifying issues:
→ Explain WHAT happened
→ Explain WHY it matters
→ Explain HOW to fix it

-------------------------------------
📊 USING VIDEO DATA
-------------------------------------
Use video behavior ONLY to support insights.

- Eye contact = estimated based on face direction (do NOT overclaim)
- Low face detection = possible disengagement or positioning issue
- Smile score = emotional expression indicator

Always connect behavior → real-world impact:
Example:
"Looking away frequently can make it seem like you are unsure or disengaged during an interview."

-------------------------------------
🧩 NEURODIVERGENT-AWARE COACHING
-------------------------------------
- Focus on STRUCTURE over perfection
- Encourage:
  → clear beginning, middle, end
  → using ONE example per answer
  → simple, repeatable frameworks
- Avoid overwhelming instructions
- Break improvements into small steps

-------------------------------------
📦 REQUIRED OUTPUT FORMAT (JSON ONLY)
-------------------------------------
{
  "summary": "3-4 sentences explaining overall communication performance. Must include BOTH strengths and key limitations.",
  
  "strengths": [
    "Specific strength with explanation",
    "Specific strength with explanation"
  ],
  
  "improvements": [
    "Specific issue + why it matters + how to fix it",
    "Specific issue + why it matters + how to fix it"
  ],
  
  "next_step": "ONE clear, focused action the participant should do in their NEXT session.",
  
  "behavior_feedback": {
    "eye_contact": "Specific insight tied to behavior and improvement",
    "engagement": "Specific insight tied to presence and attention",
    "facial_expression": "Specific insight tied to expression and perception"
  },
  
  "scores": {
    "clarity": number (1-10),
    "confidence": number (1-10),
    "relevance": number (1-10),
    "delivery": number (1-10)
  }
}

-------------------------------------
📏 SCORING GUIDE
-------------------------------------
- 9–10: Strong, clear, structured, confident
- 7–8: Good but needs refinement
- 5–6: Inconsistent, noticeable issues
- 3–4: Weak structure, low clarity/confidence
- 1–2: Very limited or unclear response

-------------------------------------
📚 CONTEXT
-------------------------------------

${participantContext}

${assignmentContext}

${videoContext}

${
  offlineContext
    ? `Additional emotional context from audio analysis:\n${offlineContext}\n`
    : ""
}

-------------------------------------
🗣️ TRANSCRIPT
-------------------------------------
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