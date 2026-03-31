export const dynamic = "force-dynamic";

import Link from "next/link";
import {
  Users,
  UserPlus,
  CalendarDays,
  Flame,
  Activity,
  ArrowRight,
} from "lucide-react";
import InstructorSidebar from "@/components/InstructorSidebar";
import { requireInstructor } from "@/lib/server/auth/requireInstructor";
import { getInstructorStudents } from "@/lib/server/instructor/getInstructorStudents";
import {
  formatDate,
  getInitials,
  getStatusClasses,
} from "@/lib/utils/studentHelpers";

export default async function InstructorStudentsPage() {
  const { supabase, instructorId, instructorName } = await requireInstructor();
  const { rows, stats } = await getInstructorStudents(supabase, instructorId);

  return (
    <div className="min-h-screen bg-brand-light font-sans flex">
      <InstructorSidebar name={instructorName} />

      <main className="flex-1 min-w-0 p-6 md:p-8">
        <div className="max-w-[1400px] mx-auto">
          <section className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 mb-8">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900">Students</h1>
              <p className="mt-2 text-gray-600 font-medium">
                Students assigned to your account.
              </p>
            </div>

            <Link
              href="/instructor/students/new"
              className="inline-flex items-center gap-2 rounded-2xl bg-brand-secondary hover:bg-brand-primary text-white font-semibold px-5 py-3 shadow-md transition-colors"
            >
              <UserPlus size={18} />
              Create Student Account
            </Link>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
            <StatCard
              icon={<Users size={20} />}
              label="Total Students"
              value={String(stats.totalStudents)}
            />
            <StatCard
              icon={<Activity size={20} />}
              label="Active"
              value={String(stats.activeStudents)}
            />
            <StatCard
              icon={<Flame size={20} />}
              label="Needs Attention"
              value={String(stats.needsAttention)}
            />
            <StatCard
              icon={<CalendarDays size={20} />}
              label="Inactive"
              value={String(stats.inactiveStudents)}
            />
          </section>

          <section className="bg-white rounded-[2rem] border-2 border-brand-muted shadow-sm overflow-hidden">
            <div className="p-5 md:p-6 border-b-2 border-brand-muted bg-brand-light/30">
              <h2 className="text-xl font-extrabold text-gray-900">
                Assigned Students
              </h2>
              <p className="text-sm text-gray-500 font-medium mt-1">
                Students linked to your instructor account.
              </p>
            </div>

            {rows.length === 0 ? (
              <div className="p-10 text-center">
                <div className="mx-auto h-16 w-16 rounded-full border-2 border-brand-muted bg-brand-light flex items-center justify-center mb-4">
                  <Users className="text-brand-primary" size={26} />
                </div>

                <h3 className="text-lg font-bold text-gray-900">
                  No assigned students yet
                </h3>
                <p className="text-gray-500 font-medium mt-2">
                  Create a student account to get started.
                </p>
              </div>
            ) : (
              <>
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#EDF5F3] border-b border-brand-muted">
                      <tr className="text-left">
                        <th className="px-6 py-5 text-sm font-bold text-gray-700">
                          Student
                        </th>
                        <th className="px-6 py-5 text-sm font-bold text-gray-700">
                          Last Session
                        </th>
                        <th className="px-6 py-5 text-sm font-bold text-gray-700">
                          Current Streak
                        </th>
                        <th className="px-6 py-5 text-sm font-bold text-gray-700">
                          Status
                        </th>
                        <th className="px-6 py-5 text-sm font-bold text-gray-700 text-right">
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {rows.map((student) => (
                        <tr
                          key={student.user_id}
                          className="border-b border-gray-100 hover:bg-brand-light/20 transition-colors"
                        >
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-4">
                              <div className="h-12 w-12 rounded-full bg-brand-light border-2 border-brand-muted flex items-center justify-center text-brand-primary font-bold">
                                {getInitials(student.full_name)}
                              </div>

                              <div>
                                <div className="text-[18px] font-bold text-gray-900">
                                  {student.full_name}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-5 text-[18px] font-semibold text-gray-800">
                            {formatDate(student.last_session_at)}
                          </td>

                          <td className="px-6 py-5 text-[18px] font-semibold text-gray-800">
                            {student.streak_days > 0
                              ? `${student.streak_days} day${
                                  student.streak_days > 1 ? "s" : ""
                                }`
                              : "—"}
                          </td>

                          <td className="px-6 py-5">
                            <span
                              className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-bold border ${getStatusClasses(
                                student.derived_status
                              )}`}
                            >
                              {student.derived_status}
                            </span>
                          </td>

                          <td className="px-6 py-5 text-right">
                            <Link
                              href={`/instructor/students/${student.user_id}`}
                              className="inline-flex items-center gap-2 rounded-xl border-2 border-brand-muted bg-white px-4 py-2 text-sm font-semibold text-gray-800 hover:border-brand-primary transition-colors"
                            >
                              View
                              <ArrowRight size={16} />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="lg:hidden p-4 space-y-4">
                  {rows.map((student) => (
                    <div
                      key={student.user_id}
                      className="rounded-2xl border-2 border-brand-muted bg-brand-light/30 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-full bg-white border-2 border-brand-muted flex items-center justify-center text-brand-primary font-bold">
                            {getInitials(student.full_name)}
                          </div>

                          <div>
                            <div className="text-base font-bold text-gray-900">
                              {student.full_name}
                            </div>
                          </div>
                        </div>

                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-bold border ${getStatusClasses(
                            student.derived_status
                          )}`}
                        >
                          {student.derived_status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mt-4">
                        <MiniInfo
                          label="Last Session"
                          value={formatDate(student.last_session_at)}
                        />
                        <MiniInfo
                          label="Current Streak"
                          value={
                            student.streak_days > 0
                              ? `${student.streak_days} day${
                                  student.streak_days > 1 ? "s" : ""
                                }`
                              : "—"
                          }
                        />
                      </div>

                      <div className="mt-4">
                        <Link
                          href={`/instructor/students/${student.user_id}`}
                          className="inline-flex items-center gap-2 rounded-xl border-2 border-brand-muted bg-white px-4 py-2 text-sm font-semibold text-gray-800 hover:border-brand-primary transition-colors"
                        >
                          View Student
                          <ArrowRight size={16} />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.75rem] border-2 border-brand-muted bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-2xl bg-brand-light border-2 border-brand-muted flex items-center justify-center text-brand-primary">
          {icon}
        </div>

        <div>
          <p className="text-sm font-semibold text-gray-500">{label}</p>
          <p className="text-2xl font-extrabold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

function MiniInfo({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-brand-muted bg-white p-3">
      <div className="text-xs font-semibold text-gray-500">{label}</div>
      <div className="text-sm font-bold text-gray-900 mt-1">{value}</div>
    </div>
  );
}