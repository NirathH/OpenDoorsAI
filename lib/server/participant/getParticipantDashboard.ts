import { SupabaseClient } from "@supabase/supabase-js";

export async function getParticipantDashboard(
  supabase: SupabaseClient,
  participantId: string
) {
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name, job_goal, coach_notes")
    .eq("user_id", participantId)
    .maybeSingle();

  if (profileError) {
    throw new Error(profileError.message);
  }

  const { data: assignments, error: assignmentsError } = await supabase
    .from("session_assignments")
    .select("id, title, goal, instructions, status, due_at, created_at")
    .eq("participant_id", participantId)
    .order("created_at", { ascending: false });

  if (assignmentsError) {
    throw new Error(assignmentsError.message);
  }

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

  const pendingAssignments = allAssignments.filter(
    (a) => a.status === "assigned" || a.status === "in_progress"
  );

  const completedSessions = allSessions.filter(
    (s) => s.status === "completed"
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