"use client";

import type React from "react";
import {
  CheckCircle2,
  Clock3,
  ClipboardList,
  TimerReset,
  TrendingUp,
  Target,
  Activity,
  Briefcase,
  StickyNote,
  Sparkles,
  ArrowRight,
  CalendarDays,
  Lightbulb,
  ChevronDown,
} from "lucide-react";
import {
  ResponsiveContainer,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
} from "recharts";

const COLORS = {
  teal: "#0d9488",
  sky: "#38bdf8",
  amber: "#f59e0b",
  tealLight: "#ccfbf1",
};

const tooltipStyle = {
  contentStyle: {
    borderRadius: "12px",
    border: "2px solid #e2e8f0",
    boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
    fontSize: "13px",
    fontWeight: 600,
  },
  cursor: { fill: "rgba(13,148,136,0.06)" },
};

type SessionsOverTimeItem = {
  date: string;
  completedSessions: number;
};

type RecentSession = {
  id: string;
  title: string | null;
  status: string | null;
  duration_seconds: number | null;
  created_at: string | null;
  ended_at: string | null;
};

type PendingGoal = {
  id: string;
  title: string | null;
  status: string | null;
  created_at: string | null;
  due_at: string | null;
};

type WeeklyFeedbackJson = {
  summary?: string;
  progress_made?: string[];
  still_working_on?: string[];
  next_week_focus?: string;
  coach_note?: string;
  recommended_practice?: string[];
};

type WeeklyFeedbackRow = {
  id: string;
  week_start: string;
  week_end: string;
  sessions_count: number;
  avg_clarity: number | null;
  avg_confidence: number | null;
  avg_relevance: number | null;
  avg_delivery: number | null;
  feedback_json: WeeklyFeedbackJson | null;
};

type ParticipantProgress = {
  participantInfo: {
    fullName: string;
    jobGoal: string;
    coachNotes: string;
    supportNotes: string;
    joinedAt: string | null;
  };
  instructorName: string;
  totalAssignments: number;
  completedAssignments: number;
  pendingAssignments: number;
  totalSessions: number;
  completedSessions: number;
  completionRate: number;
  averageSessionDurationSeconds: number;
  averageSessionDurationLabel: string;
  sessionsOverTime: SessionsOverTimeItem[];
  recentSessions: RecentSession[];
  pendingGoals: PendingGoal[];
  weeklyFeedback: WeeklyFeedbackRow[];
  latestWeekly: WeeklyFeedbackRow | null;
};

type Props = {
  participantName: string;
  participantEmail: string;
  progress: ParticipantProgress;
};

function formatChartDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatDuration(seconds: number | null) {
  if (!seconds || seconds <= 0) return "—";
  return `${Math.round(seconds / 60)}m`;
}

