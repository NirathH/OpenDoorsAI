import type { SupabaseClient } from "@supabase/supabase-js";

type SessionRow = {
  id: string;
  assignment_id: string | null;
  title: string | null;
  status: string | null;
  duration_seconds: number | null;
  created_at: string | null;
  started_at: string | null;
  ended_at: string | null;
};

type AssignmentRow = {
  id: string;
  title: string | null;
  status: string | null;
  created_at: string | null;
  due_at: string | null;
};

function formatDurationLabel(seconds: number) {
  if (!seconds || seconds <= 0) return "—";
  return `${Math.round(seconds / 60)}m`;
}

function buildSessionsOverTime(sessions: SessionRow[]) {
  const map = new Map<string, number>();

  sessions.forEach((session) => {
    const rawDate = session.ended_at || session.created_at;
    if (!rawDate) return;

    const date = new Date(rawDate).toISOString().slice(0, 10);
    map.set(date, (map.get(date) ?? 0) + 1);
  });

  return Array.from(map.entries())
    .map(([date, completedSessions]) => ({
      date,
      completedSessions,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export async function getParticipantProgress(
  supabase: SupabaseClient,
  participantId: string
) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, instructor_id, job_goal, coach_notes, created_at")
    .eq("user_id", participantId)
    .maybeSingle();

  let instructorName = "Not assigned";

  if (profile?.instructor_id) {
    const { data: instructorProfile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", profile.instructor_id)
      .maybeSingle();

    instructorName = instructorProfile?.full_name || "Not assigned";
  }

  const { data: assignmentsData } = await supabase
    .from("session_assignments")
    .select("id, title, status, created_at, due_at")
    .eq("participant_id", participantId)
    .order("created_at", { ascending: false });

  const { data: sessionsData } = await supabase
    .from("sessions")
    .select(
      "id, assignment_id, title, status, duration_seconds, created_at, started_at, ended_at"
    )
    .eq("participant_id", participantId)
    .order("created_at", { ascending: false });

  const { data: weeklyFeedback } = await supabase
    .from("weekly_feedback")
    .select("*")
    .eq("participant_id", participantId)
    .order("week_start", { ascending: false });

  const assignments = (assignmentsData ?? []) as AssignmentRow[];
  const sessions = (sessionsData ?? []) as SessionRow[];

  const completedSessionsList = sessions.filter(
    (session) => session.status === "completed"
  );

  const totalAssignments = assignments.length;

  const completedAssignments = assignments.filter(
    (assignment) => assignment.status === "completed"
  ).length;

  const pendingAssignments = assignments.filter(
    (assignment) =>
      assignment.status === "assigned" || assignment.status === "in_progress"
  ).length;

  const totalSessions = sessions.length;
  const completedSessions = completedSessionsList.length;

  const completionRate =
    totalAssignments > 0
      ? Math.round((completedAssignments / totalAssignments) * 100)
      : 0;

  const durationValues = completedSessionsList
    .map((session) => session.duration_seconds)
    .filter((value): value is number => typeof value === "number" && value > 0);

  const averageSessionDurationSeconds =
    durationValues.length > 0
      ? Math.round(
          durationValues.reduce((sum, value) => sum + value, 0) /
            durationValues.length
        )
      : 0;

  const sessionsOverTime = buildSessionsOverTime(completedSessionsList);

  const recentSessions = completedSessionsList.slice(0, 5);

  const pendingGoals = assignments
    .filter(
      (assignment) =>
        assignment.status === "assigned" || assignment.status === "in_progress"
    )
    .slice(0, 5);

  return {
    participantInfo: {
      fullName: profile?.full_name || "Participant",
      jobGoal: profile?.job_goal || "No participant goal added yet.",
      coachNotes: profile?.coach_notes || "No coach notes added yet.",
      supportNotes: profile?.coach_notes || "No support notes added yet.",
      joinedAt: profile?.created_at || null,
    },

    instructorName,

    totalAssignments,
    completedAssignments,
    pendingAssignments,

    totalSessions,
    completedSessions,
    completionRate,

    averageSessionDurationSeconds,
    averageSessionDurationLabel: formatDurationLabel(
      averageSessionDurationSeconds
    ),

    sessionsOverTime,
    recentSessions,
    pendingGoals,

    weeklyFeedback: weeklyFeedback ?? [],
    latestWeekly: weeklyFeedback?.[0] ?? null,
  };
}