export const dynamic = "force-dynamic";

import type React from "react";
import Link from "next/link";
import {
  ClipboardList,
  CheckCircle2,
  Clock3,
  AlertTriangle,
  Pencil,
  Trash2,
  Plus,
  CalendarDays,
  User,
  Eye,
} from "lucide-react";
import InstructorSidebar from "@/components/InstructorSidebar";
import { requireInstructor } from "@/lib/server/auth/requireInstructor";
import {
  getInstructorAssignments,
} from "@/lib/server/instructor/getInstructorAssignments";
import { formatShortDate } from "@/lib/utils/studentHelpers";

type PageProps = {
  searchParams: Promise<{
    active_filter?: string;
    completed_filter?: string;
  }>;
};

type ActiveFilter = "all" | "assigned" | "in_progress" | "overdue";
type CompletedFilter = "this_week" | "this_month" | "all_time";

function getActiveBadgeStyles(status: string) {
  if (status === "in_progress")
    return "bg-yellow-50 text-yellow-700 border border-yellow-200";
  if (status === "overdue")
    return "bg-red-50 text-red-700 border border-red-200";
  return "bg-brand-light text-brand-primary border border-brand-muted";
}

export default async function InstructorAssignmentsPage({
  searchParams,
}: PageProps) {
  const { active_filter, completed_filter } = await searchParams;

  const activeFilter: ActiveFilter =
    active_filter === "assigned" ||
    active_filter === "in_progress" ||
    active_filter === "overdue"
      ? active_filter
      : "all";

  const completedFilter: CompletedFilter =
    completed_filter === "this_month" || completed_filter === "all_time"
      ? completed_filter
      : "this_week";

  const { supabase, instructorId, instructorName } = await requireInstructor();

  const { historyRows: allRows, stats } = await getInstructorAssignments(
    supabase,
    instructorId,
    "all"
  );

  const activeRows = allRows.filter((r) => r.effective_status !== "completed");
  const completedRows = allRows.filter(
    (r) => r.effective_status === "completed"
  );

  const filteredActiveRows =
    activeFilter === "all"
      ? activeRows
      : activeRows.filter((r) => r.effective_status === activeFilter);

  // Wire up date filtering here when ready
  const filteredCompletedRows = completedRows;

  const activeFilters: { label: string; value: ActiveFilter }[] = [
    { label: "All", value: "all" },
    { label: "Assigned", value: "assigned" },
    { label: "In progress", value: "in_progress" },
    { label: "Overdue", value: "overdue" },
  ];

  const completedFilters: { label: string; value: CompletedFilter }[] = [
    { label: "This week", value: "this_week" },
    { label: "This month", value: "this_month" },
    { label: "All time", value: "all_time" },
  ];

  function activeFilterHref(a: ActiveFilter) {
    const p = new URLSearchParams();
    if (a !== "all") p.set("active_filter", a);
    if (completedFilter !== "this_week") p.set("completed_filter", completedFilter);
    const qs = p.toString();
    return `/instructor/assignments${qs ? `?${qs}` : ""}`;
  }

  function completedFilterHref(c: CompletedFilter) {
    const p = new URLSearchParams();
    if (activeFilter !== "all") p.set("active_filter", activeFilter);
    if (c !== "this_week") p.set("completed_filter", c);
    const qs = p.toString();
    return `/instructor/assignments${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="min-h-screen bg-brand-light font-sans flex">
      <InstructorSidebar name={instructorName} />

      <main className="flex-1 min-w-0 p-6 md:p-8 flex flex-col gap-6">
        <div className="max-w-[1280px] mx-auto w-full flex flex-col gap-6">

          {/* ── Header ── */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-brand-muted text-brand-primary text-xs font-bold mb-3">
                <ClipboardList size={13} />
                Instructor Workspace
              </div>
              <h1 className="text-2xl font-extrabold text-gray-900">
                Session Assignments
              </h1>
              <p className="text-sm text-gray-500 font-medium mt-1">
                Create, track, and manage student practice assignments.
              </p>
            </div>
            <Link
              href="/instructor/assignments/new"
              className="inline-flex items-center gap-2 bg-brand-secondary hover:bg-brand-primary text-white text-sm font-bold px-5 py-2.5 rounded-xl shadow-sm transition-colors whitespace-nowrap"
            >
              <Plus size={15} />
              Assign Session
            </Link>
          </div>

          {/* ── Stats ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatTile
              icon={<ClipboardList size={16} />}
              dotColor="bg-brand-primary"
              label="Assigned"
              value={stats.assigned}
              sub="Waiting to start"
            />
            <StatTile
              icon={<Clock3 size={16} />}
              dotColor="bg-yellow-400"
              label="In progress"
              value={stats.inProgress}
              sub="Currently active"
            />
            <StatTile
              icon={<AlertTriangle size={16} />}
              dotColor="bg-red-400"
              label="Overdue"
              value={stats.overdue}
              sub="Needs attention"
            />
            <StatTile
              icon={<CheckCircle2 size={16} />}
              dotColor="bg-green-500"
              label="Completed"
              value={stats.completed}
              sub="Finished sessions"
            />
          </div>

          {/* ── Two panels ── */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

            {/* Active */}
            <div className="bg-white border-2 border-brand-muted rounded-2xl overflow-hidden flex flex-col">
              <div className="flex items-center justify-between gap-3 px-5 py-4 border-b-2 border-brand-muted">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-extrabold text-gray-900">
                    Active
                  </span>
                  <span className="text-xs font-bold text-brand-primary bg-brand-light border border-brand-muted rounded-full px-2 py-0.5">
                    {activeRows.length}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {activeFilters.map((f) => (
                    <Link
                      key={f.value}
                      href={activeFilterHref(f.value)}
                      className={
                        "text-xs px-3 py-1.5 rounded-xl border-2 transition-colors font-bold " +
                        (activeFilter === f.value
                          ? "bg-brand-secondary border-brand-secondary text-white"
                          : "bg-white border-brand-muted text-gray-600 hover:border-brand-primary hover:text-brand-primary")
                      }
                    >
                      {f.label}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-brand-muted/50">
                {filteredActiveRows.length === 0 ? (
                  <EmptyState text="No active assignments for this filter." />
                ) : (
                  filteredActiveRows.map((item) => (
                    <AssignmentRow
                      key={item.id}
                      item={item}
                      variant="active"
                      badgeStyles={getActiveBadgeStyles(item.effective_status)}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Completed */}
            <div className="bg-white border-2 border-brand-muted rounded-2xl overflow-hidden flex flex-col">
              <div className="flex items-center justify-between gap-3 px-5 py-4 border-b-2 border-brand-muted">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-extrabold text-gray-900">
                    Completed
                  </span>
                  <span className="text-xs font-bold text-brand-primary bg-brand-light border border-brand-muted rounded-full px-2 py-0.5">
                    {completedRows.length}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {completedFilters.map((f) => (
                    <Link
                      key={f.value}
                      href={completedFilterHref(f.value)}
                      className={
                        "text-xs px-3 py-1.5 rounded-xl border-2 transition-colors font-bold " +
                        (completedFilter === f.value
                          ? "bg-brand-secondary border-brand-secondary text-white"
                          : "bg-white border-brand-muted text-gray-600 hover:border-brand-primary hover:text-brand-primary")
                      }
                    >
                      {f.label}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-brand-muted/50">
                {filteredCompletedRows.length === 0 ? (
                  <EmptyState text="No completed assignments yet." />
                ) : (
                  filteredCompletedRows.map((item) => (
                    <AssignmentRow
                      key={item.id}
                      item={item}
                      variant="completed"
                      badgeStyles="bg-green-50 text-green-700 border border-green-200"
                    />
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}

// ─── StatTile ─────────────────────────────────────────────────────────────────

function StatTile({
  icon,
  dotColor,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  dotColor: string;
  label: string;
  value: number;
  sub: string;
}) {
  return (
    <div className="bg-white border-2 border-brand-muted rounded-2xl px-4 py-4">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dotColor}`} />
            <span className="text-xs font-extrabold text-gray-900">{label}</span>
          </div>
          <p className="text-xs text-gray-400 font-medium">{sub}</p>
        </div>
        <div className="h-8 w-8 rounded-xl bg-brand-light border border-brand-muted flex items-center justify-center text-brand-primary flex-shrink-0">
          {icon}
        </div>
      </div>
      <p className="text-3xl font-extrabold text-gray-900">{value}</p>
    </div>
  );
}

