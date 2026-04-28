"use client";

import { useState } from "react";
import {
  User,
  Mail,
  ShieldCheck,
  CalendarDays,
  Lock,
  ChevronDown,
  ChevronUp,
  LogOut,
} from "lucide-react";
import { updateInstructorPassword, signOut } from "@/app/actions/auth";

type Props = {
  fullName: string;
  email: string;
  role: string;
  createdAt: string | null;
};

export default function InstructorProfileForm({
  fullName,
  email,
  role,
  createdAt,
}: Props) {
  const [passwordOpen, setPasswordOpen] = useState(false);

  return (
    <div className="space-y-8">
      <section className="bg-white rounded-[2rem] border-2 border-brand-muted shadow-sm p-8">
        <div className="flex flex-col lg:flex-row lg:items-center gap-8">
          <div className="h-24 w-24 rounded-full bg-brand-primary/10 border-2 border-brand-muted flex items-center justify-center shrink-0">
            <User size={44} className="text-brand-primary" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-brand-primary uppercase tracking-wide">
              Account
            </p>

            <h2 className="mt-1 text-3xl font-extrabold text-gray-900">
              {fullName || "Instructor"}
            </h2>

            <p className="mt-1 text-gray-500 font-semibold capitalize text-lg">
              {role}
            </p>
          </div>

          <form action={signOut}>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-red-200 bg-red-50 px-5 py-3 font-bold text-red-600 hover:bg-red-100 transition"
            >
              <LogOut size={18} />
              Log out
            </button>
          </form>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-5">
          <InfoItem icon={<Mail size={20} />} label="Email" value={email} />
          <InfoItem
            icon={<ShieldCheck size={20} />}
            label="Role"
            value={role}
          />
          <InfoItem
            icon={<CalendarDays size={20} />}
            label="Member Since"
            value={
              createdAt
                ? new Date(createdAt).toLocaleDateString()
                : "Not available"
            }
          />
        </div>
      </section>

      <section className="bg-white rounded-[2rem] border-2 border-brand-muted shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => setPasswordOpen((prev) => !prev)}
          className="w-full p-8 flex items-center justify-between text-left hover:bg-brand-light/40 transition"
        >
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-brand-primary/10 border-2 border-brand-muted flex items-center justify-center">
              <Lock size={24} className="text-brand-primary" />
            </div>

            <div>
              <h3 className="text-2xl font-extrabold text-gray-900">
                Change Password
              </h3>
              <p className="mt-1 text-gray-500 font-medium">
                Open this section when you want to update your password.
              </p>
            </div>
          </div>

          {passwordOpen ? (
            <ChevronUp size={26} className="text-gray-500" />
          ) : (
            <ChevronDown size={26} className="text-gray-500" />
          )}
        </button>

        {passwordOpen && (
          <div className="px-8 pb-8">
            <form action={updateInstructorPassword} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  name="currentPassword"
                  className="w-full rounded-2xl border-2 border-brand-muted px-5 py-4 font-medium outline-none focus:border-brand-primary"
                  placeholder="Enter current password"
                  required
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    name="newPassword"
                    className="w-full rounded-2xl border-2 border-brand-muted px-5 py-4 font-medium outline-none focus:border-brand-primary"
                    placeholder="Enter new password"
                    required
                    minLength={6}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    className="w-full rounded-2xl border-2 border-brand-muted px-5 py-4 font-medium outline-none focus:border-brand-primary"
                    placeholder="Confirm new password"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="rounded-2xl bg-gray-900 px-6 py-4 font-bold text-white hover:opacity-90 transition"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        )}
      </section>
    </div>
  );
}

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border-2 border-brand-muted bg-brand-light/40 p-5 min-w-0">
      <div className="text-brand-primary mb-3">{icon}</div>
      <p className="text-sm text-gray-500 font-semibold">{label}</p>
      <p className="mt-1 text-gray-900 font-bold break-words text-base">
        {value}
      </p>
    </div>
  );
}