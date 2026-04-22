import { SupabaseClient } from "@supabase/supabase-js";

export type AssignmentStatusFilter =
  | "all"
  | "assigned"
  | "in_progress"
  | "completed"
  | "overdue";

export type AssignmentRow = {
  id: string;
  participant_id: string;
  instructor_id: string;
  title: string;
  goal: string | null;
  participant_summary: string | null;
  instructions: string | null;
  max_minutes: number | null;
  status: string;
  created_at: string;
  due_at: string | null;
};

export type AssignmentHistoryRow = AssignmentRow & {
  participant_name: string;
  effective_status: AssignmentStatusFilter | "assigned" | "in_progress" | "completed";
  latest_activity_at: string | null;
  latest_session_id: string | null;
  recent_completed: boolean;
};

type GetInstructorAssignmentsResult = {
  recentAssigned: AssignmentHistoryRow[];
  recentCompleted: AssignmentHistoryRow[];
  historyRows: AssignmentHistoryRow[];
  stats: {
    total: number;
    assigned: number;
    inProgress: number;
    completed: number;
    overdue: number;
  };
};

function isPast(dateString: string | null) {
  if (!dateString) return false;
  return new Date(dateString).getTime() < Date.now();
}

function isWithinDays(dateString: string | null, days: number) {
  if (!dateString) return false;
  const now = Date.now();
  const value = new Date(dateString).getTime();
  const diff = now - value;
  return diff <= days * 24 * 60 * 60 * 1000;
}

export async function getInstructorAssignments(
  supabase: SupabaseClient,
  instructorId: string,
  filter: AssignmentStatusFilter = "all"
): Promise<GetInstructorAssignmentsResult> {
  const { data: participantsData, error: participantsError } = await supabase
    .from("profiles")
    .select("user_id, full_name")
    .eq("role", "participant")
    .eq("instructor_id", instructorId);

  if (participantsError) {
    throw new Error(participantsError.message);
  }

  const participantMap = new Map(
    (participantsData ?? []).map((p) => [p.user_id, p.full_name || "Unnamed Participant"])
  );

  const { data: assignmentsData, error: assignmentsError } = await supabase
    .from("session_assignments")
    .select(
      "id, participant_id, instructor_id, title, goal, participant_summary, instructions, max_minutes, status, created_at, due_at"
    )
    .eq("instructor_id", instructorId)
    .order("created_at", { ascending: false });

  if (assignmentsError) {
    throw new Error(assignmentsError.message);
  }

  const assignments = (assignmentsData ?? []) as AssignmentRow[];
  const assignmentIds = assignments.map((a) => a.id);

  let sessionsData:
    | Array<{
        id: string;
        assignment_id: string | null;
        status: string;
        ended_at: string | null;
        created_at: string;
      }>
    | [] = [];

  if (assignmentIds.length > 0) {
    const { data, error } = await supabase
      .from("sessions")
      .select("id, assignment_id, status, ended_at, created_at")
      .in("assignment_id", assignmentIds)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    sessionsData = data ?? [];
  }

  const historyRows: AssignmentHistoryRow[] = assignments.map((assignment) => {
    const relatedSessions = sessionsData.filter(
      (session) => session.assignment_id === assignment.id
    );

    const latestActivityAt =
      relatedSessions[0]?.ended_at || relatedSessions[0]?.created_at || null;

    const recentCompleted = relatedSessions.some(
      (session) =>
        session.status === "completed" &&
        isWithinDays(session.ended_at || session.created_at, 4)
    );

    let effectiveStatus: AssignmentHistoryRow["effective_status"] =
      assignment.status as AssignmentHistoryRow["effective_status"];

    if (
      assignment.status !== "completed" &&
      assignment.due_at &&
      isPast(assignment.due_at)
    ) {
      effectiveStatus = "overdue";
    }

    return {
      ...assignment,
      participant_name: participantMap.get(assignment.participant_id) || "Unnamed Participant",
      effective_status: effectiveStatus,
      latest_activity_at: latestActivityAt,
      latest_session_id: relatedSessions[0]?.id || null,
      recent_completed: recentCompleted,
    };
  });

  const filteredHistory =
    filter === "all"
      ? historyRows
      : historyRows.filter((row) => row.effective_status === filter);

  const recentAssigned = historyRows.filter(
    (row) =>
      isWithinDays(row.created_at, 4) &&
      (row.effective_status === "assigned" || row.effective_status === "in_progress")
  );

  const recentCompleted = historyRows.filter((row) => row.recent_completed);

  return {
    recentAssigned,
    recentCompleted,
    historyRows: filteredHistory,
    stats: {
      total: historyRows.length,
      assigned: historyRows.filter((r) => r.effective_status === "assigned").length,
      inProgress: historyRows.filter((r) => r.effective_status === "in_progress").length,
      completed: historyRows.filter((r) => r.effective_status === "completed").length,
      overdue: historyRows.filter((r) => r.effective_status === "overdue").length,
    },
  };
}