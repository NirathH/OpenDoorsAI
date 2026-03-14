import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ChevronLeft,
  CalendarDays,
  Clock3,
  CheckCircle2,
  FileText,
  MessageSquareText,
  User,
} from "lucide-react";
import Navbar from "@/components/participantNavbar";
import { createSupabaseServer } from "@/lib/supabaseServer";
const supabase = await createSupabaseServer();
const { data } = await supabase.auth.getUser();

type PageProps = {
  params: Promise<{
    sessionId: string;
  }>;
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

function prettyJson(value: unknown) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return "No feedback available.";
  }
}

export default async function ParticipantSessionDetailsPage({
  params,
}: PageProps) {
  const { sessionId } = await params;

  const supabase = await createSupabaseServer();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData.user) redirect("/login");
  if (authData.user.role === "instructor") redirect("/login");

  const userId = authData.user.id;

  // Load session
  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .select(
      `
        id,
        participant_id,
        assignment_id,
        title,
        status,
        ended_at,
        created_at,
        duration_seconds
      `
    )
    .eq("id", sessionId)
    .eq("participant_id", userId)
    .single();

  if (sessionError || !session) {
    notFound();
  }

  // Load transcript
  const { data: transcript } = await supabase
    .from("transcripts")
    .select("transcript_text")
    .eq("session_id", sessionId)
    .maybeSingle();

  // Load feedback
  const { data: feedback } = await supabase
    .from("feedback")
    .select("feedback_json")
    .eq("session_id", sessionId)
    .maybeSingle();

  // Try to get instructor name from linked assignment
  let instructorName = "Instructor not available";

  if (session.assignment_id) {
    const { data: assignment } = await supabase
      .from("session_assignments")
      .select("instructor_id")
      .eq("id", session.assignment_id)
      .maybeSingle();

    if (assignment?.instructor_id) {
      const { data: instructorProfile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", assignment.instructor_id)
        .maybeSingle();

      if (instructorProfile?.full_name) {
        instructorName = instructorProfile.full_name;
      }
    }
  }
  const fullName = data.user?.user_metadata?.full_name || "User";
  
  return (
    <div className="min-h-screen bg-brand-light font-sans">
      <Navbar
        userName={fullName}
        userRole="Participant"
      />

      <main className="max-w-[1000px] mx-auto p-6 md:p-8">
        <div className="mb-8 flex flex-col gap-4">
          <Link
            href="/participant/sessions"
            className="inline-flex w-fit items-center gap-2 px-4 py-2 rounded-xl border-2 border-brand-muted bg-white hover:border-brand-primary transition-colors text-gray-900 font-semibold"
          >
            <ChevronLeft size={18} className="text-brand-primary" />
            Back
          </Link>

          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">
              {session.title || "Session Details"}
            </h1>
            <p className="mt-2 text-gray-600 font-medium">
              Review your session clearly and simply.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8">
          {/* Session Info */}
          <section className="bg-white rounded-[2rem] border-2 border-brand-muted shadow-sm p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-brand-light p-3 rounded-2xl border-2 border-brand-muted">
                <CheckCircle2 size={22} className="text-brand-primary" />
              </div>
              <h2 className="text-xl font-extrabold text-gray-900">
                Session Info
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoCard
                icon={<CalendarDays size={18} />}
                label="Date"
                value={formatDate(session.ended_at || session.created_at)}
              />
              <InfoCard
                icon={<Clock3 size={18} />}
                label="Duration"
                value={formatDuration(session.duration_seconds)}
              />
              <InfoCard
                icon={<CheckCircle2 size={18} />}
                label="Status"
                value={session.status}
              />
              <InfoCard
                icon={<User size={18} />}
                label="Instructor"
                value={instructorName}
              />
            </div>
          </section>

          {/* Transcript */}
          <section className="bg-white rounded-[2rem] border-2 border-brand-muted shadow-sm p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-brand-light p-3 rounded-2xl border-2 border-brand-muted">
                <FileText size={22} className="text-brand-primary" />
              </div>
              <h2 className="text-xl font-extrabold text-gray-900">
                Transcript
              </h2>
            </div>

            {transcript?.transcript_text ? (
              <div className="rounded-2xl border-2 border-brand-muted bg-brand-light/40 p-5">
                <pre className="whitespace-pre-wrap break-words text-sm text-gray-800 font-medium">
                  {transcript.transcript_text}
                </pre>
              </div>
            ) : (
              <EmptyState text="No transcript available yet." />
            )}
          </section>

          {/* Feedback */}
          <section className="bg-white rounded-[2rem] border-2 border-brand-muted shadow-sm p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-brand-light p-3 rounded-2xl border-2 border-brand-muted">
                <MessageSquareText
                  size={22}
                  className="text-brand-primary"
                />
              </div>
              <h2 className="text-xl font-extrabold text-gray-900">
                Feedback
              </h2>
            </div>

            {feedback?.feedback_json ? (
              <div className="rounded-2xl border-2 border-brand-muted bg-brand-light/40 p-5">
                <pre className="whitespace-pre-wrap break-words text-sm text-gray-800 font-medium">
                  {prettyJson(feedback.feedback_json)}
                </pre>
              </div>
            ) : (
              <EmptyState text="No feedback available yet." />
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border-2 border-brand-muted bg-brand-light/40 p-5">
      <div className="flex items-center gap-2 text-brand-primary mb-2">
        {icon}
      </div>
      <div className="text-xs text-gray-500 font-semibold mb-1">{label}</div>
      <div className="text-gray-900 font-bold">{value}</div>
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