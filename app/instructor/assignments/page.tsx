export const dynamic = "force-dynamic";

import Link from "next/link";
import {
  ClipboardList,
  CheckCircle2,
  Clock3,
  AlertTriangle,
  Pencil,
  Trash2,
  Plus,
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
    return "bg-emerald-100 text-emerald-700 border-emerald-200";
  }
  if (status === "in_progress") {
    return "bg-amber-100 text-amber-700 border-amber-200";
  }
  if (status === "overdue") {
    return "bg-red-100 text-red-700 border-red-200";
  }
  return "bg-blue-100 text-blue-700 border-blue-200";
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

  return (
    <div className="min-h-screen bg-brand-light font-sans flex">
      <InstructorSidebar name={instructorName} />

      <main className="flex-1 min-w-0 p-6 md:p-8">
        <div className="max-w-[1100px] mx-auto">
          <section className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 mb-8">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900">
                Session Assignments
              </h1>
              <p className="mt-2 text-gray-600 font-medium">
                Create, track, and manage session assignments.
              </p>
            </div>

            <Link
              href="/instructor/assignments/new"
              className="inline-flex items-center gap-2 rounded-2xl bg-brand-secondary hover:bg-brand-primary text-white font-semibold px-5 py-3 shadow-md transition-colors"
            >
              <Plus size={18} />
              Assign Session
            </Link>
          </section>

          <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard
              icon={<ClipboardList size={18} />}
              label="Assigned"
              value={String(stats.assigned)}
            />
            <StatCard
              icon={<Clock3 size={18} />}
              label="In Progress"
              value={String(stats.inProgress)}
            />
            <StatCard
              icon={<CheckCircle2 size={18} />}
              label="Completed"
              value={String(stats.completed)}
            />
            <StatCard
              icon={<AlertTriangle size={18} />}
              label="Overdue"
              value={String(stats.overdue)}
            />
          </section>

          <section className="bg-white rounded-[2rem] border-2 border-brand-muted shadow-sm overflow-hidden">
            <div className="p-5 md:p-6 border-b-2 border-brand-muted bg-brand-light/30 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-gray-900">
                  All Assignments
                </h2>
                <p className="text-sm text-gray-500 font-medium mt-1">
                  Filter assignments by status.
                </p>
              </div>

              <form method="GET" className="flex items-center gap-3">
                <select
                  name="status"
                  defaultValue={selectedFilter}
                  className="rounded-xl border-2 border-brand-muted bg-white px-4 py-2 text-sm font-medium text-gray-800 outline-none focus:border-brand-primary"
                >
                  <option value="all">All</option>
                  <option value="assigned">Assigned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="overdue">Overdue</option>
                </select>

                <button
                  type="submit"
                  className="rounded-xl bg-brand-secondary hover:bg-brand-primary text-white font-semibold px-4 py-2 transition-colors"
                >
                  Apply
                </button>
              </form>
            </div>

            {historyRows.length === 0 ? (
              <div className="p-8">
                <EmptyState text="No assignments found." />
              </div>
            ) : (
              <div className="p-4 md:p-6 space-y-4">
                {historyRows.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border-2 border-brand-muted bg-brand-light/30 p-5"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="text-lg font-bold text-gray-900">
                            {item.title}
                          </h3>
                          <StatusPill status={item.effective_status} />
                        </div>

                        <p className="text-sm text-gray-600 font-medium">
                          {item.participant_name}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <Pill
                            text={`Assigned ${formatShortDate(item.created_at)}`}
                          />
                          <Pill
                            text={`Due ${
                              item.due_at
                                ? formatShortDate(item.due_at)
                                : "No due date"
                            }`}
                          />
                          {item.latest_activity_at && (
                            <Pill
                              text={`Latest ${formatShortDate(
                                item.latest_activity_at
                              )}`}
                            />
                          )}
                        </div>

                        {item.goal && (
                          <p className="mt-4 text-sm text-gray-700 leading-6">
                            {item.goal}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/instructor/assignments/${item.id}/edit`}
                          className="inline-flex items-center gap-2 rounded-xl border-2 border-brand-muted bg-white px-4 py-2 text-sm font-semibold text-gray-800 hover:border-brand-primary transition-colors"
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
                            className="inline-flex items-center gap-2 rounded-xl border-2 border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 size={16} />
                            Delete
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
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
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.5rem] border-2 border-brand-muted bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-brand-light border-2 border-brand-muted flex items-center justify-center text-brand-primary">
          {icon}
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-500">{label}</p>
          <p className="text-xl font-extrabold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

function Pill({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold border-2 border-brand-muted bg-white text-gray-700">
      {text}
    </span>
  );
}

function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-bold border ${getStatusStyles(
        status
      )}`}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-brand-muted bg-brand-light/30 p-8 text-center">
      <p className="text-gray-500 font-medium">{text}</p>
    </div>
  );
}