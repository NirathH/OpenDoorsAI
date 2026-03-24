export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, UserPlus } from "lucide-react";
import InstructorSidebar from "@/components/InstructorSidebar";
import { createSupabaseServer } from "@/lib/supabaseServer";

export default async function NewStudentPage() {
  const supabase = await createSupabaseServer();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData.user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("user_id", authData.user.id)
    .maybeSingle();

  if (!profile || profile.role !== "instructor") {
    redirect("/login");
  }

  const instructorName =
    profile.full_name?.trim() ||
    authData.user.user_metadata?.full_name?.trim() ||
    "";

  return (
    <div className="min-h-screen bg-brand-light font-sans flex">
      <InstructorSidebar name={instructorName} />

      <main className="flex-1 min-w-0 p-6 md:p-8">
        <div className="max-w-[900px] mx-auto">
          <div className="mb-6">
            <Link
              href="/instructor/students"
              className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-brand-primary transition-colors"
            >
              <ArrowLeft size={16} />
              Back to Students
            </Link>
          </div>

          <section className="bg-white rounded-[2rem] border-2 border-brand-muted shadow-sm p-6 md:p-8">
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

            <form
              action="/api/instructor/students"
              method="POST"
              className="space-y-6"
            >
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  name="full_name"
                  type="text"
                  required
                  className="w-full rounded-2xl border-2 border-brand-muted bg-white px-4 py-3 text-sm font-medium text-gray-800 outline-none focus:border-brand-primary"
                  placeholder="Student full name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  className="w-full rounded-2xl border-2 border-brand-muted bg-white px-4 py-3 text-sm font-medium text-gray-800 outline-none focus:border-brand-primary"
                  placeholder="student@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Temporary Password
                </label>
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
              </div>

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