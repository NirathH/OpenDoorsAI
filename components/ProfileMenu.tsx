"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, LogOut, User } from "lucide-react";
import { signOut } from "@/app/actions/auth";

export default function ProfileMenu({
  initials,
  name,
  role = "Participant",
}: {
  initials?: string;
  name?: string;
  role?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  const displayName = name?.trim() || "Loading...";
  const displayInitial = initials || name?.trim()?.charAt(0)?.toUpperCase() || "?";

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="hidden sm:flex items-center gap-3 bg-white border-2 border-brand-muted rounded-2xl px-3 py-2 shadow-sm hover:border-brand-primary transition-colors"
      >
        <div className="h-9 w-9 rounded-full bg-brand-light border-2 border-brand-muted flex items-center justify-center">
          <span className="text-brand-primary font-bold">{displayInitial}</span>
        </div>

        <div className="leading-tight text-left">
          <div className="text-sm font-semibold text-gray-900">{displayName}</div>
          <div className="text-xs text-gray-500 font-medium">{role}</div>
        </div>

        <ChevronDown size={18} className="text-gray-400" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border-2 border-brand-muted bg-white shadow-lg">
          <div className="px-4 py-3 border-b border-brand-muted bg-brand-light/40">
            <div className="text-sm font-semibold text-gray-900">{displayName}</div>
            <div className="text-xs text-gray-500 font-medium">{role}</div>
          </div>

          <div className="p-2">
            <Link
              href="/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-brand-light/60"
            >
              <User size={18} className="text-brand-primary" />
              Profile
            </Link>

            <form action={signOut}>
              <button
                type="submit"
                className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
              >
                <LogOut size={18} />
                Log out
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}