export const dynamic = "force-dynamic";

import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  ClipboardList,
  User,
  Target,
  FileText,
  Clock3,
  CalendarDays,
} from "lucide-react";
import InstructorSidebar from "@/components/InstructorSidebar";
import { requireInstructor } from "@/lib/server/auth/requireInstructor";

export default async function NewAssignmentPage() {
  const { supabase, instructorId, instructorName } =
    await requireInstructor();

  const { data: participants, error } = await supabase
    .from("profiles")
    .select("user_id, full_name")
    .eq("role", "participant")
    .eq("instructor_id", instructorId)
    .order("full_name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (
    <div className="min-h-screen bg-brand-light font-sans flex">
      <InstructorSidebar name={instructorName} />

      <main className="flex-1 min-w-0 p-6 md:p-8">
        <div className="max-w-[980px] mx-auto">
          <div className="mb-6">
            <Link
              href="/instructor/assignments"
              className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-brand-primary transition-colors"
            >
              <ArrowLeft size={16} />
              Back to Assignments
            </Link>
          </div>

          <section className="bg-white rounded-[2rem] border border-green-200 shadow-sm overflow-hidden">
            <div className="border-b border-gray-100 px-6 md:px-8 py-6 md:py-7">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-2xl bg-brand-light border border-brand-muted flex items-center justify-center text-brand-primary shrink-0">
                  <ClipboardList size={22} />
                </div>

                <div>
                  <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
                    Assign New Session
                  </h1>
                  <p className="mt-2 text-[15px] text-gray-600 font-medium max-w-2xl leading-6">
                    Create a structured coaching session for a participant with a
                    clear goal, guidance, and timeline.
                  </p>
                </div>
              </div>
            </div>

            <form
              action="/api/instructor/assignments"
              method="POST"
              className="px-6 md:px-8 py-6 md:py-8 space-y-6"
            >
              <SectionCard
                icon={<User size={18} />}
                title="Participant"
                subtitle="Choose who this session will be assigned to."
              >
                <FieldLabel htmlFor="participant_id">Select Participant</FieldLabel>
                <select
                  id="participant_id"
                  name="participant_id"
                  required
                  className="w-full rounded-2xl border border-green-300 bg-white px-4 py-3.5 text-sm font-medium text-gray-800 outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 transition"
                  defaultValue=""
                >
                  <option value="" disabled>
                    Choose a participant
                  </option>
                  {participants?.map((participant) => (
                    <option
                      key={participant.user_id}
                      value={participant.user_id}
                    >
                      {participant.full_name || "Unnamed Participant"}
                    </option>
                  ))}
                </select>
              </SectionCard>

              <SectionCard
                icon={<Target size={18} />}
                title="Session Details"
                subtitle="Set the core title and objective."
              >
                <div className="grid grid-cols-1 gap-5">
                  <div>
                    <FieldLabel htmlFor="title">Session Title</FieldLabel>
                    <input
                      id="title"
                      name="title"
                      type="text"
                      required
                      placeholder="AI Communication Coaching Session"
                      className="w-full rounded-2xl border border-green-300 bg-white px-4 py-3.5 text-sm font-medium text-gray-800 outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 transition"
                    />
                  </div>

                  <div>
                    <FieldLabel htmlFor="goal">Goal</FieldLabel>
                    <textarea
                      id="goal"
                      name="goal"
                      rows={3}
                      placeholder="Help the participant practice answering clearly and confidently in a mock interview setting."
                      className="w-full rounded-2xl border border-green-300 bg-white px-4 py-3.5 text-sm font-medium text-gray-800 outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 transition resize-none"
                    />
                  </div>
                </div>
              </SectionCard>

              <SectionCard
                icon={<FileText size={18} />}
                title="Instructions"
                subtitle="Provide guidance the participant should follow during the session."
              >
                <div>
                  <FieldLabel htmlFor="instructions">Instructions</FieldLabel>
                  <textarea
                    id="instructions"
                    name="instructions"
                    rows={5}
                    placeholder="Speak clearly, give complete answers, and include at least one real example. Focus on confidence and structure."
                    className="w-full rounded-2xl border border-green-300 bg-white px-4 py-3.5 text-sm font-medium text-gray-800 outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 transition resize-none"
                  />
                </div>
              </SectionCard>

              <SectionCard
                icon={<Clock3 size={18} />}
                title="Timing"
                subtitle="Define the expected duration and deadline."
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <FieldLabel htmlFor="max_minutes">Max Minutes</FieldLabel>
                    <div className="relative">
                      <input
                        id="max_minutes"
                        name="max_minutes"
                        type="number"
                        min={1}
                        placeholder="5"
                        className="w-full rounded-2xl border border-green-300 bg-white px-4 py-3.5 pr-16 text-sm font-medium text-gray-800 outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 transition"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-500">
                        mins
                      </span>
                    </div>
                  </div>

                  <div>
                    <FieldLabel htmlFor="due_at">Due Date</FieldLabel>
                    <div className="relative">
                      <input
                        id="due_at"
                        name="due_at"
                        type="datetime-local"
                        className="w-full rounded-2xl border border-green-300 bg-white px-4 py-3.5 pr-11 text-sm font-medium text-gray-800 outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 transition"
                      />
                      <CalendarDays
                        size={16}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                      />
                    </div>
                  </div>
                </div>
              </SectionCard>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-secondary hover:bg-brand-primary text-white font-semibold px-6 py-3.5 shadow-sm transition-colors"
                >
                  <Plus size={18} />
                  Create Assignment
                </button>

                <Link
                  href="/instructor/assignments"
                  className="inline-flex items-center justify-center rounded-2xl border border-gray-300 bg-white text-gray-800 font-semibold px-6 py-3.5 hover:border-brand-primary transition-colors"
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

function SectionCard({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[1.5rem] border border-gray-500 bg-gray-50/60 p-5 md:p-6">
      <div className="flex items-start gap-3 mb-5">
        <div className="h-10 w-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-brand-primary shrink-0">
          {icon}
        </div>

        <div>
          <h2 className="text-lg font-bold text-gray-900 tracking-tight">
            {title}
          </h2>
          <p className="text-sm text-gray-500 font-medium mt-1">{subtitle}</p>
        </div>
      </div>

      {children}
    </div>
  );
}

function FieldLabel({
  htmlFor,
  children,
}: {
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-sm font-semibold text-gray-700 mb-2"
    >
      {children}
    </label>
  );
}