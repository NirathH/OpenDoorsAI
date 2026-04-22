"use client";

import { useState } from "react";
import StudentTable from "@/components/StudentTable";


type StudentTableRow = {
  id: string;
  name: string;
  lastSession: string;
  streak: string;
  status: string;
  totalSessions: number;
  avgScore: number;
};

interface DashboardClientProps {
  initialStudents: StudentTableRow[];
}

export default function DashboardClient({ initialStudents }: DashboardClientProps) {
  const [showNeedsAttention, setShowNeedsAttention] = useState(false);

  const displayedStudents = showNeedsAttention
    ? initialStudents.filter(s => s.status === "Needs Attention")
    : initialStudents;

  return (
    <div className="space-y-4">
      <div className="flex justify-end border-b border-gray-200">
        <div className="flex space-x-4 mb-[-1px]">
          <button
            onClick={() => setShowNeedsAttention(false)}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
              !showNeedsAttention
                ? "border-brand-primary text-brand-primary"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            All Students
          </button>
          <button
            onClick={() => setShowNeedsAttention(true)}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              showNeedsAttention
                ? "border-amber-500 text-amber-700"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Needs Attention
          </button>
        </div>
      </div>
      <div>
        <StudentTable students={displayedStudents} />
      </div>
    </div>
  );
}
