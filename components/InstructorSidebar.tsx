"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  BarChart3,
  LogOut,
} from "lucide-react";
import { signOut } from "@/app/actions/auth";

const items = [
  { label: "Overview", href: "/instructor/dashboard", icon: LayoutDashboard },
  { label: "Students", href: "/instructor/students", icon: Users },
  { label: "Assignments", href: "/instructor/assignments", icon: ClipboardList },
  { label: "Analytics", href: "/instructor/analytics", icon: BarChart3 },
];

function cn(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(" ");
}

export default function InstructorSidebar({
  name,
}: {
  name?: string;
}) {
  const pathname = usePathname();

  const cleanName = name?.trim() || "Instructor";
  const initial = cleanName.charAt(0).toUpperCase();

  return (
    <aside className="w-[260px] min-h-screen bg-white border-r-2 border-brand-muted hidden md:flex flex-col justify-between">
      {/* Top */}
      <div>
        {/* Header */}
        <div className="px-6 py-6 border-b border-brand-muted">
          <div className="text-xl font-bold text-gray-900">
            Instructor Portal
          </div>
          <div className="text-sm text-gray-500 font-medium mt-1">
            OpenDoorsAI
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 flex flex-col gap-2">
          {items.map((item) => {
            const active =
              pathname === item.href ||
              pathname?.startsWith(item.href + "/");

            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-colors",
                  active
                    ? "bg-brand-secondary text-white shadow-sm"
                    : "text-gray-700 hover:bg-brand-light"
                )}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom: Profile + Logout */}
      <div className="p-4 border-t border-brand-muted">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-10 w-10 rounded-full bg-brand-light border-2 border-brand-muted flex items-center justify-center text-brand-primary font-bold">
            {initial}
          </div>

          <div className="leading-tight">
            <div className="text-sm font-semibold text-gray-900">
              {cleanName}
            </div>
            <div className="text-xs text-gray-500 font-medium">
              Instructor
            </div>
          </div>
        </div>

        {/* Logout */}
        <form action={signOut}>
          <button
            type="submit"
            className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut size={16} />
            Log out
          </button>
        </form>
      </div>
    </aside>
  );
}