export const dynamic = "force-dynamic";

import Link from "next/link";
import {
  Users,
  ClipboardList,
  Clock3,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import InstructorSidebar from "@/components/InstructorSidebar";
import DashboardClient from "./DashboardClient";
import { requireInstructor } from "@/lib/server/auth/requireInstructor";
import { getInstructorStudents } from "@/lib/server/instructor/getInstructorStudents";
import { getInstructorAssignments } from "@/lib/server/instructor/getInstructorAssignments";
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

  const { rows: studentRows } = await getInstructorStudents(
    supabase,
    instructorId
  );

  const {
    stats: assignmentStats,
    recentAssigned,
    recentCompleted,
  } = await getInstructorAssignments(supabase, instructorId, "all");

  const students: StudentTableRow[] = studentRows.map((student) => ({
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

      <main className="flex-1 min-w-0 p-6 md:p-8 pt-24 md:pt-8">
        <div className="max-w-[1400px] mx-auto">
          <section className="mb-8">
            <h1 className="text-3xl font-extrabold text-gray-900">
              Dashboard
            </h1>
            <p className="text-gray-600 font-medium mt-2">
              Track students, assignments, and recent coaching activity.
            </p>
          </section>

          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-8">
            <SummaryCard
              icon={<Users size={18} />}
              label="Students"
              value={String(students.length)}
            />
            <SummaryCard
              icon={<ClipboardList size={18} />}
              label="Assigned"
              value={String(assignmentStats.assigned)}
            />
            <SummaryCard
              icon={<Clock3 size={18} />}
              label="In Progress"
              value={String(assignmentStats.inProgress)}
            />
            <SummaryCard
              icon={<CheckCircle2 size={18} />}
              label="Completed Recently"
              value={String(recentCompleted.length)}
            />
            <SummaryCard
              icon={<AlertTriangle size={18} />}
              label="Overdue"
              value={String(assignmentStats.overdue)}
            />
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">
            <div className="min-w-0">
              <DashboardClient initialStudents={students} />
            </div>

            <aside className="bg-white rounded-[2rem] border border-gray-200 shadow-sm overflow-hidden h-fit">
              <div className="px-6 py-5 border-b border-gray-100">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-extrabold text-gray-900">
                      Assignment Activity
                    </h2>
                    <p className="text-sm text-gray-500 font-medium mt-1">
                      Recent work that needs your attention.
                    </p>
                  </div>

                  <Link
                    href="/instructor/assignments"
                    className="inline-flex items-center gap-1 text-sm font-semibold text-brand-primary hover:underline"
                  >
                    View all
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>

              <div className="p-5 space-y-6">
                <div>
                  <div className="text-sm font-bold text-gray-900 mb-3">
                    Recently Assigned
                  </div>

                  {recentAssigned.length === 0 ? (
                    <EmptyCard text="No recent assignments." />
                  ) : (
                    <div className="space-y-3">
                      {recentAssigned.slice(0, 4).map((item) => (
                        <MiniAssignmentCard
                          key={item.id}
                          title={item.title}
                          subtitle={item.participant_name}
                          meta={`Assigned ${formatShortDate(item.created_at)}`}
                          href={`/instructor/assignments/${item.id}/edit`}
                          status={item.effective_status}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <div className="text-sm font-bold text-gray-900 mb-3">
                    Recently Completed
                  </div>

                  {recentCompleted.length === 0 ? (
                    <EmptyCard text="No recent completed assignments." />
                  ) : (
                    <div className="space-y-3">
                      {recentCompleted.slice(0, 4).map((item) => (
                        <MiniAssignmentCard
                          key={item.id}
                          title={item.title}
                          subtitle={item.participant_name}
                          meta={`Completed ${formatShortDate(
                            item.latest_activity_at || item.created_at
                          )}`}
                          href={`/instructor/assignments/${item.id}/edit`}
                          status={item.effective_status}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </aside>
          </section>
        </div>
      </main>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-white rounded-[1.5rem] border border-gray-200 p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center text-green-700">
          {icon}
        </div>

        <div>
          <div className="text-sm font-medium text-gray-500">{label}</div>
          <div className="text-2xl font-extrabold text-gray-900">{value}</div>
        </div>
      </div>
    </div>
  );
}

function MiniAssignmentCard({
  title,
  subtitle,
  meta,
  href,
  status,
}: {
  title: string;
  subtitle: string;
  meta: string;
  href: string;
  status: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-2xl border border-gray-200 bg-gray-50/70 hover:bg-gray-50 transition-colors p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-bold text-gray-900 truncate">{title}</div>
          <div className="text-xs text-gray-500 font-medium mt-1 truncate">
            {subtitle}
          </div>
          <div className="text-xs text-gray-600 mt-2">{meta}</div>
        </div>

        <StatusPill status={status} />
      </div>
    </Link>
  );
}

function StatusPill({ status }: { status: string }) {
  let classes =
    "bg-blue-100 text-blue-700 border-blue-200";

  if (status === "completed") {
    classes = "bg-emerald-100 text-emerald-700 border-emerald-200";
  } else if (status === "in_progress") {
    classes = "bg-amber-100 text-amber-700 border-amber-200";
  } else if (status === "overdue") {
    classes = "bg-red-100 text-red-700 border-red-200";
  }

  return (
    <span
      className={`shrink-0 inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold border ${classes}`}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}

function EmptyCard({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/60 p-4 text-sm text-gray-500 font-medium">
      {text}
    </div>
  );
}