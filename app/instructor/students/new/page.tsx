export const dynamic = "force-dynamic";

import Link from "next/link";
import { ArrowLeft, UserPlus } from "lucide-react";

import InstructorSidebar from "@/components/InstructorSidebar";
import { requireInstructor } from "@/lib/server/auth/requireInstructor";

/**
 * New student page for instructors.
 *
 * Purpose:
 * - Verify the current user is an instructor
 * - Show a form to create a new student account
 * - Submit the form to the backend route that creates the student
 */
export default async function NewStudentPage() {
  // Ensure the current user is an instructor
  const { instructorName } = await requireInstructor();

  return (
    <div className="min-h-screen bg-brand-light font-sans flex">
      {/* Left sidebar navigation */}
      <InstructorSidebar name={instructorName} />

      {/* Main content */}
      <main className="flex-1 min-w-0 p-6 md:p-8">
        <div className="max-w-[900px] mx-auto">
          {/* Back link */}
          <div className="mb-6">
            <Link
              href="/instructor/students"
              className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-brand-primary transition-colors"
            >
              <ArrowLeft size={16} />
              Back to Students
            </Link>
          </div>

          {/* Create student form card */}
          <section className="bg-white rounded-[2rem] border-2 border-brand-muted shadow-sm p-6 md:p-8">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="h-12 w-12 rounded-2xl bg-brand-light border-2 border-brand-muted flex items-center justify-center text-brand-primary">
                <UserPlus size={22} />
              </div>

              <div>
                <h1 className="text-3xl font-extrabold text-gray-900">
                  Create Student Account
                </h1>
                <p className="mt-1 text-gray-600 font-medium">
                  Add a new participant and automatically assign them to you.
                </p>
              </div>
            </div>

            {/* Form submits to backend route */}
            <form
              action="/api/instructor/students"
              method="POST"
              className="space-y-6"
            >
              <FormField label="Full Name">
                <input
                  name="full_name"
                  type="text"
                  required
                  className="w-full rounded-2xl border-2 border-brand-muted bg-white px-4 py-3 text-sm font-medium text-gray-800 outline-none focus:border-brand-primary"
                  placeholder="Student full name"
                />
              </FormField>

              <FormField label="Email">
                <input
                  name="email"
                  type="email"
                  required
                  className="w-full rounded-2xl border-2 border-brand-muted bg-white px-4 py-3 text-sm font-medium text-gray-800 outline-none focus:border-brand-primary"
                  placeholder="student@email.com"
                />
              </FormField>

              <FormField label="Temporary Password">
                <input
                  name="password"
                  type="text"
                  required
                  minLength={8}
                  className="w-full rounded-2xl border-2 border-brand-muted bg-white px-4 py-3 text-sm font-medium text-gray-800 outline-none focus:border-brand-primary"
                  placeholder="At least 8 characters"
                />
                <p className="mt-2 text-xs text-gray-500 font-medium">
                  The student can use this password to log in and change it
                  later.
                </p>
              </FormField>

              <FormField label="Job Goal">
                <input
                  name="job_goal"
                  type="text"
                  className="w-full rounded-2xl border-2 border-brand-muted bg-white px-4 py-3 text-sm font-medium text-gray-800 outline-none focus:border-brand-primary"
                  placeholder="Example: Customer service representative"
                />
              </FormField>

              <FormField label="Notes">
                <textarea
                  name="coach_notes"
                  rows={4}
                  className="w-full rounded-2xl border-2 border-brand-muted bg-white px-4 py-3 text-sm font-medium text-gray-800 outline-none focus:border-brand-primary resize-none"
                  placeholder="Optional instructor-only notes."
                />
              </FormField>

              {/* Actions */}
              <div className="pt-2 flex flex-wrap gap-3">
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-2xl bg-brand-secondary hover:bg-brand-primary text-white font-semibold px-5 py-3 shadow-md transition-colors"
                >
                  Create Student
                </button>

                <Link
                  href="/instructor/students"
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

/**
 * Reusable form field wrapper for labels + inputs.
 */
function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        {label}
      </label>
      {children}
    </div>
  );
}