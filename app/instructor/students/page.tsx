export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Users,
  UserPlus,
  CalendarDays,
  Flame,
  Activity,
  ArrowRight,
} from "lucide-react";
import InstructorSidebar from "@/components/InstructorSidebar";
import { createSupabaseServer } from "@/lib/supabaseServer";

type StudentRow = {
  user_id: string;
  full_name: string;
  created_at: string | null;
  last_session_at: string | null;
  streak_days: number;
  derived_status: "Active" | "Needs Attention" | "Inactive" | "New";
};

function formatDate(dateString: string | null) {
  if (!dateString) return "—";

  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getInitials(name: string) {
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function getStatusClasses(status: StudentRow["derived_status"]) {
  if (status === "Active") {
    return "bg-emerald-100 text-emerald-700 border-emerald-200";
  }
  if (status === "Needs Attention") {
    return "bg-amber-100 text-amber-700 border-amber-200";
  }
  if (status === "Inactive") {
    return "bg-gray-100 text-gray-700 border-gray-200";
  }
  return "bg-blue-100 text-blue-700 border-blue-200";
}

function startOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function differenceInDays(a: Date, b: Date) {
  const ms = startOfDay(a).getTime() - startOfDay(b).getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

function calculateStreak(sessionDates: string[]) {
  if (sessionDates.length === 0) return 0;

  const uniqueDays = Array.from(
    new Set(
      sessionDates.map((d) => {
        const date = new Date(d);
        return startOfDay(date).toISOString();
      })
    )
  )
    .map((d) => new Date(d))
    .sort((a, b) => b.getTime() - a.getTime());

  if (uniqueDays.length === 0) return 0;

  let streak = 1;

  for (let i = 0; i < uniqueDays.length - 1; i++) {
    const current = uniqueDays[i];
    const next = uniqueDays[i + 1];
    const diff = differenceInDays(current, next);

    if (diff === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

function deriveStatus(lastSessionAt: string | null, createdAt: string | null) {
  const now = new Date();

  if (!lastSessionAt) {
    if (!createdAt) return "New";
    const createdDiff = differenceInDays(now, new Date(createdAt));
    return createdDiff <= 7 ? "New" : "Inactive";
  }

  const daysSinceLast = differenceInDays(now, new Date(lastSessionAt));

  if (daysSinceLast <= 7) return "Active";
  if (daysSinceLast <= 14) return "Needs Attention";
  return "Inactive";
}

export default async function InstructorStudentsPage() {
  const supabase = await createSupabaseServer();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData.user) redirect("/login");

  const instructorId = authData.user.id;

  const { data: instructorProfile, error: instructorProfileError } =
    await supabase
      .from("profiles")
      .select("full_name, role")
      .eq("user_id", instructorId)
      .maybeSingle();

  if (instructorProfileError || !instructorProfile) {
    console.error("Instructor profile error:", instructorProfileError);
    redirect("/login");
  }

  if (instructorProfile.role !== "instructor") {
    redirect("/login");
  }

  const instructorName =
    instructorProfile.full_name?.trim() ||
    authData.user.user_metadata?.full_name?.trim() ||
    "";

  // ONLY students assigned to logged-in instructor
  const { data: studentsData, error: studentsError } = await supabase
    .from("profiles")
    .select("user_id, full_name, created_at, instructor_id, role")
    .eq("role", "participant")
    .eq("instructor_id", instructorId)
    .order("created_at", { ascending: false });

  if (studentsError) {
    console.error("Students fetch error:", studentsError);
  }

  const students = studentsData ?? [];
  const studentIds = students.map((s) => s.user_id);

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
      console.error("Sessions fetch error:", error);
    } else {
      sessionsData = data ?? [];
    }
  }

  const rows: StudentRow[] = students.map((student) => {
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
  });

  const totalStudents = rows.length;
  const activeStudents = rows.filter((r) => r.derived_status === "Active").length;
  const needsAttention = rows.filter(
    (r) => r.derived_status === "Needs Attention"
  ).length;
  const inactiveStudents = rows.filter(
    (r) => r.derived_status === "Inactive"
  ).length;

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
            <StatCard icon={<Users size={20} />} label="Total Students" value={String(totalStudents)} />
            <StatCard icon={<Activity size={20} />} label="Active" value={String(activeStudents)} />
            <StatCard icon={<Flame size={20} />} label="Needs Attention" value={String(needsAttention)} />
            <StatCard icon={<CalendarDays size={20} />} label="Inactive" value={String(inactiveStudents)} />
          </section>

          <section className="bg-white rounded-[2rem] border-2 border-brand-muted shadow-sm overflow-hidden">
            <div className="p-5 md:p-6 border-b-2 border-brand-muted bg-brand-light/30">
              <h2 className="text-xl font-extrabold text-gray-900">Assigned Students</h2>
              <p className="text-sm text-gray-500 font-medium mt-1">
                Based only on profiles.instructor_id.
              </p>
            </div>

            {rows.length === 0 ? (
              <div className="p-10 text-center">
                <div className="mx-auto h-16 w-16 rounded-full border-2 border-brand-muted bg-brand-light flex items-center justify-center mb-4">
                  <Users className="text-brand-primary" size={26} />
                </div>

                <h3 className="text-lg font-bold text-gray-900">No assigned students yet</h3>
                <p className="text-gray-500 font-medium mt-2">
                  This means no participant profile currently has your user id in instructor_id.
                </p>
              </div>
            ) : (
              <>
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#EDF5F3] border-b border-brand-muted">
                      <tr className="text-left">
                        <th className="px-6 py-5 text-sm font-bold text-gray-700">Student</th>
                        <th className="px-6 py-5 text-sm font-bold text-gray-700">Last Session</th>
                        <th className="px-6 py-5 text-sm font-bold text-gray-700">Current Streak</th>
                        <th className="px-6 py-5 text-sm font-bold text-gray-700">Status</th>
                        <th className="px-6 py-5 text-sm font-bold text-gray-700 text-right">Action</th>
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
                              ? `${student.streak_days} day${student.streak_days > 1 ? "s" : ""}`
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
                              ? `${student.streak_days} day${student.streak_days > 1 ? "s" : ""}`
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