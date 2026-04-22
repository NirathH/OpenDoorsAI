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

  return (
    <div className="min-h-screen bg-brand-light font-sans flex">
      <InstructorSidebar name={instructorName} />

      <main className="flex-1 min-w-0 p-4 md:p-8">
        <div className="max-w-[1400px] mx-auto">
          <div className="mb-6">
            <Link
              href="/instructor/students"
              className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-brand-primary transition-colors"
            >
              <ArrowLeft size={16} />
              Back to Students
            </Link>
          </div>

          <section className="bg-white rounded-[2rem] border-2 border-brand-muted shadow-sm p-6 md:p-8 mb-8">
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
                  text={`${stats.totalSessions} total sessions`}
                />
                <InfoBadge
                  icon={<CalendarDays size={15} />}
                  text={`${stats.completedSessions} completed`}
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

          <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <StatCard label="Total Sessions" value={String(stats.totalSessions)} />
            <StatCard
              label="Completed Sessions"
              value={String(stats.completedSessions)}
            />
            <StatCard
              label="Latest Activity"
              value={
                stats.latestSession
                  ? formatShortDate(
                      stats.latestSession.ended_at ||
                        stats.latestSession.created_at
                    )
                  : "—"
              }
            />
          </section>

          <section className="bg-white rounded-[2rem] border-2 border-brand-muted shadow-sm overflow-hidden">
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
                          href={`/instructor/sessions/${session.id}?studentId=${studentId}`}
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
    <div className="rounded-[1.5rem] border-2 border-brand-muted bg-brand-light/30 p-4">
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