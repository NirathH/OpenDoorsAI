import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Gets the main participant dashboard data:
 * - profile basics
 * - assignments
 * - completed sessions
 * - quick dashboard stats
 */
export async function getParticipantDashboard(
  supabase: SupabaseClient,
  participantId: string
) {
  // Fetch the participant profile info
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name, job_goal, coach_notes")
    .eq("user_id", participantId)
    .maybeSingle();

  if (profileError) {
    throw new Error(profileError.message);
  }

  // Fetch assignments for this participant
  const { data: assignments, error: assignmentsError } = await supabase
    .from("session_assignments")
    .select("id, title, goal, instructions, status, due_at, created_at")
    .eq("participant_id", participantId)
    .order("created_at", { ascending: false });

  if (assignmentsError) {
    throw new Error(assignmentsError.message);
  }

  // Fetch sessions for this participant
  const { data: sessions, error: sessionsError } = await supabase
    .from("sessions")
    .select("id, title, status, ended_at, created_at")
    .eq("participant_id", participantId)
    .order("created_at", { ascending: false });

  if (sessionsError) {
    throw new Error(sessionsError.message);
  }

  const allAssignments = assignments ?? [];
  const allSessions = sessions ?? [];

  // Assignments the participant still needs to work on
  const pendingAssignments = allAssignments.filter(
    (assignment) =>
      assignment.status === "assigned" || assignment.status === "in_progress"
  );

  // Sessions that were completed
  const completedSessions = allSessions.filter(
    (session) => session.status === "completed"
  );

  const latestCompleted = completedSessions[0] ?? null;
  const nextAssignment = pendingAssignments[0] ?? null;

  return {
    profile,
    stats: {
      totalSessions: completedSessions.length,
      pendingAssignments: pendingAssignments.length,
      latestCompletedDate:
        latestCompleted?.ended_at || latestCompleted?.created_at || null,
    },
    nextAssignment,
    pendingAssignments,
  };
}