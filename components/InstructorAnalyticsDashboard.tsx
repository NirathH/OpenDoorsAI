"use client";

import { useRef } from "react";
import { toPng } from "html-to-image";
import {
  Users,
  ClipboardList,
  CheckCircle2,
  Clock3,
  TrendingUp,
  TimerReset,
  Award,
  Activity,
  Download,
  FileSpreadsheet,
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
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

// ─── Color palette used across all charts ────────────────────────────────────
const COLORS = {
  teal: "#0d9488",
  sky: "#38bdf8",
  amber: "#f59e0b",
  slate: "#94a3b8",
  tealLight: "#ccfbf1",
};

// ─── Types ────────────────────────────────────────────────────────────────────

type SessionsByStudentItem = {
  participantId: string;
  studentName: string;
  completedSessions: number;
  totalSessions: number;
};

type SessionsOverTimeItem = {
  date: string;
  completedSessions: number;
};

type InstructorAnalytics = {
  totalStudents: number;
  totalAssignments: number;
  completedSessions: number;
  pendingAssignments: number;
  completionRate: number;
  averageSessionDurationSeconds: number;
  averageSessionDurationLabel: string;
  assignedVsCompleted: {
    assigned: number;
    completed: number;
    pending: number;
  };
  sessionsByStudent: SessionsByStudentItem[];
  sessionsOverTime: SessionsOverTimeItem[];
};

type Props = {
  analytics: InstructorAnalytics;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatChartDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function downloadCsv(filename: string, rows: Record<string, string | number>[]) {
  if (!rows.length) return;

  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((header) => {
          const value = String(row[header] ?? "").replace(/"/g, '""');
          return `"${value}"`;
        })
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

async function downloadElementAsPng(
  element: HTMLElement | null,
  filename: string
) {
  if (!element) return;

  const dataUrl = await toPng(element, {
    cacheBust: true,
    pixelRatio: 2,
    backgroundColor: "#ffffff",
  });

  const link = document.createElement("a");
  link.download = filename;
  link.href = dataUrl;
  link.click();
}

// ─── Shared chart tooltip style ───────────────────────────────────────────────

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

// ─── Sub-components ───────────────────────────────────────────────────────────

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
    <div className="rounded-2xl border-2 border-brand-muted bg-white p-5 shadow-sm flex items-start gap-4">
      <div
        className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${accent}18`, color: accent }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
          {title}
        </p>
        <p className="mt-1 text-2xl font-extrabold text-gray-900 leading-none">
          {value}
        </p>
        <p className="mt-1 text-xs text-gray-400 font-medium">{subtitle}</p>
      </div>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
  onDownloadPng,
  onExportCsv,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onDownloadPng?: () => void;
  onExportCsv?: () => void;
}) {
  return (
    <section className="rounded-2xl border-2 border-brand-muted bg-white shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b-2 border-brand-muted flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-base font-extrabold text-gray-900">{title}</h2>
          {subtitle && (
            <p className="text-xs text-gray-400 font-medium mt-0.5">
              {subtitle}
            </p>
          )}
        </div>

        {(onDownloadPng || onExportCsv) && (
          <div className="flex flex-wrap gap-2">
            {onDownloadPng && (
              <button
                type="button"
                onClick={onDownloadPng}
                className="inline-flex items-center gap-2 rounded-xl border-2 border-brand-muted bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:border-brand-primary hover:text-brand-primary transition"
              >
                <Download size={14} />
                PNG
              </button>
            )}

            {onExportCsv && (
              <button
                type="button"
                onClick={onExportCsv}
                className="inline-flex items-center gap-2 rounded-xl border-2 border-brand-muted bg-brand-light/30 px-3 py-2 text-xs font-semibold text-gray-700 hover:border-brand-primary hover:text-brand-primary transition"
              >
                <FileSpreadsheet size={14} />
                CSV
              </button>
            )}
          </div>
        )}
      </div>

      <div className="p-5">{children}</div>
    </section>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="h-[260px] flex items-center justify-center rounded-2xl border-2 border-dashed border-brand-muted bg-brand-light/20 text-gray-400 text-sm font-semibold">
      {label}
    </div>
  );
}

// ─── Main dashboard ───────────────────────────────────────────────────────────

export default function InstructorAnalyticsDashboard({ analytics }: Props) {
  const assignedChartRef = useRef<HTMLDivElement>(null);
  const pieChartRef = useRef<HTMLDivElement>(null);
  const lineChartRef = useRef<HTMLDivElement>(null);
  const studentsChartRef = useRef<HTMLDivElement>(null);

  const assignedVsCompletedData = [
    {
      name: "Assigned",
      value: analytics.assignedVsCompleted.assigned,
      fill: COLORS.sky,
    },
    {
      name: "Completed",
      value: analytics.assignedVsCompleted.completed,
      fill: COLORS.teal,
    },
    {
      name: "Pending",
      value: analytics.assignedVsCompleted.pending,
      fill: COLORS.amber,
    },
  ];

  const sessionsByStudentData = analytics.sessionsByStudent
    .slice(0, 8)
    .map((item) => ({
      studentName: item.studentName,
      name:
        item.studentName.length > 12
          ? `${item.studentName.slice(0, 12)}…`
          : item.studentName,
      completed: item.completedSessions,
      total: item.totalSessions,
    }));

  const sessionsOverTimeData = analytics.sessionsOverTime.map((item) => ({
    ...item,
    label: formatChartDate(item.date),
  }));

  const pieData = [
    {
      name: "Completed",
      value: analytics.completedSessions,
      fill: COLORS.teal,
    },
    {
      name: "Pending",
      value: analytics.pendingAssignments,
      fill: COLORS.amber,
    },
  ];

  const topStudents = analytics.sessionsByStudent.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* ── Stat row ── */}
      <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <StatCard
          title="Students"
          value={analytics.totalStudents}
          subtitle="Assigned to you"
          icon={<Users size={20} />}
          accent={COLORS.teal}
        />
        <StatCard
          title="Assignments"
          value={analytics.totalAssignments}
          subtitle="Total sessions assigned"
          icon={<ClipboardList size={20} />}
          accent={COLORS.sky}
        />
        <StatCard
          title="Completed"
          value={analytics.completedSessions}
          subtitle="Finished sessions"
          icon={<CheckCircle2 size={20} />}
          accent={COLORS.teal}
        />
        <StatCard
          title="Pending"
          value={analytics.pendingAssignments}
          subtitle="Awaiting completion"
          icon={<Clock3 size={20} />}
          accent={COLORS.amber}
        />
        <StatCard
          title="Completion Rate"
          value={`${analytics.completionRate}%`}
          subtitle="Assigned vs completed"
          icon={<TrendingUp size={20} />}
          accent={COLORS.teal}
        />
        <StatCard
          title="Avg Duration"
          value={analytics.averageSessionDurationLabel}
          subtitle="Per completed session"
          icon={<TimerReset size={20} />}
          accent={COLORS.sky}
        />
      </section>

      {/* ── Row 2: bar + donut ── */}
      <section className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <ChartCard
          title="Assignment Progress"
          subtitle="Assigned · Completed · Pending"
          onDownloadPng={() =>
            downloadElementAsPng(
              assignedChartRef.current,
              "assignment-progress-chart.png"
            )
          }
          onExportCsv={() =>
            downloadCsv(
              "assignment-progress.csv",
              assignedVsCompletedData.map((item) => ({
                name: item.name,
                value: item.value,
              }))
            )
          }
        >
          {assignedVsCompletedData.some((d) => d.value > 0) ? (
            <div ref={assignedChartRef}>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={assignedVsCompletedData} barCategoryGap="40%">
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#f1f5f9"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 12, fontWeight: 600, fill: "#64748b" }}
                    />
                    <YAxis
                      allowDecimals={false}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11, fill: COLORS.slate }}
                    />
                    <Tooltip {...tooltipStyle} />
                    <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                      {assignedVsCompletedData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <EmptyState label="No assignment activity yet." />
          )}
        </ChartCard>

        <ChartCard
          title="Completion Split"
          subtitle="Completed vs still pending"
          onDownloadPng={() =>
            downloadElementAsPng(
              pieChartRef.current,
              "completion-split-chart.png"
            )
          }
          onExportCsv={() =>
            downloadCsv(
              "completion-split.csv",
              pieData.map((item) => ({
                name: item.name,
                value: item.value,
              }))
            )
          }
        >
          {pieData.some((d) => d.value > 0) ? (
            <div ref={pieChartRef}>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={72}
                      outerRadius={108}
                      paddingAngle={4}
                      strokeWidth={0}
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Legend
                      iconType="circle"
                      iconSize={10}
                      formatter={(value) => (
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: "#475569",
                          }}
                        >
                          {value}
                        </span>
                      )}
                    />
                    <Tooltip {...tooltipStyle} cursor={false} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <EmptyState label="No completion data yet." />
          )}
        </ChartCard>
      </section>

      {/* ── Row 3: line chart + top students ── */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2">
          <ChartCard
            title="Sessions Over Time"
            subtitle="Completed sessions by date"
            onDownloadPng={() =>
              downloadElementAsPng(
                lineChartRef.current,
                "sessions-over-time-chart.png"
              )
            }
            onExportCsv={() =>
              downloadCsv(
                "sessions-over-time.csv",
                sessionsOverTimeData.map((item) => ({
                  date: item.date,
                  label: item.label,
                  completedSessions: item.completedSessions,
                }))
              )
            }
          >
            {sessionsOverTimeData.length > 0 ? (
              <div ref={lineChartRef}>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={sessionsOverTimeData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#f1f5f9"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="label"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 11, fill: COLORS.slate }}
                      />
                      <YAxis
                        allowDecimals={false}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 11, fill: COLORS.slate }}
                      />
                      <Tooltip {...tooltipStyle} />
                      <Line
                        type="monotone"
                        dataKey="completedSessions"
                        stroke={COLORS.teal}
                        strokeWidth={3}
                        dot={{ r: 4, fill: COLORS.teal, strokeWidth: 0 }}
                        activeDot={{
                          r: 6,
                          fill: COLORS.teal,
                          stroke: COLORS.tealLight,
                          strokeWidth: 3,
                        }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <EmptyState label="No completed sessions over time yet." />
            )}
          </ChartCard>
        </div>

        <ChartCard title="Top Participants" subtitle="Most sessions completed">
          {topStudents.length > 0 ? (
            <div className="space-y-2.5">
              {topStudents.map((student, index) => (
                <div
                  key={student.participantId}
                  className="flex items-center gap-3 rounded-xl border-2 border-brand-muted bg-brand-light/20 px-3 py-2.5"
                >
                  <div
                    className="h-7 w-7 rounded-lg flex items-center justify-center text-xs font-extrabold shrink-0 text-white"
                    style={{
                      background:
                        index === 0
                          ? COLORS.teal
                          : index === 1
                          ? COLORS.sky
                          : COLORS.slate,
                    }}
                  >
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-gray-900 truncate">
                      {student.studentName}
                    </p>
                    <p className="text-xs text-gray-400 font-medium">
                      {student.totalSessions} total
                    </p>
                  </div>
                  <span
                    className="shrink-0 inline-flex items-center gap-1 text-xs font-bold rounded-full px-2.5 py-1"
                    style={{ background: COLORS.tealLight, color: COLORS.teal }}
                  >
                    <Award size={12} />
                    {student.completedSessions}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState label="No participant data yet." />
          )}
        </ChartCard>
      </section>

      {/* ── Row 4: per-student bar + snapshot ── */}
      <section className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <ChartCard
          title="Completed Sessions by Student"
          subtitle="Top 8 most active participants"
          onDownloadPng={() =>
            downloadElementAsPng(
              studentsChartRef.current,
              "completed-sessions-by-student-chart.png"
            )
          }
          onExportCsv={() =>
            downloadCsv(
              "completed-sessions-by-student.csv",
              sessionsByStudentData.map((item) => ({
                studentName: item.studentName,
                completedSessions: item.completed,
                totalSessions: item.total,
              }))
            )
          }
        >
          {sessionsByStudentData.length > 0 ? (
            <div ref={studentsChartRef}>
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sessionsByStudentData} barCategoryGap="35%">
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#f1f5f9"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11, fill: COLORS.slate }}
                    />
                    <YAxis
                      allowDecimals={false}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11, fill: COLORS.slate }}
                    />
                    <Tooltip {...tooltipStyle} />
                    <Bar
                      dataKey="total"
                      name="Total"
                      fill={COLORS.sky}
                      radius={[8, 8, 0, 0]}
                    />
                    <Bar
                      dataKey="completed"
                      name="Completed"
                      fill={COLORS.teal}
                      radius={[8, 8, 0, 0]}
                    />
                    <Legend
                      iconType="circle"
                      iconSize={10}
                      formatter={(value) => (
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: "#475569",
                          }}
                        >
                          {value}
                        </span>
                      )}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <EmptyState label="No student completion data yet." />
          )}
        </ChartCard>

        <ChartCard title="Snapshot" subtitle="Overall activity at a glance">
          <div className="grid grid-cols-2 gap-3 mb-4">
            <MiniInsight
              icon={<Activity size={16} />}
              label="Most Active"
              value={analytics.sessionsByStudent[0]?.studentName || "—"}
            />
            <MiniInsight
              icon={<CheckCircle2 size={16} />}
              label="Best Count"
              value={
                analytics.sessionsByStudent[0]
                  ? `${analytics.sessionsByStudent[0].completedSessions} done`
                  : "0 done"
              }
            />
            <MiniInsight
              icon={<Users size={16} />}
              label="Students"
              value={String(analytics.totalStudents)}
            />
            <MiniInsight
              icon={<ClipboardList size={16} />}
              label="Assignments"
              value={String(analytics.totalAssignments)}
            />
          </div>

          <div className="rounded-xl border-2 border-brand-muted bg-brand-light/30 p-4">
            <p className="text-sm leading-6 text-gray-600 font-medium">
              You manage{" "}
              <span className="font-bold text-gray-900">
                {analytics.totalStudents}
              </span>{" "}
              student{analytics.totalStudents === 1 ? "" : "s"} and have assigned{" "}
              <span className="font-bold text-gray-900">
                {analytics.totalAssignments}
              </span>{" "}
              session{analytics.totalAssignments === 1 ? "" : "s"}.{" "}
              <span className="font-bold text-gray-900">
                {analytics.completedSessions}
              </span>{" "}
              completed — a{" "}
              <span style={{ color: COLORS.teal }} className="font-extrabold">
                {analytics.completionRate}%
              </span>{" "}
              completion rate.
            </p>
          </div>
        </ChartCard>
      </section>
    </div>
  );
}

function MiniInsight({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border-2 border-brand-muted bg-brand-light/20 p-3">
      <div
        className="flex items-center gap-1.5 mb-1"
        style={{ color: COLORS.teal }}
      >
        {icon}
      </div>
      <p className="text-xs text-gray-400 font-semibold">{label}</p>
      <p className="text-sm font-bold text-gray-900 mt-0.5 truncate">{value}</p>
    </div>
  );
}