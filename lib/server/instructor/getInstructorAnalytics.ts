import type { SupabaseClient } from "@supabase/supabase-js";

type StudentRow = {
  user_id: string;
  full_name: string | null;
};

type AssignmentRow = {
  id: string;
  participant_id: string;
  instructor_id: string;
  status: string | null;
  created_at: string | null;
  due_at: string | null;
};

type SessionRow = {
  id: string;
  participant_id: string;
  assignment_id: string | null;
  status: string | null;
  duration_seconds: number | null;
  created_at: string | null;
  ended_at: string | null;
};

type SessionsByStudentItem = {
  participantId: string;
  studentName: string;
  completedSessions: number;
  totalSessions: number;
};

type SessionsOverTimeItem = {
  date: string;
  completedSessions: number;
};

export type InstructorAnalytics = {
  totalStudents: number;
  totalAssignments: number;
  completedSessions: number;
  pendingAssignments: number;
  completionRate: number;
  averageSessionDurationSeconds: number;
  averageSessionDurationLabel: string;
  assignedVsCompleted: {
    assigned: number;
    completed: number;
    pending: number;
  };
  sessionsByStudent: SessionsByStudentItem[];
  sessionsOverTime: SessionsOverTimeItem[];
};

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return "0m";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function roundToTwo(num: number): number {
  return Math.round(num * 100) / 100;
}

export async function getInstructorAnalytics(
  supabase: SupabaseClient,
  instructorId: string
): Promise<InstructorAnalytics> {
  // 1) Get all students for this instructor
  const { data: students, error: studentsError } = await supabase
    .from("profiles")
    .select("user_id, full_name")
    .eq("role", "participant")
    .eq("instructor_id", instructorId);

  if (studentsError) {
    throw new Error(`Failed to load students: ${studentsError.message}`);
  }

  const studentRows = (students ?? []) as StudentRow[];
  const participantIds = studentRows.map((s) => s.user_id);

  if (participantIds.length === 0) {
    return {
      totalStudents: 0,
      totalAssignments: 0,
      completedSessions: 0,
      pendingAssignments: 0,
      completionRate: 0,
      averageSessionDurationSeconds: 0,
      averageSessionDurationLabel: "0m",
      assignedVsCompleted: { assigned: 0, completed: 0, pending: 0 },
      sessionsByStudent: [],
      sessionsOverTime: [],
    };
  }

  // 2) Get all assignments for this instructor
  const { data: assignments, error: assignmentsError } = await supabase
    .from("session_assignments")
    .select("id, participant_id, instructor_id, status, created_at, due_at")
    .eq("instructor_id", instructorId);

  if (assignmentsError) {
    throw new Error(`Failed to load assignments: ${assignmentsError.message}`);
  }

  const assignmentRows = (assignments ?? []) as AssignmentRow[];
  const totalAssignments = assignmentRows.length;
  const assignmentIds = assignmentRows.map((a) => a.id);

  // 3) Get all sessions for this instructor's participants
  //    Used for duration averages, sessions-over-time, and per-student counts
  let allSessionRows: SessionRow[] = [];

  if (participantIds.length > 0) {
    const { data: sessionsData, error: sessionsError } = await supabase
      .from("sessions")
      .select(
        "id, participant_id, assignment_id, status, duration_seconds, created_at, ended_at"
      )
      .in("participant_id", participantIds);

    if (sessionsError) {
      throw new Error(`Failed to load sessions: ${sessionsError.message}`);
    }

    allSessionRows = (sessionsData ?? []) as SessionRow[];
  }

  // 4) Compute top-level totals
  //    Same logic as getInstructorStudentDetails:
  //    totalSessions = session rows + assignments still "pending" (never started, no session row yet)
  //    completedSessions = session rows with status "completed"
  //    pendingAssignments = assignments with status "pending" (never started)
  const totalStudents = studentRows.length;

  const pendingAssignmentRows = assignmentRows.filter(
    (a) => a.status === "assigned"
  );
  const pendingAssignments = pendingAssignmentRows.length;

  const completedSessionRows = allSessionRows.filter(
    (s) => s.status === "completed"
  );
  const completedSessions = completedSessionRows.length;

  // Total = actual session rows (started or completed) + pending assignments (never started)
  const totalSessions = allSessionRows.length + pendingAssignments;

  const completionRate =
    totalAssignments > 0
      ? roundToTwo((completedSessions / totalAssignments) * 100)
      : 0;

  const durations = completedSessionRows
    .map((s) => s.duration_seconds ?? 0)
    .filter((d) => d > 0);

  const averageSessionDurationSeconds =
    durations.length > 0
      ? Math.round(durations.reduce((sum, v) => sum + v, 0) / durations.length)
      : 0;

  const averageSessionDurationLabel = formatDuration(
    averageSessionDurationSeconds
  );

  // 5) Assigned vs Completed summary
  const assignedVsCompleted = {
    assigned: totalAssignments,
    completed: completedSessions,
    pending: pendingAssignments,
  };

  // 6) Sessions by Student — same logic as getInstructorStudentDetails
  //    totalSessions     = session rows for student + their pending assignments
  //    completedSessions = session rows with status "completed"
  const studentNameMap = new Map(
    studentRows.map((s) => [s.user_id, s.full_name || "Unnamed Student"])
  );

  // Count session rows per participant
  const sessionCountMap = new Map<string, number>();
  const completedCountMap = new Map<string, number>();
  for (const participantId of participantIds) {
    sessionCountMap.set(participantId, 0);
    completedCountMap.set(participantId, 0);
  }
  for (const session of allSessionRows) {
    sessionCountMap.set(
      session.participant_id,
      (sessionCountMap.get(session.participant_id) ?? 0) + 1
    );
    if (session.status === "completed") {
      completedCountMap.set(
        session.participant_id,
        (completedCountMap.get(session.participant_id) ?? 0) + 1
      );
    }
  }

  // Count pending assignments per participant
  const pendingCountMap = new Map<string, number>();
  for (const participantId of participantIds) {
    pendingCountMap.set(participantId, 0);
  }
  for (const assignment of pendingAssignmentRows) {
    pendingCountMap.set(
      assignment.participant_id,
      (pendingCountMap.get(assignment.participant_id) ?? 0) + 1
    );
  }

  const sessionsByStudent: SessionsByStudentItem[] = participantIds
    .map((participantId) => ({
      participantId,
      studentName: studentNameMap.get(participantId) || "Unnamed Student",
      completedSessions: completedCountMap.get(participantId) ?? 0,
      // sessions started/completed + assignments never started
      totalSessions:
        (sessionCountMap.get(participantId) ?? 0) +
        (pendingCountMap.get(participantId) ?? 0),
    }))
    .sort((a, b) => b.completedSessions - a.completedSessions);

  // 7) Sessions over time — completed session rows, bucketed by day
  const dateMap = new Map<string, number>();

  for (const session of completedSessionRows) {
    const sourceDate = session.ended_at || session.created_at;
    if (!sourceDate) continue;
    const day = new Date(sourceDate).toISOString().slice(0, 10);
    dateMap.set(day, (dateMap.get(day) ?? 0) + 1);
  }

  const sessionsOverTime: SessionsOverTimeItem[] = Array.from(dateMap.entries())
    .map(([date, completedSessions]) => ({ date, completedSessions }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    totalStudents,
    totalAssignments,
    completedSessions,
    pendingAssignments,
    completionRate,
    averageSessionDurationSeconds,
    averageSessionDurationLabel,
    assignedVsCompleted,
    sessionsByStudent,
    sessionsOverTime,
  };
}