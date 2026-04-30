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
  Sparkles,
  ArrowRight,
  Lightbulb,
  Brain,
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

function getScoreTone(score?: number | null) {
  if (score == null) return "Needs data";
  if (score >= 8) return "Strong";
  if (score >= 6) return "Good";
  return "Keep practicing";
}

export default async function InstructorSessionDetailsPage({
  params,
}: PageProps) {
  const { studentId, sessionId } = await params;
  const { supabase, instructorName } = await requireInstructor();

  const {
    session,
    feedbackData,
    instructorName: sessionInstructorName,
  } = await getParticipantSessionDetails(supabase, studentId, sessionId);

  const scores = feedbackData?.scores;

  return (
    <div className="min-h-screen bg-brand-light font-sans flex">
      <InstructorSidebar name={instructorName} />

      <main className="flex-1 min-w-0 p-6 md:p-8">
        <div className="max-w-[1100px] mx-auto">
          {/* BACK */}
          <div className="mb-6">
            <Link
              href={`/instructor/students/${studentId}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-brand-muted bg-white hover:border-brand-primary transition font-semibold"
            >
              <ChevronLeft size={18} className="text-brand-primary" />
              Back to Student Profile
            </Link>
          </div>

          {/* HEADER */}
          <section className="rounded-[2rem] border-2 border-brand-muted bg-white p-6 md:p-8 shadow-sm mb-8">
            <div className="flex flex-col md:flex-row justify-between gap-5">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 border border-green-200 text-green-700 text-sm font-bold mb-4">
                  <CheckCircle2 size={16} />
                  Session Completed
                </div>

                <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">
                  {session.title || "Session Details"}
                </h1>

                <p className="mt-3 text-gray-600 font-medium max-w-2xl">
                  Quick breakdown of performance, strengths, and next step.
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
            {/* SCORES */}
            {scores && (
              <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <ScoreCard label="Clarity" score={scores.clarity} />
                <ScoreCard label="Confidence" score={scores.confidence} />
                <ScoreCard label="Relevance" score={scores.relevance} />
                <ScoreCard label="Delivery" score={scores.delivery} />
              </section>
            )}

            {/* SUMMARY (MAIN FOCUS) */}
            {feedbackData?.summary && (
              <AccordionCard
                defaultOpen
                icon={<Sparkles size={22} />}
                title="Session Summary"
                subtitle="Quick understanding of this session"
              >
                <div className="space-y-3">
                  {feedbackData.summary.split(". ").map((line, i) => (
                    <div
                      key={i}
                      className="rounded-2xl border border-brand-muted bg-brand-light/40 p-4"
                    >
                      <p className="text-gray-800 font-medium leading-7">
                        {line.trim()}
                      </p>
                    </div>
                  ))}
                </div>
              </AccordionCard>
            )}

            {/* STRENGTHS */}
            {feedbackData?.strengths?.length && (
              <AccordionCard
                icon={<CheckCircle2 size={22} />}
                title="What Went Well"
                subtitle="Student strengths"
              >
                <List items={feedbackData.strengths} green />
              </AccordionCard>
            )}

            {/* IMPROVEMENTS */}
            {feedbackData?.improvements?.length && (
              <AccordionCard
                icon={<Target size={22} />}
                title="What To Improve"
                subtitle="Focus areas"
              >
                <List items={feedbackData.improvements} />
              </AccordionCard>
            )}

            {/* DELIVERY */}
            {feedbackData?.behavior_feedback && (
              <AccordionCard
                icon={<Eye size={22} />}
                title="Delivery Feedback"
                subtitle="Expression and engagement"
              >
                <div className="grid md:grid-cols-3 gap-4">
                  <BehaviorCard
                    title="Eye Contact"
                    text={feedbackData.behavior_feedback.eye_contact}
                  />
                  <BehaviorCard
                    title="Engagement"
                    text={feedbackData.behavior_feedback.engagement}
                  />
                  <BehaviorCard
                    title="Expression"
                    text={feedbackData.behavior_feedback.facial_expression}
                  />
                </div>
              </AccordionCard>
            )}

            {/* NEXT STEP */}
            {feedbackData?.next_step && (
              <AccordionCard
                defaultOpen
                icon={<ArrowRight size={22} />}
                title="One Next Step"
                subtitle="Focus before next session"
              >
                <div className="rounded-2xl border-2 border-brand-primary p-4">
                  <p className="font-medium text-gray-800">
                    {feedbackData.next_step}
                  </p>
                </div>
              </AccordionCard>
            )}

            {/* SESSION DETAILS */}
            <AccordionCard
              icon={<CalendarDays size={22} />}
              title="Session Details"
              subtitle="Basic info"
            >
              <div className="grid md:grid-cols-4 gap-4">
                <InfoCard label="Date" value={formatDate(session.ended_at)} />
                <InfoCard
                  label="Duration"
                  value={formatDuration(session.duration_seconds)}
                />
                <InfoCard label="Status" value={session.status} />
                <InfoCard
                  label="Instructor"
                  value={sessionInstructorName || "—"}
                />
              </div>
            </AccordionCard>
          </div>
        </div>
      </main>
    </div>
  );
}

/* ---------- COMPONENTS ---------- */

function AccordionCard({ icon, title, subtitle, children, defaultOpen = false }: { icon: React.ReactNode; title: string; subtitle: string; children: React.ReactNode; defaultOpen?: boolean }) {
  return (
    <details open={defaultOpen} className="bg-white rounded-3xl border p-5">
      <summary className="flex justify-between cursor-pointer">
        <div>
          <div className="flex items-center gap-2 font-bold">{icon} {title}</div>
          <p className="text-sm text-gray-500">{subtitle}</p>
        </div>
        <span className="text-sm text-gray-500">Open</span>
      </summary>
      <div className="mt-4">{children}</div>
    </details>
  );
}

function ScoreCard({ label, score }: { label: string; score?: number | null }) {
  const width = score ? score * 10 : 0;
  return (
    <div className="bg-white border rounded-2xl p-4">
      <div className="flex justify-between">
        <span className="font-bold">{label}</span>
        <span>{score ?? "—"}/10</span>
      </div>
      <div className="mt-2 h-2 bg-gray-200 rounded">
        <div className="h-2 bg-brand-primary rounded" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function List({ items, green }: { items: string[]; green?: boolean }) {
  return (
    <div className="space-y-2">
      {items.map((item: string, i: number) => (
        <div
          key={i}
          className={`p-3 rounded-xl border ${
            green ? "bg-green-50 border-green-200" : "bg-brand-light border-brand-muted"
          }`}
        >
          {item}
        </div>
      ))}
    </div>
  );
}

function BehaviorCard({ title, text }: { title: string; text?: string | null }) {
  return (
    <div className="p-4 border rounded-xl bg-brand-light">
      <div className="font-bold">{title}</div>
      <p className="text-sm text-gray-600">{text || "No data"}</p>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="p-4 border rounded-xl bg-white">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="font-bold">{value}</div>
    </div>
  );
}