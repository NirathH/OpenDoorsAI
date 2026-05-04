"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, LogOut } from "lucide-react";
import ProfileMenu from "@/components/ProfileMenu";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/participant/dashboard" },
  { label: "Sessions", href: "/participant/sessions" },
  { label: "Progress", href: "/participant/progress" },
  { label: "My Profile", href: "/participant/profile" },
];

function cn(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(" ");
}

type NavbarProps = {
  userName?: string;
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);

  const cleanName = userName?.trim() || "";
  const safeInitial = userInitial || cleanName.charAt(0).toUpperCase() || "?";

  useEffect(() => {
    const handlePathChange = () => {
      setMobileMenuOpen(false);
    };
    handlePathChange();
  }, [pathname]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node)
      ) {
        setMobileMenuOpen(false);
      }
    }

    if (mobileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [mobileMenuOpen]);

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b-2 border-brand-muted">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 h-[72px] flex items-center justify-between gap-3">
        <Link
          href="/participant/dashboard"
          className="flex items-center gap-3 min-w-0"
        >
          <div className="relative h-11 w-11 rounded-full overflow-hidden border-2 border-brand-muted bg-white shadow-sm shrink-0">
            <Image
              src={logoSrc}
              alt="OpenDoorsAI"
              fill
              className="object-contain p-1"
              priority
            />
          </div>

          <span className="text-[18px] font-extrabold text-brand-primary truncate">
            OpenDoorsAI
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-2 rounded-2xl border-2 border-brand-muted bg-brand-light/50 px-2 py-2">
          {NAV_ITEMS.map((item) => {
            const active =
              pathname === item.href || pathname?.startsWith(item.href + "/");

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-3 py-2 rounded-xl text-base font-semibold transition-colors",
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

        <div className="flex items-center gap-2 md:gap-3">
          <span className="hidden md:inline-flex px-3 py-1.5 rounded-full text-sm font-semibold border-2 border-brand-muted bg-white text-gray-700">
            {userRole}
          </span>

          <div className="relative lg:hidden" ref={mobileMenuRef}>
            <button
              type="button"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="inline-flex items-center justify-center h-10 w-10 rounded-xl border-2 border-brand-muted bg-white text-gray-700 hover:border-brand-primary hover:text-brand-primary transition-colors"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>

            {mobileMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-2xl border-2 border-brand-muted bg-white shadow-lg p-2 z-50">

                  {/* Navigation */}
                  <div className="px-3 py-2 text-sm font-semibold text-gray-500">
                    Navigation
                  </div>

                  <div className="flex flex-col gap-1">
                    {NAV_ITEMS.map((item) => {
                      const active =
                        pathname === item.href ||
                        pathname?.startsWith(item.href + "/");

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={cn(
                            "px-3 py-2 rounded-xl text-base font-semibold transition-colors",
                            active
                              ? "bg-brand-secondary text-white"
                              : "text-gray-700 hover:bg-brand-light"
                          )}
                        >
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>

                  {/* 👇 Profile section at bottom */}
                  <div className="mt-3 pt-3 border-t border-brand-muted">
                    <div className="flex items-center gap-3 px-2">
                      <div className="h-10 w-10 rounded-full border-2 border-brand-muted bg-white flex items-center justify-center text-base font-bold text-brand-primary shrink-0">
                        {safeInitial}
                      </div>

                      <div className="min-w-0">
                        <div className="text-base font-bold text-gray-900 truncate">
                          {cleanName || "Participant"}
                        </div>
                        <div className="text-sm text-gray-500 font-medium">
                          {userRole}
                        </div>
                      </div>
                    </div>

                    <Link
                      href="/login"
                      className="mt-3 inline-flex w-full items-center gap-2 rounded-xl px-3 py-2 text-base font-semibold text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut size={16} />
                      Logout
                    </Link>
                  </div>
                </div>
              )}
          </div>

          <div className="hidden lg:block">
            <ProfileMenu
              initials={safeInitial}
              name={cleanName}
              role={userRole}
            />
          </div>
        </div>
      </div>
    </header>
  );
}