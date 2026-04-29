export const dynamic = "force-dynamic";

import InstructorSidebar from "@/components/InstructorSidebar";
import { requireInstructor } from "@/lib/server/auth/requireInstructor";
import InstructorProfileForm from "./InstructorProfileForm";

type PageProps = {
  searchParams?: Promise<{
    error?: string;
    success?: string;
  }>;
};

export default async function InstructorProfilePage({
  searchParams,
}: PageProps) {
  const params = await searchParams;

  const { supabase, instructorId, instructorName } = await requireInstructor();

  const { data: profile } = await supabase
    .from("profiles")
    .select("user_id, full_name, role, created_at")
    .eq("user_id", instructorId)
    .single();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-brand-light flex">
      <InstructorSidebar name={instructorName} />

      <main className="flex-1 px-8 py-10 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <p className="text-sm font-bold text-brand-primary uppercase tracking-wide">
              Instructor Profile
            </p>

            <h1 className="mt-2 text-4xl font-extrabold text-gray-900">
              My Profile
            </h1>

            <p className="mt-2 text-gray-600 font-medium text-lg">
              Manage your account information and password.
            </p>
          </div>

          {params?.error && (
            <div className="mb-6 rounded-2xl border-2 border-red-200 bg-red-50 p-5 text-red-700 font-semibold text-base">
              {params.error}
            </div>
          )}

          {params?.success && (
            <div className="mb-6 rounded-2xl border-2 border-green-200 bg-green-50 p-5 text-green-700 font-semibold text-base">
              {params.success}
            </div>
          )}

          <InstructorProfileForm
            fullName={profile?.full_name || instructorName || ""}
            email={user?.email || ""}
            role={profile?.role || "instructor"}
            createdAt={profile?.created_at || null}
          />
        </div>
      </main>
    </div>
  );
}