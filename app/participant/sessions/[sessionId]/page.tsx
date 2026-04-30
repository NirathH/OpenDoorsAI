export const dynamic = "force-dynamic";

import type React from "react";
import Link from "next/link";
import {
  ChevronLeft,
  CalendarDays,
  Clock3,
  CheckCircle2,
  User,
  Target,
  Eye,
  Smile,
  MessageSquareText,
  Sparkles,
  ArrowRight,
  Lightbulb,
  Brain,
} from "lucide-react";
import Navbar from "@/components/participantNavbar";
import { requireParticipant } from "@/lib/server/auth/requireParticipant";
import { getParticipantSessionDetails } from "@/lib/server/participant/getParticipantSessionDetails";
import { getParticipantProfile } from "@/lib/server/participant/getParticipantProfile";

type PageProps = {
  params: Promise<{
    sessionId: string;
  }>;
};
type BehaviorFeedback = {
  eye_contact?: string;
  engagement?: string;
  facial_expression?: string;
};

type FeedbackData = {
  summary?: string;
  strengths?: string[];
  improvements?: string[];
  behavior_feedback?: BehaviorFeedback;
  next_step?: string;
  scores?: {
    clarity?: number | null;
    confidence?: number | null;
    relevance?: number | null;
    delivery?: number | null;
  };
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

function getScoreTone(score?: number | null) {
  if (score == null) return "Needs data";
  if (score >= 8) return "Strong";
  if (score >= 6) return "Good";
  return "Keep practicing";
}

export default async function ParticipantSessionDetailsPage({
  params,
}: PageProps) {
  const { sessionId } = await params;

  const { supabase, participantId, participantName } =
    await requireParticipant();

  const { session, transcriptBlocks, feedbackData, instructorName } =
    await getParticipantSessionDetails(supabase, participantId, sessionId);

  const { instructorName: profileInstructorName } =
    await getParticipantProfile(supabase, participantId);

  const finalInstructorName =
    profileInstructorName?.trim() ||
    instructorName?.trim() ||
    "Not assigned yet";

  const scores = feedbackData?.scores;
  const behaviorFeedback = (feedbackData as FeedbackData | undefined)
    ?.behavior_feedback;

  return (
    <div className="min-h-screen bg-brand-light font-sans">
      <Navbar userName={participantName} userRole="Participant" />

      <main className="max-w-[1100px] mx-auto p-5 md:p-8">
        <div className="mb-6">
          <Link
            href="/participant/sessions"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-brand-muted bg-white hover:border-brand-primary transition-colors text-gray-900 font-semibold"
          >
            <ChevronLeft size={18} className="text-brand-primary" />
            Back to Sessions
          </Link>
        </div>

        <section className="rounded-[2rem] border-2 border-brand-muted bg-white p-6 md:p-8 shadow-sm mb-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 border border-green-200 text-green-700 text-sm font-bold mb-4">
                <CheckCircle2 size={16} />
                Session Completed
              </div>

              <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight">
                {session.title || "Session Feedback"}
              </h1>

              <p className="mt-3 text-gray-600 font-medium max-w-2xl leading-relaxed">
                Here is a simple review of what went well, what to practice,
                and one clear next step.
              </p>
            </div>

            <div className="rounded-2xl border-2 border-brand-muted bg-brand-light/40 p-4 min-w-[180px]">
              <div className="text-xs font-bold text-gray-500 uppercase">
                Duration
              </div>
              <div className="text-2xl font-extrabold text-gray-900 mt-1">
                {formatDuration(session.duration_seconds)}
              </div>
            </div>
          </div>
        </section>

        <div className="space-y-6">
          {feedbackData ? (
            <>
              {scores && (
                <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <ScoreCard label="Clarity" score={scores.clarity} />
                  <ScoreCard label="Confidence" score={scores.confidence} />
                  <ScoreCard label="Relevance" score={scores.relevance} />
                </section>
              )}

              {feedbackData.summary && (
                <AccordionCard
                  defaultOpen
                  icon={<Sparkles size={22} />}
                  title="Summary"
                  subtitle="A quick overview of your session"
                  tone="brand"
                >
                  <p className="text-gray-800 font-medium leading-8 text-base">
                    {feedbackData.summary}
                  </p>
                </AccordionCard>
              )}

              {feedbackData.strengths?.length ? (
                <AccordionCard
                  icon={<CheckCircle2 size={22} />}
                  title="What Went Well"
                  subtitle="Strengths from this session"
                  tone="green"
                >
                  <NumberedList items={feedbackData.strengths} tone="green" />
                </AccordionCard>
              ) : null}

              {feedbackData.improvements?.length ? (
                <AccordionCard
                  icon={<Target size={22} />}
                  title="What To Improve"
                  subtitle="Practice points for next time"
                  tone="brand"
                >
                  <NumberedList items={feedbackData.improvements} tone="brand" />
                </AccordionCard>
              ) : null}

              {behaviorFeedback && (
                <AccordionCard
                  icon={<Eye size={22} />}
                  title="Delivery Feedback"
                  subtitle="Eye contact, engagement, and expression"
                  tone="brand"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <BehaviorCard
                      icon={<Eye size={20} />}
                      title="Eye Contact"
                      text={behaviorFeedback.eye_contact}
                    />
                    <BehaviorCard
                      icon={<Brain size={20} />}
                      title="Engagement"
                      text={behaviorFeedback.engagement}
                    />
                    <BehaviorCard
                      icon={<Smile size={20} />}
                      title="Expression"
                      text={behaviorFeedback.facial_expression}
                    />
                  </div>
                </AccordionCard>
              )}

              {feedbackData.next_step && (
                <AccordionCard
                  defaultOpen
                  icon={<ArrowRight size={22} />}
                  title="Your One Next Step"
                  subtitle="Focus on this before your next practice"
                  tone="brand"
                >
                  <div className="rounded-3xl border-2 border-brand-primary bg-white p-5">
                    <p className="text-gray-800 font-medium leading-8">
                      {feedbackData.next_step}
                    </p>
                  </div>
                </AccordionCard>
              )}
            </>
          ) : (
            <EmptyState text="No feedback available yet." />
          )}

          {transcriptBlocks.length > 0 && (
            <AccordionCard
              icon={<MessageSquareText size={22} />}
              title="Interview Content"
              subtitle="Questions and answers from your session"
              tone="neutral"
            >
              <div className="space-y-4">
                {transcriptBlocks.map((block, index) => (
                  <div
                    key={index}
                    className="rounded-3xl border-2 border-brand-muted bg-brand-light/40 p-5 md:p-6"
                  >
                    <div className="flex items-center gap-2 text-sm font-extrabold text-brand-primary mb-2">
                      Question {index + 1}
                    </div>

                    <p className="text-gray-900 font-bold leading-7 mb-5">
                      {block.question}
                    </p>

                    <div className="rounded-2xl bg-white border-2 border-brand-muted p-4">
                      <div className="text-xs font-bold text-gray-500 uppercase mb-2">
                        Your Response
                      </div>
                      <p className="text-gray-800 font-medium leading-7">
                        {block.answer}
                      </p>
                    </div>

                    {block.emotion && (
                      <div className="mt-4 rounded-2xl bg-white border-2 border-brand-muted p-4">
                        <div className="text-xs font-bold text-gray-500 uppercase mb-2">
                          Expression
                        </div>
                        <p className="text-gray-700 font-medium leading-7">
                          {block.emotion}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </AccordionCard>
          )}

          <AccordionCard
            icon={<CalendarDays size={22} />}
            title="Session Details"
            subtitle="Date, duration, status, and instructor"
            tone="neutral"
          >
            <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <InfoCard
                icon={<CalendarDays size={20} />}
                label="Session Date"
                value={formatDate(session.ended_at || session.created_at)}
              />
              <InfoCard
                icon={<Clock3 size={20} />}
                label="Duration"
                value={formatDuration(session.duration_seconds)}
              />
              <InfoCard
                icon={<CheckCircle2 size={20} />}
                label="Session Status"
                value={session.status}
              />
              <InfoCard
                icon={<User size={20} />}
                label="Instructor"
                value={finalInstructorName}
              />
            </section>
          </AccordionCard>
        </div>
      </main>
    </div>
  );
}

function AccordionCard({
  icon,
  title,
  subtitle,
  children,
  tone = "brand",
  defaultOpen = false,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  tone?: "brand" | "green" | "neutral";
  defaultOpen?: boolean;
}) {
  const iconTone =
    tone === "green"
      ? "text-green-700"
      : tone === "neutral"
      ? "text-gray-600"
      : "text-brand-primary";

  const iconBg =
    tone === "green"
      ? "bg-green-50 border-green-200"
      : "bg-brand-light border-brand-muted";

  return (
    <details
      open={defaultOpen}
      className="group rounded-[2rem] border-2 border-brand-muted bg-white shadow-sm overflow-hidden"
    >
      <summary className="cursor-pointer list-none p-5 md:p-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`h-12 w-12 rounded-2xl border-2 ${iconBg} flex items-center justify-center ${iconTone} shrink-0`}
          >
            {icon}
          </div>

          <div>
            <h2 className="text-lg md:text-xl font-extrabold text-gray-900">
              {title}
            </h2>
            <p className="text-sm text-gray-500 font-medium mt-1">
              {subtitle}
            </p>
          </div>
        </div>

        <span className="text-sm font-bold text-gray-500 group-open:hidden">
          Open
        </span>
        <span className="text-sm font-bold text-gray-500 hidden group-open:inline">
          Close
        </span>
      </summary>

      <div className="px-5 md:px-6 pb-6">{children}</div>
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
    <div className="rounded-3xl border-2 border-brand-muted bg-white p-5">
      <div className="h-10 w-10 rounded-2xl bg-brand-light flex items-center justify-center text-brand-primary mb-4">
        {icon}
      </div>
      <div className="text-xs text-gray-500 font-bold uppercase mb-1">
        {label}
      </div>
      <div className="text-gray-900 font-extrabold break-words">{value}</div>
    </div>
  );
}

function ScoreCard({
  label,
  score,
}: {
  label: string;
  score?: number | null;
}) {
  const safeScore = typeof score === "number" ? score : null;
  const width = safeScore ? Math.max(8, Math.min(100, safeScore * 10)) : 0;

  return (
    <div className="rounded-3xl border-2 border-brand-muted bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-extrabold text-gray-900">{label}</div>
          <div className="text-xs font-bold text-gray-500 mt-1">
            {getScoreTone(safeScore)}
          </div>
        </div>

        <div className="text-2xl font-extrabold text-gray-900">
          {safeScore ?? "—"}
          <span className="text-sm text-gray-500">/10</span>
        </div>
      </div>

      <div className="mt-4 h-3 rounded-full bg-brand-light border border-brand-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-brand-primary"
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

function NumberedList({
  items,
  tone,
}: {
  items: string[];
  tone: "green" | "brand";
}) {
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div
          key={i}
          className={
            "flex gap-3 rounded-2xl border p-4 " +
            (tone === "green"
              ? "bg-green-50 border-green-200"
              : "bg-brand-light/40 border-brand-muted")
          }
        >
          <div
            className={
              "mt-1 h-6 w-6 rounded-full flex items-center justify-center shrink-0 bg-white " +
              (tone === "green" ? "text-green-700" : "text-brand-primary")
            }
          >
            <span className="text-xs font-extrabold">{i + 1}</span>
          </div>

          <p className="text-gray-800 font-medium leading-7">{item}</p>
        </div>
      ))}
    </div>
  );
}

function BehaviorCard({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text?: string;
}) {
  return (
    <div className="rounded-2xl border-2 border-brand-muted bg-brand-light/40 p-5">
      <div className="text-brand-primary mb-3">{icon}</div>
      <div className="font-extrabold text-gray-900 mb-2">{title}</div>
      <p className="text-sm text-gray-700 font-medium leading-6">
        {text || "No data available yet."}
      </p>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-3xl border-2 border-dashed border-brand-muted bg-white p-10 text-center">
      <Lightbulb className="mx-auto text-brand-primary mb-3" size={30} />
      <p className="text-gray-600 font-semibold">{text}</p>
    </div>
  );
}