function formatShortDate(dateString: string | null) {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function ParticipantProgressDashboard({
  participantName,
  participantEmail,
  progress,
}: Props) {
  const latestWeekly = progress.latestWeekly;
  const latestWeeklyJson = latestWeekly?.feedback_json;

  const displayName =
    progress.participantInfo?.fullName?.trim() ||
    participantName ||
    "Participant";

  const sessionsOverTimeData = progress.sessionsOverTime.map((item) => ({
    ...item,
    label: formatChartDate(item.date),
  }));

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-[2rem] border-2 border-brand-muted shadow-sm p-6 md:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-center gap-4 min-w-0">
            <div
              className="h-16 w-16 rounded-3xl flex items-center justify-center text-white font-extrabold text-2xl shrink-0"
              style={{ background: COLORS.teal }}
            >
              {displayName.charAt(0).toUpperCase()}
            </div>

            <div className="min-w-0">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                Participant
              </p>
              <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 truncate">
                {displayName}
              </h2>
              <p className="text-sm text-gray-500 font-medium mt-1 truncate">
                {participantEmail}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border-2 border-brand-muted bg-brand-light/40 px-5 py-4">
            <div className="flex items-center gap-2 text-brand-primary font-extrabold">
              <TrendingUp size={18} />
              {progress.completionRate}% goal completion
            </div>
            <p className="text-xs text-gray-500 font-semibold mt-1">
              Based on assigned practice goals
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
          <InfoTile
            icon={<Briefcase size={18} />}
            label="Participant Goal"
            value={progress.participantInfo?.jobGoal || "No goal added yet."}
          />
          <InfoTile
            icon={<StickyNote size={18} />}
            label="Coach Notes"
            value={progress.participantInfo?.coachNotes || "No coach notes yet."}
          />
        </div>
      </section>

      <section className="rounded-[2rem] border-2 border-brand-muted bg-white shadow-sm overflow-hidden">
        <div className="px-5 md:px-6 py-5 border-b-2 border-brand-muted flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-brand-light border-2 border-brand-muted flex items-center justify-center text-brand-primary">
            <Sparkles size={22} />
          </div>

          <div>
            <h2 className="text-xl font-extrabold text-gray-900">
              Weekly Coach Feedback
            </h2>
            <p className="text-sm text-gray-500 font-medium mt-1">
              Simple weekly progress, next focus, and coaching notes.
            </p>
          </div>
        </div>

        <div className="p-5 md:p-6">
          {latestWeeklyJson ? (
            <div className="space-y-5">
              <div className="rounded-3xl border-2 border-brand-muted bg-brand-light/30 p-5 md:p-6">
                <div className="flex items-center gap-2 text-brand-primary font-extrabold mb-3">
                  <CalendarDays size={19} />
                  Week of {formatShortDate(latestWeekly.week_start)}
                </div>
                <p className="text-gray-800 font-medium leading-8">
                  {latestWeeklyJson.summary}
                </p>
              </div>

              {latestWeeklyJson.next_week_focus && (
                <div className="rounded-3xl border-2 border-brand-primary bg-white p-5 md:p-6">
                  <div className="flex items-center gap-2 text-brand-primary font-extrabold mb-3">
                    <ArrowRight size={20} />
                    One Focus for Next Week
                  </div>
                  <p className="text-gray-800 font-medium leading-8">
                    {latestWeeklyJson.next_week_focus}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <WeeklyList
                  title="What Improved"
                  items={latestWeeklyJson.progress_made}
                  tone="green"
                />
                <WeeklyList
                  title="Still Working On"
                  items={latestWeeklyJson.still_working_on}
                  tone="amber"
                />
              </div>

              {latestWeeklyJson.coach_note && (
                <AccordionCard
                  icon={<Lightbulb size={20} />}
                  title="Coach Note"
                  subtitle="Optional extra encouragement"
                  defaultOpen={false}
                >
                  <p className="text-gray-700 font-medium leading-7">
                    {latestWeeklyJson.coach_note}
                  </p>
                </AccordionCard>
              )}

              {latestWeeklyJson.recommended_practice?.length ? (
                <AccordionCard
                  icon={<Target size={20} />}
                  title="Recommended Practice"
                  subtitle="Optional practice ideas"
                  defaultOpen={false}
                >
                  <div className="space-y-3">
                    {latestWeeklyJson.recommended_practice.map((item, index) => (
                      <div
                        key={index}
                        className="rounded-2xl border-2 border-brand-muted bg-brand-light/30 p-4 text-sm text-gray-800 font-medium leading-6"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </AccordionCard>
              ) : null}
            </div>
          ) : (
            <EmptyState label="No weekly feedback yet. Complete sessions this week to generate a weekly report." />
          )}
        </div>
      </section>

      <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        <StatCard
          title="Assigned"
          value={progress.totalAssignments}
          subtitle="Goals assigned"
          icon={<ClipboardList size={20} />}
          accent={COLORS.sky}
        />
        <StatCard
          title="Completed"
          value={progress.completedAssignments}
          subtitle="Goals finished"
          icon={<CheckCircle2 size={20} />}
          accent={COLORS.teal}
        />
        <StatCard
          title="Pending"
          value={progress.pendingAssignments}
          subtitle="Still to complete"
          icon={<Clock3 size={20} />}
          accent={COLORS.amber}
        />
        <StatCard
          title="Sessions"
          value={progress.totalSessions}
          subtitle="Practice sessions"
          icon={<Activity size={20} />}
          accent={COLORS.sky}
        />
        <StatCard
          title="Avg Time"
          value={progress.averageSessionDurationLabel}
          subtitle="Per session"
          icon={<TimerReset size={20} />}
          accent={COLORS.teal}
        />
      </section>

      <AccordionCard
        icon={<TrendingUp size={20} />}
        title="Sessions Over Time"
        subtitle="Completed practice sessions by date"
        defaultOpen
      >
        {sessionsOverTimeData.length > 0 ? (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sessionsOverTimeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip {...tooltipStyle} />
                <Line
                  type="monotone"
                  dataKey="completedSessions"
                  stroke={COLORS.teal}
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState label="No session trend yet." />
        )}
      </AccordionCard>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <AccordionCard
          icon={<CheckCircle2 size={20} />}
          title="Recent Sessions"
          subtitle="Latest completed practice"
        >
          {progress.recentSessions.length > 0 ? (
            <div className="space-y-3">
              {progress.recentSessions.map((session) => (
                <div
                  key={session.id}
                  className="rounded-2xl border-2 border-brand-muted bg-brand-light/30 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-extrabold text-gray-900">
                        {session.title || "Practice Session"}
                      </p>
                      <p className="text-xs text-gray-500 font-medium mt-1">
                        {formatShortDate(session.ended_at || session.created_at)}
                      </p>
                    </div>
                    <span className="rounded-full bg-white border-2 border-brand-muted px-3 py-1 text-xs font-bold text-gray-700">
                      {formatDuration(session.duration_seconds)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState label="No recent sessions yet." />
          )}
        </AccordionCard>

        <AccordionCard
          icon={<Target size={20} />}
          title="Pending Goals"
          subtitle="Assigned sessions still waiting"
        >
          {progress.pendingGoals.length > 0 ? (
            <div className="space-y-3">
              {progress.pendingGoals.map((goal) => (
                <div
                  key={goal.id}
                  className="rounded-2xl border-2 border-brand-muted bg-brand-light/30 p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-xl bg-white border-2 border-brand-muted flex items-center justify-center text-brand-primary shrink-0">
                      <Target size={18} />
                    </div>
                    <div>
                      <p className="font-extrabold text-gray-900">
                        {goal.title || "Untitled Goal"}
                      </p>
                      <p className="text-xs text-gray-500 font-medium mt-1">
                        Due {formatShortDate(goal.due_at)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState label="No pending goals." />
          )}
        </AccordionCard>
      </section>

      {progress.weeklyFeedback.length > 1 && (
        <AccordionCard
          icon={<CalendarDays size={20} />}
          title="Past Weekly Reports"
          subtitle="Previous coaching summaries"
        >
          <div className="space-y-3">
            {progress.weeklyFeedback.slice(1, 5).map((week) => (
              <div
                key={week.id}
                className="rounded-2xl border-2 border-brand-muted bg-brand-light/30 p-4"
              >
                <p className="text-xs font-bold text-gray-500 mb-2">
                  Week of {formatShortDate(week.week_start)}
                </p>
                <p className="text-sm text-gray-800 font-medium leading-6">
                  {week.feedback_json?.summary || "No summary available."}
                </p>
              </div>
            ))}
          </div>
        </AccordionCard>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
  accent = COLORS.teal,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  accent?: string;
}) {
  return (
    <div className="rounded-3xl border-2 border-brand-muted bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">
            {title}
          </p>
          <p className="mt-2 text-3xl font-extrabold text-gray-900 leading-none">
            {value}
          </p>
          <p className="mt-2 text-xs text-gray-500 font-medium">{subtitle}</p>
        </div>

        <div
          className="h-11 w-11 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: `${accent}18`, color: accent }}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function InfoTile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-3xl border-2 border-brand-muted bg-brand-light/30 p-5">
      <div className="flex items-center gap-2 text-brand-primary mb-3">
        {icon}
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
          {label}
        </p>
      </div>

      <p className="text-sm font-semibold text-gray-800 leading-7 whitespace-pre-line">
        {value || "—"}
      </p>
    </div>
  );
}

function AccordionCard({
  icon,
  title,
  subtitle,
  children,
  defaultOpen = false,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details
      open={defaultOpen}
      className="group rounded-[2rem] border-2 border-brand-muted bg-white shadow-sm overflow-hidden"
    >
      <summary className="cursor-pointer list-none p-5 md:p-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-brand-light border-2 border-brand-muted flex items-center justify-center text-brand-primary shrink-0">
            {icon}
          </div>

          <div>
            <h2 className="text-lg font-extrabold text-gray-900">{title}</h2>
            {subtitle && (
              <p className="text-sm text-gray-500 font-medium mt-1">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm font-bold text-gray-500">
          <span className="group-open:hidden">Open</span>
          <span className="hidden group-open:inline">Close</span>
          <ChevronDown className="transition-transform group-open:rotate-180" size={18} />
        </div>
      </summary>

      <div className="px-5 md:px-6 pb-6">{children}</div>
    </details>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="min-h-45 flex items-center justify-center rounded-3xl border-2 border-dashed border-brand-muted bg-brand-light/20 text-gray-500 text-sm font-semibold text-center px-6 py-8">
      {label}
    </div>
  );
}

function WeeklyList({
  title,
  items,
  tone,
}: {
  title: string;
  items?: string[];
  tone: "green" | "amber";
}) {
  if (!items || items.length === 0) return null;

  return (
    <div
      className={
        "rounded-3xl border-2 p-5 md:p-6 " +
        (tone === "green"
          ? "bg-green-50 border-green-200"
          : "bg-yellow-50 border-yellow-200")
      }
    >
      <h3 className="font-extrabold text-gray-900 mb-4">{title}</h3>

      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={index} className="flex gap-3">
            <div
              className={
                "mt-0.5 h-7 w-7 rounded-full bg-white flex items-center justify-center shrink-0 text-xs font-extrabold " +
                (tone === "green" ? "text-green-700" : "text-yellow-700")
              }
            >
              {index + 1}
            </div>

            <p className="text-sm text-gray-800 font-medium leading-7">
              {item}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}