import { notFound } from "next/navigation";
import { SupabaseClient } from "@supabase/supabase-js";

export type StudentProfileRow = {
  user_id: string;
  full_name: string | null;
  role: string;
  instructor_id: string | null;
  created_at: string | null;
  job_goal: string | null;
  coach_notes: string | null;
};

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

type AssignmentRow = {
  id: string;
  status: string | null;
};

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

export async function getInstructorStudentDetails(
  supabase: SupabaseClient,
  instructorId: string,
  studentId: string
): Promise<StudentDetailsResult> {
  // Fetch the participant profile
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

  // Fetch assignments for this participant that are still pending (never started)
  // These have no session row yet so sessions.length alone would under-count
  const { data: assignmentsData, error: assignmentsError } = await supabase
    .from("session_assignments")
    .select("id, status")
    .eq("participant_id", studentId)
    .eq("instructor_id", instructorId);

  if (assignmentsError) {
    throw new Error(assignmentsError.message);
  }

  const assignments = (assignmentsData ?? []) as AssignmentRow[];

  const safeName = studentProfile.full_name?.trim() || "Unnamed Student";

  // totalSessions = actual session rows + assignments still pending (not yet started)
  // pending assignments have no session row so we add them separately
  const pendingAssignments = assignments.filter(
    (a) => a.status === "assigned"
  ).length;

  const totalSessions = sessions.length + pendingAssignments;

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