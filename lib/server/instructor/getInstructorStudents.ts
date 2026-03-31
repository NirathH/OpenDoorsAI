import {
  calculateStreak,
  deriveStatus,
  type DerivedStudentStatus,
} from "@/lib/utils/studentHelpers";
import { SupabaseClient } from "@supabase/supabase-js";

export type StudentRow = {
  user_id: string;
  full_name: string;
  created_at: string | null;
  last_session_at: string | null;
  streak_days: number;
  derived_status: DerivedStudentStatus;
};

export async function getInstructorStudents(
  supabase: SupabaseClient,
  instructorId: string
) {
  const { data: studentsData, error: studentsError } = await supabase
    .from("profiles")
    .select("user_id, full_name, created_at, instructor_id, role")
    .eq("role", "participant")
    .eq("instructor_id", instructorId)
    .order("created_at", { ascending: false });

  if (studentsError) {
    throw new Error(studentsError.message);
  }

  const students = studentsData ?? [];
  const studentIds = students.map((s: { user_id: string }) => s.user_id);

  let sessionsData:
    | Array<{
        participant_id: string;
        ended_at: string | null;
        created_at: string;
      }>
    | [] = [];

  if (studentIds.length > 0) {
    const { data, error } = await supabase
      .from("sessions")
      .select("participant_id, ended_at, created_at")
      .in("participant_id", studentIds)
      .eq("status", "completed")
      .order("ended_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    sessionsData = data ?? [];
  }

  const rows: StudentRow[] = students.map(
    (student: {
      user_id: string;
      full_name: string | null;
      created_at: string | null;
    }) => {
      const studentSessions = sessionsData.filter(
        (session) => session.participant_id === student.user_id
      );

      const sessionDates = studentSessions
        .map((s) => s.ended_at || s.created_at)
        .filter(Boolean) as string[];

      const lastSessionAt = studentSessions[0]?.ended_at || null;
      const streakDays = calculateStreak(sessionDates);
      const derivedStatus = deriveStatus(lastSessionAt, student.created_at);

      return {
        user_id: student.user_id,
        full_name: student.full_name?.trim() || "Unnamed Student",
        created_at: student.created_at,
        last_session_at: lastSessionAt,
        streak_days: streakDays,
        derived_status: derivedStatus,
      };
    }
  );

  return {
    rows,
    stats: {
      totalStudents: rows.length,
      activeStudents: rows.filter((r) => r.derived_status === "Active").length,
      needsAttention: rows.filter(
        (r) => r.derived_status === "Needs Attention"
      ).length,
      inactiveStudents: rows.filter((r) => r.derived_status === "Inactive")
        .length,
    },
  };
}