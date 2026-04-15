import { Plus, Video } from "lucide-react";
import StatMiniCard from "@/components/StatMiniCard";
import Link from "next/link";

export default function StudentProgressPanel({
  student,
  onClose,
}: {
  student: {
    id: string;
    name: string;
    lastSession: string;
    streak: string;
    status: string;
    totalSessions: number;
    avgScore: number;
  };
  onClose: () => void;
}) {
  return (
    <div className="bg-white rounded-[2rem] border-2 border-brand-muted shadow-sm p-6 flex flex-col h-fit">
      <div className="flex items-start justify-between border-b border-brand-muted pb-4 mb-5">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{student.name}</h2>
          <p className="text-sm text-gray-500 font-medium">
            Student Progress Details
          </p>
        </div>

        <button 
          onClick={onClose}
          className="text-gray-400 hover:text-gray-700 text-lg font-bold"
        >
          ×
        </button>
      </div>

      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          Interview Confidence Score
        </h3>

        <p className="text-sm text-gray-600 font-medium mt-2">
          Confidence has improved by <span className="font-semibold text-brand-primary">37%</span> over the last 4 weeks
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <StatMiniCard label="Total Sessions" value={student.totalSessions.toString()} />
        <StatMiniCard label="Avg. Score" value={student.avgScore.toString()} />
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          Quick Actions
        </h3>

        <div className="flex flex-col gap-3">
          <Link 
            href={`/instructor/assignments/new?studentId=${student.id}`} 
            className="w-full bg-brand-secondary hover:bg-brand-primary text-white font-semibold py-3 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            <Plus size={16} />
            Assign New Goal
          </Link>

          <Link 
            href={`/instructor/students?studentId=${student.id}`}
            className="w-full border-2 border-brand-muted hover:border-brand-primary bg-white text-gray-800 font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <Video size={16} />
            Review Latest Recording
          </Link>
        </div>
      </div>
    </div>
  );
}