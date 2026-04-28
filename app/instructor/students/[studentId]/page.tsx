export const dynamic = "force-dynamic";

import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  FileText,
  UserCircle2,
  Briefcase,
  StickyNote,
  ChevronDown,
  CheckCircle2,
  Clock3,
  TrendingUp,
  TimerReset,
  Activity,
  Target,
} from "lucide-react";
import InstructorSidebar from "@/components/InstructorSidebar";
import { requireInstructor } from "@/lib/server/auth/requireInstructor";
import {
  getInstructorStudentDetails,
  type SessionRow,
} from "@/lib/server/instructor/getInstructorStudentDetails";
import {
  formatDate,
  formatDuration,
  formatShortDate,
  getInitials,
} from "@/lib/utils/studentHelpers";

type PageProps = {
  params: Promise<{
    studentId: string;
  }>;
  searchParams?: Promise<{
    showAll?: string;
  }>;
};

export default async function StudentDetailsPage({
  params,
  searchParams,
}: PageProps) {
  const { studentId } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const showAll = resolvedSearchParams?.showAll === "true";

  const { supabase, instructorId, instructorName } = await requireInstructor();
  const { studentProfile, safeName, sessions, stats } =
    await getInstructorStudentDetails(supabase, instructorId, studentId);

  const visibleSessions = showAll ? sessions : sessions.slice(0, 5);

  const completedSessions = stats.completedSessions ?? 0;
  const totalSessions = stats.totalSessions ?? 0;
  const pendingSessions = Math.max(totalSessions - completedSessions, 0);

  const completionRate =
    totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;

  const durationValues = sessions
    .map((session) => session.duration_seconds ?? 0)
    .filter((value) => value > 0);

  const averageDurationSeconds =
    durationValues.length > 0
      ? Math.round(
          durationValues.reduce((sum, value) => sum + value, 0) /
            durationValues.length
        )
      : 0;

  const latestActivity = stats.latestSession
    ? formatShortDate(
        stats.latestSession.ended_at || stats.latestSession.created_at
      )
    : "—";

  const recentCompletedCount = sessions.filter(
    (session) => session.status === "completed" || session.ended_at
  ).length;

  return (
    <div className="min-h-screen bg-brand-light font-sans flex">
      <InstructorSidebar name={instructorName} />

      <main className="flex-1 min-w-0 p-4 md:p-8">
        <div className="max-w-350 mx-auto">
          <div className="mb-6">
            <Link
              href="/instructor/students"
              className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-brand-primary transition-colors"
            >
              <ArrowLeft size={16} />
              Back to Students
            </Link>
          </div>

          <section className="bg-white rounded-4xl border-2 border-brand-muted shadow-sm p-6 md:p-8 mb-8">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="flex items-center gap-4 min-w-0">
                <div className="h-16 w-16 shrink-0 rounded-full bg-brand-light border-2 border-brand-muted flex items-center justify-center text-brand-primary font-bold text-xl">
                  {getInitials(safeName)}
                </div>

                <div className="min-w-0">
                  <h1 className="text-3xl font-extrabold text-gray-900 truncate">
                    {safeName}
                  </h1>
                  <p className="mt-1 text-gray-600 font-medium">
                    Student progress and session history
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <InfoBadge
                  icon={<UserCircle2 size={15} />}
                  text={`Joined ${formatShortDate(studentProfile.created_at)}`}
                />
                <InfoBadge
                  icon={<FileText size={15} />}
                  text={`${totalSessions} total sessions`}
                />
                <InfoBadge
                  icon={<CalendarDays size={15} />}
                  text={`${completedSessions} completed`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <DetailCard
                icon={<Briefcase size={18} />}
                label="Job Goal"
                value={studentProfile.job_goal || "Not added yet"}
              />
              <DetailCard
                icon={<StickyNote size={18} />}
                label="Coach Notes"
                value={studentProfile.coach_notes || "Not added yet"}
              />
            </div>
          </section>

          <section className="bg-white rounded-4xl border-2 border-brand-muted shadow-sm p-6 md:p-8 mb-8">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5 mb-6">
              <div>
                <h2 className="text-2xl font-extrabold text-gray-900">
                  Participant Dashboard
                </h2>
                <p className="mt-1 text-gray-600 font-medium">
                  A quick performance overview for this participant.
                </p>
              </div>

              <div className="inline-flex items-center gap-2 rounded-full border-2 border-brand-muted bg-brand-light/30 px-4 py-2 text-sm font-semibold text-gray-700 w-fit">
                <Activity size={15} />
                Latest activity: {latestActivity}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
              <DashboardCard
                icon={<CheckCircle2 size={20} />}
                label="Completed Sessions"
                value={String(completedSessions)}
                subtext="Finished by participant"
              />
              <DashboardCard
                icon={<Clock3 size={20} />}
                label="Pending Sessions"
                value={String(pendingSessions)}
                subtext="Not finished yet"
              />
              <DashboardCard
                icon={<TrendingUp size={20} />}
                label="Completion Rate"
                value={`${completionRate}%`}
                subtext="Based on session history"
              />
              <DashboardCard
                icon={<TimerReset size={20} />}
                label="Avg Session Time"
                value={formatDuration(averageDurationSeconds)}
                subtext="Average session duration"
              />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              <div className="xl:col-span-2 rounded-3xl border-2 border-brand-muted bg-brand-light/20 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Target size={18} className="text-brand-primary" />
                  <h3 className="text-lg font-bold text-gray-900">
                    Progress Snapshot
                  </h3>
                </div>

                <p className="text-sm text-gray-600 font-medium leading-6">
                  <span className="font-bold text-gray-900">{safeName}</span> has
                  completed{" "}
                  <span className="font-bold text-gray-900">
                    {completedSessions}
                  </span>{" "}
                  out of{" "}
                  <span className="font-bold text-gray-900">{totalSessions}</span>{" "}
                  session{totalSessions === 1 ? "" : "s"}, with an overall
                  completion rate of{" "}
                  <span className="font-bold text-gray-900">
                    {completionRate}%
                  </span>
                  . Their latest activity was on{" "}
                  <span className="font-bold text-gray-900">{latestActivity}</span>.
                </p>

                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm font-semibold text-gray-600 mb-2">
                    <span>Progress</span>
                    <span>{completionRate}%</span>
                  </div>

                  <div className="h-3 w-full rounded-full bg-white border border-brand-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-brand-primary transition-all"
                      style={{ width: `${completionRate}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border-2 border-brand-muted bg-white p-5">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Quick Insight
                </h3>

                <div className="space-y-3">
                  <InsightRow
                    label="Student Name"
                    value={safeName}
                  />
                  <InsightRow
                    label="Completed Recently"
                    value={`${recentCompletedCount}`}
                  />
                  <InsightRow
                    label="Latest Activity"
                    value={latestActivity}
                  />
                  <InsightRow
                    label="Average Duration"
                    value={formatDuration(averageDurationSeconds)}
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <StatCard label="Total Sessions" value={String(totalSessions)} />
            <StatCard
              label="Completed Sessions"
              value={String(completedSessions)}
            />
            <StatCard label="Latest Activity" value={latestActivity} />
          </section>

          <section className="bg-white rounded-4xl border-2 border-brand-muted shadow-sm overflow-hidden">
            <div className="p-5 md:p-6 border-b-2 border-brand-muted bg-brand-light/30">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <h2 className="text-xl font-extrabold text-gray-900">
                    Session History
                  </h2>
                  <p className="text-sm text-gray-500 font-medium mt-1">
                    Showing {visibleSessions.length} of {sessions.length} session
                    {sessions.length === 1 ? "" : "s"}.
                  </p>
                </div>

                {sessions.length > 5 && (
                  <Link
                    href={
                      showAll
                        ? `/instructor/students/${studentId}`
                        : `/instructor/students/${studentId}?showAll=true`
                    }
                    className={`inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                      showAll
                        ? "border-2 border-brand-muted bg-white text-gray-700 hover:border-brand-primary hover:text-brand-primary"
                        : "bg-brand-primary text-white hover:opacity-90"
                    }`}
                  >
                    {showAll ? "Show Less" : "View All Sessions"}
                  </Link>
                )}
              </div>
            </div>

            {sessions.length === 0 ? (
              <div className="p-10 text-center">
                <div className="mx-auto h-16 w-16 rounded-full border-2 border-brand-muted bg-brand-light flex items-center justify-center mb-4">
                  <FileText className="text-brand-primary" size={26} />
                </div>

                <h3 className="text-lg font-bold text-gray-900">
                  No sessions yet
                </h3>
                <p className="text-gray-500 font-medium mt-2">
                  This student has not completed any practice sessions yet.
                </p>
              </div>
            ) : (
              <div className="p-4 md:p-6 space-y-4">
                {visibleSessions.map((session: SessionRow) => (
                  <details
                    key={session.id}
                    className="group rounded-2xl border-2 border-brand-muted bg-brand-light/20 overflow-hidden"
                  >
                    <summary className="list-none cursor-pointer p-5">
                      <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start gap-3">
                            <div className="mt-1 text-gray-500 transition-transform group-open:rotate-180">
                              <ChevronDown size={18} />
                            </div>

                            <div className="min-w-0">
                              <h3 className="text-lg font-bold text-gray-900 truncate">
                                {session.title || "Practice Session"}
                              </h3>

                              <div className="mt-3 flex flex-wrap gap-2">
                                <Pill text={`Status: ${session.status}`} />
                                <Pill
                                  text={`Started: ${formatShortDate(
                                    session.started_at || session.created_at
                                  )}`}
                                />
                                <Pill
                                  text={`Duration: ${formatDuration(
                                    session.duration_seconds
                                  )}`}
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 pl-8 xl:pl-0">
                          <span className="text-sm font-semibold text-gray-500">
                            {session.ended_at
                              ? `Ended ${formatShortDate(session.ended_at)}`
                              : "Not finished"}
                          </span>
                          <span className="inline-flex items-center rounded-xl border-2 border-brand-muted bg-white px-3 py-2 text-sm font-semibold text-gray-700">
                            Details
                          </span>
                        </div>
                      </div>
                    </summary>

                    <div className="border-t-2 border-brand-muted bg-white p-5">
                      <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
                        <div>
                          <div className="flex flex-wrap gap-2">
                            <Pill text={`Status: ${session.status}`} />
                            <Pill
                              text={`Started: ${formatDate(
                                session.started_at || session.created_at
                              )}`}
                            />
                            <Pill text={`Ended: ${formatDate(session.ended_at)}`} />
                            <Pill
                              text={`Duration: ${formatDuration(
                                session.duration_seconds
                              )}`}
                            />
                          </div>
                        </div>

                        <Link
                          href={`/instructor/students/${studentId}/sessions/${session.id}`}
                          className="inline-flex items-center gap-2 rounded-xl border-2 border-brand-muted bg-brand-light px-4 py-2 text-sm font-semibold text-gray-800 hover:border-brand-primary hover:bg-white transition-colors"
                        >
                          View Session
                        </Link>
                      </div>

                      {session.compact_transcript ? (
                        <div className="mt-4 rounded-xl bg-brand-light/20 border border-brand-muted p-4">
                          <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                            Saved Summary
                          </div>
                          <p className="text-sm text-gray-700 whitespace-pre-line leading-6">
                            {session.compact_transcript}
                          </p>
                        </div>
                      ) : (
                        <div className="mt-4 rounded-xl border border-dashed border-brand-muted p-4 text-sm text-gray-500">
                          No saved summary for this session yet.
                        </div>
                      )}
                    </div>
                  </details>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.75rem] border-2 border-brand-muted bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-gray-500">{label}</p>
      <p className="text-2xl font-extrabold text-gray-900 mt-1">{value}</p>
    </div>
  );
}

function DashboardCard({
  icon,
  label,
  value,
  subtext,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtext: string;
}) {
  return (
    <div className="rounded-3xl border-2 border-brand-muted bg-brand-light/20 p-5">
      <div className="flex items-center gap-2 text-brand-primary mb-3">
        {icon}
      </div>
      <p className="text-sm font-semibold text-gray-500">{label}</p>
      <p className="text-2xl font-extrabold text-gray-900 mt-1">{value}</p>
      <p className="text-xs text-gray-500 font-medium mt-1">{subtext}</p>
    </div>
  );
}

function InsightRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-brand-muted bg-brand-light/20 px-3 py-2">
      <div className="text-xs font-semibold text-gray-500">{label}</div>
      <div className="text-sm font-bold text-gray-900 mt-1">{value}</div>
    </div>
  );
}

function Pill({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold border-2 border-brand-muted bg-white text-gray-700">
      {text}
    </span>
  );
}

function InfoBadge({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold border-2 border-brand-muted bg-white text-gray-700">
      {icon}
      {text}
    </span>
  );
}

function DetailCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-3xl border-2 border-brand-muted bg-brand-light/30 p-4">
      <div className="flex items-center gap-2 text-gray-700 font-semibold text-sm mb-2">
        {icon}
        {label}
      </div>
      <p className="text-sm text-gray-800 leading-6 whitespace-pre-line">
        {value}
      </p>
    </div>
  );
}