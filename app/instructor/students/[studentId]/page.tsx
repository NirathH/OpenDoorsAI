export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  FileText,
  UserCircle2,
} from "lucide-react";
import InstructorSidebar from "@/components/InstructorSidebar";
import { createSupabaseServer } from "@/lib/supabaseServer";

type PageProps = {
  params: Promise<{
    studentId: string;
  }>;
};

function formatDate(dateString: string | null) {
  if (!dateString) return "—";

  return new Date(dateString).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatShortDate(dateString: string | null) {
  if (!dateString) return "—";

  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDuration(seconds: number | null) {
  if (seconds == null) return "—";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

function getInitials(name: string) {
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export default async function StudentDetailsPage({ params }: PageProps) {
  const { studentId } = await params;

  const supabase = await createSupabaseServer();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData.user) redirect("/login");

  const instructorId = authData.user.id;

  const { data: instructorProfile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("user_id", instructorId)
    .maybeSingle();

  if (!instructorProfile || instructorProfile.role !== "instructor") {
    redirect("/login");
  }

  const instructorName =
    instructorProfile.full_name?.trim() ||
    authData.user.user_metadata?.full_name?.trim() ||
    "";

  const { data: studentProfile } = await supabase
    .from("profiles")
    .select("user_id, full_name, role, instructor_id, created_at")
    .eq("user_id", studentId)
    .eq("role", "participant")
    .eq("instructor_id", instructorId)
    .maybeSingle();

  if (!studentProfile) {
    notFound();
  }

  const { data: sessions } = await supabase
    .from("sessions")
    .select(
      "id, title, status, started_at, ended_at, duration_seconds, created_at, compact_transcript, assignment_id"
    )
    .eq("participant_id", studentId)
    .order("created_at", { ascending: false });

  const safeName = studentProfile.full_name?.trim() || "Unnamed Student";
  const totalSessions = sessions?.length ?? 0;
  const completedSessions =
    sessions?.filter((session) => session.status === "completed").length ?? 0;
  const latestSession = sessions?.[0] ?? null;

  return (
    <div className="min-h-screen bg-brand-light font-sans flex">
      <InstructorSidebar name={instructorName} />

      <main className="flex-1 min-w-0 p-6 md:p-8">
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
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-brand-light border-2 border-brand-muted flex items-center justify-center text-brand-primary font-bold text-xl">
                  {getInitials(safeName)}
                </div>

                <div>
                  <h1 className="text-3xl font-extrabold text-gray-900">
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
          </section>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <StatCard label="Total Sessions" value={String(totalSessions)} />
            <StatCard
              label="Completed Sessions"
              value={String(completedSessions)}
            />
            <StatCard
              label="Latest Activity"
              value={
                latestSession
                  ? formatShortDate(
                      latestSession.ended_at || latestSession.created_at
                    )
                  : "—"
              }
            />
          </section>

          <section className="bg-white rounded-[2rem] border-2 border-brand-muted shadow-sm overflow-hidden">
            <div className="p-5 md:p-6 border-b-2 border-brand-muted bg-brand-light/30">
              <h2 className="text-xl font-extrabold text-gray-900">
                Session History
              </h2>
              <p className="text-sm text-gray-500 font-medium mt-1">
                Review this student’s sessions, timing, and saved summaries.
              </p>
            </div>

            {!sessions || sessions.length === 0 ? (
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
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className="rounded-2xl border-2 border-brand-muted bg-brand-light/30 p-5"
                  >
                    <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">
                          {session.title || "Practice Session"}
                        </h3>
                        <div className="mt-3 flex flex-wrap gap-2">
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
                        href={`/participant/sessions/${session.id}`}
                        className="inline-flex items-center gap-2 rounded-xl border-2 border-brand-muted bg-white px-4 py-2 text-sm font-semibold text-gray-800 hover:border-brand-primary transition-colors"
                      >
                        View Session
                      </Link>
                    </div>

                    {session.compact_transcript && (
                      <div className="mt-4 rounded-xl bg-white border border-brand-muted p-4">
                        <div className="text-xs font-semibold text-gray-500 mb-2">
                          Saved Summary
                        </div>
                        <p className="text-sm text-gray-700 whitespace-pre-line leading-6">
                          {session.compact_transcript}
                        </p>
                      </div>
                    )}
                  </div>
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