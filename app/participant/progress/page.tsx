export const dynamic = "force-dynamic";

import Navbar from "@/components/participantNavbar";
import { requireParticipant } from "@/lib/server/auth/requireParticipant";
import { getParticipantProgress } from "@/lib/server/participant/getParticipantProgress";
import ParticipantProgressDashboard from "@/components/ParticipantProgressDashboard";
import { TrendingUp } from "lucide-react";

export default async function ParticipantProgressPage() {
  const { supabase, participantId, participantName, user } =
    await requireParticipant();

  const progress = await getParticipantProgress(supabase, participantId);

  return (
    <div className="min-h-screen bg-brand-light font-sans">
      <Navbar userName={participantName} userRole="Participant" />

      <main className="max-w-[1200px] mx-auto px-6 md:px-8 py-8 md:py-10">
        <section className="mb-10">
          <div className="rounded-[2rem] border-2 border-brand-muted bg-white p-6 md:p-8 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-light border border-brand-muted text-brand-primary text-base font-bold mb-4">
                  <TrendingUp size={16} />
                  Progress Overview
                </div>

                <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900">
                  My Progress
                </h1>

                <p className="mt-3 text-gray-600 font-medium max-w-xl leading-relaxed">
                  See your weekly coaching feedback, track your improvement,
                  and understand what to focus on next.
                </p>
              </div>

              <div className="rounded-2xl border-2 border-brand-muted bg-brand-light/40 px-5 py-4 min-w-[180px]">
                <div className="text-sm font-bold text-gray-500 uppercase">
                  Completed Sessions
                </div>
                <div className="text-3xl font-extrabold text-gray-900 mt-1">
                  {progress.completedSessions || 0}
                </div>
              </div>
            </div>
          </div>
        </section>

        <ParticipantProgressDashboard
          participantName={participantName}
          participantEmail={user.email || "—"}
          progress={progress}
        />
      </main>
    </div>
  );
}