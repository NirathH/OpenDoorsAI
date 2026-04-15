import OpenAI from "openai";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * Final feedback shape saved in the database.
 */
type FeedbackJson = {
  summary: string;
  strengths: string[];
  improvements: string[];
  next_step: string;
  scores: {
    clarity: number;
    confidence: number;
    relevance: number;
  };
};

// Create OpenAI client using server-side API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

/**
 * Builds safe fallback feedback when the transcript is missing
 * or the model fails.
 */
function buildFallbackFeedback(transcriptText: string): FeedbackJson {
  const hasContent = transcriptText.trim().length > 0;

  return {
    summary: hasContent
      ? "You did a solid job completing this session. Your answers showed effort and engagement, and you're building a strong foundation. With a bit more structure and confidence in delivery, your responses can become much more impactful."
      : "You completed the session, which is a great first step. However, there wasn't enough clear response data to give detailed feedback. Focus on speaking clearly and giving fuller answers next time.",
    strengths: hasContent
      ? [
          "You stayed engaged throughout the session and responded to the prompts",
          "You were able to express your ideas instead of staying silent or stuck",
          "You're building consistency by completing practice sessions",
        ]
      : [
          "You showed up and completed the session",
          "You're starting to get comfortable with the practice environment",
        ],
    improvements: hasContent
      ? [
          "Try structuring your answers with a beginning, middle, and strong ending",
          "Use more specific examples so your responses feel stronger and more believable",
          "Slow down slightly and reduce filler words to sound more confident",
        ]
      : [
          "Speak a bit louder and clearer so your answers are captured properly",
          "Try to give longer, more complete answers instead of very short responses",
          "Take a second to think, then answer with a full idea instead of stopping early",
        ],
    next_step: hasContent
      ? "In your next session, focus on giving one clear, well-structured answer with a real example."
      : "In your next session, focus on speaking clearly and giving at least 2 to 3 full sentences per answer so stronger feedback can be generated.",
    scores: {
      clarity: hasContent ? 7 : 4,
      confidence: hasContent ? 6 : 4,
      relevance: hasContent ? 7 : 4,
    },
  };
}

/**
 * Ensures the model output matches the expected feedback shape.
 * If anything is missing or malformed, fallback values are used.
 */
function normalizeFeedback(raw: unknown, transcriptText: string): FeedbackJson {
  const fallback = buildFallbackFeedback(transcriptText);

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
    scores: {
      clarity: toScore(scoresObj.clarity, fallback.scores.clarity),
      confidence: toScore(scoresObj.confidence, fallback.scores.confidence),
      relevance: toScore(scoresObj.relevance, fallback.scores.relevance),
    },
  };
}

/**
 * Analyzes one session and saves normalized feedback into the feedback table.
 */
export async function analyzeSession(sessionId: string) {
  try {
    console.log("Analyzing session:", sessionId);

    // Fetch the session
    const { data: session, error: sessionError } = await supabaseAdmin
      .from("sessions")
      .select("id, compact_transcript, participant_id, assignment_id, title")
      .eq("id", sessionId)
      .single();

    if (sessionError || !session) {
      throw new Error(sessionError?.message || "Session not found");
    }

    // Prefer compact transcript stored on the session
    let transcriptText = session.compact_transcript ?? "";

    // If compact transcript is missing, fallback to the transcripts table
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

    const hasTranscript = transcriptText.trim().length > 0;

    let feedbackJson: FeedbackJson;

    // If no transcript exists, skip model call and use fallback feedback
    if (!hasTranscript) {
      feedbackJson = buildFallbackFeedback(transcriptText);
    } else {
      let participantContext = "";
      let assignmentContext = "";

      // Fetch participant context to personalize the coaching feedback
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
- Participant condition/notes: ${participantProfile.participant_condition || "Not provided"}
`.trim();
      }

      // Fetch assignment context if this session came from an assignment
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

      // Prompt sent to OpenAI
      const prompt = `
You are a supportive interview coach for neurodiverse users.

Analyze the following mock interview session and return JSON only.

Required JSON shape:
{
  "summary": "...",
  "strengths": ["...", "..."],
  "improvements": ["...", "..."],
  "next_step": "...",
  "scores": {
    "clarity": ?,
    "confidence": ?,
    "relevance": ?
  }
}

Rules:
- Keep language simple, encouraging, and specific.
- Avoid harsh wording.
- Make the feedback feel helpful and human, like a coach.
- Be concrete and actionable.
- Keep strengths and improvements concise.
- Scores must be integers between 1 and 10, be realistic and strict on the scoring.
- Base the feedback on the transcript first, then use participant and assignment context when relevant.
- If the transcript is very short or low quality, focus on general encouragement and tips for improvement instead of specific feedback.
- Use the participant's overall job goal to make feedback more relevant to the type of role they are targeting.
- Use coach notes and participant condition to adjust your tone and level of support appropriately.

${participantContext}

${assignmentContext}

Transcript:
${transcriptText}
`;

      try {
        // Ask the model to generate structured JSON feedback
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
          throw new Error("No feedback returned by model");
        }

        const parsed = JSON.parse(raw) as unknown;
        feedbackJson = normalizeFeedback(parsed, transcriptText);
      } catch (openaiError: unknown) {
        // If OpenAI fails, use fallback feedback instead of crashing
        console.error("OpenAI analysis failed, using fallback:", openaiError);
        feedbackJson = buildFallbackFeedback(transcriptText);
      }
    }

    // Check whether feedback already exists for this session
    const { data: existingFeedback, error: existingFeedbackError } =
      await supabaseAdmin
        .from("feedback")
        .select("id")
        .eq("session_id", sessionId)
        .maybeSingle();

    if (existingFeedbackError) {
      throw new Error(existingFeedbackError.message);
    }

    // Update existing feedback or insert new feedback
    if (existingFeedback) {
      const { error: updateError } = await supabaseAdmin
        .from("feedback")
        .update({
          feedback_json: feedbackJson,
        })
        .eq("id", existingFeedback.id);

      if (updateError) {
        throw new Error(updateError.message);
      }
    } else {
      const { error: insertError } = await supabaseAdmin
        .from("feedback")
        .insert({
          session_id: sessionId,
          feedback_json: feedbackJson,
        });

      if (insertError) {
        throw new Error(insertError.message);
      }
    }

    console.log("Feedback saved for session:", sessionId);
    return feedbackJson;
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown analyzeSession error";

    console.error("analyzeSession error:", message);
    throw error;
  }
}