// ─── AssignmentRow ────────────────────────────────────────────────────────────

function AssignmentRow({
  item,
  variant,
  badgeStyles,
}: {
  item: {
    id: string;
    title: string;
    effective_status: string;
    participant_name: string;
    created_at: string;
    due_at: string | null;
    latest_activity_at: string | null;
    goal: string | null;
  };
  variant: "active" | "completed";
  badgeStyles: string;
}) {
  return (
    <div className="flex items-start gap-3 px-5 py-4 hover:bg-brand-light/40 transition-colors">
      <div className="flex-1 min-w-0">

        {/* Title + badge */}
        <div className="flex items-center gap-2 flex-wrap mb-1.5">
          <span className="text-sm font-extrabold text-gray-900 truncate">
            {item.title}
          </span>
          <span
            className={`inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${badgeStyles}`}
          >
            {item.effective_status.replaceAll("_", " ")}
          </span>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="inline-flex items-center gap-1 text-xs text-gray-500 font-semibold">
            <User size={11} className="text-brand-primary" />
            {item.participant_name}
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-gray-400 font-medium">
            <CalendarDays size={11} />
            {item.due_at
              ? `Due ${formatShortDate(item.due_at)}`
              : "No due date"}
          </span>
          {variant === "completed" && item.latest_activity_at && (
            <span className="text-xs text-green-600 font-bold">
              Done {formatShortDate(item.latest_activity_at)}
            </span>
          )}
          {variant === "active" && item.effective_status === "overdue" && (
            <span className="text-xs text-red-500 font-bold">Past due</span>
          )}
        </div>

        {/* Goal */}
        {item.goal && (
          <p className="mt-2 text-xs text-gray-400 font-medium leading-relaxed border-l-2 border-brand-muted pl-2.5">
            {item.goal}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 flex-shrink-0 pt-0.5">
        {variant === "active" ? (
          <>
            <Link
              href={`/instructor/assignments/${item.id}/edit`}
              className="inline-flex items-center gap-1 text-xs font-bold text-gray-600 hover:text-brand-primary border-2 border-brand-muted hover:border-brand-primary bg-white rounded-xl px-3 py-1.5 transition-colors"
            >
              <Pencil size={11} />
              Edit
            </Link>
            <form
              action={`/api/instructor/assignments/${item.id}`}
              method="POST"
            >
              <input type="hidden" name="_intent" value="delete" />
              <button
                type="submit"
                className="inline-flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-700 border-2 border-red-100 hover:border-red-300 bg-white rounded-xl px-3 py-1.5 transition-colors"
              >
                <Trash2 size={11} />
                Del
              </button>
            </form>
          </>
        ) : (
          <Link
            href={`/instructor/assignments/${item.id}`}
            className="inline-flex items-center gap-1 text-xs font-bold text-gray-600 hover:text-brand-primary border-2 border-brand-muted hover:border-brand-primary bg-white rounded-xl px-3 py-1.5 transition-colors"
          >
            <Eye size={11} />
            View
          </Link>
        )}
      </div>
    </div>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
      <div className="h-12 w-12 rounded-2xl bg-brand-light border-2 border-brand-muted flex items-center justify-center text-brand-primary mb-3">
        <ClipboardList size={22} />
      </div>
      <p className="text-sm text-gray-500 font-semibold">{text}</p>
    </div>
  );
}