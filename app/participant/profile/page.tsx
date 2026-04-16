export const dynamic = "force-dynamic";

import { Mail, User, Briefcase, StickyNote, Users } from "lucide-react";
import Navbar from "@/components/participantNavbar";
import { requireParticipant } from "@/lib/server/auth/requireParticipant";
import { getParticipantProfile } from "@/lib/server/participant/getParticipantProfile";
import { formatShortDate } from "@/lib/utils/studentHelpers";

export default async function ProfilePage() {
  const { supabase, participantId, participantName, user } =
    await requireParticipant();

  const { profile, instructorName } = await getParticipantProfile(
    supabase,
    participantId
  );

  return (
    <div className="min-h-screen bg-brand-light font-sans">
      <Navbar userName={participantName} userRole="Participant" />

      <main className="max-w-[1000px] mx-auto p-6 md:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">My Profile</h1>
          <p className="mt-2 text-gray-600 font-medium">
            View your information, goals, and support details.
          </p>
        </div>

        <section className="bg-white rounded-[2rem] border-2 border-brand-muted shadow-sm p-6 md:p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-16 w-16 rounded-full bg-brand-light border-2 border-brand-muted flex items-center justify-center text-brand-primary font-extrabold text-2xl">
              {participantName.charAt(0).toUpperCase()}
            </div>

            <div>
              <h2 className="text-2xl font-extrabold text-gray-900">
                {profile.full_name || participantName}
              </h2>
              <p className="text-gray-600 font-medium">
                Participant account
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoCard
              icon={<Mail size={18} />}
              label="Email"
              value={user.email || "—"}
            />
            <InfoCard
              icon={<User size={18} />}
              label="Joined"
              value={formatShortDate(profile.created_at)}
            />
            <InfoCard
              icon={<Users size={18} />}
              label="Instructor"
              value={instructorName}
            />
            <InfoCard
              icon={<Briefcase size={18} />}
              label="Job Goal"
              value={profile.job_goal || "Not added yet"}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 mt-4">
            <DetailCard
              icon={<StickyNote size={18} />}
              label="Support Notes"
              value={profile.participant_condition || "Not added yet"}
            />
            <DetailCard
              icon={<StickyNote size={18} />}
              label="Coach Notes"
              value={profile.coach_notes || "Not added yet"}
            />
          </div>
        </section>
      </main>
    </div>
  );
}

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border-2 border-brand-muted bg-brand-light/40 p-5">
      <div className="flex items-center gap-2 text-brand-primary mb-2">
        {icon}
      </div>
      <div className="text-xs text-gray-500 font-semibold mb-1">{label}</div>
      <div className="text-gray-900 font-bold">{value}</div>
    </div>
  );
}

function DetailCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.5rem] border-2 border-brand-muted bg-brand-light/30 p-4">
      <div className="flex items-center gap-2 text-gray-700 font-semibold text-sm mb-2">
        {icon}
        {label}
      </div>
      <p className="text-sm text-gray-800 leading-6 whitespace-pre-line">
        {value}
      </p>
    </div>
  );
}