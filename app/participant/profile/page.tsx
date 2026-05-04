export const dynamic = "force-dynamic";

import {
  Mail,
  User,
  Briefcase,
  StickyNote,
  Users,
  LogOut,
  Lock,
  ChevronDown,
} from "lucide-react";
import Navbar from "@/components/participantNavbar";
import { requireParticipant } from "@/lib/server/auth/requireParticipant";
import { getParticipantProfile } from "@/lib/server/participant/getParticipantProfile";
import { formatShortDate } from "@/lib/utils/studentHelpers";
import { signOut, updatePassword } from "@/app/actions/auth";

type PageProps = {
  searchParams?: Promise<{
    error?: string;
    success?: string;
  }>;
};

export default async function ProfilePage({ searchParams }: PageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const error = resolvedSearchParams?.error;
  const success = resolvedSearchParams?.success;

  const { supabase, participantId, participantName, user } =
    await requireParticipant();

  const { profile, instructorName } = await getParticipantProfile(
    supabase,
    participantId
  );

  return (
    <div className="min-h-screen bg-brand-light font-sans">
      <Navbar userName={participantName} userRole="Participant" />

      <main className="max-w-250 mx-auto p-6 md:p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold text-gray-900">My Profile</h1>
          <p className="mt-2 text-gray-600 font-medium">
            View your information, goals, and support details.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-2xl border-2 border-red-200 bg-red-50 px-4 py-3 text-base font-semibold text-red-700">
            {decodeURIComponent(error)}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-2xl border-2 border-green-200 bg-green-50 px-4 py-3 text-base font-semibold text-green-700">
            {decodeURIComponent(success)}
          </div>
        )}

        <section className="bg-white rounded-4xl border-2 border-brand-muted shadow-sm p-6 md:p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-16 w-16 rounded-full bg-brand-light border-2 border-brand-muted flex items-center justify-center text-brand-primary font-extrabold text-3xl">
              {participantName.charAt(0).toUpperCase()}
            </div>

            <div>
              <h2 className="text-3xl font-extrabold text-gray-900">
                {profile.full_name || participantName}
              </h2>
              <p className="text-gray-600 font-medium">Participant account</p>
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
              label="Coach Notes"
              value={profile.coach_notes || "Not added yet"}
            />
          </div>

          <div className="mt-6">
            <details className="group rounded-3xl border-2 border-brand-muted bg-brand-light/20 overflow-hidden">
              <summary className="list-none cursor-pointer px-5 py-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border-2 border-brand-muted text-brand-primary">
                      <Lock size={18} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        Change Password
                      </h3>
                      <p className="text-base text-gray-500 font-medium">
                        Update your password securely
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-base font-semibold text-gray-600">
                    <span className="hidden sm:inline">Open</span>
                    <ChevronDown
                      size={18}
                      className="transition-transform group-open:rotate-180"
                    />
                  </div>
                </div>
              </summary>

              <div className="border-t-2 border-brand-muted bg-white p-5">
                <form action={updatePassword} className="space-y-4">
                  <div>
                    <label className="block text-base font-semibold text-gray-700 mb-2">
                      Current Password
                    </label>
                    <input
                      type="password"
                      name="currentPassword"
                      placeholder="Enter current password"
                      className="w-full rounded-xl border-2 border-brand-muted px-4 py-3 text-base outline-none focus:border-brand-primary"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-base font-semibold text-gray-700 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      name="newPassword"
                      placeholder="Enter new password"
                      className="w-full rounded-xl border-2 border-brand-muted px-4 py-3 text-base outline-none focus:border-brand-primary"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-base font-semibold text-gray-700 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      placeholder="Confirm new password"
                      className="w-full rounded-xl border-2 border-brand-muted px-4 py-3 text-base outline-none focus:border-brand-primary"
                      required
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="inline-flex items-center rounded-xl bg-brand-primary px-5 py-3 text-base font-semibold text-white hover:opacity-90 transition"
                    >
                      Update Password
                    </button>
                  </div>
                </form>
              </div>
            </details>
          </div>

          <div className="flex justify-end mt-6">
            <form action={signOut}>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-5 py-3 text-base font-semibold text-white hover:bg-red-600 transition"
              >
                <LogOut size={16} />
                Logout
              </button>
            </form>
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
      <div className="text-sm text-gray-500 font-semibold mb-1">{label}</div>
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
    <div className="rounded-3xl border-2 border-brand-muted bg-brand-light/30 p-4">
      <div className="flex items-center gap-2 text-gray-700 font-semibold text-base mb-2">
        {icon}
        {label}
      </div>
      <p className="text-base text-gray-800 leading-6 whitespace-pre-line">
        {value}
      </p>
    </div>
  );
}