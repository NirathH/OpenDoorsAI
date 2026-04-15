export const dynamic = "force-dynamic";

import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import InstructorSidebar from "@/components/InstructorSidebar";
import { requireInstructor } from "@/lib/server/auth/requireInstructor";
import { getInstructorAssignmentForEdit } from "@/lib/server/instructor/getInstructorAssignmentForEdit";

type PageProps = {
  params: Promise<{
    assignmentId: string;
  }>;
};

function formatForDateTimeLocal(dateString: string | null) {
  if (!dateString) return "";
  const date = new Date(dateString);
  const pad = (n: number) => String(n).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default async function EditAssignmentPage({ params }: PageProps) {
  const { assignmentId } = await params;

  const { supabase, instructorId, instructorName } = await requireInstructor();
  const { assignment, participants } = await getInstructorAssignmentForEdit(
    supabase,
    instructorId,
    assignmentId
  );

  return (
    <div className="min-h-screen bg-brand-light font-sans flex">
      <InstructorSidebar name={instructorName} />

      <main className="flex-1 min-w-0 p-6 md:p-8">
        <div className="max-w-[900px] mx-auto">
          <div className="mb-6">
            <Link
              href="/instructor/assignments"
              className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-brand-primary transition-colors"
            >
              <ArrowLeft size={16} />
              Back to Assignments
            </Link>
          </div>

          <section className="bg-white rounded-[2rem] border-2 border-brand-muted shadow-sm p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-12 w-12 rounded-2xl bg-brand-light border-2 border-brand-muted flex items-center justify-center text-brand-primary">
                <Pencil size={22} />
              </div>

              <div>
                <h1 className="text-3xl font-extrabold text-gray-900">
                  Edit Assignment
                </h1>
                <p className="mt-1 text-gray-600 font-medium">
                  Update the assigned session details.
                </p>
              </div>
            </div>

            <form
              action={`/api/instructor/assignments/${assignment.id}`}
              method="POST"
              className="space-y-6"
            >
              <input type="hidden" name="_intent" value="update" />

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Participant
                </label>
                <select
                  name="participant_id"
                  defaultValue={assignment.participant_id}
                  className="w-full rounded-2xl border-2 border-brand-muted bg-white px-4 py-3 text-sm font-medium text-gray-800 outline-none focus:border-brand-primary"
                >
                  {participants.map((participant) => (
                    <option key={participant.user_id} value={participant.user_id}>
                      {participant.full_name || "Unnamed Participant"}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Title
                </label>
                <input
                  name="title"
                  type="text"
                  required
                  defaultValue={assignment.title}
                  className="w-full rounded-2xl border-2 border-brand-muted bg-white px-4 py-3 text-sm font-medium text-gray-800 outline-none focus:border-brand-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Goal
                </label>
                <textarea
                  name="goal"
                  rows={3}
                  defaultValue={assignment.goal || ""}
                  className="w-full rounded-2xl border-2 border-brand-muted bg-white px-4 py-3 text-sm font-medium text-gray-800 outline-none focus:border-brand-primary resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Participant Summary
                </label>
                <textarea
                  name="participant_summary"
                  rows={3}
                  defaultValue={assignment.participant_summary || ""}
                  className="w-full rounded-2xl border-2 border-brand-muted bg-white px-4 py-3 text-sm font-medium text-gray-800 outline-none focus:border-brand-primary resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Instructions
                </label>
                <textarea
                  name="instructions"
                  rows={4}
                  defaultValue={assignment.instructions || ""}
                  className="w-full rounded-2xl border-2 border-brand-muted bg-white px-4 py-3 text-sm font-medium text-gray-800 outline-none focus:border-brand-primary resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Max Minutes
                  </label>
                  <input
                    name="max_minutes"
                    type="number"
                    min={1}
                    defaultValue={assignment.max_minutes ?? 5}
                    className="w-full rounded-2xl border-2 border-brand-muted bg-white px-4 py-3 text-sm font-medium text-gray-800 outline-none focus:border-brand-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Due Date
                  </label>
                  <input
                    name="due_at"
                    type="datetime-local"
                    defaultValue={formatForDateTimeLocal(assignment.due_at)}
                    className="w-full rounded-2xl border-2 border-brand-muted bg-white px-4 py-3 text-sm font-medium text-gray-800 outline-none focus:border-brand-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    name="status"
                    defaultValue={assignment.status}
                    className="w-full rounded-2xl border-2 border-brand-muted bg-white px-4 py-3 text-sm font-medium text-gray-800 outline-none focus:border-brand-primary"
                  >
                    <option value="assigned">assigned</option>
                    <option value="in_progress">in_progress</option>
                    <option value="completed">completed</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap gap-3">
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-2xl bg-brand-secondary hover:bg-brand-primary text-white font-semibold px-5 py-3 shadow-md transition-colors"
                >
                  Save Changes
                </button>

                <Link
                  href="/instructor/assignments"
                  className="inline-flex items-center justify-center rounded-2xl border-2 border-brand-muted bg-white text-gray-800 font-semibold px-5 py-3 hover:border-brand-primary transition-colors"
                >
                  Cancel
                </Link>
              </div>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}