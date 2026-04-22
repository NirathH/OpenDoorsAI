export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, CalendarDays, Clock3, CheckCircle2, User } from "lucide-react";
import InstructorSidebar from "@/components/InstructorSidebar";
import { requireInstructor } from "@/lib/server/auth/requireInstructor";
import { getParticipantSessionDetails } from "@/lib/server/participant/getParticipantSessionDetails";

type PageProps = {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<{ studentId?: string }>;
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

export default async function InstructorSessionDetailsPage({ params, searchParams }: PageProps) {
  const { sessionId } = await params;
  const { studentId } = await searchParams;

  const { supabase, instructorId, instructorName } = await requireInstructor();

  // If no studentId in the URL, we can't verify ownership
  if (!studentId) notFound();

  // Step 1: confirm this student belongs to this instructor
  const { data: profile } = await supabase
    .from("profiles")
    .select("instructor_id")
    .eq("user_id", studentId)
    .eq("instructor_id", instructorId)
    .maybeSingle();

  if (!profile) notFound();

  // Step 2: fetch session — internally confirms session belongs to this student
  const { session, transcriptBlocks, feedbackData } =
    await getParticipantSessionDetails(supabase, studentId, sessionId);

  return (
    <div className="min-h-screen bg-brand-light font-sans flex">
      <InstructorSidebar name={instructorName} />

      <main className="flex-1 min-w-0 p-6 md:p-8">
        <div className="max-w-[1000px] mx-auto">
          <Link
            href={`/instructor/students/${studentId}`}
            className="inline-flex w-fit items-center gap-2 px-4 py-2 rounded-xl border-2 border-brand-muted bg-white hover:border-brand-primary transition-colors text-gray-900 font-semibold mb-6"
          >
            <ChevronLeft size={18} className="text-brand-primary" />
            Back to Student
          </Link>

          <h1 className="text-3xl font-extrabold text-gray-900 mb-8">
            {session.title || "Session Details"}
          </h1>

          <div className="grid grid-cols-1 gap-8">
            <Section title="Session Info">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoCard icon={<CalendarDays size={18} />} label="Date" value={formatDate(session.ended_at || session.created_at)} />
                <InfoCard icon={<Clock3 size={18} />} label="Duration" value={formatDuration(session.duration_seconds)} />
                <InfoCard icon={<CheckCircle2 size={18} />} label="Status" value={session.status} />
              </div>
            </Section>

            <Section title="Feedback">
              {feedbackData ? (
                <div className="space-y-5">
                  {feedbackData.summary && (
                    <div className="rounded-2xl border-2 border-brand-muted bg-brand-light/40 p-5">
                      <div className="text-sm font-bold text-gray-900 mb-2">Summary</div>
                      <p className="text-sm text-gray-700 font-medium leading-relaxed">{feedbackData.summary}</p>
                    </div>
                  )}
                  {feedbackData.scores && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <InfoCard icon={<CheckCircle2 size={18} />} label="Clarity" value={`${feedbackData.scores.clarity ?? "—"}/10`} />
                      <InfoCard icon={<CheckCircle2 size={18} />} label="Confidence" value={`${feedbackData.scores.confidence ?? "—"}/10`} />
                      <InfoCard icon={<CheckCircle2 size={18} />} label="Relevance" value={`${feedbackData.scores.relevance ?? "—"}/10`} />
                    </div>
                  )}
                  {feedbackData.strengths?.length ? (
                    <div className="rounded-2xl border-2 border-brand-muted bg-brand-light/40 p-5">
                      <div className="text-sm font-bold text-gray-900 mb-2">What Went Well</div>
                      <ul className="list-disc ml-5 space-y-1 text-sm text-gray-700 font-medium">
                        {feedbackData.strengths.map((item, i) => <li key={i}>{item}</li>)}
                      </ul>
                    </div>
                  ) : null}
                  {feedbackData.improvements?.length ? (
                    <div className="rounded-2xl border-2 border-brand-muted bg-brand-light/40 p-5">
                      <div className="text-sm font-bold text-gray-900 mb-2">What to Improve</div>
                      <ul className="list-disc ml-5 space-y-1 text-sm text-gray-700 font-medium">
                        {feedbackData.improvements.map((item, i) => <li key={i}>{item}</li>)}
                      </ul>
                    </div>
                  ) : null}
                  {feedbackData.next_step && (
                    <div className="rounded-2xl border-2 border-brand-muted bg-brand-light/40 p-5">
                      <div className="text-sm font-bold text-gray-900 mb-2">Next Step</div>
                      <p className="text-sm text-gray-700 font-medium leading-relaxed">{feedbackData.next_step}</p>
                    </div>
                  )}
                </div>
              ) : (
                <EmptyState text="No feedback available yet." />
              )}
            </Section>

            <Section title="Interview Content">
              {transcriptBlocks.length > 0 ? (
                <div className="space-y-4">
                  {transcriptBlocks.map((block, index) => (
                    <div key={index} className="rounded-2xl border-2 border-brand-muted bg-brand-light/40 p-5">
                      <div className="text-xs font-semibold text-gray-500 mb-1">Question</div>
                      <div className="text-gray-900 font-semibold mb-4">{block.question}</div>
                      <div className="text-xs font-semibold text-gray-500 mb-1">Your Response</div>
                      <div className="text-gray-800 font-medium mb-4">{block.answer}</div>
                      {block.emotion && (
                        <>
                          <div className="text-xs font-semibold text-gray-500 mb-1">Expression</div>
                          <div className="text-gray-700 font-medium">{block.emotion}</div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState text="No transcript available yet." />
              )}
            </Section>
          </div>
        </div>
      </main>
    </div>
  );
}


function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-[2rem] border-2 border-brand-muted shadow-sm p-6 md:p-8">
      <h2 className="text-xl font-extrabold text-gray-900 mb-5">{title}</h2>
      {children}
    </div>
  );
}

function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border-2 border-brand-muted bg-brand-light/40 p-5">
      <div className="flex items-center gap-2 text-brand-primary mb-2">{icon}</div>
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