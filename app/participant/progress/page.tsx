export const dynamic = "force-dynamic";

import Navbar from "@/components/participantNavbar";
import { requireParticipant } from "@/lib/server/auth/requireParticipant";
import { getParticipantProgress } from "@/lib/server/participant/getParticipantProgress";
import ParticipantProgressDashboard from "@/components/ParticipantProgressDashboard";

export default async function ParticipantProgressPage() {
  const { supabase, participantId, participantName, user } =
    await requireParticipant();

  const progress = await getParticipantProgress(supabase, participantId);

  return (
    <div className="min-h-screen bg-brand-light font-sans">
      <Navbar userName={participantName} userRole="Participant" />

      <main className="max-w-350 mx-auto p-6 md:p-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">
            My Progress
          </h1>
          <p className="mt-2 text-gray-600 font-medium">
            Track your goals, completed practice sessions, and growth over time.
          </p>
        </div>

        <ParticipantProgressDashboard
          participantName={participantName}
          participantEmail={user.email || "—"}
          progress={progress}
        />
      </main>
    </div>
  );
}