"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  BarChart3,
} from "lucide-react";

const items = [
  { label: "Overview", href: "/instructor", icon: LayoutDashboard },
  { label: "Students", href: "/instructor/students", icon: Users },
  { label: "Assignments", href: "/instructor/assignments", icon: ClipboardList },
  { label: "Analytics", href: "/instructor/analytics", icon: BarChart3 },
];

function cn(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(" ");
}

export default function InstructorSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[250px] min-h-screen bg-white border-r-2 border-brand-muted hidden md:flex flex-col">
      <div className="px-6 py-6 border-b border-brand-muted">
        <div className="text-xl font-bold text-gray-900">Instructor Portal</div>
        <div className="text-sm text-gray-500 font-medium mt-1">
          OpenDoorsAI
        </div>
      </div>

      <nav className="p-4 flex flex-col gap-2">
        {items.map((item) => {
          const active =
            pathname === item.href || pathname?.startsWith(item.href + "/");

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
    </aside>
  );
}