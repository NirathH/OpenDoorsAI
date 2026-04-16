export const dynamic = "force-dynamic";

import React from "react";
import {
  Play,
  TrendingUp,
  Book,
  MessageSquare,
  Award,
  ClipboardList,
} from "lucide-react";
import Navbar from "@/components/participantNavbar";
import ActionCircle from "@/components/ActionCircle";
import GoalCard from "@/components/GoalCard";
import { requireParticipant } from "@/lib/server/auth/requireParticipant";
import { getParticipantDashboard } from "@/lib/server/participant/getParticipantDashboard";
import { formatShortDate } from "@/lib/utils/studentHelpers";

export default async function ParticipantDashboardPage() {
  const { supabase, participantId, participantName } = await requireParticipant();

  const { profile, stats, nextAssignment, pendingAssignments } =
    await getParticipantDashboard(supabase, participantId);

  return (
    <div className="min-h-screen font-sans bg-brand-light">
      <Navbar userName={participantName} userRole="Participant" />

      <main className="max-w-[1400px] mx-auto p-6 md:p-8 flex flex-col lg:flex-row gap-8">
        <div className="flex-1 flex flex-col gap-8">
          <section className="bg-white rounded-[2rem] p-10 border-2 border-brand-muted shadow-sm flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute -top-20 -right-20 h-56 w-56 rounded-full bg-brand-light border-2 border-brand-muted opacity-70" />
            <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-brand-light border-2 border-brand-muted opacity-50" />

            <div className="relative w-36 h-36 rounded-full border-[6px] border-brand-primary overflow-hidden mb-6 shadow-lg bg-brand-light flex items-center justify-center">
              <span className="text-brand-primary font-extrabold text-5xl">
                {participantName.charAt(0).toUpperCase()}
              </span>
            </div>

            <h1 className="relative text-3xl font-semibold text-gray-900 mb-2">
              Welcome back, {participantName}!
            </h1>

            <p className="relative text-gray-500 font-medium">
              Keep practicing and building confidence one session at a time.
            </p>

            <div className="relative mt-6 flex flex-wrap justify-center gap-3">
              <Pill>
                Next task: {nextAssignment?.title || "No assigned task right now"}
              </Pill>
              <Pill>Goal: {profile?.job_goal || "Not added yet"}</Pill>
              <Pill>
                Pending assignments: {String(stats.pendingAssignments)}
              </Pill>
            </div>
          </section>

          <section className="flex flex-wrap justify-center items-center gap-6 py-4">
            <ActionCircle
              icon={TrendingUp}
              label="View Sessions"
              variant="secondary"
              href="/participant/sessions"
            />

            <ActionCircle
              icon={Play}
              label="Start Session"
              variant="primary"
              size="lg"
              href={
                nextAssignment
                  ? `/participant/sessions/new?participantId=${participantId}&assignmentId=${nextAssignment.id}`
                  : `/participant/sessions/new?participantId=${participantId}`
              }
            />

            <ActionCircle
              icon={Book}
              label="My Profile"
              variant="secondary"
              href="/participant/profile"
            />
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title="My Progress">
              <div className="flex gap-4">
                <MiniStat
                  icon={<TrendingUp size={24} strokeWidth={2.5} />}
                  label="Sessions Completed"
                  value={String(stats.totalSessions)}
                />
                <MiniStat
                  icon={<Award size={24} strokeWidth={2.5} />}
                  label="Latest Activity"
                  value={
                    stats.latestCompletedDate
                      ? formatShortDate(stats.latestCompletedDate)
                      : "—"
                  }
                />
              </div>

            </Card>

            <Card title="Upcoming Goals">
              <div className="flex flex-col gap-2">
                {pendingAssignments.length > 0 ? (
                  pendingAssignments.slice(0, 3).map((assignment) => (
                    <GoalCard
                      key={assignment.id}
                      icon={ClipboardList}
                      title={assignment.title}
                    />
                  ))
                ) : (
                  <div className="rounded-2xl border-2 border-dashed border-brand-muted bg-brand-light/30 p-6 text-sm text-gray-500 font-medium">
                    No goals assigned yet.
                  </div>
                )}
              </div>
            </Card>
          </section>
        </div>

        <aside className="w-full lg:w-[420px] bg-white rounded-[2rem] border-2 border-brand-muted p-8 shadow-sm h-fit">
          <div className="flex items-start gap-4 mb-6 pb-6 border-b border-brand-muted">
            <div className="bg-brand-light p-3 rounded-2xl border-2 border-brand-muted">
              <MessageSquare size={24} className="text-brand-primary" />
            </div>

            <div className="flex flex-col gap-1">
              <h2 className="text-gray-900 font-semibold text-[17px]">
                Coaching Snapshot
              </h2>
              <p className="text-gray-500 text-[13px] font-medium">
                Quick reminders to keep you focused
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <SidebarNote
              title="Job Goal"
              text={profile?.job_goal || "No job goal added yet."}
            />
            <SidebarNote
              title="Next Assignment"
              text={nextAssignment?.title || "No assignment waiting right now."}
            />
          </div>
        </aside>
      </main>
    </div>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-[2rem] p-6 border-2 border-brand-muted flex flex-col">
      <h2 className="text-[15px] font-medium text-gray-700 mb-4 px-2">
        {title}
      </h2>
      {children}
    </div>
  );
}

function MiniStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex-1 border-2 border-brand-muted rounded-2xl p-5 flex flex-col items-start justify-center">
      <div className="text-brand-secondary mb-3 bg-brand-light p-2 rounded-xl border-2 border-brand-muted/60">
        {icon}
      </div>
      <div>
        <div className="text-xs text-gray-600 font-semibold mb-1">
          {label}
        </div>
        <div className="text-3xl font-bold text-gray-900 leading-none">
          {value}
        </div>
      </div>
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="px-3 py-1.5 rounded-full text-xs font-semibold border-2 border-brand-muted bg-white text-gray-700">
      {children}
    </span>
  );
}

function SidebarNote({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border-2 border-brand-muted bg-brand-light/40 p-4">
      <div className="text-xs font-semibold text-gray-500 mb-1">{title}</div>
      <div className="text-sm text-gray-800 font-medium leading-6">{text}</div>
    </div>
  );
}