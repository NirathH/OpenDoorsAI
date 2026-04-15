import { notFound } from "next/navigation";
import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Full participant profile shape used in the instructor student details page.
 */
export type StudentProfileRow = {
  user_id: string;
  full_name: string | null;
  role: string;
  instructor_id: string | null;
  created_at: string | null;
  job_goal: string | null;
  coach_notes: string | null;
};

/**
 * Session shape used for a student's session history.
 */
export type SessionRow = {
  id: string;
  title: string | null;
  status: string | null;
  started_at: string | null;
  ended_at: string | null;
  duration_seconds: number | null;
  created_at: string | null;
  compact_transcript: string | null;
  assignment_id: string | null;
};

/**
 * Final result returned by this helper.
 */
type StudentDetailsResult = {
  studentProfile: StudentProfileRow;
  safeName: string;
  sessions: SessionRow[];
  stats: {
    totalSessions: number;
    completedSessions: number;
    latestSession: SessionRow | null;
  };
};

/**
 * Gets one participant that belongs to the given instructor,
 * along with that participant's sessions and summary stats.
 */
export async function getInstructorStudentDetails(
  supabase: SupabaseClient,
  instructorId: string,
  studentId: string
): Promise<StudentDetailsResult> {
  // Fetch the participant profile, but only if they belong to this instructor
  const { data: studentData, error: studentError } = await supabase
    .from("profiles")
    .select(
      "user_id, full_name, role, instructor_id, created_at, job_goal, coach_notes"
    )
    .eq("user_id", studentId)
    .eq("role", "participant")
    .eq("instructor_id", instructorId)
    .maybeSingle();

  if (studentError) {
    throw new Error(studentError.message);
  }

  // If no matching student exists, return 404
  if (!studentData) {
    notFound();
  }

  const studentProfile = studentData as StudentProfileRow;

  // Fetch all sessions for this participant
  const { data: sessionsData, error: sessionsError } = await supabase
    .from("sessions")
    .select(
      "id, title, status, started_at, ended_at, duration_seconds, created_at, compact_transcript, assignment_id"
    )
    .eq("participant_id", studentId)
    .order("created_at", { ascending: false });

  if (sessionsError) {
    throw new Error(sessionsError.message);
  }

  const sessions = (sessionsData ?? []) as SessionRow[];

  // Safe display name fallback
  const safeName = studentProfile.full_name?.trim() || "Unnamed Student";

  // Simple session stats
  const totalSessions = sessions.length;
  const completedSessions = sessions.filter(
    (session) => session.status === "completed"
  ).length;
  const latestSession = sessions[0] ?? null;

  return {
    studentProfile,
    safeName,
    sessions,
    stats: {
      totalSessions,
      completedSessions,
      latestSession,
    },
  };
}