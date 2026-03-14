import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ClipboardList,
  CheckCircle2,
  Clock3,
  CalendarDays,
  Play,
  FileText,
} from "lucide-react";
import Navbar from "@/components/participantNavbar";
import { createSupabaseServer } from "@/lib/supabaseServer";
import { supabase } from "@/lib/supabaseClient";
const { data } = await supabase.auth.getUser();
const fullName = data.user?.user_metadata?.full_name || "User";

type Assignment = {
  id: string;
  title: string;
  goal: string | null;
  instructions: string | null;
  max_minutes: number | null;
  status: string;
  due_at: string | null;
  created_at: string;
};

type Session = {
  id: string;
  assignment_id: string | null;
  title: string | null;
  status: string;
  started_at: string | null;
  ended_at: string | null;
  duration_seconds: number | null;
  compact_transcript: string | null;
  created_at: string;
};

function formatDate(dateString: string | null) {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString();
}

function formatDuration(seconds: number | null) {
  if (seconds == null) return "—";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

export default async function ParticipantSessionsPage() {
  const supabase = await createSupabaseServer();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData.user) redirect("/login");
  if (authData.user.role === "instructor") redirect("/login");

  const userId = authData.user.id;

  // Assignments that still need attention
  const { data: assignedData, error: assignedError } = await supabase
    .from("session_assignments")
    .select("id, title, goal, instructions, max_minutes, status, due_at, created_at")
    .eq("participant_id", userId)
    .in("status", ["assigned", "in_progress"])
    .order("created_at", { ascending: false });

  // Completed actual sessions
  const { data: completedData, error: completedError } = await supabase
    .from("sessions")
    .select(
      "id, assignment_id, title, status, started_at, ended_at, duration_seconds, compact_transcript, created_at"
    )
    .eq("participant_id", userId)
    .eq("status", "completed")
    .order("created_at", { ascending: false });

  if (assignedError) {
    console.error("Assigned sessions error:", assignedError);
  }

  if (completedError) {
    console.error("Completed sessions error:", completedError);
  }

  const assignedSessions = (assignedData ?? []) as Assignment[];
  const completedSessions = (completedData ?? []) as Session[];

  return (
    <div className="min-h-screen bg-brand-light font-sans">
      <Navbar
        userName={fullName}
        userRole="Participant"
    />
      <main className="max-w-[1400px] mx-auto p-6 md:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">My Sessions</h1>
          <p className="mt-2 text-gray-600 font-medium">
            View your assigned practice sessions and your completed sessions.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Assigned / Not Completed */}
          <section className="bg-white rounded-[2rem] border-2 border-brand-muted shadow-sm p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-brand-light p-3 rounded-2xl border-2 border-brand-muted">
                <ClipboardList size={22} className="text-brand-primary" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-gray-900">
                  Assigned / Not Completed
                </h2>
                <p className="text-sm text-gray-500 font-medium">
                  Sessions assigned by your instructor that still need to be done
                </p>
              </div>
            </div>

            {assignedSessions.length === 0 ? (
              <EmptyState text="No assigned sessions waiting right now." />
            ) : (
              <div className="space-y-4">
                {assignedSessions.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="rounded-2xl border-2 border-brand-muted bg-brand-light/40 p-5"
                  >
                    <h3 className="text-lg font-bold text-gray-900">
                      {assignment.title}
                    </h3>

                    {assignment.goal && (
                      <p className="mt-3 text-sm text-gray-700">
                        <span className="font-semibold">Goal:</span> {assignment.goal}
                      </p>
                    )}

                    {assignment.instructions && (
                      <p className="mt-2 text-sm text-gray-700 font-medium">
                        {assignment.instructions}
                      </p>
                    )}

                    <div className="mt-4 flex flex-wrap gap-2">
                      <InfoPill
                        icon={<Clock3 size={14} />}
                        text={`${assignment.max_minutes ?? 5} min max`}
                      />
                      <InfoPill
                        icon={<CalendarDays size={14} />}
                        text={
                          assignment.due_at
                            ? `Due ${formatDate(assignment.due_at)}`
                            : "No due date"
                        }
                      />
                      <StatusPill status={assignment.status} />
                    </div>

                    <div className="mt-5">
                      <Link
                        href={`/participant/sessions/new?participantId=${userId}&assignmentId=${assignment.id}`}
                        className="inline-flex items-center gap-2 bg-brand-secondary hover:bg-brand-primary text-white font-semibold px-5 py-3 rounded-xl transition-colors shadow-md"
                      >
                        <Play size={16} />
                        Start Session
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Completed */}
          <section className="bg-white rounded-[2rem] border-2 border-brand-muted shadow-sm p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-brand-light p-3 rounded-2xl border-2 border-brand-muted">
                <CheckCircle2 size={22} className="text-brand-primary" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-gray-900">
                  Completed Sessions
                </h2>
                <p className="text-sm text-gray-500 font-medium">
                  Practice sessions you already finished
                </p>
              </div>
            </div>

            {completedSessions.length === 0 ? (
              <EmptyState text="No completed sessions yet." />
            ) : (
              <div className="space-y-4">
                {completedSessions.map((session) => (
                  <div
                    key={session.id}
                    className="rounded-2xl border-2 border-brand-muted bg-brand-light/40 p-5"
                  >
                    <h3 className="text-lg font-bold text-gray-900">
                      {session.title || "Practice Session"}
                    </h3>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <InfoPill
                        icon={<CalendarDays size={14} />}
                        text={`Completed ${formatDate(session.ended_at || session.created_at)}`}
                      />
                      <InfoPill
                        icon={<Clock3 size={14} />}
                        text={formatDuration(session.duration_seconds)}
                      />
                      <StatusPill status={session.status} />
                    </div>

                    {session.compact_transcript && (
                      <div className="mt-4 rounded-xl bg-white border border-brand-muted p-3">
                        <div className="text-xs font-semibold text-gray-500 mb-1">
                          Saved Summary
                        </div>
                        <p className="text-sm text-gray-700 font-medium line-clamp-4 whitespace-pre-line">
                          {session.compact_transcript}
                        </p>
                      </div>
                    )}

                    <div className="mt-5">
                      <Link
                        href={`/participant/sessions/${session.id}`}
                        className="inline-flex items-center gap-2 bg-white border-2 border-brand-muted hover:border-brand-primary text-gray-900 font-semibold px-5 py-3 rounded-xl transition-colors"
                      >
                        <FileText size={16} />
                        View Details
                      </Link>
                    </div>
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

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-brand-muted bg-brand-light/30 p-8 text-center">
      <p className="text-gray-500 font-medium">{text}</p>
    </div>
  );
}

function InfoPill({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border-2 border-brand-muted bg-white text-gray-700">
      {icon}
      {text}
    </span>
  );
}

function StatusPill({ status }: { status: string }) {
  const styles =
    status === "completed"
      ? "bg-green-50 text-green-700 border-green-200"
      : status === "in_progress"
      ? "bg-yellow-50 text-yellow-700 border-yellow-200"
      : "bg-white text-gray-700 border-brand-muted";

  return (
    <span
      className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border ${styles}`}
    >
      {status.replace("_", " ")}
    </span>
  );
}