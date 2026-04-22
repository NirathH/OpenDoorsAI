import { User, ChevronRight, Plus } from "lucide-react";
import Link from "next/link";

interface Student {
  id: string;
  name: string;
  lastSession: string;
  streak: string;
  status: string;
}

export default function StudentTable({
  students,
}: {
  students: Student[];
}) {
  return (
    <div className="bg-white rounded-[2rem] border-2 border-brand-muted shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-brand-muted">
        <h2 className="text-lg font-semibold text-gray-900">Student Priority Queue</h2>
        <p className="text-sm text-gray-500 font-medium">
          Identify who needs help and assign targeted practice.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead className="bg-brand-light/60">
            <tr className="text-left text-sm text-gray-600">
              <th className="px-6 py-4 font-semibold">Student</th>
              <th className="px-6 py-4 font-semibold">Last Session</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {students.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500 font-medium">
                  No students found.
                </td>
              </tr>
            ) : (
              students.map((student) => (
                <tr
                  key={student.id}
                  className="border-t border-brand-muted/60 transition-colors hover:bg-brand-light/30"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-brand-secondary/15 border border-brand-muted flex items-center justify-center">
                        <User size={16} className="text-brand-primary" />
                      </div>
                      <span className="font-semibold text-gray-900">
                        {student.name}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-gray-700 font-medium">
                    {student.lastSession}
                  </td>

                  <td className="px-6 py-4">
                    <StatusBadge status={student.status} />
                  </td>

                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/instructor/assignments/new?participant_id=${student.id}`}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 bg-white hover:border-brand-primary hover:text-brand-primary text-xs font-semibold text-gray-700 transition-colors"
                      >
                        <Plus size={14} />
                        Assign Goal
                      </Link>
                      <Link
                        href={`/instructor/students/${student.id}`}
                        className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl bg-brand-light hover:bg-brand-muted/50 text-brand-primary text-xs font-semibold transition-colors"
                      >
                        Profile
                        <ChevronRight size={14} />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles =
    status === "Active"
      ? "bg-emerald-100 text-emerald-700"
      : status === "Needs Attention"
      ? "bg-amber-100 text-amber-700"
      : "bg-gray-100 text-gray-500";

  return (
    <span
      className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${styles}`}
    >
      {status}
    </span>
  );
}