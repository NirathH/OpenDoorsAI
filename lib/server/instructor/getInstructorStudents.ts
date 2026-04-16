import {
  calculateStreak,
  deriveStatus,
  type DerivedStudentStatus,
} from "@/lib/utils/studentHelpers";
import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Row shape used by the instructor students list page.
 */
export type StudentRow = {
  user_id: string;
  full_name: string;
  created_at: string | null;
  last_session_at: string | null;
  streak_days: number;
  derived_status: DerivedStudentStatus;
  total_sessions: number;
  avg_score: number;
};

/**
 * Gets all students assigned to an instructor, then calculates
 * dashboard-friendly stats like streak and activity status.
 */
export async function getInstructorStudents(
  supabase: SupabaseClient,
  instructorId: string
) {
  // Fetch all participant profiles assigned to this instructor
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
  const studentIds = students.map((student: { user_id: string }) => student.user_id);

  // Default to empty session list if no students exist
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let sessionsData: any[] = [];

  // Only query sessions if there are student ids
  if (studentIds.length > 0) {
    const { data, error } = await supabase
      .from("sessions")
      .select("participant_id, ended_at, created_at, feedback ( feedback_json )")
      .in("participant_id", studentIds)
      .eq("status", "completed")
      .order("ended_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    sessionsData = data ?? [];
  }

  // Build dashboard rows for each student
  const rows: StudentRow[] = students.map(
    (student: {
      user_id: string;
      full_name: string | null;
      created_at: string | null;
    }) => {
      // Sessions that belong to the current student
      const studentSessions = sessionsData.filter(
        (session) => session.participant_id === student.user_id
      );

      // Dates used for streak calculation
      const sessionDates = studentSessions
        .map((session) => session.ended_at || session.created_at)
        .filter(Boolean) as string[];

      const lastSessionAt = studentSessions[0]?.ended_at || null;
      const streakDays = calculateStreak(sessionDates);
      const derivedStatus = deriveStatus(lastSessionAt, student.created_at);

      // Calculate total sessions
      const totalSessions = studentSessions.length;

      // Calculate average score across all scored sessions
      let totalScore = 0;
      let scoredSessionsCount = 0;

      for (const session of studentSessions) {
        // Handle both single object or array of objects returned by Supabase
        const fArray = Array.isArray(session.feedback) ? session.feedback : (session.feedback ? [session.feedback] : []);
        if (fArray.length > 0 && fArray[0].feedback_json && fArray[0].feedback_json.scores) {
          const s = fArray[0].feedback_json.scores;
          // Clarity, confidence, relevance are usually out of 10
          if (typeof s.clarity === "number" && typeof s.confidence === "number" && typeof s.relevance === "number") {
            // compute average of the 3 components, out of 10.
            const sessionAvg = (s.clarity + s.confidence + s.relevance) / 3;
            // scale to out of 100
            totalScore += sessionAvg * 10;
            scoredSessionsCount++;
          }
        }
      }

      const avgScore = scoredSessionsCount > 0 ? Math.round(totalScore / scoredSessionsCount) : 0;

      return {
        user_id: student.user_id,
        full_name: student.full_name?.trim() || "Unnamed Student",
        created_at: student.created_at,
        last_session_at: lastSessionAt,
        streak_days: streakDays,
        derived_status: derivedStatus,
        total_sessions: totalSessions,
        avg_score: avgScore,
      };
    }
  );

  return {
    rows,
    stats: {
      totalStudents: rows.length,
      activeStudents: rows.filter((row) => row.derived_status === "Active").length,
      needsAttention: rows.filter(
        (row) => row.derived_status === "Needs Attention"
      ).length,
      inactiveStudents: rows.filter(
        (row) => row.derived_status === "Inactive"
      ).length,
    },
  };
}