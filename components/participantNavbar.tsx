"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ProfileMenu from "@/components/ProfileMenu";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/participant/dashboard" },
  { label: "Sessions", href: "/participant/sessions" },
  { label: "Progress", href: "/participant/progress" },
  { label: "Skill Modules", href: "/participant/modules" },
  { label: "Feedback", href: "/participant/feedback" },
];

function cn(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(" ");
}

type NavbarProps = {
  userName: string;
  userInitial?: string;
  userRole?: string;
  logoSrc?: string;
};

export default function Navbar({
  userName,
  userInitial,
  userRole = "Participant",
  logoSrc = "/logo-submark.png",
}: NavbarProps) {
  const pathname = usePathname();

  // Fallback initial if one is not passed in
  const safeInitial =
    userInitial || userName?.trim()?.charAt(0)?.toUpperCase() || "U";

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b-2 border-brand-muted">
      <div className="max-w-[1400px] mx-auto px-6 md:px-8 h-[72px] flex items-center justify-between gap-4">
        {/* Left: Logo */}
        <Link
          href="/participant/dashboard"
          className="flex items-center gap-3"
        >
          <div className="relative h-11 w-11 rounded-full overflow-hidden border-2 border-brand-muted bg-white shadow-sm">
            <Image
              src={logoSrc}
              alt="OpenDoorsAI"
              fill
              className="object-contain p-1"
              priority
            />
          </div>
          <span className="text-[18px] font-extrabold text-brand-primary">
            OpenDoorsAI
          </span>
        </Link>

        {/* Middle: Tabs (desktop) */}
        <nav className="hidden lg:flex items-center gap-2 rounded-2xl border-2 border-brand-muted bg-brand-light/50 px-2 py-2">
          {NAV_ITEMS.map((item) => {
            const active =
              pathname === item.href || pathname?.startsWith(item.href + "/");

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-3 py-2 rounded-xl text-sm font-semibold transition-colors",
                  active
                    ? "bg-white border-2 border-brand-muted text-brand-primary shadow-sm"
                    : "text-gray-600 hover:text-gray-900 hover:bg-white/70"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right: Role + Profile */}
        <div className="flex items-center gap-3">
          <span className="hidden md:inline-flex px-3 py-1.5 rounded-full text-xs font-semibold border-2 border-brand-muted bg-white text-gray-700">
            {userRole}
          </span>

          <ProfileMenu
            initials={safeInitial}
            name={userName}
            role={userRole}
          />
        </div>
      </div>

      {/* Mobile tabs */}
      <div className="lg:hidden border-t-2 border-brand-muted bg-white">
        <div className="max-w-[1400px] mx-auto px-4 py-2 flex gap-2 overflow-x-auto">
          {NAV_ITEMS.map((item) => {
            const active =
              pathname === item.href || pathname?.startsWith(item.href + "/");

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "whitespace-nowrap px-3 py-2 rounded-xl text-sm font-semibold border-2 transition-colors",
                  active
                    ? "bg-brand-secondary text-white border-brand-secondary"
                    : "bg-white text-gray-700 border-brand-muted hover:border-brand-primary"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}