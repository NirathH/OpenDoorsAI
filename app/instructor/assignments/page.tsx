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
  Filter,
  CalendarDays,
  User,
  Target,
} from "lucide-react";
import InstructorSidebar from "@/components/InstructorSidebar";
import { requireInstructor } from "@/lib/server/auth/requireInstructor";
import {
  getInstructorAssignments,
  type AssignmentStatusFilter,
} from "@/lib/server/instructor/getInstructorAssignments";
import { formatShortDate } from "@/lib/utils/studentHelpers";

type PageProps = {
  searchParams: Promise<{
    status?: string;
  }>;
};

function getStatusStyles(status: string) {
  if (status === "completed") {
    return "bg-green-50 text-green-700 border-green-200";
  }

  if (status === "in_progress") {
    return "bg-yellow-50 text-yellow-700 border-yellow-200";
  }

  if (status === "overdue") {
    return "bg-red-50 text-red-700 border-red-200";
  }

  return "bg-brand-light text-brand-primary border-brand-muted";
}

function getFilterHref(status: AssignmentStatusFilter) {
  if (status === "all") return "/instructor/assignments";
  return `/instructor/assignments?status=${status}`;
}

export default async function InstructorAssignmentsPage({
  searchParams,
}: PageProps) {
  const { status } = await searchParams;

  const selectedFilter: AssignmentStatusFilter =
    status === "assigned" ||
    status === "in_progress" ||
    status === "completed" ||
    status === "overdue"
      ? status
      : "all";

  const { supabase, instructorId, instructorName } = await requireInstructor();

  const { historyRows, stats } = await getInstructorAssignments(
    supabase,
    instructorId,
    selectedFilter
  );

  const filters: { label: string; value: AssignmentStatusFilter }[] = [
    { label: "All", value: "all" },
    { label: "Assigned", value: "assigned" },
    { label: "In Progress", value: "in_progress" },
    { label: "Completed", value: "completed" },
    { label: "Overdue", value: "overdue" },
  ];

  return (
    <div className="min-h-screen bg-brand-light font-sans flex">
      <InstructorSidebar name={instructorName} />

      <main className="flex-1 min-w-0 p-6 md:p-8">
        <div className="max-w-[1180px] mx-auto">
          <section className="rounded-[2rem] border-2 border-brand-muted bg-white p-6 md:p-8 shadow-sm mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-light border border-brand-muted text-brand-primary text-sm font-bold mb-4">
                  <ClipboardList size={16} />
                  Instructor Workspace
                </div>

                <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">
                  Session Assignments
                </h1>

                <p className="mt-3 text-gray-600 font-medium max-w-2xl leading-relaxed">
                  Create, track, and manage student practice assignments in one
                  clean place.
                </p>
              </div>

              <Link
                href="/instructor/assignments/new"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-secondary hover:bg-brand-primary text-white font-extrabold px-6 py-4 shadow-md transition-colors"
              >
                <Plus size={19} />
                Assign Session
              </Link>
            </div>
          </section>

          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
            <StatCard
              icon={<ClipboardList size={20} />}
              label="Assigned"
              value={String(stats.assigned)}
              description="Waiting to be started"
            />
            <StatCard
              icon={<Clock3 size={20} />}
              label="In Progress"
              value={String(stats.inProgress)}
              description="Currently active"
            />
            <StatCard
              icon={<CheckCircle2 size={20} />}
              label="Completed"
              value={String(stats.completed)}
              description="Finished sessions"
            />
            <StatCard
              icon={<AlertTriangle size={20} />}
              label="Overdue"
              value={String(stats.overdue)}
              description="Needs attention"
            />
          </section>

          <section className="bg-white rounded-[2rem] border-2 border-brand-muted shadow-sm overflow-hidden">
            <div className="p-5 md:p-6 border-b-2 border-brand-muted bg-white">
              <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-2xl bg-brand-light border-2 border-brand-muted flex items-center justify-center text-brand-primary">
                      <Filter size={20} />
                    </div>

                    <div>
                      <h2 className="text-xl md:text-2xl font-extrabold text-gray-900">
                        Assignment History
                      </h2>
                      <p className="text-sm text-gray-500 font-medium mt-1">
                        Showing {historyRows.length} assignment
                        {historyRows.length === 1 ? "" : "s"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {filters.map((filter) => {
                    const active = selectedFilter === filter.value;

                    return (
                      <Link
                        key={filter.value}
                        href={getFilterHref(filter.value)}
                        className={
                          "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-bold border-2 transition-colors " +
                          (active
                            ? "bg-brand-secondary border-brand-secondary text-white"
                            : "bg-white border-brand-muted text-gray-700 hover:border-brand-primary hover:text-brand-primary")
                        }
                      >
                        {filter.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>

            {historyRows.length === 0 ? (
              <div className="p-8">
                <EmptyState text="No assignments found for this filter." />
              </div>
            ) : (
              <div className="p-4 md:p-6 space-y-4">
                {historyRows.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-3xl border-2 border-brand-muted bg-brand-light/30 p-5 md:p-6 hover:bg-white transition-colors"
                  >
                    <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start gap-3 mb-3">
                          <div className="h-11 w-11 rounded-2xl bg-white border-2 border-brand-muted flex items-center justify-center text-brand-primary shrink-0">
                            <Target size={20} />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-lg md:text-xl font-extrabold text-gray-900 break-words">
                                {item.title}
                              </h3>
                              <StatusPill status={item.effective_status} />
                            </div>

                            <div className="mt-2 inline-flex items-center gap-2 text-sm text-gray-600 font-semibold">
                              <User size={15} className="text-brand-primary" />
                              {item.participant_name}
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <Pill
                            icon={<CalendarDays size={14} />}
                            text={`Assigned ${formatShortDate(
                              item.created_at
                            )}`}
                          />
                          <Pill
                            icon={<Clock3 size={14} />}
                            text={`Due ${
                              item.due_at
                                ? formatShortDate(item.due_at)
                                : "No due date"
                            }`}
                          />
                          {item.latest_activity_at && (
                            <Pill
                              icon={<CheckCircle2 size={14} />}
                              text={`Latest ${formatShortDate(
                                item.latest_activity_at
                              )}`}
                            />
                          )}
                        </div>

                        {item.goal && (
                          <div className="mt-5 rounded-2xl border-2 border-brand-muted bg-white p-4">
                            <div className="text-xs font-extrabold text-gray-500 uppercase mb-2">
                              Goal
                            </div>
                            <p className="text-sm text-gray-700 font-medium leading-6">
                              {item.goal}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap xl:flex-col gap-2 xl:min-w-[140px]">
                        <Link
                          href={`/instructor/assignments/${item.id}/edit`}
                          className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-brand-muted bg-white px-4 py-2.5 text-sm font-bold text-gray-800 hover:border-brand-primary hover:text-brand-primary transition-colors"
                        >
                          <Pencil size={16} />
                          Edit
                        </Link>

                        <form
                          action={`/api/instructor/assignments/${item.id}`}
                          method="POST"
                        >
                          <input type="hidden" name="_intent" value="delete" />
                          <button
                            type="submit"
                            className="w-full inline-flex items-center justify-center gap-2 rounded-xl border-2 border-red-200 bg-white px-4 py-2.5 text-sm font-bold text-red-700 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 size={16} />
                            Delete
                          </button>
                        </form>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  description,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl border-2 border-brand-muted bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-extrabold text-gray-900">{label}</p>
          <p className="mt-1 text-xs font-semibold text-gray-500">
            {description}
          </p>
          <p className="mt-4 text-3xl font-extrabold text-gray-900">{value}</p>
        </div>

        <div className="h-11 w-11 rounded-2xl bg-brand-light border-2 border-brand-muted flex items-center justify-center text-brand-primary shrink-0">
          {icon}
        </div>
      </div>
    </div>
  );
}

function Pill({
  icon,
  text,
}: {
  icon?: React.ReactNode;
  text: string;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold border-2 border-brand-muted bg-white text-gray-700">
      {icon}
      {text}
    </span>
  );
}

function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-extrabold border ${getStatusStyles(
        status
      )}`}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-3xl border-2 border-dashed border-brand-muted bg-brand-light/30 p-10 text-center">
      <ClipboardList className="mx-auto text-brand-primary mb-3" size={32} />
      <p className="text-gray-600 font-semibold">{text}</p>
    </div>
  );
}