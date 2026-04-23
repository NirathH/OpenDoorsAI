"use client";

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
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
  Cell,
} from "recharts";

// ─── Color palette ────────────────────────────────────────────────────────────
const COLORS = {
  teal:      "#0d9488",
  sky:       "#38bdf8",
  amber:     "#f59e0b",
  slate:     "#94a3b8",
  tealLight: "#ccfbf1",
  green:     "#22c55e",
  greenLight:"#dcfce7",
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

// ─── Types ────────────────────────────────────────────────────────────────────

type ProgressByAssignmentItem = {
  assignmentId: string;
  title: string;
  status: string;
  completed: boolean;
  sessionCount: number;
};

type SessionsOverTimeItem = {
  date: string;
  completedSessions: number;
};

type RecentSession = {
  id: string;
  assignment_id: string | null;
  title: string | null;
  status: string | null;
  duration_seconds: number | null;
  created_at: string | null;
  started_at: string | null;
  ended_at: string | null;
};

type PendingGoal = {
  id: string;
  title: string | null;
  status: string | null;
  created_at: string | null;
  due_at: string | null;
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
  progressByAssignment: ProgressByAssignmentItem[];
  sessionsOverTime: SessionsOverTimeItem[];
  recentSessions: RecentSession[];
  pendingGoals: PendingGoal[];
};

type Props = {
  participantName: string;
  participantEmail: string;
  progress: ParticipantProgress;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatChartDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatDuration(seconds: number | null) {
  if (!seconds || seconds <= 0) return "—";
  return `${Math.round(seconds / 60)}m`;
}

function formatShortDate(dateString: string | null) {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  title, value, subtitle, icon, accent = COLORS.teal,
}: {
  title: string; value: string | number; subtitle: string; icon: React.ReactNode; accent?: string;
}) {
  return (
    <div className="rounded-2xl border-2 border-brand-muted bg-white p-5 shadow-sm flex items-start gap-4">
      <div className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${accent}18`, color: accent }}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{title}</p>
        <p className="mt-1 text-2xl font-extrabold text-gray-900 leading-none">{value}</p>
        <p className="mt-1 text-xs text-gray-400 font-medium">{subtitle}</p>
      </div>
    </div>
  );
}

function InfoTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border-2 border-brand-muted bg-brand-light/30 p-4">
      <div className="flex items-center gap-2 mb-1.5" style={{ color: COLORS.teal }}>{icon}</div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-sm font-bold text-gray-900 whitespace-pre-line">{value}</p>
    </div>
  );
}

function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border-2 border-brand-muted bg-white shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b-2 border-brand-muted">
        <h2 className="text-base font-extrabold text-gray-900">{title}</h2>
        {subtitle && <p className="text-xs text-gray-400 font-medium mt-0.5">{subtitle}</p>}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="h-[220px] flex items-center justify-center rounded-2xl border-2 border-dashed border-brand-muted bg-brand-light/20 text-gray-400 text-sm font-semibold">
      {label}
    </div>
  );
}

// ─── Main dashboard ───────────────────────────────────────────────────────────

export default function ParticipantProgressDashboard({ participantName, participantEmail, progress }: Props) {

  const progressByGoalData = progress.progressByAssignment.slice(0, 8).map((item) => ({
    name: item.title.length > 14 ? `${item.title.slice(0, 14)}…` : item.title,
    sessions: item.sessionCount,
    fill: item.completed ? COLORS.teal : COLORS.sky,
  }));

  const sessionsOverTimeData = progress.sessionsOverTime.map((item) => ({
    ...item,
    label: formatChartDate(item.date),
  }));

  return (
    <div className="space-y-6">

      {/* ── Profile header ── */}
      <section className="bg-white rounded-2xl border-2 border-brand-muted shadow-sm p-6 md:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div
              className="h-14 w-14 rounded-2xl flex items-center justify-center text-white font-extrabold text-xl shrink-0"
              style={{ background: COLORS.teal }}
            >
              {participantName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h2 className="text-2xl font-extrabold text-gray-900 truncate">
                {progress.participantInfo.fullName}
              </h2>
              <p className="text-xs text-gray-400 font-medium mt-0.5">Personalized progress dashboard</p>
            </div>
          </div>

          <span
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold w-fit"
            style={{ background: COLORS.tealLight, color: COLORS.teal }}
          >
            <TrendingUp size={15} />
            {progress.completionRate}% completion rate
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-5">
          <InfoTile icon={<Briefcase size={16} />} label="Job Goal"      value={progress.participantInfo.jobGoal} />
          <InfoTile icon={<StickyNote size={16} />} label="Support Notes" value={progress.participantInfo.supportNotes} />
        </div>
      </section>

      {/* ── Stat row ── */}
      <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        <StatCard title="Assigned"    value={progress.totalAssignments}           subtitle="Goals assigned"          icon={<ClipboardList size={20} />} accent={COLORS.sky} />
        <StatCard title="Completed"   value={progress.completedAssignments}       subtitle="Goals finished"          icon={<CheckCircle2 size={20} />}  accent={COLORS.teal} />
        <StatCard title="Pending"     value={progress.pendingAssignments}         subtitle="Still to complete"       icon={<Clock3 size={20} />}        accent={COLORS.amber} />
        <StatCard title="Sessions"    value={progress.totalSessions}              subtitle="Practice sessions"       icon={<Activity size={20} />}      accent={COLORS.sky} />
        <StatCard title="Avg Time"    value={progress.averageSessionDurationLabel} subtitle="Per session"            icon={<TimerReset size={20} />}    accent={COLORS.teal} />
      </section>

      {/* ── Charts ── */}
      <section className="grid grid-cols-1 xl:grid-cols-2 gap-5">

        <Card title="Goal Activity" subtitle="Sessions linked to each assigned goal">
          {progressByGoalData.length > 0 ? (
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={progressByGoalData} barCategoryGap="40%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: COLORS.slate }} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: COLORS.slate }} />
                  <Tooltip {...tooltipStyle} />
                  <Bar dataKey="sessions" radius={[10, 10, 0, 0]}>
                    {progressByGoalData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <EmptyState label="No goal activity yet." />}
        </Card>

        <Card title="Sessions Over Time" subtitle="Completed sessions by date">
          {sessionsOverTimeData.length > 0 ? (
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sessionsOverTimeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: COLORS.slate }} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: COLORS.slate }} />
                  <Tooltip {...tooltipStyle} />
                  <Line
                    type="monotone"
                    dataKey="completedSessions"
                    stroke={COLORS.teal}
                    strokeWidth={3}
                    dot={{ r: 4, fill: COLORS.teal, strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: COLORS.teal, stroke: COLORS.tealLight, strokeWidth: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : <EmptyState label="No completed session activity yet." />}
        </Card>

      </section>

      {/* ── Recent sessions + pending goals ── */}
      <section className="grid grid-cols-1 xl:grid-cols-2 gap-5">

        <Card title="Recent Sessions" subtitle="Latest practice sessions">
          {progress.recentSessions.length > 0 ? (
            <div className="space-y-2.5">
              {progress.recentSessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between gap-4 rounded-xl border-2 border-brand-muted bg-brand-light/20 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{session.title || "Practice Session"}</p>
                    <p className="text-xs text-gray-400 font-medium mt-0.5">{formatShortDate(session.ended_at || session.created_at)}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span
                      className="text-xs font-bold px-2.5 py-1 rounded-full"
                      style={
                        session.status === "completed"
                          ? { background: COLORS.greenLight, color: COLORS.green }
                          : { background: "#f1f5f9", color: COLORS.slate }
                      }
                    >
                      {session.status || "pending"}
                    </span>
                    <p className="text-xs text-gray-400 mt-1">{formatDuration(session.duration_seconds)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : <EmptyState label="No sessions yet." />}
        </Card>

        <Card title="Pending Goals" subtitle="Goals still needing your attention">
          {progress.pendingGoals.length > 0 ? (
            <div className="space-y-2.5">
              {progress.pendingGoals.map((goal) => (
                <div key={goal.id} className="flex items-center justify-between gap-4 rounded-xl border-2 border-brand-muted bg-brand-light/20 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{goal.title || "Untitled Goal"}</p>
                    <p className="text-xs text-gray-400 font-medium mt-0.5">Assigned {formatShortDate(goal.created_at)}</p>
                  </div>
                  <span className="shrink-0 inline-flex items-center gap-1.5 text-xs font-bold rounded-full px-2.5 py-1" style={{ background: "#fef9c3", color: COLORS.amber }}>
                    <Target size={12} />
                    Pending
                  </span>
                </div>
              ))}
            </div>
          ) : <EmptyState label="No pending goals. Great job." />}
        </Card>

      </section>

      {/* ── Progress by goal ── */}
      <Card title="Goal Progress" subtitle="Status and activity for each assigned goal">
        {progress.progressByAssignment.length > 0 ? (
          <div className="space-y-3">
            {progress.progressByAssignment.map((item) => {
              const pct = item.completed ? 100 : item.sessionCount > 0 ? 60 : 15;
              return (
                <div key={item.assignmentId} className="rounded-xl border-2 border-brand-muted bg-brand-light/20 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{item.title}</p>
                      <p className="text-xs text-gray-400 font-medium mt-0.5">
                        {item.sessionCount} session{item.sessionCount === 1 ? "" : "s"}
                      </p>
                    </div>
                    <span
                      className="shrink-0 inline-flex items-center gap-1.5 text-xs font-bold rounded-full px-2.5 py-1"
                      style={
                        item.completed
                          ? { background: COLORS.greenLight, color: COLORS.green }
                          : { background: COLORS.tealLight, color: COLORS.teal }
                      }
                    >
                      {item.completed ? <CheckCircle2 size={12} /> : <Activity size={12} />}
                      {item.completed ? "Completed" : "In Progress"}
                    </span>
                  </div>

                  <div className="mt-3 h-2 w-full rounded-full bg-white border border-brand-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, background: item.completed ? COLORS.green : COLORS.teal }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : <EmptyState label="No goal progress yet." />}
      </Card>

    </div>
  );
}