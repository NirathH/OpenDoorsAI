import { notFound } from "next/navigation";
import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Structured feedback shape used by the session details page.
 */
export type FeedbackData = {
  summary?: string;
  strengths?: string[];
  improvements?: string[];
  next_step?: string;

  // 🔥 ADD THIS BLOCK
  behavior_feedback?: {
    eye_contact?: string;
    engagement?: string;
    facial_expression?: string;
  } | null;

  scores?: {
    clarity?: number;
    confidence?: number;
    relevance?: number;
    delivery?: number;
  };
};

/**
 * Session shape used on the participant session details page.
 */
export type ParticipantSessionRow = {
  id: string;
  participant_id: string;
  assignment_id: string | null;
  title: string | null;
  status: string;
  ended_at: string | null;
  created_at: string;
  duration_seconds: number | null;
};

/**
 * Converts a transcript string into structured blocks for the UI.
 *
 * Expected format per block:
 * Q: ...
 * A: ...
 * E: ...
 */
export function parseTranscriptBlocks(transcriptText: string) {
  return transcriptText
    .split("\n\n")
    .map((block) => {
      const lines = block.split("\n");

      const question =
        lines.find((line) => line.startsWith("Q:"))?.replace("Q:", "").trim() ||
        "";

      const answer =
        lines.find((line) => line.startsWith("A:"))?.replace("A:", "").trim() ||
        "";

      const emotion =
        lines.find((line) => line.startsWith("E:"))?.replace("E:", "").trim() ||
        "";

      return { question, answer, emotion };
    })
    .filter((item) => item.question || item.answer);
}

/**
 * Result returned for the session details page.
 */
type GetParticipantSessionDetailsResult = {
  session: ParticipantSessionRow;
  transcriptBlocks: Array<{
    question: string;
    answer: string;
    emotion: string;
  }>;
  feedbackData: FeedbackData | null;
  instructorName: string;
};

/**
 * Gets one participant session along with transcript, feedback,
 * and best-effort instructor name lookup.
 */
export async function getParticipantSessionDetails(
  supabase: SupabaseClient,
  participantId: string,
  sessionId: string
): Promise<GetParticipantSessionDetailsResult> {
  // Fetch the session and confirm it belongs to the participant
  const { data: sessionData, error: sessionError } = await supabase
    .from("sessions")
    .select(
      `
        id,
        participant_id,
        assignment_id,
        title,
        status,
        ended_at,
        created_at,
        duration_seconds
      `
    )
    .eq("id", sessionId)
    .eq("participant_id", participantId)
    .single();

  if (sessionError || !sessionData) {
    notFound();
  }

  const session = sessionData as ParticipantSessionRow;

  // Fetch transcript
  const { data: transcript, error: transcriptError } = await supabase
    .from("transcripts")
    .select("transcript_text")
    .eq("session_id", sessionId)
    .maybeSingle();

  if (transcriptError) {
    throw new Error(transcriptError.message);
  }

  // Fetch AI feedback
  const { data: feedback, error: feedbackError } = await supabase
    .from("feedback")
    .select("feedback_json")
    .eq("session_id", sessionId)
    .maybeSingle();

  if (feedbackError) {
    throw new Error(feedbackError.message);
  }

  // Default fallback if instructor cannot be found
  let instructorName = "Instructor not available";

  /**
   * First try:
   * Look up instructor from the assignment linked to this session.
   */
  if (session.assignment_id) {
    const { data: assignment, error: assignmentError } = await supabase
      .from("session_assignments")
      .select("instructor_id")
      .eq("id", session.assignment_id)
      .maybeSingle();

    if (assignmentError) {
      throw new Error(assignmentError.message);
    }

    if (assignment?.instructor_id) {
      const { data: instructorProfile, error: instructorProfileError } =
        await supabase
          .from("profiles")
          .select("full_name")
          .eq("user_id", assignment.instructor_id)
          .maybeSingle();

      if (instructorProfileError) {
        throw new Error(instructorProfileError.message);
      }

      if (instructorProfile?.full_name) {
        instructorName = instructorProfile.full_name;
      }
    }
  }

  /**
   * Fallback:
   * If assignment lookup failed, get the participant profile
   * and use its assigned instructor_id.
   */
  if (instructorName === "Instructor not available") {
    const { data: participantProfile, error: participantProfileError } =
      await supabase
        .from("profiles")
        .select("instructor_id")
        .eq("user_id", participantId)
        .maybeSingle();

    if (participantProfileError) {
      throw new Error(participantProfileError.message);
    }

    if (participantProfile?.instructor_id) {
      const { data: fallbackInstructorProfile, error: fallbackInstructorError } =
        await supabase
          .from("profiles")
          .select("full_name")
          .eq("user_id", participantProfile.instructor_id)
          .maybeSingle();

      if (fallbackInstructorError) {
        throw new Error(fallbackInstructorError.message);
      }

      if (fallbackInstructorProfile?.full_name) {
        instructorName = fallbackInstructorProfile.full_name;
      }
    }
  }

  // Convert transcript text to display-friendly blocks
  const transcriptBlocks = transcript?.transcript_text
    ? parseTranscriptBlocks(transcript.transcript_text)
    : [];

  // Cast stored JSON feedback into the UI feedback type
  const feedbackData = (feedback?.feedback_json || null) as FeedbackData | null;

  return {
    session,
    transcriptBlocks,
    feedbackData,
    instructorName,
  };
}