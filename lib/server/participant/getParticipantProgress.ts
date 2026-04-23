import type { SupabaseClient } from "@supabase/supabase-js";

type ProfileRow = {
  full_name: string | null;
  job_goal: string | null;
  coach_notes: string | null;
  participant_condition: string | null;
  created_at: string | null;
};

type AssignmentRow = {
  id: string;
  title: string | null;
  status: string | null;
  created_at: string | null;
  due_at: string | null;
};

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

type ProgressByAssignmentItem = {
  assignmentId: string;
  title: string;
  status: string;
  completed: boolean;
  sessionCount: number;
};

type SessionsOverTimeItem = {
  date: string;
  completedSessions: number;
};

export type ParticipantProgress = {
  participantInfo: {
    fullName: string;
    jobGoal: string;
    coachNotes: string;
    supportNotes: string;
    joinedAt: string | null;
  };
  instructorName: string;
  totalAssignments: number;
  completedAssignments: number;
  pendingAssignments: number;
  totalSessions: number;
  completedSessions: number;
  completionRate: number;
  averageSessionDurationSeconds: number;
  averageSessionDurationLabel: string;
  progressByAssignment: ProgressByAssignmentItem[];
  sessionsOverTime: SessionsOverTimeItem[];
  recentSessions: SessionRow[];
  pendingGoals: AssignmentRow[];
};

function roundToTwo(num: number): number {
  return Math.round(num * 100) / 100;
}

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return "0m";

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);

  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export async function getParticipantProgress(
  supabase: SupabaseClient,
  participantId: string
): Promise<ParticipantProgress> {
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name, job_goal, coach_notes, participant_condition, created_at")
    .eq("user_id", participantId)
    .single();

  if (profileError || !profile) {
    throw new Error(`Failed to load participant profile: ${profileError?.message}`);
  }

  const typedProfile = profile as ProfileRow;

  let instructorName = "Not assigned";

  const { data: participantProfile } = await supabase
    .from("profiles")
    .select("instructor_id")
    .eq("user_id", participantId)
    .single();

  if (participantProfile?.instructor_id) {
    const { data: instructorProfile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", participantProfile.instructor_id)
      .single();

    instructorName = instructorProfile?.full_name || "Instructor";
  }

  const { data: assignments, error: assignmentsError } = await supabase
    .from("session_assignments")
    .select("id, title, status, created_at, due_at")
    .eq("participant_id", participantId)
    .order("created_at", { ascending: false });

  if (assignmentsError) {
    throw new Error(`Failed to load assignments: ${assignmentsError.message}`);
  }

  const { data: sessions, error: sessionsError } = await supabase
    .from("sessions")
    .select(
      "id, assignment_id, title, status, duration_seconds, created_at, started_at, ended_at"
    )
    .eq("participant_id", participantId)
    .order("created_at", { ascending: false });

  if (sessionsError) {
    throw new Error(`Failed to load sessions: ${sessionsError.message}`);
  }

  const assignmentRows = (assignments ?? []) as AssignmentRow[];
  const sessionRows = (sessions ?? []) as SessionRow[];

  const totalAssignments = assignmentRows.length;
  const completedAssignments = assignmentRows.filter(
    (a) => a.status === "completed"
  ).length;
  const pendingAssignments = assignmentRows.filter(
    (a) => a.status !== "completed"
  ).length;

  const totalSessions = sessionRows.length;

  const completedSessionRows = sessionRows.filter(
    (s) => s.status === "completed" || !!s.ended_at
  );

  const completedSessions = completedSessionRows.length;

  const completionRate =
    totalAssignments > 0
      ? roundToTwo((completedAssignments / totalAssignments) * 100)
      : 0;

  const durations = completedSessionRows
    .map((s) => s.duration_seconds ?? 0)
    .filter((d) => d > 0);

  const averageSessionDurationSeconds =
    durations.length > 0
      ? Math.round(
          durations.reduce((sum, value) => sum + value, 0) / durations.length
        )
      : 0;

  const averageSessionDurationLabel = formatDuration(
    averageSessionDurationSeconds
  );

  const sessionCountByAssignment = new Map<string, number>();

  for (const session of sessionRows) {
    if (!session.assignment_id) continue;
    sessionCountByAssignment.set(
      session.assignment_id,
      (sessionCountByAssignment.get(session.assignment_id) ?? 0) + 1
    );
  }

  const progressByAssignment: ProgressByAssignmentItem[] = assignmentRows.map(
    (assignment) => ({
      assignmentId: assignment.id,
      title: assignment.title || "Untitled Goal",
      status: assignment.status || "pending",
      completed: assignment.status === "completed",
      sessionCount: sessionCountByAssignment.get(assignment.id) ?? 0,
    })
  );

  const dateMap = new Map<string, number>();

  for (const session of completedSessionRows) {
    const sourceDate = session.ended_at || session.created_at;
    if (!sourceDate) continue;

    const day = new Date(sourceDate).toISOString().slice(0, 10);
    dateMap.set(day, (dateMap.get(day) ?? 0) + 1);
  }

  const sessionsOverTime: SessionsOverTimeItem[] = Array.from(dateMap.entries())
    .map(([date, completedSessions]) => ({
      date,
      completedSessions,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const recentSessions = sessionRows.slice(0, 5);

  const pendingGoals = assignmentRows
    .filter((assignment) => assignment.status !== "completed")
    .slice(0, 5);

  return {
    participantInfo: {
      fullName: typedProfile.full_name || "Participant",
      jobGoal: typedProfile.job_goal || "Not added yet",
      coachNotes: typedProfile.coach_notes || "Not added yet",
      supportNotes: typedProfile.participant_condition || "Not added yet",
      joinedAt: typedProfile.created_at,
    },
    instructorName,
    totalAssignments,
    completedAssignments,
    pendingAssignments,
    totalSessions,
    completedSessions,
    completionRate,
    averageSessionDurationSeconds,
    averageSessionDurationLabel,
    progressByAssignment,
    sessionsOverTime,
    recentSessions,
    pendingGoals,
  };
}