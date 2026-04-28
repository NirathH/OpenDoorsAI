export const dynamic = "force-dynamic";

import Link from "next/link";
import {
  ChevronLeft,
  CalendarDays,
  Clock3,
  CheckCircle2,
  User,
} from "lucide-react";
import InstructorSidebar from "@/components/InstructorSidebar";
import { requireInstructor } from "@/lib/server/auth/requireInstructor";
import { getParticipantSessionDetails } from "@/lib/server/participant/getParticipantSessionDetails";

type PageProps = {
  params: Promise<{
    studentId: string;
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

export default async function InstructorSessionDetailsPage({
  params,
}: PageProps) {
  const { studentId, sessionId } = await params;

  const { supabase, instructorName } = await requireInstructor();

  // getParticipantSessionDetails verifies that the session belongs to participantId (studentId)
  // Since it uses the instructor's supabase client, it will only succeed if RLS permits
  const { session, transcriptBlocks, feedbackData, instructorName: sessionInstructorName } =
    await getParticipantSessionDetails(supabase, studentId, sessionId);

  return (
    <div className="min-h-screen bg-brand-light font-sans flex">
      <InstructorSidebar name={instructorName} />

      <main className="flex-1 min-w-0 p-6 md:p-8">
        <div className="max-w-250 mx-auto">
          <div className="mb-8 flex flex-col gap-4">
            <Link
              href={`/instructor/students/${studentId}`}
              className="inline-flex w-fit items-center gap-2 px-4 py-2 rounded-xl border-2 border-brand-muted bg-white hover:border-brand-primary transition-colors text-gray-900 font-semibold"
            >
              <ChevronLeft size={18} className="text-brand-primary" />
              Back to Student Profile
            </Link>

            <div>
              <h1 className="text-3xl font-extrabold text-gray-900">
                {session.title || "Session Details"}
              </h1>
              <p className="mt-2 text-gray-600 font-medium">
                Review session performance, transcript, and emotion scores.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8">
            <ExpandableSection title="Session Info" defaultOpen={true}>
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
                  value={sessionInstructorName}
                />
              </div>
            </ExpandableSection>

            <ExpandableSection title="Session Feedback" defaultOpen={true}>
              {feedbackData ? (
                <div className="space-y-5">
                  {feedbackData.summary && (
                    <div className="rounded-2xl border-2 border-brand-muted bg-brand-light/40 p-5">
                      <div className="text-sm font-bold text-gray-900 mb-2">
                        Summary
                      </div>
                      <p className="text-sm text-gray-700 font-medium leading-relaxed">
                        {feedbackData.summary}
                      </p>
                    </div>
                  )}

                  {feedbackData.scores && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <InfoCard
                        icon={<CheckCircle2 size={18} />}
                        label="Clarity"
                        value={`${feedbackData.scores.clarity ?? "—"}/10`}
                      />
                      <InfoCard
                        icon={<CheckCircle2 size={18} />}
                        label="Confidence"
                        value={`${feedbackData.scores.confidence ?? "—"}/10`}
                      />
                      <InfoCard
                        icon={<CheckCircle2 size={18} />}
                        label="Relevance"
                        value={`${feedbackData.scores.relevance ?? "—"}/10`}
                      />
                    </div>
                  )}

                  {feedbackData.strengths?.length ? (
                    <div className="rounded-2xl border-2 border-brand-muted bg-brand-light/40 p-5">
                      <div className="text-sm font-bold text-gray-900 mb-2">
                        What Went Well
                      </div>
                      <ul className="list-disc ml-5 space-y-1 text-sm text-gray-700 font-medium">
                        {feedbackData.strengths.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {feedbackData.improvements?.length ? (
                    <div className="rounded-2xl border-2 border-brand-muted bg-brand-light/40 p-5">
                      <div className="text-sm font-bold text-gray-900 mb-2">
                        What to Improve
                      </div>
                      <ul className="list-disc ml-5 space-y-1 text-sm text-gray-700 font-medium">
                        {feedbackData.improvements.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {feedbackData.next_step && (
                    <div className="rounded-2xl border-2 border-brand-muted bg-brand-light/40 p-5">
                      <div className="text-sm font-bold text-gray-900 mb-2">
                        Next Step
                      </div>
                      <p className="text-sm text-gray-700 font-medium leading-relaxed">
                        {feedbackData.next_step}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <EmptyState text="No feedback available yet." />
              )}
            </ExpandableSection>

            <ExpandableSection title="Interview Content" defaultOpen={false}>
              {transcriptBlocks.length > 0 ? (
                <div className="space-y-4">
                  {transcriptBlocks.map((block, index) => (
                    <div
                      key={index}
                      className="rounded-2xl border-2 border-brand-muted bg-brand-light/40 p-5"
                    >
                      <div className="text-xs font-semibold text-gray-500 mb-1">
                        Question
                      </div>
                      <div className="text-gray-900 font-semibold mb-4">
                        {block.question}
                      </div>

                      <div className="text-xs font-semibold text-gray-500 mb-1">
                        Participant Response
                      </div>
                      <div className="text-gray-800 font-medium mb-4">
                        {block.answer}
                      </div>

                      {block.emotion && (
                        <>
                          <div className="text-xs font-semibold text-gray-500 mb-1">
                            Expression
                          </div>
                          <div className="text-gray-700 font-medium">
                            {block.emotion}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState text="No transcript available yet." />
              )}
            </ExpandableSection>
          </div>
        </div>
      </main>
    </div>
  );
}

function ExpandableSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details
      open={defaultOpen}
      className="bg-white rounded-4xl border-2 border-brand-muted shadow-sm"
    >
      <summary className="cursor-pointer list-none p-6 md:p-8 flex items-center justify-between">
        <h2 className="text-xl font-extrabold text-gray-900">{title}</h2>
        <span className="text-sm text-gray-500 font-medium">Open / Close</span>
      </summary>
      <div className="px-6 md:px-8 pb-6 md:pb-8">{children}</div>
    </details>
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
