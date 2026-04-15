export const dynamic = "force-dynamic";

import InstructorSidebar from "@/components/InstructorSidebar";
import DashboardClient from "./DashboardClient";
import { requireInstructor } from "@/lib/server/auth/requireInstructor";
import { getInstructorStudents } from "@/lib/server/instructor/getInstructorStudents";
import { formatShortDate } from "@/lib/utils/studentHelpers";

type StudentTableRow = {
  id: string;
  name: string;
  lastSession: string;
  streak: string;
  status: string;
  totalSessions: number;
  avgScore: number;
};

export default async function InstructorDashboardPage() {
  const { supabase, instructorId, instructorName } = await requireInstructor();

  const { rows } = await getInstructorStudents(supabase, instructorId);

  const students: StudentTableRow[] = rows.map((student) => ({
    id: student.user_id,
    name: student.full_name,
    lastSession: student.last_session_at
      ? formatShortDate(student.last_session_at)
      : "No session yet",
    streak:
      student.streak_days > 0
        ? `${student.streak_days} day${student.streak_days > 1 ? "s" : ""}`
        : "0 days",
    status: student.derived_status,
    totalSessions: student.total_sessions,
    avgScore: student.avg_score,
  }));

  return (
    <div className="min-h-screen bg-brand-light flex">
      <InstructorSidebar name={instructorName} />

      <main className="flex-1 p-6 md:p-8">
        <div className="max-w-[1400px] mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Students</h1>
            <p className="text-gray-600 font-medium mt-1">
              Manage and track your students&apos; progress
            </p>
          </div>

          <DashboardClient initialStudents={students} />
        </div>
      </main>
    </div>
  );
}