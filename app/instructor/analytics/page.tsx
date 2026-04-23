export const dynamic = "force-dynamic";

import InstructorSidebar from "@/components/InstructorSidebar";
import { requireInstructor } from "@/lib/server/auth/requireInstructor";
import { getInstructorAnalytics } from "@/lib/server/instructor/getInstructorAnalytics";
import InstructorAnalyticsDashboard from "@/components/InstructorAnalyticsDashboard";

export default async function InstructorAnalyticsPage() {
  const { supabase, instructorId, instructorName } = await requireInstructor();

  const analytics = await getInstructorAnalytics(supabase, instructorId);

  return (
    <div className="min-h-screen bg-brand-light font-sans flex">
      <InstructorSidebar name={instructorName} />

      <main className="flex-1 min-w-0 p-4 md:p-8">
        <div className="max-w-[1500px] mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">
              Analytics Dashboard
            </h1>
            <p className="mt-2 text-gray-600 font-medium">
              Track student activity, session completion, and instructor progress.
            </p>
          </div>

          <InstructorAnalyticsDashboard analytics={analytics} />
        </div>
      </main>
    </div>
  );
}